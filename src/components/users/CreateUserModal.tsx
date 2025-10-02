import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { WebUser, UserRole } from "@/types/auth";
import { Shield, MapPin } from "lucide-react";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: WebUser) => void;
  availableStations?: Array<{ id: string; name: string; code?: string }>;
}

export function CreateUserModal({
  open,
  onOpenChange,
  onUserCreated,
  availableStations = []
}: CreateUserModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "" as UserRole | "",
    password: "",
    confirmPassword: "",
    assignedStationIds: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
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

    // Create new user
    const newUser: WebUser = {
      id: `user-${Date.now()}`, // Generate ID
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role as UserRole,
      assignedStationIds: formData.role === 'StationOperator' ? formData.assignedStationIds : undefined,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUserCreated(newUser);
    
    toast({
      title: "Success",
      description: "User created successfully",
    });

    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      password: "",
      confirmPassword: "",
      assignedStationIds: []
    });

    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStationToggle = (stationId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignedStationIds: checked
        ? [...prev.assignedStationIds, stationId]
        : prev.assignedStationIds.filter(id => id !== stationId)
    }));
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
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
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
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BackOffice">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      BackOffice - Full Admin Access
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
                {formData.role === 'BackOffice' 
                  ? "Full system access: user management, reports, all stations"
                  : formData.role === 'StationOperator'
                  ? "Limited access: bookings, owners, assigned stations only"
                  : "Choose a role to see permissions"
                }
              </div>
            </div>

            {/* Station Assignment for Station Operators */}
            {formData.role === 'StationOperator' && availableStations.length > 0 && (
              <div className="space-y-2">
                <Label>Assigned Charging Stations</Label>
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto space-y-2">
                  {availableStations.map((station) => (
                    <div key={station.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`station-${station.id}`}
                        checked={formData.assignedStationIds.includes(station.id)}
                        onCheckedChange={(checked) => 
                          handleStationToggle(station.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`station-${station.id}`} className="text-sm">
                        {station.name} {station.code && `(${station.code})`}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formData.assignedStationIds.length} stations selected
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
                  onChange={(e) => handleInputChange("password", e.target.value)}
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
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}