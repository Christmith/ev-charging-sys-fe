import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  CheckCircle, 
  MapPin, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardStats } from "@/types/entities";

// Mock data - replace with actual API calls
const mockStats: DashboardStats = {
  pendingReservations: 12,
  approvedFutureReservations: 45,
  activeStations: 8,
  deactivatedStations: 2,
  sameDayCapacity: {
    total: 120,
    booked: 78,
  }
};

const mockUpcomingBookings = [
  {
    id: "1",
    time: "09:30 AM",
    ownerNIC: "123456789V",
    ownerName: "John Doe",
    stationName: "Central Station",
    status: "PENDING" as const
  },
  {
    id: "2", 
    time: "11:00 AM",
    ownerNIC: "987654321V",
    ownerName: "Jane Smith", 
    stationName: "Mall Parking",
    status: "APPROVED" as const
  },
  {
    id: "3",
    time: "02:15 PM", 
    ownerNIC: "456789123V",
    ownerName: "Bob Wilson",
    stationName: "Airport Terminal",
    status: "APPROVED" as const
  }
];

const mockStations = [
  {
    id: "1",
    name: "Central Station",
    type: "DC" as const,
    city: "Colombo",
    availableSlots: 3,
    totalSlots: 4,
    status: "ACTIVE" as const,
    latitude: 6.9271,
    longitude: 79.8612,
  },
  {
    id: "2", 
    name: "Mall Parking",
    type: "AC" as const,
    city: "Kandy",
    availableSlots: 2,
    totalSlots: 3,
    status: "ACTIVE" as const,
    latitude: 7.2906,
    longitude: 80.6337,
  },
  {
    id: "3",
    name: "Airport Terminal", 
    type: "DC" as const,
    city: "Colombo",
    availableSlots: 0,
    totalSlots: 6,
    status: "ACTIVE" as const,
    latitude: 7.1808,
    longitude: 79.8841,
  }
];

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default" 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "accent";
}) {
  const variantClasses = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning", 
    accent: "text-accent"
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variantClasses[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(mockStats);

  useEffect(() => {
    // Simulate loading stats
    const loadStats = async () => {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(mockStats);
    };

    loadStats();
  }, []);

  const capacityPercentage = Math.round((stats.sameDayCapacity.booked / stats.sameDayCapacity.total) * 100);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}. Here's what's happening today.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Today</div>
          <div className="text-2xl font-semibold">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Reservations"
          value={stats.pendingReservations}
          subtitle="Next 7 days"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Approved Reservations"
          value={stats.approvedFutureReservations}
          subtitle="Future bookings"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Active Stations"
          value={`${stats.activeStations}/${stats.activeStations + stats.deactivatedStations}`}
          subtitle={`${stats.deactivatedStations} deactivated`}
          icon={Zap}
          variant="accent"
        />
        <StatCard
          title="Today's Capacity"
          value={`${capacityPercentage}%`}
          subtitle={`${stats.sameDayCapacity.booked} / ${stats.sameDayCapacity.total} slots`}
          icon={TrendingUp}
          variant={capacityPercentage > 80 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Today's Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUpcomingBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-muted-foreground w-20">
                    {booking.time}
                  </div>
                  <div>
                    <div className="font-medium">{booking.ownerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.ownerNIC} • {booking.stationName}
                    </div>
                  </div>
                </div>
                <div 
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'PENDING' 
                      ? 'bg-warning/10 text-warning' 
                      : 'bg-success/10 text-success'
                  }`}
                >
                  {booking.status.toLowerCase()}
                </div>
              </div>
            ))}
            
            {mockUpcomingBookings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div>No bookings scheduled for today</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Station Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              Station Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockStations.map((station) => (
              <div 
                key={station.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    station.status === 'ACTIVE' ? 'bg-success' : 'bg-muted'
                  }`} />
                  <div>
                    <div className="font-medium">{station.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {station.type} • {station.city}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {station.availableSlots}/{station.totalSlots}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    available
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Business Rules Reminder */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-accent">
            <Activity className="w-5 h-5" />
            Business Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
            <div>
              <strong>Booking Window:</strong> Reservations can only be created within 7 days from today
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-warning mt-0.5" />
            <div>
              <strong>Modification Rule:</strong> Updates and cancellations require at least 12 hours notice
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-warning mt-0.5" />
            <div>
              <strong>Station Policy:</strong> Active stations cannot be deactivated if they have existing bookings
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}