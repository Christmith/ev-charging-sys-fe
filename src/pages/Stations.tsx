import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MapPin,
  Zap,
  Calendar,
  AlertTriangle,
  Settings,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Station } from "@/types/entities";
import CreateStationModal from "@/components/stations/CreateStationModal";
import ViewStationModal from "@/components/stations/ViewStationModal";
import EditStationModal from "@/components/stations/EditStationModal";
import StationStatusDialog from "@/components/stations/StationStatusDialog";
import StationScheduleModal from "@/components/stations/StationScheduleModal";
import { ConfirmationDialog } from "@/components/bookings/ConfirmationDialog";
import { usePagination } from "@/hooks/usePagination";
import { DataPagination } from "@/components/ui/data-pagination";

// Mock data - replace with API calls
const mockStations: Station[] = [
  {
    id: "station-1",
    name: "Central Station",
    code: "CS-001",
    acSlots: 2,
    dcSlots: 2,
    addressLine1: "123 Central Avenue",
    city: "Colombo",
    latitude: 6.9271,
    longitude: 79.8612,
    status: "ACTIVE",
    operatorUserId: "user-2",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "station-2",
    name: "Mall Parking",
    code: "MP-002",
    acSlots: 3,
    dcSlots: 0,
    addressLine1: "456 Shopping Complex",
    city: "Kandy",
    latitude: 7.2906,
    longitude: 80.6337,
    status: "ACTIVE",
    operatorUserId: "user-2",
    createdAt: "2024-02-15T14:30:00Z",
    updatedAt: "2024-11-01T10:15:00Z",
  },
  {
    id: "station-3",
    name: "Airport Terminal",
    code: "AT-003",
    acSlots: 0,
    dcSlots: 6,
    addressLine1: "Bandaranaike International Airport",
    city: "Colombo",
    latitude: 7.1808,
    longitude: 79.8841,
    status: "ACTIVE",
    createdAt: "2024-03-20T11:45:00Z",
    updatedAt: "2024-03-20T11:45:00Z",
  },
  {
    id: "station-4",
    name: "Beach Resort",
    code: "BR-004",
    acSlots: 2,
    dcSlots: 0,
    addressLine1: "789 Ocean Drive",
    city: "Galle",
    latitude: 6.0535,
    longitude: 80.221,
    status: "DEACTIVATED",
    operatorUserId: "user-2",
    createdAt: "2024-04-05T16:20:00Z",
    updatedAt: "2024-10-15T13:45:00Z",
  },
];

// Mock current availability data
const mockAvailability = [
  { stationId: "station-1", availableSlots: 3, totalSlots: 4 },
  { stationId: "station-2", availableSlots: 2, totalSlots: 3 },
  { stationId: "station-3", availableSlots: 0, totalSlots: 6 },
  { stationId: "station-4", availableSlots: 0, totalSlots: 2 }, // Deactivated
];

function StatusBadge({ status }: { status: Station["status"] }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "ACTIVE"
          ? "bg-success/10 text-success border-success/20"
          : "bg-muted text-muted-foreground border-muted/20"
      }
    >
      {status.toLowerCase()}
    </Badge>
  );
}

function TypeBadge({ station }: { station: Station }) {
  const hasAC = station.acSlots > 0;
  const hasDC = station.dcSlots > 0;

  if (hasAC && hasDC) {
    return (
      <div className="flex gap-1">
        <Badge
          variant="outline"
          className="bg-muted/10 text-muted-foreground border-muted/20"
        >
          AC
        </Badge>
        <Badge
          variant="outline"
          className="bg-accent/10 text-accent border-accent/20"
        >
          DC
        </Badge>
      </div>
    );
  }

  if (hasDC) {
    return (
      <Badge
        variant="outline"
        className="bg-accent/10 text-accent border-accent/20"
      >
        DC Fast
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-muted/10 text-muted-foreground border-muted/20"
    >
      AC Charging
    </Badge>
  );
}

export default function Stations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected station and action
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [statusAction, setStatusAction] = useState<"activate" | "deactivate">(
    "activate"
  );

  const { toast } = useToast();

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.addressLine1.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "AC" && station.acSlots > 0) ||
      (typeFilter === "DC" && station.dcSlots > 0);

    return matchesSearch && matchesStatus && matchesType;
  });

  const pagination = usePagination(filteredStations, {
    itemsPerPage,
    initialPage: 1,
  });

  // Reset to first page when filters change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [searchTerm, statusFilter, typeFilter]);

  const activeStations = stations.filter((s) => s.status === "ACTIVE").length;
  const deactivatedStations = stations.filter(
    (s) => s.status === "DEACTIVATED"
  ).length;
  const dcStations = stations.filter((s) => s.dcSlots > 0).length;
  const totalSlots = stations.reduce(
    (sum, station) => sum + station.acSlots + station.dcSlots,
    0
  );

  const getAvailability = (stationId: string) => {
    return (
      mockAvailability.find((a) => a.stationId === stationId) || {
        availableSlots: 0,
        totalSlots: 0,
      }
    );
  };

  // Handler functions
  const handleCreateStation = (station: Station) => {
    setStations([...stations, station]);
  };

  const handleUpdateStation = (updatedStation: Station) => {
    setStations(
      stations.map((s) => (s.id === updatedStation.id ? updatedStation : s))
    );
  };

  const handleStatusChange = (stationId: string) => {
    const station = stations.find((s) => s.id === stationId);
    if (station) {
      const newStatus: "ACTIVE" | "DEACTIVATED" =
        station.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
      const updatedStation = {
        ...station,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      setStations(
        stations.map((s) => (s.id === stationId ? updatedStation : s))
      );

      toast({
        title: `Station ${
          newStatus === "ACTIVE" ? "Activated" : "Deactivated"
        }`,
        description: `${station.name} has been ${newStatus.toLowerCase()}.`,
      });
    }
    setStatusDialogOpen(false);
    setSelectedStation(null);
  };

  const handleDeleteStation = (stationId: string) => {
    const station = stations.find((s) => s.id === stationId);
    setStations(stations.filter((s) => s.id !== stationId));

    toast({
      title: "Station Deleted",
      description: `${
        station?.name || "Station"
      } has been permanently removed.`,
    });
    setDeleteDialogOpen(false);
    setSelectedStation(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScheduleUpdate = (stationId: string, schedules: any[]) => {
    toast({
      title: "Schedule Updated",
      description: "Station schedule has been saved successfully.",
    });
  };

  const openStatusDialog = (
    station: Station,
    action: "activate" | "deactivate"
  ) => {
    setSelectedStation(station);
    setStatusAction(action);
    setStatusDialogOpen(true);
  };

  const openViewModal = (station: Station) => {
    setSelectedStation(station);
    setViewModalOpen(true);
  };

  const openEditModal = (station: Station) => {
    setSelectedStation(station);
    setEditModalOpen(true);
  };

  const openScheduleModal = (station: Station) => {
    setSelectedStation(station);
    setScheduleModalOpen(true);
  };

  const openDeleteDialog = (station: Station) => {
    setSelectedStation(station);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Stations & Schedules
          </h1>
          <p className="text-muted-foreground">
            Manage charging stations, availability schedules, and operational
            status
          </p>
        </div>
        <Button
          variant="accent"
          className="gap-2"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Station
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Stations
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Stations
            </CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {activeStations}
            </div>
            <p className="text-xs text-muted-foreground">
              {deactivatedStations} deactivated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DC Stations</CardTitle>
            <Zap className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{dcStations}</div>
            <p className="text-xs text-muted-foreground">
              {stations.length - dcStations} AC stations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSlots}</div>
            <p className="text-xs text-muted-foreground">Across all stations</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, code, city, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="AC">AC Charging</SelectItem>
                <SelectItem value="DC">DC Charging</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredStations.length} of {stations.length} charging
            stations
          </div>
        </CardContent>
      </Card>

      {/* Station Deactivation Rules */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium text-accent">
                Station Management Rules
              </div>
              <div className="text-sm text-muted-foreground">
                • Active stations cannot be deactivated if they have existing
                bookings • Schedule modifications affect future booking
                availability • Station operators can only manage assigned
                stations • Real-time availability is calculated from schedules
                and current bookings
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Station Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station Details</TableHead>
                  <TableHead>Type & Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Availability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.currentItems.map((station) => {
                  const availability = getAvailability(station.id);
                  const totalSlots = station.acSlots + station.dcSlots;
                  const utilizationPercent =
                    totalSlots > 0
                      ? Math.round(
                          ((totalSlots - availability.availableSlots) /
                            totalSlots) *
                            100
                        )
                      : 0;

                  return (
                    <TableRow key={station.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{station.name}</div>
                          {station.code && (
                            <div className="text-sm text-muted-foreground font-mono">
                              {station.code}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Added{" "}
                            {new Date(station.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <TypeBadge station={station} />
                          <div className="text-sm">
                            <div className="font-medium">
                              {totalSlots} slots
                            </div>
                            <div className="text-muted-foreground">
                              {station.acSlots > 0 && `${station.acSlots} AC`}
                              {station.acSlots > 0 &&
                                station.dcSlots > 0 &&
                                " + "}
                              {station.dcSlots > 0 && `${station.dcSlots} DC`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="text-sm">
                            <div>{station.addressLine1}</div>
                            <div className="text-muted-foreground">
                              {station.city}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {station.latitude.toFixed(4)},{" "}
                              {station.longitude.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {availability.availableSlots}/{totalSlots}
                            </div>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                availability.availableSlots > 0
                                  ? "bg-success"
                                  : "bg-warning"
                              }`}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {utilizationPercent}% utilized
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={station.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewModal(station)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openScheduleModal(station)}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Schedule
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(station)}
                          >
                            Edit
                          </Button>
                          {station.status === "ACTIVE" ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                openStatusDialog(station, "deactivate")
                              }
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-success hover:bg-success/90 text-success-foreground"
                              onClick={() =>
                                openStatusDialog(station, "activate")
                              }
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredStations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <div className="text-lg font-medium mb-2">No stations found</div>
              <div className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Add the first charging station to get started"}
              </div>
              <Button
                variant="default"
                onClick={() => setCreateModalOpen(true)}
              >
                Add Charging Station
              </Button>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {filteredStations.length > 0 && (
          <div className="px-6 pb-6">
            <DataPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              pageNumbers={pagination.pageNumbers}
              showEllipsisStart={pagination.showEllipsisStart}
              showEllipsisEnd={pagination.showEllipsisEnd}
              onPageChange={pagination.goToPage}
              onItemsPerPageChange={setItemsPerPage}
              onNextPage={pagination.goToNextPage}
              onPreviousPage={pagination.goToPreviousPage}
              onFirstPage={pagination.goToFirstPage}
              onLastPage={pagination.goToLastPage}
            />
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateStationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onStationCreated={handleCreateStation}
      />

      <ViewStationModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        station={selectedStation}
        onEdit={openEditModal}
        onSchedule={openScheduleModal}
      />

      <EditStationModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        station={selectedStation}
        onStationUpdated={handleUpdateStation}
      />

      <StationScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        station={selectedStation}
        onScheduleUpdated={handleScheduleUpdate}
      />

      <StationStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        station={selectedStation}
        action={statusAction}
        onConfirm={handleStatusChange}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Station"
        description={`Are you sure you want to permanently delete "${selectedStation?.name}"? This action cannot be undone and will cancel all active bookings.`}
        onConfirm={() =>
          selectedStation && handleDeleteStation(selectedStation.id)
        }
        confirmText="Delete Station"
      />
    </div>
  );
}
