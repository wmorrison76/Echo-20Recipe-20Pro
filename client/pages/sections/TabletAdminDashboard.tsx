import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Download,
  Filter,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { TabletNav } from "@/components/TabletNav";
import { RecipeAccessManagement, type RecipeAccess } from "@/components/RecipeAccessManagement";

interface TabletDevice {
  id: string;
  device_id: string;
  device_name: string;
  credential_mode: "none" | "camera" | "employee_id" | "disabled";
  include_chef_name: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface QRCodeData {
  device_id: string;
  device_name: string;
  device_token: string;
  pairing_url: string;
  qr_code_url: string;
  setup_instructions: string;
}

interface PrintRecord {
  id: string;
  device_id: string;
  device_name: string;
  recipe_id: string;
  recipe_name: string;
  born_on: string;
  expires_on: string;
  total_portions: string;
  allergens: string[];
  employee_id: string;
  chef_name: string;
  printed_at: string;
  print_date: string;
}

export default function TabletAdminDashboard() {
  const { toast } = useToast();

  const [devices, setDevices] = useState<TabletDevice[]>([]);
  const [printHistory, setPrintHistory] = useState<PrintRecord[]>([]);
  const [recipes, setRecipes] = useState<RecipeAccess[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewDevice, setShowNewDevice] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [filters, setFilters] = useState({
    deviceId: "",
    startDate: "",
    endDate: "",
  });
  const [newDevice, setNewDevice] = useState({
    deviceName: "",
    credentialMode: "none" as const,
    includeChefName: false,
  });

  // Load devices and history on mount
  useEffect(() => {
    loadDevices();
    loadPrintHistory();
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      // Note: This endpoint would need to be created to fetch all tablet configs
      // For now, we'll show a placeholder
      toast({
        title: "Info",
        description: "Tablet device list endpoint needed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadPrintHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.deviceId) params.append("deviceId", filters.deviceId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/tablet/compliance-report?${params}`);
      if (!response.ok) throw new Error("Failed to load print history");

      const data = await response.json();
      setPrintHistory(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load print history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  const handleCreateDevice = async () => {
    if (!newDevice.deviceName.trim()) {
      toast({
        title: "Validation",
        description: "Please enter a device name",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/tablet/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminToken: "admin-token-placeholder", // In production, use actual auth token
          deviceName: newDevice.deviceName,
          credentialMode: newDevice.credentialMode,
          includeChefName: newDevice.includeChefName,
        }),
      });

      if (!response.ok) throw new Error("Failed to create device");

      const data = await response.json();

      toast({
        title: "Success",
        description: `Device created: ${data.deviceId}`,
      });

      setShowNewDevice(false);
      setNewDevice({ deviceName: "", credentialMode: "none", includeChefName: false });

      // Copy setup URL to clipboard
      navigator.clipboard.writeText(data.setupUrl);
      toast({
        title: "Setup URL copied",
        description: "Paste to tablet browser",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create device",
        variant: "destructive",
      });
    }
  };

  const downloadReport = () => {
    const csv = [
      "Device,Recipe,Portions,Employee,Date",
      ...printHistory.map((r) =>
        `"${r.device_name}","${r.recipe_name}","${r.total_portions}","${r.employee_id}","${r.printed_at}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tablet-compliance-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmRecipeAccuracy = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/tablet/recipes/${recipeId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to confirm recipe");

      toast({
        title: "Success",
        description: "Recipe confirmed as accurate",
      });

      setRecipes((prev) =>
        prev.map((r) =>
          r.recipe_id === recipeId
            ? { ...r, confirmed_at: new Date().toISOString() }
            : r
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm recipe",
        variant: "destructive",
      });
    }
  };

  const toggleRecipeAccess = async (recipeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/tablet/recipes/${recipeId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      });

      if (!response.ok) throw new Error("Failed to update recipe access");

      toast({
        title: "Success",
        description: `Recipe access ${!isActive ? "enabled" : "disabled"}`,
      });

      setRecipes((prev) =>
        prev.map((r) =>
          r.recipe_id === recipeId ? { ...r, is_active: !isActive } : r
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update recipe access",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-row">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 border-r border-gray-300">
        <TabletNav />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tablet Admin</h1>
            <p className="text-gray-600 mt-1">Manage kitchen tablet devices and compliance</p>
          </div>
        <Button
          onClick={() => setShowNewDevice(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Device
        </Button>
      </div>

      {/* Devices Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Devices</h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : devices.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No devices configured</p>
            <p className="text-sm text-gray-500 mt-1">Create your first tablet device to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{device.device_name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{device.device_id}</p>
                  </div>
                  {device.enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">Credential Mode: </span>
                    <span className="font-semibold text-gray-900">{device.credential_mode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Chef Name: </span>
                    <span className="font-semibold text-gray-900">{device.include_chef_name ? "Yes" : "No"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created: </span>
                    <span className="font-semibold text-gray-900">
                      {format(new Date(device.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Management Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recipe Access Management</h2>
        <RecipeAccessManagement
          recipes={recipes}
          onConfirm={async (recipeId) => {
            await confirmRecipeAccuracy(recipeId);
          }}
          onToggleAccess={async (recipeId, isActive) => {
            await toggleRecipeAccess(recipeId, isActive);
          }}
        />
      </div>

      {/* Compliance Report Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Compliance Report</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadReport}
              disabled={printHistory.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Device ID"
              value={filters.deviceId}
              onChange={(e) => setFilters({ ...filters, deviceId: e.target.value })}
            />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        )}

        {/* Print History Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : printHistory.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No print history available</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Recipe</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Portions</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Allergens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {printHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{record.device_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{record.recipe_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{record.total_portions}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{record.employee_id || "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {format(new Date(record.printed_at), "MMM d, HH:mm")}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {record.allergens && record.allergens.length > 0 ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          {record.allergens.join(", ")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Device Dialog */}
      <Dialog open={showNewDevice} onOpenChange={setShowNewDevice}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Tablet Device</DialogTitle>
            <DialogDescription>
              Set up a new kitchen tablet for recipe access and label printing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Device Name
              </label>
              <Input
                placeholder="e.g., Kitchen-Station-1"
                value={newDevice.deviceName}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, deviceName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Credential Mode
              </label>
              <Select
                value={newDevice.credentialMode}
                onValueChange={(value: any) =>
                  setNewDevice({ ...newDevice, credentialMode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Credentials</SelectItem>
                  <SelectItem value="camera">Camera/Photo</SelectItem>
                  <SelectItem value="employee_id">Employee ID</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newDevice.includeChefName}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, includeChefName: e.target.checked })
                }
              />
              <span className="text-sm text-gray-700">Include chef name in QR code</span>
            </label>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewDevice(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDevice} className="bg-blue-600 hover:bg-blue-700">
                Create Device
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
