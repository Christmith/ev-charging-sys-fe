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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { EVOwner } from "@/types/entities";
import { evOwnerApi } from "@/services/api";

interface CreateOwnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOwnerCreated: (owner: EVOwner) => void;
}

export function CreateOwnerModal({
  open,
  onOpenChange,
  onOwnerCreated,
}: CreateOwnerModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nic: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    vehicleModel: "",
    vehiclePlate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.nic ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.email
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Transform form data to API format
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const address = [
        formData.addressLine1,
        formData.addressLine2,
        formData.city,
      ]
        .filter(Boolean)
        .join(", ");

      const apiData = {
        email: formData.email.trim(),
        nic: formData.nic.trim(),
        fullName,
        phone: formData.phone.trim(),
        address: address || formData.addressLine1, // Fallback to addressLine1 if no address components
        vehicleModel: formData.vehicleModel?.trim() || undefined,
        licensePlate: formData.vehiclePlate?.trim() || undefined,
      };

      // Call API to create owner
      const response = await evOwnerApi.createEvOwner(apiData);

      // Create local owner object for state update
      const newOwner: EVOwner = {
        nic: formData.nic,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        vehicleModel: formData.vehicleModel,
        vehiclePlate: formData.vehiclePlate,
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onOwnerCreated(newOwner);

      toast({
        title: "Success",
        description: response.message || "EV Owner created successfully",
      });

      // Reset form and close modal
      setFormData({
        nic: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        vehicleModel: "",
        vehiclePlate: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create EV owner:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create EV owner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New EV Owner</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nic">NIC (Primary Key) *</Label>
                <Input
                  id="nic"
                  value={formData.nic}
                  onChange={(e) => handleInputChange("nic", e.target.value)}
                  placeholder="123456789V"
                  required
                />
              </div>
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

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+94771234567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) =>
                  handleInputChange("addressLine1", e.target.value)
                }
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) =>
                  handleInputChange("addressLine2", e.target.value)
                }
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Colombo"
              />
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Vehicle Information (Optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Vehicle Model</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) =>
                    handleInputChange("vehicleModel", e.target.value)
                  }
                  placeholder="Tesla Model 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehiclePlate">License Plate</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={(e) =>
                    handleInputChange("vehiclePlate", e.target.value)
                  }
                  placeholder="ABC-1234"
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create EV Owner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
