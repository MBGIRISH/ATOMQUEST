import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In a real enterprise app, this would be secured by a cron secret
// For example: if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) ...

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    
    // Find all goals that are past their deadline, not completed, and haven't been escalated yet
    const overdueGoals = await prisma.goal.findMany({
      where: {
        deadline: {
          lt: today
        },
        status: {
          notIn: ["APPROVED", "COMPLETED"]
        },
        escalations: {
          none: {} // Only escalate if it hasn't been escalated before
        }
      },
      include: {
        owner: true
      }
    });

    if (overdueGoals.length === 0) {
      return NextResponse.json({ message: "No overdue goals require escalation today.", count: 0 });
    }

    // Create escalations for each overdue goal
    const escalations = await Promise.all(
      overdueGoals.map(async (goal) => {
        return prisma.escalation.create({
          data: {
            goalId: goal.id,
            userId: goal.ownerId,
            reason: `Goal deadline (${goal.deadline.toISOString().split('T')[0]}) has passed and the goal is still in ${goal.status} status.`,
            resolved: false,
            level: 1, // First level escalation
          }
        });
      })
    );

    // Create notifications for managers
    await Promise.all(
      overdueGoals.map(async (goal) => {
        if (goal.owner.managerId) {
          return prisma.notification.create({
            data: {
              userId: goal.owner.managerId,
              title: "Goal Escalation Alert",
              message: `Your report ${goal.owner.name} has an overdue goal: ${goal.title}`,
              isRead: false
            }
          });
        }
      })
    );

    return NextResponse.json({ 
      message: "Escalation engine executed successfully.", 
      escalatedCount: escalations.length 
    });

  } catch (error) {
    console.error("Escalation Engine Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
