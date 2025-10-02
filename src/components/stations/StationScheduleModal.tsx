import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Clock,
  Plus, 
  Trash2, 
  Copy, 
  Settings,
  AlertCircle,
  BarChart3,
  Save,
  User,
  Car
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Station, StationSchedule, Booking } from "@/types/entities";

// Extended StationSchedule interface to include specific slot availability
interface ExtendedStationSchedule extends Omit<StationSchedule, 'windows'> {
  windows: Array<{
    start: string;
    end: string;
    availableSlots: number;
    selectedSlots: string[]; // Array of slot IDs like ['AC-1', 'DC-1']
  }>;
}

interface StationScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  onScheduleUpdated: (stationId: string, schedules: StationSchedule[]) => void;
}

// Mock approved bookings for the station (more comprehensive data)
const mockApprovedBookings: Booking[] = [
  {
    id: "booking-1",
    ownerNIC: "123456789V",
    ownerName: "John Doe",
    stationId: "station-1",
    stationName: "Central Station",
    status: "APPROVED",
    startAt: "2024-09-13T09:00:00Z",
    endAt: "2024-09-13T11:00:00Z",
    createdByUserId: "admin-1",
    createdAt: "2024-09-12T10:00:00Z",
    updatedAt: "2024-09-12T10:30:00Z",
    notes: "AC charging session"
  },
  {
    id: "booking-2", 
    ownerNIC: "987654321V",
    ownerName: "Sarah Smith",
    stationId: "station-1",
    stationName: "Central Station",
    status: "APPROVED",
    startAt: "2024-09-13T14:00:00Z",
    endAt: "2024-09-13T16:00:00Z",
    createdByUserId: "admin-1",
    createdAt: "2024-09-12T11:00:00Z",
    updatedAt: "2024-09-12T11:15:00Z",
    notes: "DC fast charging"
  },
  {
    id: "booking-3",
    ownerNIC: "456789123V", 
    ownerName: "Mike Johnson",
    stationId: "station-1",
    stationName: "Central Station",
    status: "APPROVED",
    startAt: "2024-09-14T10:00:00Z",
    endAt: "2024-09-14T12:00:00Z",
    createdByUserId: "admin-1",
    createdAt: "2024-09-13T09:00:00Z",
    updatedAt: "2024-09-13T09:30:00Z",
    notes: "Regular charging session"
  },
  {
    id: "booking-4",
    ownerNIC: "321654987V",
    ownerName: "Emma Wilson",
    stationId: "station-1",
    stationName: "Central Station",
    status: "APPROVED",
    startAt: "2024-09-13T16:30:00Z",
    endAt: "2024-09-13T18:30:00Z",
    createdByUserId: "admin-1",
    createdAt: "2024-09-12T15:00:00Z",
    updatedAt: "2024-09-12T15:15:00Z",
    notes: "Evening charge before commute"
  },
  {
    id: "booking-5",
    ownerNIC: "789123456V",
    ownerName: "David Brown",
    stationId: "station-1", 
    stationName: "Central Station",
    status: "APPROVED",
    startAt: "2024-09-15T08:00:00Z",
    endAt: "2024-09-15T10:30:00Z",
    createdByUserId: "admin-1",
    createdAt: "2024-09-14T12:00:00Z",
    updatedAt: "2024-09-14T12:30:00Z",
    notes: "Weekend charging"
  },
  {
    id: "booking-6",
    ownerNIC: "654987321V",
    ownerName: "Lisa Garcia",
    stationId: "station-1",
    stationName: "Central Station", 
    status: "APPROVED",
    startAt: "2024-09-16T13:00:00Z",
    endAt: "2024-09-16T15:00:00Z",
    createdByUserId: "admin-1",
    createdAt: "2024-09-15T10:00:00Z",
    updatedAt: "2024-09-15T10:20:00Z",
    notes: "Lunch break charging"
  }
];

// Mock current schedules with selected slots
const mockSchedules: ExtendedStationSchedule[] = [
  {
    stationId: "station-1",
    weekday: 1, // Monday
    windows: [
      { 
        start: "08:00", 
        end: "12:00", 
        availableSlots: 2,
        selectedSlots: ['AC-1', 'DC-1']
      },
      { 
        start: "13:00", 
        end: "18:00", 
        availableSlots: 4,
        selectedSlots: ['AC-1', 'AC-2', 'DC-1', 'DC-2']
      },
    ]
  },
  {
    stationId: "station-1", 
    weekday: 2, // Tuesday
    windows: [
      { 
        start: "08:00", 
        end: "18:00", 
        availableSlots: 4,
        selectedSlots: ['AC-1', 'AC-2', 'DC-1', 'DC-2']
      },
    ]
  },
];

const weekdays = [
  { id: 0, name: "Sunday", short: "Sun" },
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
];

const scheduleTemplates = [
  {
    id: "business",
    name: "Business Hours",
    description: "Monday-Friday 9AM-6PM",
    schedule: [
      { weekday: 1, windows: [{ start: "09:00", end: "18:00", availableSlots: 0 }] },
      { weekday: 2, windows: [{ start: "09:00", end: "18:00", availableSlots: 0 }] },
      { weekday: 3, windows: [{ start: "09:00", end: "18:00", availableSlots: 0 }] },
      { weekday: 4, windows: [{ start: "09:00", end: "18:00", availableSlots: 0 }] },
      { weekday: 5, windows: [{ start: "09:00", end: "18:00", availableSlots: 0 }] },
    ]
  },
  {
    id: "24x7",
    name: "24/7 Operations",
    description: "Always available",
    schedule: weekdays.map(day => ({
      weekday: day.id,
      windows: [{ start: "00:00", end: "23:59", availableSlots: 0 }]
    }))
  },
  {
    id: "weekend",
    name: "Weekends Only",
    description: "Saturday-Sunday only",
    schedule: [
      { weekday: 0, windows: [{ start: "08:00", end: "20:00", availableSlots: 0 }] },
      { weekday: 6, windows: [{ start: "08:00", end: "20:00", availableSlots: 0 }] },
    ]
  }
];

export default function StationScheduleModal({ 
  open, 
  onOpenChange, 
  station,
  onScheduleUpdated 
}: StationScheduleModalProps) {
  const [schedules, setSchedules] = useState<ExtendedStationSchedule[]>(mockSchedules);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("bookings");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const { toast } = useToast();

  // Ensure a stable first slot selection when station becomes available
  useEffect(() => {
    if (!station) return;
    const firstSlotId = station.acSlots > 0 ? "AC-1" : station.dcSlots > 0 ? "DC-1" : "";
    if (!selectedSlot || !/^AC|DC/.test(selectedSlot)) {
      setSelectedSlot(firstSlotId);
    }
  }, [station, selectedSlot]);

  if (!station) return null;

  // Generate slot options based on station capacity
  const generateSlotOptions = () => {
    const slots = [] as { id: string; name: string; type: 'AC' | 'DC' }[];
    for (let i = 1; i <= station.acSlots; i++) {
      slots.push({ id: `AC-${i}`, name: `AC Slot ${i}`, type: 'AC' });
    }
    for (let i = 1; i <= station.dcSlots; i++) {
      slots.push({ id: `DC-${i}`, name: `DC Slot ${i}`, type: 'DC' });
    }
    return slots;
  };

  const slotOptions = generateSlotOptions();

  // Get bookings for the selected slot and date
  const getBookingsForSlot = (slotId: string, date: Date) => {
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    // In a real app, you would filter bookings by slotId and date
    // For now, we'll show bookings for the selected date
    return mockApprovedBookings.filter(booking => {
      if (booking.stationId !== station.id) return false;
      
      const bookingDate = format(new Date(booking.startAt), 'yyyy-MM-dd');
      return bookingDate === selectedDateStr;
    });
  };

  const selectedSlotBookings = getBookingsForSlot(selectedSlot, selectedDate);

  const currentDaySchedule = schedules.find(s => s.weekday === selectedDay);

  const addTimeWindow = () => {
    const newWindow = { 
      start: "09:00", 
      end: "17:00", 
      availableSlots: 0,
      selectedSlots: []
    };
    
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.weekday === selectedDay) {
        return {
          ...schedule,
          windows: [...schedule.windows, newWindow]
        };
      }
      return schedule;
    });

    // If no schedule exists for this day, create one
    if (!currentDaySchedule) {
      updatedSchedules.push({
        stationId: station.id,
        weekday: selectedDay as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        windows: [newWindow]
      });
    }

    setSchedules(updatedSchedules);
  };

  const removeTimeWindow = (windowIndex: number) => {
    if (!currentDaySchedule) return;

    const updatedSchedules = schedules.map(schedule => {
      if (schedule.weekday === selectedDay) {
        return {
          ...schedule,
          windows: schedule.windows.filter((_, index) => index !== windowIndex)
        };
      }
      return schedule;
    }).filter(schedule => schedule.windows.length > 0); // Remove empty schedules

    setSchedules(updatedSchedules);
  };

  const updateTimeWindow = (windowIndex: number, field: string, value: string | number | string[]) => {
    if (!currentDaySchedule) return;

    const updatedSchedules = schedules.map(schedule => {
      if (schedule.weekday === selectedDay) {
        return {
          ...schedule,
          windows: schedule.windows.map((window, index) => {
            if (index === windowIndex) {
              if (field === 'selectedSlots') {
                return { 
                  ...window, 
                  selectedSlots: value as string[],
                  availableSlots: (value as string[]).length
                };
              }
              return { ...window, [field]: value };
            }
            return window;
          })
        };
      }
      return schedule;
    });

    setSchedules(updatedSchedules);
  };

  const applyTemplate = (templateId: string) => {
    const template = scheduleTemplates.find(t => t.id === templateId);
    if (!template) return;

    const allSlotIds = slotOptions.map(slot => slot.id);
    const newSchedules = template.schedule.map(scheduleTemplate => ({
      stationId: station.id,
      weekday: scheduleTemplate.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      windows: scheduleTemplate.windows.map(window => ({
        ...window,
        availableSlots: window.availableSlots || (station.acSlots + station.dcSlots),
        selectedSlots: allSlotIds // Select all slots by default
      }))
    }));

    setSchedules(newSchedules);
    toast({
      title: "Template Applied",
      description: `${template.name} schedule has been applied to all days.`,  
    });
  };

  const copySchedule = (fromDay: number) => {
    const sourceSchedule = schedules.find(s => s.weekday === fromDay);
    if (!sourceSchedule) return;

    const newSchedule: ExtendedStationSchedule = {
      stationId: station.id,
      weekday: selectedDay as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      windows: sourceSchedule.windows.map(window => ({
        ...window,
        selectedSlots: [...window.selectedSlots] // Copy the selected slots
      }))
    };

    const updatedSchedules = schedules.filter(s => s.weekday !== selectedDay);
    updatedSchedules.push(newSchedule);
    
    setSchedules(updatedSchedules);
    toast({
      title: "Schedule Copied",
      description: `${weekdays[fromDay].name} schedule copied to ${weekdays[selectedDay].name}.`,
    });
  };

  const saveSchedules = () => {
    onScheduleUpdated(station.id, schedules);
    toast({
      title: "Schedules Updated",
      description: "Station availability schedules have been saved successfully.",
    });
    onOpenChange(false);
  };

  const getTotalWeeklySlots = () => {
    return schedules.reduce((total, schedule) => {
      const dayTotal = schedule.windows.reduce((daySum, window) => {
        const startTime = new Date(`2024-01-01T${window.start}:00`);
        const endTime = new Date(`2024-01-01T${window.end}:00`);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return daySum + (hours * window.availableSlots);
      }, 0);
      return total + dayTotal;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Station Schedule: {station.name}
          </DialogTitle>
          <DialogDescription>
            Configure operating hours and slot availability for each day of the week.
            Changes affect future bookings only.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">Slot Bookings</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="templates">Quick Templates</TabsTrigger>
            <TabsTrigger value="analytics">Schedule Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Filters Card - Wider */}
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  {/* Slot Selector */}
                  <div>
                    <Label className="text-sm font-medium">Select Slot</Label>
                    <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose slot..." />
                      </SelectTrigger>
                      <SelectContent>
                        {slotOptions.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <Label className="text-sm font-medium">Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => setSelectedDate(date || new Date())}
                          initialFocus
                          className="p-3 pointer-events-auto border-0"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>


                  {/* Summary */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">
                      {slotOptions.find(s => s.id === selectedSlot)?.type} Charging
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedSlotBookings.length} booking{selectedSlotBookings.length !== 1 ? 's' : ''} found
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(selectedDate, "MMM dd, yyyy")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Display - Takes remaining space */}
            <div className="lg:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Bookings for {slotOptions.find(s => s.id === selectedSlot)?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedSlotBookings.length > 0 ? (
                      <div className="space-y-4">
                        {selectedSlotBookings.map((booking) => (
                          <div key={booking.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{booking.ownerName}</div>
                                    <div className="text-sm text-muted-foreground">NIC: {booking.ownerNIC}</div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Start Time</Label>
                                    <div className="text-sm font-mono">
                                      {new Date(booking.startAt).toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">End Time</Label>
                                    <div className="text-sm font-mono">
                                      {new Date(booking.endAt).toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                {booking.notes && (
                                  <div className="mt-3">
                                    <Label className="text-xs text-muted-foreground">Notes</Label>
                                    <div className="text-sm">{booking.notes}</div>
                                  </div>
                                )}
                              </div>
                              
                              <Badge variant="secondary" className="ml-4">
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <div className="text-lg font-medium mb-2">No bookings</div>
                        <div className="text-sm">
                          No approved bookings found for {slotOptions.find(s => s.id === selectedSlot)?.name}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Day Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Day</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {weekdays.map((day) => {
                    const hasSchedule = schedules.some(s => s.weekday === day.id);
                    const isSelected = selectedDay === day.id;
                    
                    return (
                      <Button
                        key={day.id}
                        variant={isSelected ? "default" : "outline"}
                        className="w-full justify-between"
                        onClick={() => setSelectedDay(day.id)}
                      >
                        <span>{day.name}</span>
                        {hasSchedule && (
                          <Badge variant="secondary" className="ml-2">
                            {schedules.find(s => s.weekday === day.id)?.windows.length || 0}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Schedule Configuration */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {weekdays[selectedDay].name} Schedule
                      </span>
                      <div className="flex gap-2">
                        <Select onValueChange={(value) => copySchedule(parseInt(value))}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Copy from..." />
                          </SelectTrigger>
                          <SelectContent>
                            {weekdays
                              .filter(day => day.id !== selectedDay && schedules.some(s => s.weekday === day.id))
                              .map((day) => (
                                <SelectItem key={day.id} value={day.id.toString()}>
                                  {day.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addTimeWindow}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Window
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentDaySchedule?.windows.length ? (
                      currentDaySchedule.windows.map((window, index) => (
                         <div key={index} className="p-4 border rounded-lg space-y-4">
                           <div className="grid grid-cols-2 gap-4">
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
                           </div>
                           
                           {/* Slot Selection */}
                           <div>
                             <Label className="text-sm font-medium mb-3 block">Available Slots</Label>
                             <div className="grid grid-cols-2 gap-2 mb-3">
                               {slotOptions.map((slot) => (
                                 <div key={slot.id} className="flex items-center space-x-2">
                                   <Checkbox
                                     id={`${index}-${slot.id}`}
                                     checked={(window.selectedSlots || []).includes(slot.id)}
                                     onCheckedChange={(checked) => {
                                       const currentSelected = window.selectedSlots || [];
                                       const newSelected = checked 
                                         ? [...currentSelected, slot.id]
                                         : currentSelected.filter(s => s !== slot.id);
                                       updateTimeWindow(index, 'selectedSlots', newSelected);
                                     }}
                                   />
                                   <Label htmlFor={`${index}-${slot.id}`} className="text-sm">
                                     {slot.name}
                                   </Label>
                                 </div>
                               ))}
                             </div>
                             
                             {/* Selected Slots Summary */}
                             <div className="p-2 bg-muted rounded text-sm">
                               <strong>Selected: </strong>
                               {(window.selectedSlots || []).length > 0 ? (
                                 (window.selectedSlots || []).map(slotId => 
                                   slotOptions.find(s => s.id === slotId)?.name
                                 ).join(', ')
                               ) : (
                                 'No slots selected'
                               )}
                               <div className="text-xs text-muted-foreground mt-1">
                                 Total: {(window.selectedSlots || []).length} slot{(window.selectedSlots || []).length !== 1 ? 's' : ''}
                               </div>
                             </div>
                           </div>
                           
                           {/* Remove Button */}
                           <div className="flex justify-end">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => removeTimeWindow(index)}
                               className="text-destructive hover:text-destructive"
                             >
                               <Trash2 className="w-4 h-4 mr-1" />
                               Remove Window
                             </Button>
                           </div>
                         </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <div className="text-lg font-medium mb-2">No schedule set</div>
                        <div className="text-sm">
                          {weekdays[selectedDay].name} is currently unavailable for bookings
                        </div>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={addTimeWindow}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Time Window
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const totalSlots = station.acSlots + station.dcSlots;
                        const allSlotIds = slotOptions.map(slot => slot.id);
                        const allDayWindow = { 
                          start: "00:00", 
                          end: "23:59", 
                          availableSlots: totalSlots,
                          selectedSlots: allSlotIds
                        };
                        const updatedSchedules = schedules.filter(s => s.weekday !== selectedDay);
                        updatedSchedules.push({
                          stationId: station.id,
                          weekday: selectedDay as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                          windows: [allDayWindow]
                        });
                        setSchedules(updatedSchedules);
                      }}
                    >
                      Set 24/7 Available
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const totalSlots = station.acSlots + station.dcSlots;
                        const allSlotIds = slotOptions.map(slot => slot.id);
                        const businessWindow = { 
                          start: "09:00", 
                          end: "18:00", 
                          availableSlots: totalSlots,
                          selectedSlots: allSlotIds
                        };
                        const updatedSchedules = schedules.filter(s => s.weekday !== selectedDay);
                        updatedSchedules.push({
                          stationId: station.id,
                          weekday: selectedDay as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                          windows: [businessWindow]
                        });
                        setSchedules(updatedSchedules);
                      }}
                    >
                      Set Business Hours
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSchedules(schedules.filter(s => s.weekday !== selectedDay));
                      }}
                    >
                      Clear Day
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const allSlotIds = slotOptions.map(slot => slot.id);
                        const updatedSchedules = schedules.map(schedule => {
                          if (schedule.weekday === selectedDay) {
                            return {
                              ...schedule,
                              windows: schedule.windows.map(window => ({
                                ...window,
                                selectedSlots: allSlotIds
                              }))
                            };
                          }
                          return schedule;
                        });
                        setSchedules(updatedSchedules);
                      }}
                    >
                      Max All Slots
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6 mt-6">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Applying a template will replace all existing schedules. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scheduleTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-medium">Coverage:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.schedule.map((day) => (
                          <Badge key={day.weekday} variant="outline" className="text-xs">
                            {weekdays[day.weekday].short}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => applyTemplate(template.id)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Apply Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Weekly Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Days:</span>
                    <Badge variant="outline">{schedules.length} / 7</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Slot-Hours:</span>
                    <Badge variant="secondary">{getTotalWeeklySlots().toFixed(0)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Hours/Day:</span>
                    <span className="font-medium">
                      {schedules.length ? (getTotalWeeklySlots() / (station.acSlots + station.dcSlots) / schedules.length).toFixed(1) : '0'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Capacity Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {schedules.map((schedule) => {
                      const totalSlotHours = schedule.windows.reduce((sum, window) => {
                        const startTime = new Date(`2024-01-01T${window.start}:00`);
                        const endTime = new Date(`2024-01-01T${window.end}:00`);
                        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                        return sum + (hours * window.availableSlots);
                      }, 0);
                      const maxPossible = 24 * (station.acSlots + station.dcSlots);
                      const utilization = Math.round((totalSlotHours / maxPossible) * 100);

                      return (
                        <div key={schedule.weekday} className="flex justify-between items-center">
                          <span className="text-sm">{weekdays[schedule.weekday].short}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-accent h-2 rounded-full" 
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{utilization}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Schedule Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${schedules.length >= 5 ? 'bg-success' : 'bg-warning'}`} />
                    <span className="text-sm">Weekday Coverage</span>
                    <Badge variant="outline" className="ml-auto">
                      {schedules.filter(s => s.weekday >= 1 && s.weekday <= 5).length}/5
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${schedules.filter(s => [0, 6].includes(s.weekday)).length > 0 ? 'bg-success' : 'bg-muted'}`} />
                    <span className="text-sm">Weekend Coverage</span>
                    <Badge variant="outline" className="ml-auto">
                      {schedules.filter(s => [0, 6].includes(s.weekday)).length}/2
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getTotalWeeklySlots() > 0 ? 'bg-success' : 'bg-destructive'}`} />
                    <span className="text-sm">Availability</span>
                    <Badge variant="outline" className="ml-auto">
                      {getTotalWeeklySlots() > 0 ? 'Active' : 'None'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="accent" onClick={saveSchedules}>
            <Save className="w-4 h-4 mr-2" />
            Save Schedules
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}