"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ShieldAlert, Activity, User, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/audit");
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    }
  });

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "bg-blue-100 text-blue-800";
    if (action.includes("UPDATE")) return "bg-emerald-100 text-emerald-800";
    if (action.includes("DELETE")) return "bg-red-100 text-red-800";
    if (action.includes("REJECTED") || action.includes("REWORK")) return "bg-amber-100 text-amber-800";
    if (action.includes("APPROVED")) return "bg-emerald-100 text-emerald-800";
    return "bg-zinc-100 text-zinc-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-red-100 p-2 rounded-lg">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Audit & Governance</h1>
          <p className="text-sm text-zinc-500">Immutable tracking of all critical system actions</p>
        </div>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle>Recent Activity Logs</CardTitle>
          <CardDescription>Comprehensive timeline of state changes and approvals</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">Loading audit trail...</div>
          ) : logs?.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No logs found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-zinc-500 text-xs">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-700">
                            {log.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{log.user?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {log.entityType === "GOAL" ? <Target className="h-3 w-3 text-zinc-400" /> : <User className="h-3 w-3 text-zinc-400" />}
                        {log.entityType}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-xs text-zinc-500 truncate" title={log.goal?.title}>
                        {log.goal ? `Targeted Goal: ${log.goal.title}` : `ID: ${log.entityId}`}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
