import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Booking } from "@/types/entities";
import { ConfirmationDialog } from "./ConfirmationDialog";

const formSchema = z.object({
  ownerNIC: z.string().min(1, "EV Owner NIC is required"),
  stationId: z.string().min(1, "Station is required"),
  slotType: z.enum(["AC", "DC"]),
  date: z.date({
    required_error: "Booking date is required",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
});

interface EditBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onUpdateBooking: (booking: Booking) => void;
}

// Mock data
const mockEVOwners = [
  { nic: "123456789V", name: "John Doe" },
  { nic: "987654321V", name: "Jane Smith" },
  { nic: "456789123V", name: "Bob Wilson" },
  { nic: "789123456V", name: "Alice Johnson" },
];

const mockStations = [
  { id: "station-1", name: "Central Station", acSlots: 4, dcSlots: 2 },
  { id: "station-2", name: "Mall Parking", acSlots: 6, dcSlots: 3 },
  { id: "station-3", name: "Airport Terminal", acSlots: 8, dcSlots: 4 },
  { id: "station-4", name: "City Plaza", acSlots: 5, dcSlots: 2 },
];

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export function EditBookingModal({ open, onOpenChange, booking, onUpdateBooking }: EditBookingModalProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  // Initialize form when booking changes
  useEffect(() => {
    if (booking && open) {
      const startDate = new Date(booking.startAt);
      const endDate = new Date(booking.endAt);
      
      form.reset({
        ownerNIC: booking.ownerNIC,
        stationId: booking.stationId,
        slotType: booking.chargingSlot?.type || 'AC',
        date: startDate,
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        notes: booking.notes || '',
      });
    }
  }, [booking, open, form]);

  if (!booking) return null;

  const canModifyBooking = () => {
    const startTime = new Date(booking.startAt);
    const now = new Date();
    const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 12;
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const selectedOwner = mockEVOwners.find(owner => owner.nic === values.ownerNIC);
    const selectedStation = mockStations.find(station => station.id === values.stationId);

    const startDateTime = new Date(values.date);
    const [startHour, startMinute] = values.startTime.split(':');
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endDateTime = new Date(values.date);
    const [endHour, endMinute] = values.endTime.split(':');
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    const updatedBooking: Booking = {
      ...booking,
      ownerNIC: values.ownerNIC,
      ownerName: selectedOwner?.name,
      stationId: values.stationId,
      stationName: selectedStation?.name,
      chargingSlot: {
        type: values.slotType,
        slotNumber: booking.chargingSlot?.slotNumber || 1,
      },
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      notes: values.notes,
      updatedAt: new Date().toISOString(),
    };

    setConfirmDialog({
      open: true,
      title: "Update Booking",
      description: "Are you sure you want to update this booking? The changes cannot be undone.",
      action: () => {
        onUpdateBooking(updatedBooking);
        onOpenChange(false);
        setConfirmDialog(null);
      }
    });
  };

  const handleStatusChange = (newStatus: Booking['status'], reason?: string) => {
    const updatedBooking: Booking = {
      ...booking,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...(reason && { cancelReason: reason })
    };

    const action = () => {
      onUpdateBooking(updatedBooking);
      onOpenChange(false);
      setConfirmDialog(null);
    };

    if (newStatus === 'COMPLETED') {
      setConfirmDialog({
        open: true,
        title: "Mark as Completed",
        description: "Are you sure you want to mark this booking as completed? This action cannot be undone.",
        action
      });
    } else if (newStatus === 'CANCELLED') {
      setConfirmDialog({
        open: true,
        title: "Cancel Booking",
        description: "Are you sure you want to cancel this booking? This action cannot be undone.",
        action
      });
    } else if (newStatus === 'APPROVED') {
      setConfirmDialog({
        open: true,
        title: "Approve Booking",
        description: "Are you sure you want to approve this booking?",
        action
      });
    }
  };

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Edit Booking
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Booking ID: {booking.id}</div>
              </div>
              <Badge variant="outline" className={getStatusColor(booking.status)}>
                {booking.status.toLowerCase()}
              </Badge>
            </div>

            {!canModifyBooking() && (
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <div className="text-sm text-destructive">
                  <div className="font-medium">This booking cannot be updated or cancelled</div>
                  <div className="text-xs mt-1">
                    Reservations can only be modified or cancelled at least 12 hours before the booking start time.
                  </div>
                </div>
              </div>
            )}

            {/* Status Actions */}
            {booking.status === 'PENDING' && (
              <div className="space-y-3">
                <h4 className="font-medium">Status Actions</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={() => handleStatusChange('APPROVED')}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('CANCELLED', 'Cancelled by admin')}
                    className="gap-2 text-destructive hover:text-destructive"
                    disabled={!canModifyBooking()}
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {booking.status === 'APPROVED' && (
              <div className="space-y-3">
                <h4 className="font-medium">Status Actions</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="accent" 
                    size="sm" 
                    onClick={() => handleStatusChange('COMPLETED')}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('CANCELLED', 'Cancelled after approval')}
                    className="gap-2 text-destructive hover:text-destructive"
                    disabled={!canModifyBooking()}
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Edit Form - only show if can modify */}
            {canModifyBooking() && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6">
                    {/* EV Owner Selection */}
                    <FormField
                      control={form.control}
                      name="ownerNIC"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            EV Owner
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select EV owner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockEVOwners.map((owner) => (
                                <SelectItem key={owner.nic} value={owner.nic}>
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{owner.name}</span>
                                    <span className="text-sm text-muted-foreground">{owner.nic}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Station Selection */}
                    <FormField
                      control={form.control}
                      name="stationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Charging Station
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select charging station" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockStations.map((station) => (
                                <SelectItem key={station.id} value={station.id}>
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{station.name}</span>
                                    <span className="text-sm text-muted-foreground">AC: {station.acSlots} | DC: {station.dcSlots}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Slot Type Selection */}
                    <FormField
                      control={form.control}
                      name="slotType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Charging Slot Type
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select slot type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AC">
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">AC Charging</span>
                                  <span className="text-sm text-muted-foreground">Slower charging (Type 2)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="DC">
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">DC Fast Charging</span>
                                  <span className="text-sm text-muted-foreground">Rapid charging (CCS/CHAdeMO)</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date Selection */}
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            Booking Date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() || date > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                }
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select start time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select end time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any special instructions or notes..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="accent">
                      Update Booking
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}

            {!canModifyBooking() && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog && (
        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) => !open && setConfirmDialog(null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.action}
        />
      )}
    </>
  );
}