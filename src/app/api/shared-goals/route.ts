import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSharedKpiSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  thrustArea: z.string().min(1),
  uomType: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
  target: z.number().positive(),
  deadline: z.string().datetime(),
  departmentId: z.string()
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // If manager/admin, show department KPIs they created or manage
    // If employee, show KPIs assigned to their department that they can adopt

    const kpis = await prisma.goal.findMany({
      where: {
        isShared: true,
        parentGoalId: null, // Only root KPIs
        departmentId: session.user.departmentId
      },
      include: {
        owner: true,
        department: true,
        childGoals: {
          where: session.user.role === "EMPLOYEE" ? { ownerId: session.user.id } : undefined,
          include: { owner: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(kpis);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createSharedKpiSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const newKpi = await prisma.goal.create({
      data: {
        ...result.data,
        deadline: new Date(result.data.deadline),
        weightage: 0, // Master KPI doesn't count towards manager's personal 100%
        status: "APPROVED", // Auto-approved
        priority: "HIGH",
        isShared: true,
        ownerId: session.user.id,
      }
    });

    return NextResponse.json(newKpi, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
