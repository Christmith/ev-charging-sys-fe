import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Zap, Settings, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Station } from "@/types/entities";

const stationSchema = z.object({
  name: z.string().min(1, "Station name is required"),
  code: z.string().optional(),
  acSlots: z.number().min(0, "AC slots cannot be negative").max(20, "Maximum 20 AC slots allowed"),
  dcSlots: z.number().min(0, "DC slots cannot be negative").max(20, "Maximum 20 DC slots allowed"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  googlePlaceId: z.string().optional(),
  operatorUserId: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.acSlots + data.dcSlots >= 1, {
  message: "Station must have at least 1 charging slot (AC or DC)",
  path: ["acSlots"],
});

type StationFormData = z.infer<typeof stationSchema>;

interface EditStationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  onStationUpdated: (station: Station) => void;
}

// Mock operator users
const mockOperators = [
  { id: "user-1", name: "John Smith", email: "john@station-ops.com" },
  { id: "user-2", name: "Sarah Johnson", email: "sarah@station-ops.com" },
  { id: "user-3", name: "Mike Chen", email: "mike@station-ops.com" },
];

export default function EditStationModal({ 
  open, 
  onOpenChange, 
  station,
  onStationUpdated 
}: EditStationModalProps) {
  const [hasActiveBookings] = useState(true); // Mock check for active bookings
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
      latitude: 6.9271,
      longitude: 79.8612,
      googlePlaceId: "",
      operatorUserId: "",
      notes: "",
    },
  });

  // Populate form when station data is available
  useEffect(() => {
    console.log("EditStationModal: useEffect triggered", { station });
    if (station) {
      console.log("EditStationModal: Resetting form with station data", {
        name: station.name,
        code: station.code || "",
        acSlots: station.acSlots,
        dcSlots: station.dcSlots,
        addressLine1: station.addressLine1,
        city: station.city,
        latitude: station.latitude,
        longitude: station.longitude,
      });
      
      try {
        form.reset({
          name: station.name || "",
          code: station.code || "",
          acSlots: station.acSlots || 0,
          dcSlots: station.dcSlots || 0,
          addressLine1: station.addressLine1 || "",
          addressLine2: "",
          city: station.city || "",
          latitude: station.latitude || 0,
          longitude: station.longitude || 0,
          googlePlaceId: station.googlePlaceId || "",
          operatorUserId: station.operatorUserId || "",
          notes: "",
        });
        console.log("EditStationModal: Form reset successful");
      } catch (error) {
        console.error("EditStationModal: Error resetting form", error);
      }
    }
  }, [station, form]);

  const acSlots = form.watch("acSlots");
  const dcSlots = form.watch("dcSlots");
  const totalSlots = acSlots + dcSlots;
  const currentTotalSlots = (station?.acSlots || 0) + (station?.dcSlots || 0);

  const onSubmit = async (data: StationFormData) => {
    console.log("EditStationModal: onSubmit called", { data, station });
    if (!station) {
      console.error("EditStationModal: No station provided to onSubmit");
      return;
    }

    try {
      console.log("EditStationModal: Creating updated station object");
      const updatedStation: Station = {
        ...station,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      console.log("EditStationModal: Updated station created", updatedStation);

      console.log("EditStationModal: Calling onStationUpdated");
      onStationUpdated(updatedStation);
      
      toast({
        title: "Station Updated Successfully",
        description: `${data.name} has been updated.`,
      });

      console.log("EditStationModal: Closing modal");
      onOpenChange(false);
    } catch (error) {
      console.error("EditStationModal: Error in onSubmit", error);
      toast({
        title: "Error Updating Station",
        description: "Please try again later.",
        variant: "destructive",
      });
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

  const powerSpecs = {
    AC: { power: "7-22 kW", connector: "Type 2", chargingTime: "4-8 hours" },
    DC: { power: "50-150 kW", connector: "CCS/CHAdeMO", chargingTime: "30-60 min" }
  };

  if (!station) return null;

  const isReducingSlots = totalSlots < currentTotalSlots;
  const slotReduction = currentTotalSlots - totalSlots;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Edit Station: {station.name}
          </DialogTitle>
          <DialogDescription>
            Modify station details, capacity, and operational settings. Changes may affect future bookings.
          </DialogDescription>
        </DialogHeader>

        {/* Warnings */}
        {hasActiveBookings && (
          <Alert className="border-accent/20 bg-accent/5">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              This station has active bookings. Changes to capacity or type may affect current reservations.
            </AlertDescription>
          </Alert>
        )}

        {isReducingSlots && (
          <Alert className="border-warning/20 bg-warning/5">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Reducing slots by {slotReduction} may cancel future bookings that exceed the new capacity.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Details */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Station Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Station Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Central Mall Charging Hub" {...field} />
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
                              placeholder="e.g., CMH-001" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Unique identifier for the station.
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
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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

                    {isReducingSlots && (
                      <FormDescription className="text-warning">
                        Reducing from {currentTotalSlots} to {totalSlots} total slots
                      </FormDescription>
                    )}

                    <FormField
                      control={form.control}
                      name="operatorUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Station Operator</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Assign operator (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned">No operator assigned</SelectItem>
                              {mockOperators.map((operator) => (
                                <SelectItem key={operator.id} value={operator.id}>
                                  {operator.name} - {operator.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                      {acSlots > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AC Power Output:</span>
                            <Badge variant="outline">7-22 kW</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AC Connector:</span>
                            <Badge variant="outline">Type 2</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AC Charging Time:</span>
                            <Badge variant="outline">4-8 hours</Badge>
                          </div>
                        </>
                      )}
                      {dcSlots > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">DC Power Output:</span>
                            <Badge variant="outline">50-150 kW</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">DC Connector:</span>
                            <Badge variant="outline">CCS/CHAdeMO</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">DC Charging Time:</span>
                            <Badge variant="outline">30-60 min</Badge>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Capacity:</span>
                        <Badge variant="secondary">
                          {acSlots > 0 && `${acSlots} AC`}
                          {acSlots > 0 && dcSlots > 0 && " + "}
                          {dcSlots > 0 && `${dcSlots} DC`}
                          {" slots"}
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(station.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{new Date(station.updatedAt).toLocaleDateString()}</span>
                      </div>
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
                            <Input placeholder="e.g., 123 Main Street" {...field} />
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
                            <Input placeholder="Floor, Suite, Building (optional)" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                              <SelectItem value="Batticaloa">Batticaloa</SelectItem>
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
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                            Optional: Improves location accuracy and search visibility.
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
              >
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Update Station
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}