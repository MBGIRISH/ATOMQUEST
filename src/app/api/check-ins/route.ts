import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checkinSchema = z.object({
  goalId: z.string(),
  quarter: z.number().min(1).max(4),
  year: z.number(),
  achievement: z.number().min(0),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "AT_RISK", "DELAYED", "COMPLETED"]),
  employeeNotes: z.string().optional()
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const quarter = parseInt(searchParams.get("quarter") || "1");
    const year = parseInt(searchParams.get("year") || "2026");

    let goals;
    
    if (session.user.role === "EMPLOYEE") {
      goals = await prisma.goal.findMany({
        where: { ownerId: session.user.id },
        include: {
          checkins: {
            where: { quarter, year }
          }
        }
      });
    } else {
      // Manager viewing subordinates' check-ins
      const subordinates = await prisma.user.findMany({
        where: { managerId: session.user.id }
      });
      const subordinateIds = subordinates.map(u => u.id);
      
      goals = await prisma.goal.findMany({
        where: { ownerId: { in: subordinateIds } },
        include: {
          owner: true,
          checkins: {
            where: { quarter, year }
          }
        }
      });
    }

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
    
    // Check if it's a manager review
    if (body.action === "MANAGER_REVIEW") {
      if (session.user.role === "EMPLOYEE") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      
      const { checkinId, managerNotes } = body;
      const checkin = await prisma.quarterlyCheckin.update({
        where: { id: checkinId },
        data: { managerNotes }
      });
      return NextResponse.json(checkin);
    }

    // Otherwise it's an employee check-in submission
    const result = checkinSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { goalId, quarter, year, achievement, status, employeeNotes } = result.data;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Goal not found or unauthorized" }, { status: 404 });
    }

    if (["DRAFT", "UNDER_REVIEW", "REWORK_REQUESTED"].includes(goal.status)) {
      return NextResponse.json({ error: "Check-ins can only be logged for approved goals." }, { status: 400 });
    }

    // Quarter locking logic
    const currentMonth = new Date().getMonth() + 1;
    let currentQuarter = 1;
    if (currentMonth >= 4 && currentMonth <= 6) currentQuarter = 2;
    else if (currentMonth >= 7 && currentMonth <= 9) currentQuarter = 3;
    else if (currentMonth >= 10 && currentMonth <= 12) currentQuarter = 4;

    if (quarter > currentQuarter && year >= new Date().getFullYear()) {
      return NextResponse.json({ error: "Cannot log check-ins for future quarters." }, { status: 400 });
    }

    // Upsert check-in
    const checkin = await prisma.quarterlyCheckin.upsert({
      where: {
        goalId_quarter_year: { goalId, quarter, year }
      },
      update: {
        achievement,
        status,
        employeeNotes
      },
      create: {
        goalId,
        quarter,
        year,
        achievement,
        status,
        employeeNotes
      }
    });

    return NextResponse.json(checkin);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
