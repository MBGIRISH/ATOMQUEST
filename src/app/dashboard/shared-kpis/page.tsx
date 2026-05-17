"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Target, Users, GitMerge, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SharedKpisPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const queryClient = useQueryClient();
  const [selectedKpi, setSelectedKpi] = useState<any>(null);
  const [weightage, setWeightage] = useState<string>("20");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: kpis, isLoading } = useQuery({
    queryKey: ["shared-kpis"],
    queryFn: async () => {
      const res = await fetch("/api/shared-goals");
      if (!res.ok) throw new Error("Failed to fetch shared KPIs");
      return res.json();
    }
  });

  const adoptMutation = useMutation({
    mutationFn: async (data: { kpiId: string, weightage: number }) => {
      const res = await fetch("/api/shared-goals/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to adopt KPI");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-kpis"] });
      setSelectedKpi(null);
      toast.success("KPI adopted successfully. Check your goals.");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleAdopt = () => {
    if (!selectedKpi || !weightage) return;
    adoptMutation.mutate({
      kpiId: selectedKpi.id,
      weightage: Number(weightage)
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create KPI");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-kpis"] });
      setIsCreateModalOpen(false);
      toast.success("Department KPI created successfully.");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleCreateKpi = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      thrustArea: formData.get("thrustArea"),
      uomType: formData.get("uomType"),
      target: Number(formData.get("target")),
      deadline: new Date(formData.get("deadline") as string).toISOString(),
      departmentId: session?.user?.departmentId,
    };
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shared Department KPIs</h1>
          <p className="text-sm text-zinc-500">
            {role === "EMPLOYEE" 
              ? "Adopt department-level KPIs into your personal goals" 
              : "Manage and propagate top-level goals to your team"}
          </p>
        </div>
        
        {role !== "EMPLOYEE" && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
              <Plus className="mr-2 h-4 w-4" /> Create Department KPI
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Department KPI</DialogTitle>
                <DialogDescription>
                  <span className="block mt-2">Define a master goal that employees can adopt.</span>
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateKpi} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">KPI Title</Label>
                  <Input id="title" name="title" required placeholder="E.g., Increase Q2 Revenue" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Brief details about the KPI" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thrustArea">Thrust Area</Label>
                    <select name="thrustArea" id="thrustArea" className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300" required>
                      <option value="Technical Excellence">Technical Excellence</option>
                      <option value="Growth">Growth</option>
                      <option value="Customer Success">Customer Success</option>
                      <option value="Innovation">Innovation</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uomType">Unit of Measure</Label>
                    <select name="uomType" id="uomType" className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300" required>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="NUMERIC">Numeric</option>
                      <option value="ZERO_BASED">Zero-Based</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Target Value</Label>
                    <Input id="target" name="target" type="number" required min="1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input id="deadline" name="deadline" type="date" required />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Master KPI"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse h-40" />
          ))}
        </div>
      ) : kpis?.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <GitMerge className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium">No Department KPIs</h3>
            <p className="text-zinc-500 mt-1">
              There are currently no shared KPIs for your department.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {kpis?.map((kpi: any) => {
            const hasAdopted = kpi.childGoals && kpi.childGoals.length > 0;
            
            return (
              <Card key={kpi.id} className="flex flex-col border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30">
                      {kpi.thrustArea}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                      <Users className="h-3 w-3" />
                      Department KPI
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight mt-2">{kpi.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{kpi.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                    <div>
                      <p className="text-zinc-500 text-xs">Target</p>
                      <p className="font-medium">{kpi.target} {kpi.uomType === 'PERCENTAGE' ? '%' : ''}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs">Deadline</p>
                      <p className="font-medium">{format(new Date(kpi.deadline), "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs">Owner</p>
                      <p className="font-medium">{kpi.owner.name}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  {role === "EMPLOYEE" ? (
                    hasAdopted ? (
                      <Button variant="secondary" className="w-full text-emerald-600 bg-emerald-50 hover:bg-emerald-100" disabled>
                        Adopted (Weightage: {kpi.childGoals[0].weightage}%)
                      </Button>
                    ) : (
                      <Dialog open={selectedKpi?.id === kpi.id} onOpenChange={(open) => !open && setSelectedKpi(null)}>
                        <DialogTrigger render={<Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setSelectedKpi(kpi)} />}>
                          Adopt this KPI
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adopt Department KPI</DialogTitle>
                            <DialogDescription>
                              This will create a linked personal goal. You can only adjust the weightage.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg space-y-2">
                              <p className="font-medium">{kpi.title}</p>
                              <p className="text-sm text-zinc-500">Target: {kpi.target} {kpi.uomType === 'PERCENTAGE' ? '%' : ''}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="weightage">Your Weightage (%)</Label>
                              <Input 
                                id="weightage" 
                                type="number" 
                                min="10" 
                                max="100" 
                                value={weightage} 
                                onChange={(e) => setWeightage(e.target.value)} 
                              />
                              <p className="text-xs text-zinc-500">Minimum 10% required.</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSelectedKpi(null)}>Cancel</Button>
                            <Button 
                              className="bg-blue-600" 
                              onClick={handleAdopt}
                              disabled={adoptMutation.isPending}
                            >
                              {adoptMutation.isPending ? "Adopting..." : "Confirm Adoption"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )
                  ) : (
                    <Dialog>
                      <DialogTrigger render={<Button variant="outline" className="w-full" />}>
                        View Adopters
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>KPI Adopters</DialogTitle>
                          <DialogDescription>
                            <span className="block mt-2">Employees who have adopted this KPI.</span>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto">
                          {kpi.childGoals && kpi.childGoals.length > 0 ? (
                            kpi.childGoals.map((child: any) => (
                              <div key={child.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <div>
                                  <p className="font-medium text-sm">{child.owner.name}</p>
                                  <p className="text-xs text-zinc-500">{child.owner.email}</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30">
                                    {child.weightage}% Weight
                                  </Badge>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-zinc-500 py-4 text-sm">
                              No employees have adopted this KPI yet.
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
