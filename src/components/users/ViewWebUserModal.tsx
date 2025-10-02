import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WebUser } from "@/types/auth";
import { Shield, MapPin, User, Mail, Phone, Calendar, Activity } from "lucide-react";

interface ViewWebUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: WebUser | null;
  availableStations?: Array<{ id: string; name: string; code?: string }>;
}

export function ViewWebUserModal({
  open,
  onOpenChange,
  user,
  availableStations = []
}: ViewWebUserModalProps) {
  if (!user) return null;

  const getStationNames = () => {
    if (!user.assignedStationIds || user.assignedStationIds.length === 0) {
      return user.role === 'BackOffice' ? 'All stations (Full access)' : 'No stations assigned';
    }

    return user.assignedStationIds
      .map(id => {
        const station = availableStations.find(s => s.id === id);
        return station ? `${station.name}${station.code ? ` (${station.code})` : ''}` : id;
      })
      .join(', ');
  };

  const getRoleIcon = () => {
    return user.role === 'BackOffice' ? 
      <Shield className="w-5 h-5 text-accent" /> : 
      <MapPin className="w-5 h-5 text-muted-foreground" />;
  };

  const getRoleDescription = () => {
    return user.role === 'BackOffice' 
      ? 'Full system administration access including user management, reports, and all station operations'
      : 'Limited operational access to assigned charging stations, bookings, and owner management';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Status */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{user.firstName} {user.lastName}</h2>
              <p className="text-muted-foreground">User ID: {user.id}</p>
            </div>
            <Badge 
              variant="outline" 
              className={
                user.status === 'ACTIVE' 
                  ? "bg-success/10 text-success border-success/20" 
                  : "bg-muted text-muted-foreground border-muted/20"
              }
            >
              {user.status.toLowerCase()}
            </Badge>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Role & Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Role & Access</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getRoleIcon()}
                <span className="font-medium">Role:</span>
                <Badge 
                  variant="outline" 
                  className={
                    user.role === 'BackOffice' 
                      ? "bg-accent/10 text-accent border-accent/20" 
                      : "bg-muted/10 text-muted-foreground border-muted/20"
                  }
                >
                  {user.role === 'BackOffice' ? 'Back Office' : 'Station Operator'}
                </Badge>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription()}
                </p>
              </div>
            </div>
          </div>

          {/* Station Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Station Access</h3>
            
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Assigned Stations</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getStationNames()}
                  </div>
                  {user.assignedStationIds && user.assignedStationIds.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Total: {user.assignedStationIds.length} stations
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Activity Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activity Information</h3>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Created:</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Last Updated:</span>
                <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Last Login:</span>
                <span>
                  {user.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never logged in"
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}