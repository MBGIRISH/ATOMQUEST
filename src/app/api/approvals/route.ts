import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get goals for subordinates
    const subordinates = await prisma.user.findMany({
      where: { managerId: session.user.id }
    });

    const subordinateIds = subordinates.map(u => u.id);

    const goals = await prisma.goal.findMany({
      where: {
        ownerId: { in: subordinateIds },
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] }
      },
      include: {
        owner: true
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const approvalSchema = z.object({
  goalId: z.string(),
  status: z.enum(["APPROVED", "REWORK_REQUESTED", "REJECTED"]),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = approvalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { goalId, status, comment } = result.data;

    // Verify manager owns this goal's user
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { owner: true }
    });

    if (!goal || goal.owner.managerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to approve this goal" }, { status: 403 });
    }

    // Update goal status
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: { status }
    });

    // Create approval record
    await prisma.approval.create({
      data: {
        goalId,
        approverId: session.user.id,
        status,
        comment
      }
    });

    if (comment) {
      await prisma.comment.create({
        data: {
          content: comment,
          authorId: session.user.id,
          goalId
        }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `STATUS_CHANGE_TO_${status}`,
        entityType: "GOAL",
        entityId: goalId,
        previousData: JSON.stringify(goal),
        newData: JSON.stringify(updatedGoal),
        goalId: goalId,
      }
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
