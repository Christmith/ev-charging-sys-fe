import { useState } from "react";
import { AlertTriangle, Activity, MapPin, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Station } from "@/types/entities";

interface StationStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  action: "activate" | "deactivate";
  onConfirm: (stationId: string) => void;
}

// Mock data for active bookings check
const mockActiveBookings = [
  { id: "book-1", startAt: "2024-01-20T14:00:00Z", endAt: "2024-01-20T16:00:00Z", customerName: "John Smith" },
  { id: "book-2", startAt: "2024-01-21T10:00:00Z", endAt: "2024-01-21T12:00:00Z", customerName: "Sarah Johnson" },
  { id: "book-3", startAt: "2024-01-22T15:30:00Z", endAt: "2024-01-22T17:30:00Z", customerName: "Mike Chen" },
];

export default function StationStatusDialog({
  open,
  onOpenChange,
  station,
  action,
  onConfirm,
}: StationStatusDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!station) return null;

  const isDeactivating = action === "deactivate";
  const hasActiveBookings = isDeactivating && mockActiveBookings.length > 0;

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    onConfirm(station.id);
    setIsProcessing(false);
  };

  const getActionColor = () => {
    return isDeactivating ? "destructive" : "success";
  };

  const getActionText = () => {
    return isDeactivating ? "Deactivate" : "Activate";
  };

  const getStatusAfterAction = () => {
    return isDeactivating ? "DEACTIVATED" : "ACTIVE";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDeactivating ? (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            ) : (
              <Activity className="w-5 h-5 text-success" />
            )}
            {getActionText()} Station
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to {action} this charging station?
              </p>

              {/* Station Details */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{station.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {station.code} • {station.city}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <Badge 
                    variant="outline"
                    className={
                      station.status === 'ACTIVE'
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-muted-foreground border-muted/20"
                    }
                  >
                    {station.status}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Will become:</span>
                  <Badge 
                    variant="outline"
                    className={
                      getStatusAfterAction() === 'ACTIVE'
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-muted-foreground border-muted/20"
                    }
                  >
                    {getStatusAfterAction()}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Slots:</span>
                  <span className="text-sm font-medium">{station.acSlots + station.dcSlots}</span>
                </div>
              </div>

              {/* Warning for active bookings */}
              {hasActiveBookings && (
                <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                    <div className="space-y-2">
                      <div className="font-medium text-destructive">
                        Active Bookings Warning
                      </div>
                      <div className="text-sm text-destructive/80">
                        This station has {mockActiveBookings.length} active bookings that will be automatically cancelled:
                      </div>
                      <div className="space-y-2">
                        {mockActiveBookings.slice(0, 2).map((booking) => (
                          <div key={booking.id} className="text-xs bg-background p-2 rounded border">
                            <div className="font-medium">{booking.customerName}</div>
                            <div className="text-muted-foreground">
                              {new Date(booking.startAt).toLocaleDateString()} at{" "}
                              {new Date(booking.startAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        ))}
                        {mockActiveBookings.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            ... and {mockActiveBookings.length - 2} more booking{mockActiveBookings.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info for activation */}
              {!isDeactivating && (
                <div className="bg-success/5 border border-success/20 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-success mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-medium text-success">Activation Benefits</div>
                      <div className="text-sm text-success/80">
                        • Station will accept new bookings immediately
                        • Existing schedules will be restored
                        • Real-time availability will be tracked
                        • Users can discover this station in the app
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="text-sm text-muted-foreground">
                {isDeactivating ? (
                  hasActiveBookings ? (
                    "Affected customers will be notified automatically and offered alternative stations."
                  ) : (
                    "This station will stop accepting new bookings and become hidden from users."
                  )
                ) : (
                  "This station will immediately become available for bookings and visible to users."
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing}
            className={
              isDeactivating
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-success hover:bg-success/90 text-success-foreground"
            }
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                {isDeactivating ? (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                ) : (
                  <Activity className="w-4 h-4 mr-2" />
                )}
                {getActionText()} Station
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}