"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { CalendarCheck, ChevronLeft, ChevronRight, Activity, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CheckinsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const queryClient = useQueryClient();
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(2026);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["checkins", quarter, year],
    queryFn: async () => {
      const res = await fetch(`/api/check-ins?quarter=${quarter}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch check-ins");
      return res.json();
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = "Failed to save check-in";
        if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins", quarter, year] });
      setSelectedGoal(null);
      toast.success("Check-in saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save check-in");
    }
  });

  const handleEmployeeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Fallback for custom Select components that might not inject hidden inputs
    const statusVal = formData.get("status") || "ON_TRACK";
    
    checkinMutation.mutate({
      goalId: selectedGoal.id,
      quarter,
      year,
      achievement: Number(formData.get("achievement")),
      status: statusVal,
      employeeNotes: formData.get("employeeNotes") || "",
    });
  };

  const handleManagerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    checkinMutation.mutate({
      action: "MANAGER_REVIEW",
      checkinId: selectedGoal.checkins[0]?.id,
      managerNotes: formData.get("managerNotes"),
    });
  };

  const calculateProgress = (achievement: number, target: number, uomType: string) => {
    if (uomType === "ZERO_BASED") return achievement > 0 ? 100 : 0;
    if (target === 0) return achievement > 0 ? 100 : 0; // Handle zero target edge case
    
    // Calculate raw percentage
    let progress = (achievement / target) * 100;
    
    // For timeline or specific types where lower is better (e.g. reducing incidents)
    // If target is negative (edge case), invert logic
    if (target < 0) {
      progress = (achievement <= target) ? 100 : (achievement < 0 ? (achievement / target) * 100 : 0);
    }
    
    if (isNaN(progress) || !isFinite(progress)) return 0;
    
    // Strictly enforce Min (0) and Max (100) boundaries
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quarterly Check-ins</h1>
          <p className="text-sm text-zinc-500">Track progress and provide updates on active goals</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setQuarter(q => Math.max(1, q - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 font-medium text-sm flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-blue-600" />
            Q{quarter} {year}
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setQuarter(q => Math.min(4, q + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
      ) : goals?.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <Activity className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium">No active goals found</h3>
            <p className="text-zinc-500 mt-1">There are no approved goals to track for Q{quarter} {year}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals?.map((goal: any) => {
            const currentCheckin = goal.checkins?.[0];
            const hasCheckin = !!currentCheckin;
            const progress = calculateProgress(currentCheckin?.achievement || 0, goal.target, goal.uomType);
            
            return (
              <Card key={goal.id} className="border-zinc-200 dark:border-zinc-800 overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    
                    <div className="flex-1 space-y-3 min-w-0">
                      {role === "MANAGER" && goal.owner && (
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">{goal.owner.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-zinc-600">{goal.owner.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg leading-tight truncate">{goal.title}</h4>
                          <div className="flex gap-4 mt-1 text-sm text-zinc-500">
                            <span>Target: {goal.target}</span>
                            <span>Current: <span className="font-medium text-zinc-900 dark:text-white">{currentCheckin?.achievement || 0}</span></span>
                          </div>
                        </div>
                        {hasCheckin && (
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            currentCheckin.status === 'ON_TRACK' ? 'bg-emerald-100 text-emerald-700' :
                            currentCheckin.status === 'AT_RISK' ? 'bg-amber-100 text-amber-700' :
                            currentCheckin.status === 'DELAYED' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {currentCheckin.status.replace("_", " ")}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">Progress</span>
                          <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      {currentCheckin?.managerNotes && (
                        <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 flex gap-3 text-sm">
                          <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <span className="font-medium text-blue-900 dark:text-blue-400 block mb-1">Manager Feedback:</span>
                            <span className="text-zinc-700 dark:text-zinc-300">{currentCheckin.managerNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0">
                      <Dialog open={selectedGoal?.id === goal.id} onOpenChange={(open) => !open && setSelectedGoal(null)}>
                        <DialogTrigger render={<Button 
                            variant={hasCheckin ? "outline" : "default"}
                            className={hasCheckin ? "" : "bg-blue-600 hover:bg-blue-700"}
                            onClick={() => setSelectedGoal(goal)}
                          >
                            {role === "MANAGER" 
                              ? (currentCheckin?.managerNotes ? "Edit Feedback" : "Provide Feedback") 
                              : (hasCheckin ? "Update Progress" : "Log Progress")}
                          </Button>} />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{role === "MANAGER" ? "Manager Feedback" : "Quarterly Check-in"}</DialogTitle>
                            <DialogDescription>
                              {role === "MANAGER" 
                                ? `Provide feedback for ${goal.owner?.name}'s Q${quarter} progress.`
                                : `Update your progress for Q${quarter} ${year}.`}
                            </DialogDescription>
                          </DialogHeader>

                          {role === "MANAGER" ? (
                            <form key={selectedGoal?.id || "m"} onSubmit={handleManagerSubmit} className="space-y-4 py-4">
                              {!hasCheckin ? (
                                <div className="text-center py-6 text-zinc-500">
                                  Employee has not submitted a check-in for this quarter yet.
                                </div>
                              ) : (
                                <>
                                  <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg text-sm space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Reported Achievement:</span>
                                      <span className="font-medium">{currentCheckin.achievement} / {goal.target}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Status:</span>
                                      <span className="font-medium">{currentCheckin.status}</span>
                                    </div>
                                    {currentCheckin.employeeNotes && (
                                      <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800">
                                        <span className="text-zinc-500 block mb-1">Employee Notes:</span>
                                        <span className="italic">"{currentCheckin.employeeNotes}"</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="managerNotes">Your Feedback</Label>
                                    <Textarea 
                                      id="managerNotes" 
                                      name="managerNotes" 
                                      defaultValue={currentCheckin?.managerNotes || ""}
                                      required
                                      placeholder="Provide constructive feedback, recommendations, or note discussion points..."
                                      className="min-h-[100px]"
                                    />
                                  </div>
                                </>
                              )}
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setSelectedGoal(null)}>Cancel</Button>
                                <Button type="submit" disabled={!hasCheckin || checkinMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                                  {checkinMutation.isPending ? "Saving..." : "Save Feedback"}
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <form key={selectedGoal?.id || "e"} onSubmit={handleEmployeeSubmit} className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="achievement">Current Achievement</Label>
                                  <Input 
                                    id="achievement" 
                                    name="achievement" 
                                    type="number" 
                                    step="0.01" 
                                    defaultValue={currentCheckin?.achievement || ""}
                                    required 
                                  />
                                  <p className="text-xs text-zinc-500">Target: {goal.target}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="status">Current Status</Label>
                                  <Select name="status" defaultValue={currentCheckin?.status || "ON_TRACK"} required>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                                      <SelectItem value="ON_TRACK">On Track</SelectItem>
                                      <SelectItem value="AT_RISK">At Risk</SelectItem>
                                      <SelectItem value="DELAYED">Delayed</SelectItem>
                                      <SelectItem value="COMPLETED">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="employeeNotes">Update Notes</Label>
                                <Textarea 
                                  id="employeeNotes" 
                                  name="employeeNotes" 
                                  defaultValue={currentCheckin?.employeeNotes || ""}
                                  placeholder="Describe your progress, challenges, or support needed..."
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setSelectedGoal(null)}>Cancel</Button>
                                <Button type="submit" disabled={checkinMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                                  {checkinMutation.isPending ? "Saving..." : "Save Check-in"}
                                </Button>
                              </div>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
