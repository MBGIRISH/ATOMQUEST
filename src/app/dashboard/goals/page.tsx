"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Clock, AlertCircle, Edit, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    }
  });

  const totalWeightage = goals?.reduce((sum: number, g: any) => sum + g.weightage, 0) || 0;

  const createGoal = useMutation({
    mutationFn: async (newGoal: any) => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGoal),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create goal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setIsCreateOpen(false);
      setEditingGoal(null);
      toast.success("Goal created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const updateGoal = useMutation({
    mutationFn: async (updatedGoal: any) => {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedGoal),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        let errorMessage = "Failed to update goal";
        if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setIsCreateOpen(false);
      setEditingGoal(null);
      toast.success("Goal updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete goal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const openEdit = (goal: any) => {
    setEditingGoal(goal);
    setIsCreateOpen(true);
  };

  const handleModalOpen = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) setEditingGoal(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    
    const goalData = {
      title: formData.get("title"),
      description: formData.get("description"),
      thrustArea: formData.get("thrustArea"),
      uomType: formData.get("uomType"),
      target: Number(formData.get("target")),
      weightage: Number(formData.get("weightage")),
      deadline: new Date(formData.get("deadline") as string).toISOString(),
      priority: formData.get("priority"),
      saveAsDraft: action === "draft",
    };

    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, ...goalData });
    } else {
      createGoal.mutate(goalData);
    }
  };

  const submitDraft = (goal: any) => {
    updateGoal.mutate({
      ...goal,
      saveAsDraft: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "UNDER_REVIEW": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "DRAFT": return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
      case "REWORK_REQUESTED": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const isEditable = (status: string) => ["DRAFT", "REWORK_REQUESTED"].includes(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Goals</h1>
          <p className="text-sm text-zinc-500">Manage your quarterly performance goals</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm flex items-center gap-2">
            <span className="text-zinc-500">Total Weightage:</span>
            <span className={`font-medium ${totalWeightage > 100 ? "text-red-600" : totalWeightage === 100 ? "text-emerald-600" : "text-blue-600"}`}>
              {totalWeightage}% / 100%
            </span>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={handleModalOpen}>
            <DialogTrigger render={<Button disabled={totalWeightage >= 100} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Create Goal
              </Button>} />
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
                <DialogDescription>
                  Define a new objective for this quarter. Weightage must be between 10% and 100%.
                  <span className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium">
                    Remaining Capacity: {100 - (totalWeightage - (editingGoal?.weightage || 0))}%
                  </span>
                </DialogDescription>
              </DialogHeader>
              
              <form key={editingGoal?.id || "new"} onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Goal Title</Label>
                    <Input id="title" name="title" defaultValue={editingGoal?.title} required placeholder="E.g., Migrate frontend to Next.js 15" disabled={editingGoal?.isShared || (editingGoal && !["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status))} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <textarea 
                      id="description" 
                      name="description" 
                      defaultValue={editingGoal?.description || ""}
                      className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                      placeholder="Provide more context..."
                      disabled={editingGoal?.isShared || (editingGoal && !["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="thrustArea">Thrust Area</Label>
                      <Select name="thrustArea" required defaultValue={editingGoal?.thrustArea || "Technical Excellence"} disabled={editingGoal?.isShared || (editingGoal && !["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technical Excellence">Technical Excellence</SelectItem>
                          <SelectItem value="Growth">Growth</SelectItem>
                          <SelectItem value="Customer Success">Customer Success</SelectItem>
                          <SelectItem value="Innovation">Innovation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" required defaultValue={editingGoal?.priority || "MEDIUM"} disabled={editingGoal?.isShared || (editingGoal && !["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="uomType">Unit of Measure (UoM)</Label>
                      <Select name="uomType" required defaultValue={editingGoal?.uomType || "PERCENTAGE"} disabled={editingGoal?.isShared || (editingGoal && !["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select UoM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                          <SelectItem value="NUMERIC">Numeric Value</SelectItem>
                          <SelectItem value="TIMELINE">Timeline / Date</SelectItem>
                          <SelectItem value="ZERO_BASED">Zero-Based (Yes/No)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="target">Target Value</Label>
                      <Input id="target" name="target" type="number" step="0.01" defaultValue={editingGoal?.target} required disabled={editingGoal?.isShared || (editingGoal && !["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weightage">Weightage (%)</Label>
                      <Input id="weightage" name="weightage" type="number" min="10" max="100" defaultValue={editingGoal?.weightage} required disabled={editingGoal && !["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status)} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input id="deadline" name="deadline" type="date" defaultValue={editingGoal?.deadline ? new Date(editingGoal.deadline).toISOString().split('T')[0] : ""} required disabled={editingGoal?.isShared || (editingGoal && !["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status))} />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleModalOpen(false)}>
                    Cancel
                  </Button>
                  {(!editingGoal || ["DRAFT", "REWORK_REQUESTED"].includes(editingGoal.status)) && (
                    <>
                      <Button type="submit" value="draft" disabled={createGoal.isPending || updateGoal.isPending} variant="secondary">
                        Save as Draft
                      </Button>
                      <Button type="submit" value="submit" disabled={createGoal.isPending || updateGoal.isPending} className="bg-blue-600 hover:bg-blue-700">
                        Submit for Approval
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-t-xl" />
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : goals?.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Target className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium">No goals found</h3>
            <p className="text-zinc-500 max-w-sm mt-1">
              You haven't set any goals for this quarter yet. Create a goal to get started with your performance tracking.
            </p>
            <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals?.map((goal: any) => (
            <Card key={goal.id} className="flex flex-col hover:shadow-md transition-all border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="flex justify-between items-start gap-4">
                  <Badge variant="secondary" className="font-normal text-xs uppercase tracking-wider">
                    {goal.thrustArea}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(goal.status)}>
                      {goal.status.replace("_", " ")}
                    </Badge>
                    {isEditable(goal.status) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6">
                            <Edit className="h-3 w-3 text-zinc-500" />
                          </Button>} />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(goal)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => {
                            if (confirm("Are you sure you want to delete this goal?")) {
                              deleteGoal.mutate(goal.id);
                            }
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <CardTitle className="mt-3 text-lg leading-tight">{goal.title}</CardTitle>
                {goal.isShared && (
                  <CardDescription className="text-blue-600 flex items-center gap-1 mt-1 text-xs">
                    <Target className="h-3 w-3" /> Shared KPI
                  </CardDescription>
                )}
                {goal.status === "REWORK_REQUESTED" && goal.approvals?.[0]?.comment && (
                  <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg text-xs border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block mb-0.5">Manager Feedback:</span>
                      <span className="opacity-90">{goal.approvals[0].comment}</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Target</span>
                    <span className="font-medium">{goal.target} {goal.uomType === 'PERCENTAGE' ? '%' : ''}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Weightage</span>
                    <span className="font-medium">{goal.weightage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Deadline</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(goal.deadline), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-xs h-8"
                    onClick={() => { setEditingGoal(goal); setIsCreateOpen(true); }}
                  >
                    View Details
                  </Button>
                  {(goal.status === "DRAFT" || goal.status === "REWORK_REQUESTED") && (
                    <Button 
                      variant="default" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs h-8"
                      onClick={() => submitDraft(goal)}
                      disabled={updateGoal.isPending}
                    >
                      <Send className="mr-2 h-3 w-3" /> Submit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
