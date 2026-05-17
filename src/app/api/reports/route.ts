import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goals = await prisma.goal.findMany({
      where: session.user.role === "EMPLOYEE" 
        ? { ownerId: session.user.id } 
        : session.user.role === "MANAGER" 
          ? { owner: { managerId: session.user.id } } 
          : {}, // Admin sees all
      include: {
        owner: true,
        department: true,
        checkins: {
          orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    if (format === "json") {
      return NextResponse.json(goals);
    }

    // Generate CSV
    const headers = ["ID", "Title", "Owner", "Status", "Thrust Area", "Target", "Achievement", "UoM", "Weightage", "Priority", "Deadline", "Created At"];
    const rows = goals.map(g => [
      g.id,
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.owner?.name || 'Unknown'}"`,
      g.status,
      g.thrustArea,
      g.target,
      g.checkins?.[0]?.achievement || 0,
      g.uomType,
      g.weightage,
      g.priority,
      new Date(g.deadline).toISOString().split('T')[0],
      new Date(g.createdAt).toISOString().split('T')[0]
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv; charset=utf-8");
    response.headers.set("Content-Disposition", `attachment; filename="goals_report_${new Date().toISOString().split('T')[0]}.csv"`);

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
