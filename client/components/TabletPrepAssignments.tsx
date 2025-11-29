import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

interface PrepAssignment {
  id: string;
  prepTaskId: string;
  taskName: string;
  assignedToEmployeeId: string;
  assignedToEmployeeName?: string;
  dueDate: string;
  ingredients?: string[];
  instructions?: string;
  notes?: string;
  status: "assigned" | "in-progress" | "completed" | "cancelled";
  createdAt: string;
  completedAt?: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface TabletPrepAssignmentsProps {
  deviceId: string;
  employees?: Employee[];
  onClose?: () => void;
}

const MOCK_EMPLOYEES: Employee[] = [
  { id: "emp001", name: "Chef John", role: "Head Chef" },
  { id: "emp002", name: "Sarah", role: "Sous Chef" },
  { id: "emp003", name: "Miguel", role: "Line Cook" },
  { id: "emp004", name: "Lisa", role: "Prep Cook" },
  { id: "emp005", name: "David", role: "Apprentice" },
];

export function TabletPrepAssignments({
  deviceId,
  employees = MOCK_EMPLOYEES,
  onClose,
}: TabletPrepAssignmentsProps) {
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<PrepAssignment[]>([]);
  const [myAssignments, setMyAssignments] = useState<PrepAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"admin" | "my-tasks">("admin");
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentEmployeeId = localStorage.getItem("tablet:employeeId") || "";

  const [newAssignment, setNewAssignment] = useState({
    taskName: "",
    assignedToEmployeeId: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    ingredients: "",
    instructions: "",
    notes: "",
  });

  // Load assignments
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load all assignments (for admin view)
      const allResponse = await fetch(`/api/tablet/prep/assigned?status=assigned`);
      if (allResponse.ok) {
        const data = await allResponse.json();
        setAssignments(data.assignments || []);
      }

      // Load my assignments
      if (currentEmployeeId) {
        const myResponse = await fetch(
          `/api/tablet/prep/assigned?employeeId=${currentEmployeeId}&status=assigned`
        );
        if (myResponse.ok) {
          const data = await myResponse.json();
          setMyAssignments(data.assignments || []);
        }
      }
    } catch (error) {
      console.warn("Failed to load assignments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentEmployeeId]);

  const handleCreateAssignment = async () => {
    if (!newAssignment.taskName.trim() || !newAssignment.assignedToEmployeeId) {
      toast({
        title: "Validation",
        description: "Please enter task name and select an employee",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/tablet/prep/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          prepTaskId: `prep-${Date.now()}`,
          assignedToEmployeeId: newAssignment.assignedToEmployeeId,
          dueDate: newAssignment.dueDate,
          ingredients: newAssignment.ingredients.split("\n").filter((i) => i.trim()),
          instructions: newAssignment.instructions,
          notes: newAssignment.notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to create assignment");

      toast({
        title: "Assignment Created",
        description: `Prep work assigned to ${
          employees.find((e) => e.id === newAssignment.assignedToEmployeeId)?.name || "staff member"
        }`,
      });

      // Clear form
      setNewAssignment({
        taskName: "",
        assignedToEmployeeId: "",
        dueDate: format(new Date(), "yyyy-MM-dd"),
        ingredients: "",
        instructions: "",
        notes: "",
      });

      setShowCreateAssignment(false);

      // Reload assignments
      await loadAssignments();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tablet/prep/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update assignment");

      toast({
        title: "Success",
        description: `Assignment marked as ${newStatus}`,
      });

      // Reload assignments
      await loadAssignments();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assignment",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-50 border-blue-200";
      case "in-progress":
        return "bg-orange-50 border-orange-200";
      case "completed":
        return "bg-emerald-50 border-emerald-200";
      case "cancelled":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const AssignmentCard = ({ assignment }: { assignment: PrepAssignment }) => (
    <Card className={`border ${getStatusColor(assignment.status)}`}>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{assignment.taskName}</h3>
              <p className="text-sm text-gray-600">{assignment.assignedToEmployeeName}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(assignment.status)}`}>
              {assignment.status}
            </span>
          </div>

          <div className="text-sm">
            <p className="text-gray-600">
              <Clock className="w-3 h-3 inline mr-1" />
              Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
            </p>
          </div>

          {assignment.ingredients && assignment.ingredients.length > 0 && (
            <div className="text-sm">
              <p className="font-medium text-gray-700 mb-1">Ingredients:</p>
              <ul className="list-disc list-inside text-gray-600">
                {assignment.ingredients.map((ing, idx) => (
                  <li key={idx}>{ing}</li>
                ))}
              </ul>
            </div>
          )}

          {assignment.instructions && (
            <div className="text-sm">
              <p className="font-medium text-gray-700 mb-1">Instructions:</p>
              <p className="text-gray-600">{assignment.instructions}</p>
            </div>
          )}

          {assignment.notes && (
            <div className="text-xs text-gray-600 bg-white/30 p-2 rounded">
              <p className="font-medium">Notes:</p>
              <p>{assignment.notes}</p>
            </div>
          )}

          {assignment.status !== "completed" && assignment.status !== "cancelled" && (
            <div className="flex gap-2 pt-2">
              {assignment.status === "assigned" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateAssignmentStatus(assignment.id, "in-progress")}
                  className="flex-1 text-xs"
                >
                  Start Prep
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateAssignmentStatus(assignment.id, "completed")}
                className="flex-1 text-xs"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Mark Done
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prep Work Assignments</CardTitle>
              <CardDescription>Manage prep work and assign tasks to kitchen staff</CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateAssignment(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Assign Prep Work
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                activeTab === "admin"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              All Assignments ({assignments.length})
            </button>
            {currentEmployeeId && (
              <button
                onClick={() => setActiveTab("my-tasks")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                  activeTab === "my-tasks"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                My Tasks ({myAssignments.length})
              </button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : activeTab === "admin" ? (
            assignments.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active prep assignments. Create new assignments to distribute prep work.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            )
          ) : (
            myAssignments.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have no active prep assignments. Check back for new tasks.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Create Assignment Dialog */}
      <Dialog open={showCreateAssignment} onOpenChange={setShowCreateAssignment}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Prep Work</DialogTitle>
            <DialogDescription>Create a new prep work assignment for kitchen staff</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Name *</label>
              <Input
                placeholder="e.g., Chop vegetables, Marinate chicken"
                value={newAssignment.taskName}
                onChange={(e) => setNewAssignment({ ...newAssignment, taskName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
              <Select
                value={newAssignment.assignedToEmployeeId}
                onValueChange={(value) =>
                  setNewAssignment({ ...newAssignment, assignedToEmployeeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
              <Input
                type="date"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients (Optional)</label>
              <textarea
                placeholder="List ingredients (one per line)"
                value={newAssignment.ingredients}
                onChange={(e) => setNewAssignment({ ...newAssignment, ingredients: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructions (Optional)</label>
              <textarea
                placeholder="Detailed prep instructions..."
                value={newAssignment.instructions}
                onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                placeholder="Any additional notes or special requirements..."
                value={newAssignment.notes}
                onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateAssignment(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
