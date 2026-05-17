"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart3, PieChart } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Legend } from "recharts";

export default function ReportsPage() {
  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals-all"],
    queryFn: async () => {
      const res = await fetch("/api/reports?format=json");
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    }
  });

  const handleExportCSV = () => {
    toast.success(`Downloading CSV report...`);
    window.location.href = "/api/reports";
  };

  const reports = [
    { title: "Quarterly Achievement Report", description: "Detailed progress metrics for all goals across the organization.", icon: BarChart3, type: "CSV", action: handleExportCSV },
  ];

  // Prepare chart data
  const statusDistribution = [
    { name: 'Approved', value: goals?.filter((g: any) => g.status === 'APPROVED').length || 0, color: '#10b981' },
    { name: 'Under Review', value: goals?.filter((g: any) => g.status === 'UNDER_REVIEW').length || 0, color: '#8b5cf6' },
    { name: 'Rework Required', value: goals?.filter((g: any) => g.status === 'REWORK_REQUESTED').length || 0, color: '#f59e0b' },
    { name: 'Drafts', value: goals?.filter((g: any) => g.status === 'DRAFT').length || 0, color: '#64748b' },
  ].filter(d => d.value > 0);

  const thrustAreaDistribution = [
    { name: 'Technical Excellence', value: goals?.filter((g: any) => g.thrustArea === 'Technical Excellence').length || 0 },
    { name: 'Growth', value: goals?.filter((g: any) => g.thrustArea === 'Growth').length || 0 },
    { name: 'Customer Success', value: goals?.filter((g: any) => g.thrustArea === 'Customer Success').length || 0 },
    { name: 'Innovation', value: goals?.filter((g: any) => g.thrustArea === 'Innovation').length || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
        <p className="text-sm text-zinc-500">Generate and export performance insights</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} className="flex flex-col border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                <report.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription className="h-10">{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col justify-end">
              <Button onClick={report.action} className="w-full" variant={report.type === 'CSV' ? 'default' : 'outline'}>
                <Download className="mr-2 h-4 w-4" /> Export as {report.type}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Goal Status Distribution</CardTitle>
            <CardDescription>Overview of the current states of all goals</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="h-[300px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : statusDistribution.length > 0 ? (
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="99%" height={300}>
                  <RePieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-zinc-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Thrust Area Focus</CardTitle>
            <CardDescription>Distribution of goals across organizational pillars</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="h-[300px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : thrustAreaDistribution.length > 0 ? (
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="99%" height={300}>
                  <BarChart data={thrustAreaDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} name="Number of Goals" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-zinc-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
