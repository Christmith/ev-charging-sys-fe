import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Zap, QrCode, Settings, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Station } from "@/types/entities";
import { stationApi } from "@/services/api";

const stationSchema = z
  .object({
    name: z.string().min(1, "Station name is required"),
    code: z.string().optional(),
    acSlots: z
      .number()
      .min(0, "AC slots cannot be negative")
      .max(20, "Maximum 20 AC slots allowed"),
    dcSlots: z
      .number()
      .min(0, "DC slots cannot be negative")
      .max(20, "Maximum 20 DC slots allowed"),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    googlePlaceId: z.string().optional(),
    operatorIds: z.array(z.string()).optional().default([]),
    notes: z.string().optional(),
  })
  .refine((data) => data.acSlots + data.dcSlots >= 1, {
    message: "Station must have at least 1 charging slot (AC or DC)",
    path: ["acSlots"],
  });

type StationFormData = z.infer<typeof stationSchema>;

interface CreateStationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStationCreated: (station: Station) => void;
}

// Operator type for API response
interface Operator {
  id: string;
  email: string;
  fullName: string;
}

export default function CreateStationModal({
  open,
  onOpenChange,
  onStationCreated,
}: CreateStationModalProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<StationFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: "",
      code: "",
      acSlots: 2,
      dcSlots: 0,
      addressLine1: "",
      addressLine2: "",
      city: "",
      latitude: 6.9271, // Default to Colombo
      longitude: 79.8612,
      googlePlaceId: "",
      operatorIds: [],
      notes: "",
    },
  });

  const acSlots = form.watch("acSlots");
  const dcSlots = form.watch("dcSlots");
  const totalSlots = acSlots + dcSlots;

  // Fetch unassigned operators
  useEffect(() => {
    const fetchOperators = async () => {
      if (!open) return; // Only fetch when modal is open

      try {
        setOperatorsLoading(true);
        const operatorsData = await stationApi.getUnassignedOperators();
        setOperators(operatorsData);
      } catch (error) {
        console.error("Failed to fetch operators:", error);
        toast({
          title: "Warning",
          description: "Failed to load available operators",
          variant: "destructive",
        });
      } finally {
        setOperatorsLoading(false);
      }
    };

    fetchOperators();
  }, [open, toast]);

  const onSubmit = async (data: StationFormData) => {
    try {
      setIsSubmitting(true);

      // Generate unique station code if not provided
      const stationCode = data.code || `STA-${Date.now().toString().slice(-3)}`;

      // Prepare API request payload
      const apiData = {
        stationName: data.name,
        stationCode: stationCode,
        acChargingSlots: data.acSlots,
        dcChargingSlots: data.dcSlots,
        stationOperatorIds: data.operatorIds || [],
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        googlePlaceID: data.googlePlaceId || undefined,
        additionalNotes: data.notes || undefined,
        status: "Active" as const,
      };

      // Call the API
      await stationApi.createStation(apiData);

      // Create station object for local state update
      const newStation: Station = {
        id: `station-${Date.now()}`, // This will be replaced by actual ID from API later
        name: data.name,
        code: stationCode,
        acSlots: data.acSlots,
        dcSlots: data.dcSlots,
        addressLine1: data.addressLine1,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        googlePlaceId: data.googlePlaceId,
        operatorUserId:
          data.operatorIds && data.operatorIds.length > 0
            ? data.operatorIds[0]
            : undefined,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onStationCreated(newStation);

      toast({
        title: "Station Created Successfully",
        description: `${data.name} has been added to the network.`,
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating station:", error);
      toast({
        title: "Error Creating Station",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          toast({
            title: "Location Updated",
            description: "Current GPS coordinates have been set.",
          });
        },
        () => {
          toast({
            title: "Location Access Denied",
            description: "Please enter coordinates manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const generateStationQR = async () => {
    setGeneratingQR(true);
    // Simulate QR code generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setGeneratingQR(false);
    toast({
      title: "QR Code Generated",
      description: "Station QR code will be available after creation.",
    });
  };

  const hasAC = acSlots > 0;
  const hasDC = dcSlots > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Charging Station
          </DialogTitle>
          <DialogDescription>
            Add a new EV charging station to the network with location,
            capacity, and operational details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Details */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Station Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Station Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Central Mall Charging Hub"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Station Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., CMH-001 (auto-generated if empty)"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Unique identifier for the station. Auto-generated if
                            not provided.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="acSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AC Charging Slots</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Number of AC charging points
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dcSlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DC Fast Charging Slots</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Number of DC fast charging points
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="operatorIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Station Operators</FormLabel>
                          <FormDescription>
                            Select one or more operators to assign to this
                            station
                          </FormDescription>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between font-normal"
                                  disabled={operatorsLoading}
                                >
                                  {operatorsLoading ? (
                                    "Loading operators..."
                                  ) : field.value && field.value.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {field.value.map((operatorId) => {
                                        const operator = operators.find(
                                          (op) => op.id === operatorId
                                        );
                                        return operator ? (
                                          <Badge
                                            key={operatorId}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {operator.fullName}
                                            <button
                                              type="button"
                                              className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                const newValue =
                                                  field.value?.filter(
                                                    (id) => id !== operatorId
                                                  ) || [];
                                                field.onChange(newValue);
                                              }}
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </Badge>
                                        ) : null;
                                      })}
                                    </div>
                                  ) : (
                                    "Select operators (optional)"
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <div className="max-h-60 overflow-auto p-1">
                                {operators.length === 0 ? (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    {operatorsLoading
                                      ? "Loading..."
                                      : "No unassigned operators available"}
                                  </div>
                                ) : (
                                  operators.map((operator) => (
                                    <div
                                      key={operator.id}
                                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                      onClick={() => {
                                        const currentValue = field.value || [];
                                        const isSelected =
                                          currentValue.includes(operator.id);
                                        const newValue = isSelected
                                          ? currentValue.filter(
                                              (id) => id !== operator.id
                                            )
                                          : [...currentValue, operator.id];
                                        field.onChange(newValue);
                                      }}
                                    >
                                      <Checkbox
                                        checked={
                                          field.value?.includes(operator.id) ||
                                          false
                                        }
                                        onChange={() => {}} // Handled by the parent div click
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {operator.fullName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {operator.email}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Technical Specifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Technical Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hasAC && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              AC Power Output:
                            </span>
                            <Badge variant="outline">7-22 kW</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              AC Connector:
                            </span>
                            <Badge variant="outline">Type 2</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              AC Charging Time:
                            </span>
                            <Badge variant="outline">4-8 hours</Badge>
                          </div>
                        </>
                      )}
                      {hasDC && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              DC Power Output:
                            </span>
                            <Badge variant="outline">50-150 kW</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              DC Connector:
                            </span>
                            <Badge variant="outline">CCS/CHAdeMO</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              DC Charging Time:
                            </span>
                            <Badge variant="outline">30-60 min</Badge>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Capacity:
                        </span>
                        <Badge variant="secondary">
                          {acSlots > 0 && `${acSlots} AC`}
                          {acSlots > 0 && dcSlots > 0 && " + "}
                          {dcSlots > 0 && `${dcSlots} DC`}
                          {" slots"}
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateStationQR}
                        disabled={generatingQR}
                        className="flex-1"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        {generatingQR ? "Generating..." : "Preview QR Code"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setShowLocationPicker(!showLocationPicker)
                        }
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Advanced
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Location Details */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1 *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 123 Main Street"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Floor, Suite, Building (optional)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Colombo">Colombo</SelectItem>
                              <SelectItem value="Kandy">Kandy</SelectItem>
                              <SelectItem value="Galle">Galle</SelectItem>
                              <SelectItem value="Negombo">Negombo</SelectItem>
                              <SelectItem value="Jaffna">Jaffna</SelectItem>
                              <SelectItem value="Batticaloa">
                                Batticaloa
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="6.9271"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="79.8612"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseCurrentLocation}
                      className="w-full"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Use Current Location
                    </Button>

                    <FormField
                      control={form.control}
                      name="googlePlaceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Place ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ChIJX8... (for enhanced mapping)"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: Improves location accuracy and search
                            visibility.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operational Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Special instructions, access requirements, parking details, etc."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Any additional information for operators and users.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Station"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
