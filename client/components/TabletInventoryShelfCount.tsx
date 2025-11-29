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
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
  notes?: string;
}

interface ShelfCountSession {
  id: string;
  countDate: string;
  items: InventoryItem[];
  employeeId: string;
  notes?: string;
  recordedAt?: string;
}

export interface TabletInventoryShelfCountProps {
  deviceId: string;
  onClose?: () => void;
}

const STORAGE_UNITS = ["pcs", "lbs", "kg", "oz", "ml", "L", "cups", "tbsp", "tsp"];
const STORAGE_LOCATIONS = ["Walk-in Cooler", "Walk-in Freezer", "Dry Storage", "Pantry", "Shelf"];

export function TabletInventoryShelfCount({ deviceId, onClose }: TabletInventoryShelfCountProps) {
  const { toast } = useToast();

  const [countSession, setCountSession] = useState<ShelfCountSession>({
    id: `count-${Date.now()}`,
    countDate: format(new Date(), "yyyy-MM-dd"),
    items: [],
    employeeId: localStorage.getItem("tablet:employeeId") || "",
    notes: "",
  });

  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 0,
    unit: "pcs",
    location: "Shelf",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast({
        title: "Validation",
        description: "Please enter item name",
        variant: "destructive",
      });
      return;
    }

    const item: InventoryItem = {
      id: `item-${Date.now()}`,
      ...newItem,
    };

    setCountSession((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));

    setNewItem({
      name: "",
      quantity: 0,
      unit: "pcs",
      location: "Shelf",
      notes: "",
    });

    setShowAddItem(false);
    toast({
      title: "Item added",
      description: `${item.name} added to inventory count`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCountSession((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const handleSubmit = async () => {
    if (countSession.items.length === 0) {
      toast({
        title: "Validation",
        description: "Please add at least one item to the count",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/tablet/inventory/shelf-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          items: countSession.items,
          countDate: countSession.countDate,
          employeeId: countSession.employeeId,
          notes: countSession.notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit inventory count");

      const data = await response.json();

      toast({
        title: "Success",
        description: `Inventory count recorded: ${countSession.items.length} items`,
      });

      // Clear form
      setCountSession({
        id: `count-${Date.now()}`,
        countDate: format(new Date(), "yyyy-MM-dd"),
        items: [],
        employeeId: localStorage.getItem("tablet:employeeId") || "",
        notes: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit count",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Inventory Shelf Count</CardTitle>
              <CardDescription>Record current inventory quantities</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Count Date</p>
              <p className="text-lg font-semibold text-gray-900">{countSession.countDate}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Count Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID (Optional)
              </label>
              <Input
                placeholder="Your employee ID"
                value={countSession.employeeId}
                onChange={(e) =>
                  setCountSession((prev) => ({
                    ...prev,
                    employeeId: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Count Date
              </label>
              <Input
                type="date"
                value={countSession.countDate}
                onChange={(e) =>
                  setCountSession((prev) => ({
                    ...prev,
                    countDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={countSession.notes}
              onChange={(e) =>
                setCountSession((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Any notes about the count or inventory issues..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
            />
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Items Counted</h3>
              <Button
                onClick={() => setShowAddItem(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {countSession.items.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No items added yet. Click "Add Item" to start counting.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Item Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Notes</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {countSession.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.location}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{item.notes || "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-sm text-gray-600 mt-2">
              Total items counted: <span className="font-semibold text-gray-900">{countSession.items.length}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || countSession.items.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Submit Inventory Count
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Add a new item to your inventory count</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
              <Input
                placeholder="e.g., Tomatoes, Chicken Breast, Olive Oil"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location *</label>
              <Select
                value={newItem.location}
                onValueChange={(value) => setNewItem({ ...newItem, location: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                placeholder="Any observations about this item..."
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddItem(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
