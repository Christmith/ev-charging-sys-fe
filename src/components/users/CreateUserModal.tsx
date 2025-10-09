import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { WebUser, UserRole } from "@/types/auth";
import { Shield, MapPin } from "lucide-react";
import { userApi } from "@/services/api";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: WebUser) => void;
  availableStations?: Array<{ id: string; name: string; code?: string }>;
  loading?: boolean;
}

export function CreateUserModal({
  open,
  onOpenChange,
  onUserCreated,
  availableStations = [],
  loading = false,
}: CreateUserModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "" as UserRole,
    password: "",
    confirmPassword: "",
    assignedStationId: "" as string,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.role ||
      !formData.password
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Station assignment validation for StationOperator
    if (formData.role === "StationOperator") {
      if (!formData.assignedStationId) {
        toast({
          title: "Validation Error",
          description:
            "Station Operator must be assigned to a charging station",
          variant: "destructive",
        });
        return;
      }
      if (availableStations.length === 0) {
        toast({
          title: "Validation Error",
          description:
            "No stations available for assignment. Please try again later.",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare API request data
      const apiData = {
        email: formData.email,
        password: formData.password,
        role: formData.role as "Backoffice" | "StationOperator",
        fullName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || undefined,
        assignedStationId:
          formData.role === "StationOperator"
            ? formData.assignedStationId
            : null,
      };

      // Call the API
      const response = await userApi.createOperationalUser(apiData);

      // Create user object for the parent component (for UI updates)
      const newUser: WebUser = {
        id: `user-${Date.now()}`,
        fullName: apiData.fullName,
        email: apiData.email,
        phone: apiData.phone,
        role: apiData.role as UserRole,
        assignedStationId: apiData.assignedStationId,
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onUserCreated(newUser);

      toast({
        title: "Success",
        description: response.message || "User created successfully",
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "" as UserRole,
        password: "",
        confirmPassword: "",
        assignedStationId: "",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+94771234567"
              />
            </div>
          </div>

          {/* Role & Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Role & Access</h3>

            <div className="space-y-2">
              <Label htmlFor="role">User Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Backoffice">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      Backoffice - Full Admin Access
                    </div>
                  </SelectItem>
                  <SelectItem value="StationOperator">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Station Operator - Limited Access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground">
                {formData.role === "Backoffice"
                  ? "Full system access: user management, reports, all stations"
                  : formData.role === "StationOperator"
                  ? "Limited access: bookings, owners, assigned stations only"
                  : "Choose a role to see permissions"}
              </div>
            </div>

            {/* Station Assignment for Station Operators */}
            {formData.role === "StationOperator" && (
              <div className="space-y-2">
                <Label htmlFor="assignedStation">
                  Assigned Charging Station *
                </Label>
                {loading ? (
                  <div className="flex items-center justify-center p-4 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      Loading available stations...
                    </div>
                  </div>
                ) : availableStations.length > 0 ? (
                  <Select
                    value={formData.assignedStationId}
                    onValueChange={(value) =>
                      handleInputChange("assignedStationId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a charging station" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {station.name} {station.code && `(${station.code})`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center justify-center p-4 border rounded-md">
                    <div className="text-sm text-muted-foreground">
                      No stations available for assignment
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Station operators can only be assigned to one charging station
                </div>
              </div>
            )}
          </div>

          {/* Security */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Security</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
