"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    }
  });

  const totalGoals = goals?.length || 0;
  const completedGoals = goals?.filter((g: any) => {
    const ach = g.checkins?.[0]?.achievement || 0;
    if (g.uomType === "ZERO_BASED") return ach > 0;
    return g.target === 0 ? ach >= 0 : ach >= g.target;
  }).length || 0;
  const draftGoals = goals?.filter((g: any) => g.status === "DRAFT").length || 0;
  const underReview = goals?.filter((g: any) => g.status === "UNDER_REVIEW").length || 0;

  const stats = [
    { name: "Total Goals", value: totalGoals, icon: Target, trend: "Current Quarter", color: "text-blue-600" },
    { name: "Completed", value: completedGoals, icon: CheckCircle2, trend: `${totalGoals > 0 ? Math.round((completedGoals/totalGoals)*100) : 0}% completion rate`, color: "text-emerald-600" },
    { name: "Drafts", value: draftGoals, icon: AlertTriangle, trend: "Requires submission", color: "text-amber-600" },
    { name: "Pending Approval", value: underReview, icon: Clock, trend: "Awaiting manager review", color: "text-purple-600" },
  ];

  const chartData = goals?.slice(0, 5).map((g: any) => ({
    name: g.title.substring(0, 15) + (g.title.length > 15 ? '...' : ''),
    target: g.uomType === 'PERCENTAGE' ? 100 : g.target,
    achievement: g.checkins?.[0]?.achievement || 0,
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Welcome back, {session?.user?.name}
        </h1>
        <p className="text-zinc-500 mt-2">
          Here's an overview of your goals for Q1 2026.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {stat.name}
                </p>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="flex items-baseline flex-col mt-2">
                <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {stat.value}
                </span>
                <span className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Quarterly Progress Overview</CardTitle>
            <CardDescription>
              Goal achievement compared to target expectations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="99%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="achievement" name="Current Achievement" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target Value" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                <div className="text-center text-zinc-500">
                  <Target className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                  <p>No goals data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates on your goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
            ) : goals?.length > 0 ? (
              <div className="space-y-6">
                {goals.slice(0, 4).map((g: any, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-0.5 relative">
                      <div className="h-2 w-2 rounded-full bg-blue-600 ring-4 ring-blue-50 dark:ring-blue-900/20" />
                      {i !== Math.min(3, goals.length - 1) && <div className="absolute top-3 left-1 w-[1px] h-10 bg-zinc-200 dark:bg-zinc-800" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">Goal Created/Updated</p>
                      <p className="text-sm text-zinc-500">{g.title}</p>
                      <p className="text-xs text-zinc-400 mt-1">{format(new Date(g.updatedAt || g.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-zinc-500 py-8">No recent activity</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {role === "MANAGER" && (
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Team Status Overview</CardTitle>
            <CardDescription>
              Goal completion rates across your direct reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "John Developer", progress: 65, status: "On Track" },
                { name: "Jane Designer", progress: 85, status: "Excellent" },
                { name: "Mike Analyst", progress: 30, status: "At Risk" },
              ].map(member => (
                <div key={member.name} className="flex items-center gap-4">
                  <div className="w-[150px] text-sm font-medium">{member.name}</div>
                  <div className="flex-1">
                    <Progress value={member.progress} className={`h-2 ${member.progress < 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-600"}`} />
                  </div>
                  <div className="w-[80px] text-right text-sm text-zinc-500">{member.progress}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
