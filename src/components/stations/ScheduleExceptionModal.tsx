import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, Plus, Trash2, AlertTriangle, Save } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Station, ScheduleException } from "@/types/entities";

const scheduleExceptionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
  windows: z.array(z.object({
    start: z.string(),
    end: z.string(),
    availableSlots: z.number().min(0)
  })).min(0)
});

type ScheduleExceptionFormData = z.infer<typeof scheduleExceptionSchema>;

interface ScheduleExceptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  onExceptionCreated: (exception: ScheduleException) => void;
}

// Mock existing exceptions
const mockExceptions: ScheduleException[] = [
  {
    stationId: "station-1",
    date: "2024-01-25",
    windows: [],
    note: "Maintenance day - Station closed"
  },
  {
    stationId: "station-1", 
    date: "2024-12-25",
    windows: [
      { start: "10:00", end: "15:00", availableSlots: 2 }
    ],
    note: "Christmas Day - Limited hours"
  }
];

// Special day templates
const exceptionTemplates = [
  {
    id: "closed",
    name: "Station Closed",
    description: "No availability for the entire day",
    windows: [],
    note: "Station closed for maintenance/holiday"
  },
  {
    id: "limited",
    name: "Limited Hours",
    description: "Reduced operating hours",
    windows: [
      { start: "10:00", end: "15:00", availableSlots: 0 }
    ],
    note: "Limited operating hours"
  },
  {
    id: "maintenance",
    name: "Maintenance Window",
    description: "Specific maintenance period",
    windows: [
      { start: "08:00", end: "12:00", availableSlots: 0 },
      { start: "14:00", end: "18:00", availableSlots: 0 }
    ],
    note: "Scheduled maintenance - partial availability"
  }
];

export default function ScheduleExceptionModal({ 
  open, 
  onOpenChange, 
  station,
  onExceptionCreated 
}: ScheduleExceptionModalProps) {
  const [windows, setWindows] = useState<Array<{start: string, end: string, availableSlots: number}>>([]);
  const [existingExceptions] = useState<ScheduleException[]>(mockExceptions);
  const { toast } = useToast();

  const form = useForm<ScheduleExceptionFormData>({
    resolver: zodResolver(scheduleExceptionSchema),
    defaultValues: {
      date: "",
      note: "",
      windows: []
    },
  });

  const selectedDate = form.watch("date");
  const existingException = existingExceptions.find(ex => ex.date === selectedDate);

  const addTimeWindow = () => {
    const totalSlots = station ? station.acSlots + station.dcSlots : 1;
    setWindows([...windows, { start: "09:00", end: "17:00", availableSlots: totalSlots }]);
  };

  const removeTimeWindow = (index: number) => {
    setWindows(windows.filter((_, i) => i !== index));
  };

  const updateTimeWindow = (index: number, field: string, value: string | number) => {
    setWindows(windows.map((window, i) => 
      i === index ? { ...window, [field]: value } : window
    ));
  };

  const applyTemplate = (templateId: string) => {
    const template = exceptionTemplates.find(t => t.id === templateId);
    if (!template || !station) return;

    const templateWindows = template.windows.map(window => ({
      ...window,
      availableSlots: window.availableSlots || (station.acSlots + station.dcSlots)
    }));

    setWindows(templateWindows);
    form.setValue("note", template.note);
    
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied.`,
    });
  };

  const onSubmit = async (data: ScheduleExceptionFormData) => {
    if (!station) return;

    try {
      const exception: ScheduleException = {
        stationId: station.id,
        date: data.date,
        windows: windows,
        note: data.note || undefined
      };

      onExceptionCreated(exception);
      
      toast({
        title: "Schedule Exception Created",
        description: `Special schedule for ${new Date(data.date).toLocaleDateString()} has been saved.`,
      });

      onOpenChange(false);
      form.reset();
      setWindows([]);
    } catch (error) {
      toast({
        title: "Error Creating Exception",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (!station) return null;

  const isDateInPast = selectedDate && new Date(selectedDate) < new Date();
  const totalAvailableSlots = windows.reduce((sum, window) => sum + window.availableSlots, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Exception: {station.name}
          </DialogTitle>
          <DialogDescription>
            Create special schedules for holidays, maintenance, or other exceptions.
            These override the regular weekly schedule for specific dates.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Date & Templates */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Exception Date</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Date *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isDateInPast && (
                      <Alert className="border-warning/20 bg-warning/5">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>
                          This date is in the past. Past exceptions are for record-keeping only.
                        </AlertDescription>
                      </Alert>
                    )}

                    {existingException && (
                      <Alert className="border-accent/20 bg-accent/5">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>
                          An exception already exists for this date and will be replaced.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {exceptionTemplates.map((template) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant="outline"
                        className="w-full text-left justify-start h-auto p-3"
                        onClick={() => applyTemplate(template.id)}
                      >
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Time Windows */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Time Windows
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTimeWindow}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Window
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {windows.length > 0 ? (
                      <>
                        {windows.map((window, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="flex-1 grid grid-cols-3 gap-4">
                              <div>
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                  type="time"
                                  value={window.start}
                                  onChange={(e) => updateTimeWindow(index, 'start', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">End Time</Label>
                                <Input
                                  type="time"
                                  value={window.end}
                                  onChange={(e) => updateTimeWindow(index, 'end', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Available Slots</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={station.acSlots + station.dcSlots}
                                  value={window.availableSlots}
                                  onChange={(e) => updateTimeWindow(index, 'availableSlots', parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimeWindow(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {/* Summary */}
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Time Windows</div>
                              <div className="font-medium">{windows.length}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Total Available Slots</div>
                              <div className="font-medium">{totalAvailableSlots}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Max Concurrent</div>
                              <div className="font-medium">
                                {Math.max(...windows.map(w => w.availableSlots), 0)} / {station.acSlots + station.dcSlots}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <div className="text-lg font-medium mb-2">No time windows</div>
                        <div className="text-sm mb-4">
                          Station will be completely unavailable on this date
                        </div>
                        <Badge variant="destructive">Closed All Day</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Exception Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Exception</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., National holiday, scheduled maintenance, special event..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This note will be visible to operators and may be shown to users.
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
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setWindows([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={!selectedDate}>
                <Save className="w-4 h-4 mr-2" />
                Save Exception
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}