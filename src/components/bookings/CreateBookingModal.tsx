import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, User, Search, Plus, Eye } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Booking, EVOwner } from "@/types/entities";
import { ViewUserModal } from "./ViewUserModal";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  ownerNIC: z.string().min(1, "NIC is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  stationId: z.string().min(1, "Station is required"),
  slotType: z.enum(["AC", "DC"]),
  date: z.date({
    required_error: "Booking date is required",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
});

interface CreateBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

// Mock data for EV owners
const mockEVOwners: EVOwner[] = [
  {
    nic: "123456789V",
    firstName: "John",
    lastName: "Doe",
    phone: "+94712345678",
    email: "john.doe@email.com",
    addressLine1: "123 Main Street",
    addressLine2: "Apartment 2B",
    city: "Colombo",
    vehicleModel: "Tesla Model 3",
    vehiclePlate: "CAR-1234",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    nic: "987654321V",
    firstName: "Jane",
    lastName: "Smith",
    phone: "+94712345679",
    email: "jane.smith@email.com",
    addressLine1: "456 Oak Avenue",
    city: "Kandy",
    vehicleModel: "Nissan Leaf",
    vehiclePlate: "CAR-5678",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    nic: "456789123V",
    firstName: "Bob",
    lastName: "Wilson",
    phone: "+94712345680",
    email: "bob.wilson@email.com",
    addressLine1: "789 Pine Road",
    city: "Galle",
    vehicleModel: "BMW i3",
    vehiclePlate: "CAR-9012",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    nic: "789123456V",
    firstName: "Alice",
    lastName: "Johnson",
    phone: "+94712345681",
    email: "alice.johnson@email.com",
    addressLine1: "321 Cedar Lane",
    city: "Negombo",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Create a global mock EV owners array for this session
let globalMockEVOwners = [...mockEVOwners];

const mockStations = [
  { id: "station-1", name: "Central Station", acSlots: 4, dcSlots: 2 },
  { id: "station-2", name: "Mall Parking", acSlots: 6, dcSlots: 3 },
  { id: "station-3", name: "Airport Terminal", acSlots: 8, dcSlots: 4 },
  { id: "station-4", name: "City Plaza", acSlots: 5, dcSlots: 2 },
];

// Function to get next available slot
const getNextAvailableSlot = (stationId: string, slotType: 'AC' | 'DC'): number => {
  const station = mockStations.find(s => s.id === stationId);
  if (!station) return 1;
  
  const totalSlots = slotType === 'AC' ? station.acSlots : station.dcSlots;
  // For demo purposes, return a random available slot
  return Math.floor(Math.random() * totalSlots) + 1;
};

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export function CreateBookingModal({ open, onOpenChange, onCreateBooking }: CreateBookingModalProps) {
  const [foundUser, setFoundUser] = useState<EVOwner | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const watchedNIC = form.watch("ownerNIC");
  const watchedFirstName = form.watch("firstName");
  const watchedLastName = form.watch("lastName");
  const selectedStation = mockStations.find(station => station.id === form.watch("stationId"));
  const selectedSlotType = form.watch("slotType");

  const handleFindUser = () => {
    if (!watchedNIC) {
      toast({
        title: "Error",
        description: "Please enter a NIC first",
        variant: "destructive",
      });
      return;
    }

    const user = globalMockEVOwners.find(owner => owner.nic === watchedNIC);
    if (user) {
      setFoundUser(user);
      setUserNotFound(false);
      form.setValue("firstName", user.firstName);
      form.setValue("lastName", user.lastName);
      toast({
        title: "User Found",
        description: `Found ${user.firstName} ${user.lastName}`,
      });
    } else {
      setFoundUser(null);
      setUserNotFound(true);
      form.setValue("firstName", "");
      form.setValue("lastName", "");
      toast({
        title: "User Not Found",
        description: "No user found with this NIC. Please fill in the details to add a new user.",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = () => {
    if (!watchedNIC || !watchedFirstName || !watchedLastName) {
      toast({
        title: "Error",
        description: "Please fill in NIC, first name, and last name",
        variant: "destructive",
      });
      return;
    }

    const newUser: EVOwner = {
      nic: watchedNIC,
      firstName: watchedFirstName,
      lastName: watchedLastName,
      phone: "000-000-0000", // Placeholder
      email: "temp@email.com", // Placeholder
      addressLine1: "Address not provided",
      city: "Not specified",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    globalMockEVOwners.push(newUser);
    setFoundUser(newUser);
    setUserNotFound(false);
    
    toast({
      title: "User Added",
      description: `Successfully added ${newUser.firstName} ${newUser.lastName}`,
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const selectedOwner = foundUser || globalMockEVOwners.find(owner => owner.nic === values.ownerNIC);
    const selectedStation = mockStations.find(station => station.id === values.stationId);

    if (!selectedOwner) {
      toast({
        title: "Error",
        description: "Please find or add the user first",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(values.date);
    const [startHour, startMinute] = values.startTime.split(':');
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endDateTime = new Date(values.date);
    const [endHour, endMinute] = values.endTime.split(':');
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Automatically assign charging slot
    const slotNumber = getNextAvailableSlot(values.stationId, values.slotType);

    const newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
      ownerNIC: values.ownerNIC,
      ownerName: `${selectedOwner.firstName} ${selectedOwner.lastName}`,
      stationId: values.stationId,
      stationName: selectedStation?.name,
      chargingSlot: {
        type: values.slotType,
        slotNumber: slotNumber,
      },
      status: "PENDING",
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      createdByUserId: "current-user",
      notes: values.notes,
    };

    onCreateBooking(newBooking);
    form.reset();
    setFoundUser(null);
    setUserNotFound(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Create New Booking
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6">
                {/* NIC Field with Find User Button */}
                <FormField
                  control={form.control}
                  name="ownerNIC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        NIC
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Enter NIC (e.g., 123456789V)"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleFindUser}
                          className="px-3"
                        >
                          <Search className="w-4 h-4" />
                          Find User
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* First Name Field */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          {...field}
                          disabled={!!foundUser}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name Field with Action Button */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Enter last name"
                            {...field}
                            disabled={!!foundUser}
                          />
                        </FormControl>
                        {foundUser ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowViewUserModal(true)}
                            className="px-3"
                          >
                            <Eye className="w-4 h-4" />
                            View User
                          </Button>
                        ) : userNotFound && watchedFirstName && watchedLastName ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddUser}
                            className="px-3"
                          >
                            <Plus className="w-4 h-4" />
                            Add User
                          </Button>
                        ) : null}
                      </div>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              <span className="text-sm text-muted-foreground">
                                AC Slots: {station.acSlots} | DC Slots: {station.dcSlots}
                              </span>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    {selectedStation && selectedSlotType && (
                      <div className="text-sm text-muted-foreground">
                        Available slots: {selectedSlotType === 'AC' ? selectedStation.acSlots : selectedStation.dcSlots}
                      </div>
                    )}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Notes (Optional)</FormLabel>
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

              {/* Booking Summary */}
              {(foundUser || selectedStation || form.watch("date")) && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Booking Summary</h4>
                  {foundUser && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Owner:</span> {foundUser.firstName} {foundUser.lastName} ({foundUser.nic})
                    </div>
                  )}
                  {selectedStation && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Station:</span> {selectedStation.name} (AC: {selectedStation.acSlots}, DC: {selectedStation.dcSlots})
                    </div>
                  )}
                  {form.watch("date") && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Date:</span> {format(form.watch("date"), "PPP")}
                    </div>
                  )}
                  {form.watch("startTime") && form.watch("endTime") && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Time:</span> {form.watch("startTime")} - {form.watch("endTime")}
                    </div>
                  )}
                  {selectedSlotType && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Slot Type:</span> {selectedSlotType} charging
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Create Booking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <ViewUserModal
      open={showViewUserModal}
      onOpenChange={setShowViewUserModal}
      user={foundUser}
    />
  </>
  );
}