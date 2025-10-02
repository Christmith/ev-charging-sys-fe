import { useState } from "react";
import { 
  MapPin, 
  Zap, 
  Calendar, 
  Activity, 
  Settings, 
  QrCode,
  Clock,
  Users,
  AlertCircle,
  ExternalLink
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Station } from "@/types/entities";

interface ViewStationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  onEdit?: (station: Station) => void;
  onSchedule?: (station: Station) => void;
}

// Mock data for station analytics
const mockStationAnalytics = {
  todayBookings: 12,
  weeklyBookings: 78,
  monthlyBookings: 312,
  utilizationRate: 68,
  avgSessionDuration: "2.5 hours",
  totalEnergyDelivered: "1,247 kWh",
  revenueThisMonth: "$2,450",
  maintenanceStatus: "Good",
  lastMaintenance: "2024-01-15",
  nextMaintenance: "2024-04-15",
};

const mockRecentBookings = [
  { id: "book-1", time: "14:30", duration: "2h", vehicle: "Tesla Model 3", status: "Active" },
  { id: "book-2", time: "12:00", duration: "1.5h", vehicle: "Nissan Leaf", status: "Completed" },
  { id: "book-3", time: "09:15", duration: "3h", vehicle: "BMW i3", status: "Completed" },
];

const mockUpcomingBookings = [
  { id: "book-4", time: "16:00", duration: "2h", vehicle: "Audi e-tron", customer: "John Smith" },
  { id: "book-5", time: "18:30", duration: "1h", vehicle: "Hyundai Kona", customer: "Sarah Johnson" },
];

export default function ViewStationModal({ 
  open, 
  onOpenChange, 
  station,
  onEdit,
  onSchedule
}: ViewStationModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!station) return null;

  const powerSpecs = {
    AC: { power: "7-22 kW", connector: "Type 2", chargingTime: "4-8 hours" },
    DC: { power: "50-150 kW", connector: "CCS/CHAdeMO", chargingTime: "30-60 min" }
  };

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps?q=${station.latitude},${station.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {station.name}
            <Badge 
              variant="outline" 
              className={
                station.status === 'ACTIVE' 
                  ? "bg-success/10 text-success border-success/20 ml-2" 
                  : "bg-muted text-muted-foreground border-muted/20 ml-2"
              }
            >
              {station.status.toLowerCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {station.code && `Station Code: ${station.code} • `}
            {(station.acSlots > 0 ? 'AC' : '') + (station.acSlots > 0 && station.dcSlots > 0 ? ' & ' : '') + (station.dcSlots > 0 ? 'DC' : '')} Charging Station • {station.acSlots + station.dcSlots} Slots
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Station Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Station Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Station Name:</span>
                      <span className="font-medium">{station.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Station Code:</span>
                      <Badge variant="outline">{station.code || "Not assigned"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Charging Type:</span>
                      <div className="flex gap-1">
                        {station.acSlots > 0 && (
                          <Badge variant="secondary">AC</Badge>
                        )}
                        {station.dcSlots > 0 && (
                          <Badge variant="default">DC</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Slots:</span>
                      <Badge variant="secondary">{station.acSlots + station.dcSlots} slots</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge 
                        variant={station.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={station.status === 'ACTIVE' ? 'bg-success/10 text-success border-success/20' : ''}
                      >
                        {station.status}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Technical Specifications</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Power Output:</span>
                        <div className="font-medium">
                          {station.acSlots > 0 && station.dcSlots > 0 
                            ? "AC: 7-22 kW, DC: 50-150 kW"
                            : station.acSlots > 0 
                              ? powerSpecs.AC.power 
                              : powerSpecs.DC.power}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Connector:</span>
                        <div className="font-medium">
                          {station.acSlots > 0 && station.dcSlots > 0 
                            ? "Type 2, CCS/CHAdeMO"
                            : station.acSlots > 0 
                              ? powerSpecs.AC.connector 
                              : powerSpecs.DC.connector}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Charge Time:</span>
                        <div className="font-medium">
                          {station.acSlots > 0 && station.dcSlots > 0 
                            ? "30min - 8hrs"
                            : station.acSlots > 0 
                              ? powerSpecs.AC.chargingTime 
                              : powerSpecs.DC.chargingTime}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Capacity:</span>
                        <div className="font-medium">{station.acSlots + station.dcSlots} vehicles</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleOpenMaps} className="flex-1">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Maps
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <QrCode className="w-4 h-4 mr-2" />
                      Show QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Address</label>
                      <div className="font-medium">{station.addressLine1}</div>
                      <div className="text-muted-foreground">{station.city}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Latitude</label>
                        <div className="font-mono text-sm">{station.latitude.toFixed(6)}</div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Longitude</label>
                        <div className="font-mono text-sm">{station.longitude.toFixed(6)}</div>
                      </div>
                    </div>

                    {station.googlePlaceId && (
                      <div>
                        <label className="text-sm text-muted-foreground">Google Place ID</label>
                        <div className="font-mono text-xs text-muted-foreground break-all">
                          {station.googlePlaceId}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Timestamps</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(station.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{new Date(station.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Current Availability Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">3</div>
                    <div className="text-sm text-muted-foreground">Available Slots</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">1</div>
                    <div className="text-sm text-muted-foreground">In Use</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">68%</div>
                    <div className="text-sm text-muted-foreground">Today's Utilization</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-sm text-muted-foreground">Bookings Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Today:</span>
                      <Badge variant="outline">{mockStationAnalytics.todayBookings} bookings</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">This Week:</span>
                      <Badge variant="outline">{mockStationAnalytics.weeklyBookings} bookings</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">This Month:</span>
                      <Badge variant="outline">{mockStationAnalytics.monthlyBookings} bookings</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Utilization Rate</span>
                      <span className="text-sm font-medium">{mockStationAnalytics.utilizationRate}%</span>
                    </div>
                    <Progress value={mockStationAnalytics.utilizationRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Session:</span>
                    <span className="font-medium">{mockStationAnalytics.avgSessionDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Energy Delivered:</span>
                    <span className="font-medium">{mockStationAnalytics.totalEnergyDelivered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue (Month):</span>
                    <Badge variant="secondary">{mockStationAnalytics.revenueThisMonth}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Maintenance Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-success" />
                    <span className="font-medium text-success">{mockStationAnalytics.maintenanceStatus}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Service:</span>
                      <span>{new Date(mockStationAnalytics.lastMaintenance).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Service:</span>
                      <span>{new Date(mockStationAnalytics.nextMaintenance).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockRecentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{booking.time}</div>
                          <div className="text-sm text-muted-foreground">{booking.vehicle}</div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={booking.status === 'Active' ? 'default' : 'outline'}
                            className={booking.status === 'Active' ? 'bg-success/10 text-success border-success/20' : ''}
                          >
                            {booking.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground">{booking.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockUpcomingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{booking.time}</div>
                          <div className="text-sm text-muted-foreground">{booking.customer}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{booking.vehicle}</div>
                          <div className="text-sm text-muted-foreground">{booking.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Maintenance Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Current Status:</span>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {mockStationAnalytics.maintenanceStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Maintenance:</span>
                      <span>{new Date(mockStationAnalytics.lastMaintenance).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Scheduled:</span>
                      <span>{new Date(mockStationAnalytics.nextMaintenance).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    System Diagnostics
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onSchedule && (
            <Button variant="outline" onClick={() => onSchedule(station)}>
              <Calendar className="w-4 h-4 mr-2" />
              Manage Schedule
            </Button>
          )}
          {onEdit && (
            <Button variant="accent" onClick={() => onEdit(station)}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Station
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}