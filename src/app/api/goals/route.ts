import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createGoalSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  thrustArea: z.string().min(1),
  uomType: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
  target: z.number().positive(),
  weightage: z.number().min(10).max(100),
  deadline: z.string().datetime(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  saveAsDraft: z.boolean().optional().default(false),
});

const updateGoalSchema = createGoalSchema.extend({
  id: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goals = await prisma.goal.findMany({
      where: { ownerId: session.user.id },
      include: {
        department: true,
        parentGoal: true,
        checkins: {
          orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
          take: 1
        },
        approvals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = createGoalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { saveAsDraft, ...goalData } = result.data;

    const existingGoals = await prisma.goal.findMany({
      where: { ownerId: session.user.id }
    });

    const currentTotalWeightage = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (currentTotalWeightage + goalData.weightage > 100) {
      return NextResponse.json({ 
        error: `Total weightage cannot exceed 100%. You currently have ${currentTotalWeightage}%.` 
      }, { status: 400 });
    }

    if (existingGoals.length >= 8) {
      return NextResponse.json({ error: "Maximum of 8 goals allowed." }, { status: 400 });
    }

    const newGoal = await prisma.goal.create({
      data: {
        ...goalData,
        deadline: new Date(goalData.deadline),
        ownerId: session.user.id,
        status: saveAsDraft ? "DRAFT" : "SUBMITTED"
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "GOAL",
        entityId: newGoal.id,
        newData: JSON.stringify(newGoal),
        goalId: newGoal.id,
      }
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = updateGoalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { id, saveAsDraft, ...goalData } = result.data;

    const existingGoal = await prisma.goal.findUnique({ where: { id } });
    if (!existingGoal || existingGoal.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Goal not found or unauthorized" }, { status: 404 });
    }

    if (!["DRAFT", "REWORK_REQUESTED"].includes(existingGoal.status)) {
      return NextResponse.json({ error: "Cannot edit a goal that is currently under review or approved." }, { status: 400 });
    }

    const otherGoals = await prisma.goal.findMany({
      where: { ownerId: session.user.id, id: { not: id } }
    });

    const currentTotalWeightage = otherGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (currentTotalWeightage + goalData.weightage > 100) {
      return NextResponse.json({ 
        error: `Total weightage cannot exceed 100%. Other goals use ${currentTotalWeightage}%.` 
      }, { status: 400 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...goalData,
        deadline: new Date(goalData.deadline),
        status: saveAsDraft ? "DRAFT" : "SUBMITTED"
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "GOAL",
        entityId: updatedGoal.id,
        previousData: JSON.stringify(existingGoal),
        newData: JSON.stringify(updatedGoal),
        goalId: updatedGoal.id,
      }
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing goal ID" }, { status: 400 });

    const existingGoal = await prisma.goal.findUnique({ 
      where: { id },
      include: { childGoals: true } 
    });
    
    if (!existingGoal || existingGoal.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Goal not found or unauthorized" }, { status: 404 });
    }

    if (!["DRAFT", "REWORK_REQUESTED"].includes(existingGoal.status) && !existingGoal.isShared) {
      return NextResponse.json({ error: "Cannot delete a goal that is under review or approved." }, { status: 400 });
    }

    // Handle cascading deletions for Shared KPIs
    if (existingGoal.isShared && existingGoal.childGoals.length > 0) {
      const childGoalIds = existingGoal.childGoals.map(g => g.id);
      const childOwnerIds = existingGoal.childGoals.map(g => g.ownerId);

      // Notify users that their adopted goal was removed
      await Promise.all(
        childOwnerIds.map(ownerId => 
          prisma.notification.create({
            data: {
              userId: ownerId,
              title: "Shared KPI Removed",
              message: `The shared KPI "${existingGoal.title}" was deleted by its owner. Your adopted goal has been removed.`,
              isRead: false
            }
          })
        )
      );

      // Delete child goals
      await prisma.goal.deleteMany({
        where: { id: { in: childGoalIds } }
      });
    }

    await prisma.goal.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "GOAL",
        entityId: id,
        previousData: JSON.stringify(existingGoal),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
