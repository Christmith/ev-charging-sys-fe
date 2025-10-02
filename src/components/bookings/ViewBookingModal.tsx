import { format } from "date-fns";
import { Calendar, Clock, MapPin, User, FileText, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Booking } from "@/types/entities";

interface ViewBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

export function ViewBookingModal({ open, onOpenChange, booking }: ViewBookingModalProps) {
  if (!booking) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, "EEEE, MMMM do, yyyy"),
      time: format(date, "h:mm a")
    };
  };

  const startDateTime = formatDateTime(booking.startAt);
  const endDateTime = formatDateTime(booking.endAt);
  const createdDateTime = formatDateTime(booking.createdAt);
  const updatedDateTime = formatDateTime(booking.updatedAt);

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'APPROVED':
        return 'bg-success/10 text-success border-success/20';
      case 'COMPLETED':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'CANCELLED':
        return 'bg-muted text-muted-foreground border-muted/20';
      default:
        return 'bg-muted text-muted-foreground border-muted/20';
    }
  };

  const canModifyBooking = () => {
    const startTime = new Date(booking.startAt);
    const now = new Date();
    const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 12 && booking.status === 'PENDING';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Status & ID */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Booking ID</div>
              <div className="font-mono text-sm">{booking.id}</div>
            </div>
            <Badge variant="outline" className={getStatusColor(booking.status)}>
              {booking.status.toLowerCase()}
            </Badge>
          </div>

          <Separator />

          {/* EV Owner Information */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              EV Owner Details
            </h4>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{booking.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">NIC:</span>
                <span className="text-sm font-mono">{booking.ownerNIC}</span>
              </div>
            </div>
          </div>

          {/* Station Information */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Charging Station
            </h4>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Station:</span>
                <span className="text-sm font-medium">{booking.stationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Station ID:</span>
                <span className="text-sm font-mono">{booking.stationId}</span>
              </div>
            </div>
          </div>

          {/* Charging Slot Information */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Charging Slot
            </h4>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Slot Type:</span>
                <span className="text-sm font-medium">{booking.chargingSlot?.type || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Slot Number:</span>
                <span className="text-sm font-mono">{booking.chargingSlot?.slotNumber || 'Auto-assigned'}</span>
              </div>
            </div>
          </div>

          {/* Booking Schedule */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Schedule
            </h4>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="text-sm font-medium">{startDateTime.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Start Time:</span>
                <span className="text-sm">{startDateTime.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">End Time:</span>
                <span className="text-sm">{endDateTime.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="text-sm">
                  {Math.round((new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime()) / (1000 * 60))} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </h4>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">{booking.notes}</p>
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          {booking.cancelReason && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                Cancellation Reason
              </h4>
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive">{booking.cancelReason}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* System Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">System Information</h4>
            <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{createdDateTime.date} at {createdDateTime.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{updatedDateTime.date} at {updatedDateTime.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By:</span>
                <span className="font-mono">{booking.createdByUserId}</span>
              </div>
            </div>
          </div>

          {/* Modification Rules */}
          {!canModifyBooking() && booking.status === 'PENDING' && (
            <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                <div className="text-sm text-warning">
                  <div className="font-medium">Cannot Modify</div>
                  <div className="text-xs mt-1">
                    Bookings can only be modified or cancelled with at least 12 hours notice.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}