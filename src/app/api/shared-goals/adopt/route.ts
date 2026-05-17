import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { kpiId, weightage } = body;

    if (!kpiId || !weightage || weightage < 10) {
      return NextResponse.json({ error: "Invalid weightage" }, { status: 400 });
    }

    const masterKpi = await prisma.goal.findUnique({
      where: { id: kpiId }
    });

    if (!masterKpi) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }

    const existingGoals = await prisma.goal.findMany({
      where: {
        ownerId: session.user.id,
        status: { not: "LOCKED" }
      }
    });

    const currentTotalWeightage = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (currentTotalWeightage + weightage > 100) {
      return NextResponse.json({ 
        error: `Total weightage cannot exceed 100%. You currently have ${currentTotalWeightage}%.` 
      }, { status: 400 });
    }

    const newGoal = await prisma.goal.create({
      data: {
        title: masterKpi.title,
        description: masterKpi.description,
        thrustArea: masterKpi.thrustArea,
        uomType: masterKpi.uomType,
        target: masterKpi.target,
        weightage: weightage,
        deadline: masterKpi.deadline,
        status: "DRAFT",
        priority: masterKpi.priority,
        isShared: true,
        parentGoalId: masterKpi.id,
        departmentId: masterKpi.departmentId,
        ownerId: session.user.id,
      }
    });

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
