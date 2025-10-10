import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  MapPin,
  User,
  Search,
  Plus,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Booking,
  EVOwner,
  EvOwnerDetailsResponse,
  StationApiResponse,
  SlotAvailabilityResponse,
  BookingCreationResponse,
} from "@/types/entities";
import { ViewUserModal } from "./ViewUserModal";
import { CreateOwnerModal } from "@/components/owners/CreateOwnerModal";
import { useToast } from "@/hooks/use-toast";
import { evOwnerApi, stationApi, bookingApi } from "@/services/api";

const formSchema = z.object({
  ownerNIC: z.string().min(1, "NIC is required"),
  stationId: z.string().min(1, "Station is required"),
  slotType: z.enum(["AC", "DC"]),
  date: z.date({
    required_error: "Booking date is required",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

interface CreateBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBooking: (
    booking: Omit<Booking, "id" | "createdAt" | "updatedAt">
  ) => void;
}

// Mock data for EV owners - keeping for backward compatibility
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
    status: "Active",
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
    status: "Active",
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
    status: "Active",
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
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Create a global mock EV owners array for this session
const globalMockEVOwners = [...mockEVOwners];

// Stations are fetched from API (getAllStationsForAssignment)

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

export function CreateBookingModal({
  open,
  onOpenChange,
  onCreateBooking,
}: CreateBookingModalProps) {
  const [foundUser, setFoundUser] = useState<EVOwner | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showCreateOwnerModal, setShowCreateOwnerModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState("");
  const [stations, setStations] = useState<
    Array<{ id: string; name: string; acSlots: number; dcSlots: number }>
  >([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [slotAvailability, setSlotAvailability] =
    useState<SlotAvailabilityResponse | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const watchedNIC = form.watch("ownerNIC");
  const selectedStation = stations.find(
    (station) => station.id === form.watch("stationId")
  );
  const selectedSlotType = form.watch("slotType");

  // Fetch stations for assignment when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchStations = async () => {
      try {
        setStationsLoading(true);
        const data: StationApiResponse[] =
          await stationApi.getAllStationsForAssignment();
        const mapped = (data || []).map((s) => ({
          id: s.id,
          name: s.stationName,
          acSlots: Number(
            s.acChargingSlots ??
              (Array.isArray(s.acSlots) ? s.acSlots.length : 0)
          ),
          dcSlots: Number(
            s.dcChargingSlots ??
              (Array.isArray(s.dcSlots) ? s.dcSlots.length : 0)
          ),
        }));
        setStations(mapped);
      } catch (e: unknown) {
        toast({
          title: "Failed to load stations",
          description: (e as Error)?.message || "Could not fetch stations list",
          variant: "destructive",
        });
      } finally {
        setStationsLoading(false);
      }
    };
    fetchStations();
  }, [open, toast]);

  const getNextAvailableSlot = (
    stationId: string,
    slotType: "AC" | "DC"
  ): number => {
    const station = stations.find((s) => s.id === stationId);
    const totalSlots =
      slotType === "AC" ? station?.acSlots ?? 1 : station?.dcSlots ?? 1;
    return Math.max(1, Math.floor(Math.random() * totalSlots) + 1);
  };

  const handleFindUser = async () => {
    if (!watchedNIC) {
      toast({
        title: "Error",
        description: "Please enter a NIC first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSearching(true);
      setNotFoundMessage("");

      const response: EvOwnerDetailsResponse = await evOwnerApi.getEvOwnerByNIC(
        watchedNIC
      );

      // Split fullName into firstName and lastName
      const nameParts = response.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Convert API response to EVOwner format
      const user: EVOwner = {
        nic: response.nic,
        firstName,
        lastName,
        phone: response.phone,
        email: response.email,
        addressLine1: response.address,
        addressLine2: "",
        city: "",
        vehicleModel: response.vehicleModel,
        vehiclePlate: response.licensePlate,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };

      setFoundUser(user);
      setUserNotFound(false);

      toast({
        title: "User Found",
        description: `Found ${response.fullName}`,
      });
    } catch (error: unknown) {
      console.error("Error finding user:", error);

      setFoundUser(null);
      setUserNotFound(true);

      // Check if it's a 404 error (user not found)
      const isAxiosError =
        error && typeof error === "object" && "response" in error;
      const axiosError = isAxiosError
        ? (error as {
            response?: { status?: number; data?: { message?: string } };
          })
        : null;

      if (
        axiosError?.response?.status === 404 ||
        axiosError?.response?.data?.message?.includes("not found")
      ) {
        const errorMessage =
          axiosError?.response?.data?.message ||
          "EV Owner not found with the provided NIC.";
        setNotFoundMessage(errorMessage);
      toast({
        title: "User Not Found",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // For other errors, still show the create user option
        const errorMessage =
          axiosError?.response?.data?.message ||
          (error as Error)?.message ||
          "Failed to search for user. You can still create a new user.";
        setNotFoundMessage(errorMessage);
        toast({
          title: "Search Error",
        description:
            "Failed to search for user. You can still create a new user.",
        variant: "destructive",
      });
    }
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateUser = () => {
    setShowCreateOwnerModal(true);
  };

  const handleOwnerCreated = (newOwner: EVOwner) => {
    setFoundUser(newOwner);
    setUserNotFound(false);
    setNotFoundMessage("");
    setShowCreateOwnerModal(false);
  };

  const handleCheckAvailability = async () => {
    const formValues = form.getValues();

    // Validate required fields
    if (!foundUser) {
      toast({
        title: "Error",
        description: "Please find or create a user first",
        variant: "destructive",
      });
      return;
    }

    if (
      !formValues.stationId ||
      !formValues.slotType ||
      !formValues.date ||
      !formValues.startTime ||
      !formValues.endTime
    ) {
      toast({
        title: "Error",
        description:
          "Please fill in all required fields (station, slot type, date, and times)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCheckingAvailability(true);
      setSlotAvailability(null);
      setSelectedSlotId("");

      // Create start and end datetime strings
      const startDateTime = new Date(formValues.date);
      const [startHour, startMinute] = formValues.startTime.split(":");
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const endDateTime = new Date(formValues.date);
      const [endHour, endMinute] = formValues.endTime.split(":");
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      // For now, we'll use a placeholder evOwnerId and slotId
      // In a real implementation, you'd get these from the API or form
      const availabilityData = {
        evOwnerId: "507f1f77bcf86cd799439012", // This should come from the found user
        stationId: formValues.stationId,
        slotType: formValues.slotType,
        slotId: `${formValues.slotType}1`, // Placeholder slot ID
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        vehicleModel: foundUser.vehicleModel,
        licensePlate: foundUser.vehiclePlate,
      };

      const response: SlotAvailabilityResponse =
        await bookingApi.checkAvailability(availabilityData);
      setSlotAvailability(response);

      if (response.isAvailable) {
        toast({
          title: "Slots Available",
          description: response.message,
        });
      } else {
        toast({
          title: "No Slots Available",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error checking availability:", error);
    toast({
        title: "Error",
        description: "Failed to check slot availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const selectedOwner = foundUser;
    const selectedStation = stations.find(
      (station) => station.id === values.stationId
    );

    if (!selectedOwner) {
      toast({
        title: "Error",
        description: "Please find or create the user first",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSlotId) {
      toast({
        title: "Error",
        description: "Please select a slot first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingBooking(true);

    const startDateTime = new Date(values.date);
    const [startHour, startMinute] = values.startTime.split(":");
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endDateTime = new Date(values.date);
    const [endHour, endMinute] = values.endTime.split(":");
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      // Prepare booking data for API
      const bookingData = {
        evOwnerId: "507f1f77bcf86cd799439012", // This should come from the found user
        stationId: values.stationId,
        slotType: values.slotType,
        slotId: selectedSlotId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        vehicleModel: selectedOwner.vehicleModel,
        licensePlate: selectedOwner.vehiclePlate,
      };

      // Call the API to create booking
      const response: BookingCreationResponse = await bookingApi.createBooking(
        bookingData
      );

      // Show success message
      toast({
        title: "Booking Created",
        description: response.message,
      });

      // Create local booking object for the parent component
    const newBooking: Omit<Booking, "id" | "createdAt" | "updatedAt"> = {
      ownerNIC: values.ownerNIC,
      ownerName: `${selectedOwner.firstName} ${selectedOwner.lastName}`,
      stationId: values.stationId,
      stationName: selectedStation?.name,
      chargingSlot: {
        type: values.slotType,
          slotNumber: parseInt(selectedSlotId.replace(/\D/g, "")), // Extract number from slot ID
      },
        status: "APPROVED", // Based on the API response message
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      createdByUserId: "current-user",
    };

      // Call parent callback
    onCreateBooking(newBooking);

      // Reset form and close modal
    form.reset();
    setFoundUser(null);
    setUserNotFound(false);
      setNotFoundMessage("");
      setSlotAvailability(null);
      setSelectedSlotId("");
    onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBooking(false);
    }
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
            <DialogDescription>
              Create a new charging session booking for an EV owner.
            </DialogDescription>
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
                          disabled={isSearching}
                        >
                          <Search className="w-4 h-4" />
                          {isSearching ? "Searching..." : "Find User"}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* User Found Display */}
                {foundUser && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-success font-medium text-sm">
                          User Found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {foundUser.firstName} {foundUser.lastName} (
                          {foundUser.nic})
                        </p>
                      </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowViewUserModal(true)}
                            className="px-3"
                          >
                        <Eye className="w-4 h-4 mr-2" />
                            View User
                          </Button>
                    </div>
                  </div>
                )}

                {/* User Not Found Message */}
                {userNotFound && notFoundMessage && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-destructive font-medium text-sm">
                          User Not Found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notFoundMessage}
                        </p>
                      </div>
                          <Button
                            type="button"
                            variant="outline"
                        onClick={handleCreateUser}
                            className="px-3"
                          >
                        <Plus className="w-4 h-4 mr-2" />
                            Add User
                          </Button>
                    </div>
                      </div>
                  )}

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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select charging station" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stationsLoading ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Loading stations...
                            </div>
                          ) : stations.length > 0 ? (
                            stations.map((station) => (
                            <SelectItem key={station.id} value={station.id}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">
                                  {station.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  AC Slots: {station.acSlots} | DC Slots:{" "}
                                  {station.dcSlots}
                                </span>
                              </div>
                            </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No stations available
                            </div>
                          )}
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select slot type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AC">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">AC Charging</span>
                              <span className="text-sm text-muted-foreground">
                                Slower charging (Type 2)
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="DC">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                DC Fast Charging
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Rapid charging (CCS/CHAdeMO)
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedStation && selectedSlotType && (
                        <div className="text-sm text-muted-foreground">
                          Available slots:{" "}
                          {selectedSlotType === "AC"
                            ? selectedStation.acSlots
                            : selectedStation.dcSlots}
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
                              date < new Date() ||
                              date >
                                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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

                {/* Check Slot Availability Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleCheckAvailability}
                  disabled={isCheckingAvailability}
                >
                  {isCheckingAvailability
                    ? "Checking..."
                    : "Check Slot Availability"}
                </Button>

                {/* Slot Availability Results */}
                {slotAvailability && (
                  <div className="space-y-4">
                    {slotAvailability.isAvailable ? (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-success font-medium text-sm">
                              Slots Available
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {slotAvailability.message}
                            </p>
                          </div>
                        </div>

                        {/* Available Slots Radio Buttons */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Select a slot:</p>
                          <RadioGroup
                            value={selectedSlotId}
                            onValueChange={setSelectedSlotId}
                            className="grid grid-cols-2 gap-2"
                          >
                            {slotAvailability.availableSlotIds.map((slotId) => (
                              <div
                                key={slotId}
                                className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50"
                              >
                                <RadioGroupItem value={slotId} id={slotId} />
                                <label
                                  htmlFor={slotId}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {slotId}
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <p className="text-destructive font-medium text-sm">
                          No Slots Available
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slotAvailability.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Booking Summary */}
                {(foundUser || selectedStation || form.watch("date")) && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Booking Summary</h4>
                    {foundUser && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Owner:</span>{" "}
                        {foundUser.firstName} {foundUser.lastName} (
                        {foundUser.nic})
                      </div>
                    )}
                    {selectedStation && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Station:</span>{" "}
                        {selectedStation.name} (AC: {selectedStation.acSlots},
                        DC: {selectedStation.dcSlots})
                      </div>
                    )}
                    {form.watch("date") && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Date:</span>{" "}
                        {format(form.watch("date"), "PPP")}
                      </div>
                    )}
                    {form.watch("startTime") && form.watch("endTime") && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Time:</span>{" "}
                        {form.watch("startTime")} - {form.watch("endTime")}
                      </div>
                    )}
                    {selectedSlotType && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Slot Type:
                        </span>{" "}
                        {selectedSlotType} charging
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={
                    !foundUser ||
                    !slotAvailability?.isAvailable ||
                    !selectedSlotId ||
                    isCreatingBooking
                  }
                >
                  {isCreatingBooking ? "Creating..." : "Create Booking"}
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

      <CreateOwnerModal
        open={showCreateOwnerModal}
        onOpenChange={setShowCreateOwnerModal}
        onOwnerCreated={handleOwnerCreated}
      />
    </>
  );
}
