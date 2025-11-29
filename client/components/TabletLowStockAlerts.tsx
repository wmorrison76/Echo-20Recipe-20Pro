import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertTriangle,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";

interface LowStockAlert {
  id: string;
  itemName: string;
  currentQuantity: number;
  unit: string;
  reorderLevel?: number;
  suggestedQuantity?: number;
  employeeId: string;
  notes?: string;
  status: "pending" | "acknowledged" | "ordered" | "resolved";
  createdAt: string;
}

export interface TabletLowStockAlertsProps {
  deviceId: string;
  onClose?: () => void;
}

export function TabletLowStockAlerts({
  deviceId,
  onClose,
}: TabletLowStockAlertsProps) {
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newAlert, setNewAlert] = useState({
    itemName: "",
    currentQuantity: 0,
    unit: "pcs",
    reorderLevel: undefined as number | undefined,
    suggestedQuantity: undefined as number | undefined,
    notes: "",
  });

  // Load existing alerts
  useEffect(() => {
    loadAlerts();
  }, [deviceId]);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/tablet/inventory/low-stock?deviceId=${deviceId}`,
      );
      if (!response.ok) throw new Error("Failed to load alerts");

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.warn("Failed to load low stock alerts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  const handleCreateAlert = async () => {
    if (!newAlert.itemName.trim()) {
      toast({
        title: "Validation",
        description: "Please enter item name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/tablet/inventory/low-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          itemName: newAlert.itemName,
          currentQuantity: newAlert.currentQuantity,
          unit: newAlert.unit,
          reorderLevel: newAlert.reorderLevel,
          suggestedQuantity:
            newAlert.suggestedQuantity ||
            newAlert.reorderLevel ||
            newAlert.currentQuantity,
          employeeId: localStorage.getItem("tablet:employeeId") || "Unknown",
          notes: newAlert.notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to create alert");

      toast({
        title: "Alert Created",
        description: `Low stock alert created for ${newAlert.itemName}. Purchasing team will be notified.`,
      });

      // Clear form
      setNewAlert({
        itemName: "",
        currentQuantity: 0,
        unit: "pcs",
        reorderLevel: undefined,
        suggestedQuantity: undefined,
        notes: "",
      });

      setShowCreateAlert(false);

      // Reload alerts
      await loadAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create alert",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAlertStatus = async (
    alertId: string,
    newStatus: string,
  ) => {
    try {
      const response = await fetch(
        `/api/tablet/inventory/low-stock/${alertId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) throw new Error("Failed to update alert status");

      toast({
        title: "Success",
        description: "Alert status updated",
      });

      // Reload alerts
      await loadAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update alert",
        variant: "destructive",
      });
    }
  };

  const getAlertColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-50 border-red-200";
      case "acknowledged":
        return "bg-orange-50 border-orange-200";
      case "ordered":
        return "bg-blue-50 border-blue-200";
      case "resolved":
        return "bg-emerald-50 border-emerald-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800";
      case "acknowledged":
        return "bg-orange-100 text-orange-800";
      case "ordered":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>
                Manage inventory requests and order suggestions
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateAlert(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : alerts.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No low stock alerts. Items are in good supply or reorder
                thresholds are well-maintained.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`border ${getAlertColor(alert.status)}`}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {alert.itemName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(alert.status)}`}
                        >
                          {alert.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Current Qty</p>
                          <p className="font-semibold text-gray-900">
                            {alert.currentQuantity} {alert.unit}
                          </p>
                        </div>
                        {alert.reorderLevel && (
                          <div>
                            <p className="text-gray-600">Reorder Level</p>
                            <p className="font-semibold text-gray-900">
                              {alert.reorderLevel} {alert.unit}
                            </p>
                          </div>
                        )}
                      </div>

                      {alert.suggestedQuantity && (
                        <div className="bg-white/50 rounded p-2">
                          <p className="text-xs text-gray-600">
                            Suggested Order Qty
                          </p>
                          <p className="font-semibold text-gray-900">
                            {alert.suggestedQuantity} {alert.unit}
                          </p>
                        </div>
                      )}

                      {alert.notes && (
                        <div className="text-xs text-gray-600 bg-white/30 p-2 rounded">
                          <p className="font-medium">Notes:</p>
                          <p>{alert.notes}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Created:{" "}
                        {format(new Date(alert.createdAt), "MMM d, HH:mm")}
                      </p>

                      {alert.status !== "resolved" && (
                        <div className="flex gap-2 pt-2">
                          {alert.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleUpdateAlertStatus(
                                  alert.id,
                                  "acknowledged",
                                )
                              }
                              className="flex-1 text-xs"
                            >
                              Acknowledge
                            </Button>
                          )}
                          {alert.status !== "ordered" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleUpdateAlertStatus(alert.id, "ordered")
                              }
                              className="flex-1 text-xs"
                            >
                              Order
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateAlertStatus(alert.id, "resolved")
                            }
                            className="flex-1 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Alert Dialog */}
      <Dialog open={showCreateAlert} onOpenChange={setShowCreateAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Low Stock Alert</DialogTitle>
            <DialogDescription>
              Flag an item that is running low and needs to be reordered
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <Input
                placeholder="e.g., Tomatoes, Chicken Breast"
                value={newAlert.itemName}
                onChange={(e) =>
                  setNewAlert({ ...newAlert, itemName: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Qty *
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newAlert.currentQuantity}
                  onChange={(e) =>
                    setNewAlert({
                      ...newAlert,
                      currentQuantity: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <Select
                  value={newAlert.unit}
                  onValueChange={(value) =>
                    setNewAlert({ ...newAlert, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="oz">oz</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reorder Level (Optional)
              </label>
              <Input
                type="number"
                placeholder="Minimum quantity threshold"
                value={newAlert.reorderLevel || ""}
                onChange={(e) =>
                  setNewAlert({
                    ...newAlert,
                    reorderLevel: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Order Qty (Optional)
              </label>
              <Input
                type="number"
                placeholder="Quantity to order"
                value={newAlert.suggestedQuantity || ""}
                onChange={(e) =>
                  setNewAlert({
                    ...newAlert,
                    suggestedQuantity: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                placeholder="Any details about why this item is low..."
                value={newAlert.notes}
                onChange={(e) =>
                  setNewAlert({ ...newAlert, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateAlert(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAlert}
                disabled={isSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Create Alert
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
