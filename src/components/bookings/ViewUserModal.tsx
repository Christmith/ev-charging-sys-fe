import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Car, Calendar } from "lucide-react";
import { EVOwner } from "@/types/entities";
import { format } from "date-fns";

interface ViewUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: EVOwner | null;
}

export function ViewUserModal({ open, onOpenChange, user }: ViewUserModalProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            EV Owner Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {user.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">NIC</p>
                <p className="font-medium">{user.nic}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </h3>
            
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{user.addressLine1}</p>
              {user.addressLine2 && <p>{user.addressLine2}</p>}
              <p className="text-muted-foreground">{user.city}</p>
            </div>
          </div>

          {/* Vehicle Information */}
          {(user.vehicleModel || user.vehiclePlate) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Car className="w-4 h-4" />
                Vehicle Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {user.vehicleModel && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Vehicle Model</p>
                    <p className="font-medium">{user.vehicleModel}</p>
                  </div>
                )}
                {user.vehiclePlate && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">License Plate</p>
                    <p className="font-medium">{user.vehiclePlate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Account Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{format(new Date(user.createdAt), "PPP")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Updated At</p>
                <p className="font-medium">{format(new Date(user.updatedAt), "PPP")}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}