"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [comment, setComment] = useState("");


  const { data: goals, isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      const res = await fetch("/api/approvals");
      if (!res.ok) throw new Error("Failed to fetch approvals");
      return res.json();
    }
  });

  const actionMutation = useMutation({
    mutationFn: async (data: { goalId: string, status: string, comment?: string }) => {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      setSelectedGoal(null);
      setComment("");
      toast.success("Action recorded successfully");
    },
    onError: () => {
      toast.error("Failed to process action");
    }
  });

  const handleAction = (type: "APPROVED" | "REWORK_REQUESTED" | "REJECTED") => {
    if (!selectedGoal) return;
    
    if (type !== "APPROVED" && !comment.trim()) {
      toast.error("A comment is required for rework or rejection");
      return;
    }

    actionMutation.mutate({
      goalId: selectedGoal.id,
      status: type,
      comment: comment.trim() || undefined
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Approvals</h1>
        <p className="text-sm text-zinc-500">Review and manage your team's goal submissions</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
      ) : goals?.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <Check className="h-10 w-10 text-emerald-500 mb-4" />
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-zinc-500 mt-1">No pending approvals at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals?.map((goal: any) => (
            <Card key={goal.id} className="border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {goal.owner.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{goal.owner.name}</p>
                      <p className="text-xs text-zinc-500">{goal.owner.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-zinc-900 dark:text-white">{goal.title}</h4>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30">
                        {goal.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-500 line-clamp-1">{goal.description || "No description provided"}</p>
                    <div className="flex gap-4 mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Target: {goal.target} {goal.uomType === 'PERCENTAGE' ? '%' : ''}</span>
                      <span>Weightage: {goal.weightage}%</span>
                      <span>Priority: <span className="capitalize">{goal.priority.toLowerCase()}</span></span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <Dialog open={selectedGoal?.id === goal.id} onOpenChange={(open) => !open && setSelectedGoal(null)}>
                      <DialogTrigger render={<Button variant="outline" onClick={() => setSelectedGoal(goal)}>
                          Review
                        </Button>} />
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Review Goal</DialogTitle>
                          <DialogDescription>
                            Review {goal.owner.name}'s goal submission.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 p-4 space-y-2">
                            <h4 className="font-medium">{goal.title}</h4>
                            <p className="text-sm text-zinc-500">{goal.description}</p>
                            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                              <div><span className="text-zinc-500">Thrust Area:</span> {goal.thrustArea}</div>
                              <div><span className="text-zinc-500">Weightage:</span> {goal.weightage}%</div>
                              <div><span className="text-zinc-500">Target:</span> {goal.target}</div>
                              <div><span className="text-zinc-500">Deadline:</span> {new Date(goal.deadline).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Feedback / Comment</label>
                            <Textarea 
                              placeholder="Add a comment... (Required for Rework/Reject)"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between gap-2 pt-4 border-t">
                          <Button 
                            variant="destructive" 
                            onClick={() => handleAction("REWORK_REQUESTED")}
                            disabled={actionMutation.isPending}
                          >
                            <AlertCircle className="mr-2 h-4 w-4" /> Request Rework
                          </Button>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setSelectedGoal(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleAction("APPROVED")}
                              disabled={actionMutation.isPending}
                            >
                              <Check className="mr-2 h-4 w-4" /> Approve Goal
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
