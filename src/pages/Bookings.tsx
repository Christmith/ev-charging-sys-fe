import { useState, useEffect } from "react";
import { Plus, Search, Filter, Calendar, MapPin, User, Clock, Eye, Edit, X, Check, Trash2 } from "lucide-react";
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
import { Booking } from "@/types/entities";
import { CreateBookingModal } from "@/components/bookings/CreateBookingModal";
import { ViewBookingModal } from "@/components/bookings/ViewBookingModal";
import { EditBookingModal } from "@/components/bookings/EditBookingModal";
import { ConfirmationDialog } from "@/components/bookings/ConfirmationDialog";
import { usePagination } from "@/hooks/usePagination";
import { DataPagination } from "@/components/ui/data-pagination";

// Mock data
const mockBookings: Booking[] = [
  {
    id: "1",
    ownerNIC: "123456789V",
    ownerName: "John Doe",
    stationId: "station-1",
    stationName: "Central Station",
    status: "PENDING",
    startAt: "2024-12-15T09:00:00Z",
    endAt: "2024-12-15T11:00:00Z",
    createdByUserId: "user-1",
    createdAt: "2024-12-13T10:00:00Z",
    updatedAt: "2024-12-13T10:00:00Z",
  },
  {
    id: "2",
    ownerNIC: "987654321V", 
    ownerName: "Jane Smith",
    stationId: "station-2",
    stationName: "Mall Parking",
    status: "APPROVED",
    startAt: "2024-12-16T14:00:00Z",
    endAt: "2024-12-16T16:00:00Z",
    createdByUserId: "user-1",
    createdAt: "2024-12-13T11:30:00Z",
    updatedAt: "2024-12-13T12:00:00Z",
  },
  {
    id: "3",
    ownerNIC: "456789123V",
    ownerName: "Bob Wilson", 
    stationId: "station-1",
    stationName: "Central Station",
    status: "COMPLETED",
    startAt: "2024-12-12T08:00:00Z",
    endAt: "2024-12-12T10:00:00Z",
    createdByUserId: "user-2",
    createdAt: "2024-12-10T15:00:00Z",
    updatedAt: "2024-12-12T10:30:00Z",
  },
  {
    id: "4",
    ownerNIC: "789123456V",
    ownerName: "Alice Johnson",
    stationId: "station-3", 
    stationName: "Airport Terminal",
    status: "CANCELLED",
    startAt: "2024-12-14T13:00:00Z",
    endAt: "2024-12-14T15:00:00Z",
    createdByUserId: "user-1",
    createdAt: "2024-12-13T09:00:00Z",
    updatedAt: "2024-12-13T16:00:00Z",
    cancelReason: "Customer requested cancellation",
  }
];

function StatusBadge({ status }: { status: Booking['status'] }) {
  const variants = {
    PENDING: "bg-warning/10 text-warning border-warning/20",
    APPROVED: "bg-success/10 text-success border-success/20", 
    CANCELLED: "bg-muted text-muted-foreground border-muted/20",
    COMPLETED: "bg-accent/10 text-accent border-accent/20",
  };

  return (
    <Badge 
      variant="outline" 
      className={variants[status]}
    >
      {status.toLowerCase()}
    </Badge>
  );
}

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  const { toast } = useToast();

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.ownerNIC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.stationName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pagination = usePagination(filteredBookings, {
    itemsPerPage,
    initialPage: 1,
  });

  // Reset to first page when filters change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [searchTerm, statusFilter]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const canModifyBooking = (booking: Booking) => {
    const startTime = new Date(booking.startAt);
    const now = new Date();
    const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff >= 12;
  };

  const canDelete = (booking: Booking) => {
    return booking.status === 'COMPLETED' || booking.status === 'CANCELLED';
  };

  const handleCreateBooking = (newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    const booking: Booking = {
      ...newBooking,
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setBookings(prev => [booking, ...prev]);
    toast({
      title: "Booking Created",
      description: `Booking ${booking.id} has been created successfully.`,
    });
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
    toast({
      title: "Booking Updated",
      description: `Booking ${updatedBooking.id} has been updated successfully.`,
    });
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setViewModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditModalOpen(true);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setConfirmDialog({
      open: true,
      title: "Delete Booking",
      description: "Are you sure you want to delete this booking? This action cannot be undone.",
      action: () => {
        setBookings(prev => prev.filter(b => b.id !== booking.id));
        toast({
          title: "Booking Deleted",
          description: `Booking ${booking.id} has been deleted successfully.`,
        });
        setConfirmDialog(null);
      }
    });
  };

  const handleQuickAction = (booking: Booking, action: 'approve' | 'cancel') => {
    const actionDetails = {
      approve: {
        title: "Approve Booking",
        description: "Are you sure you want to approve this booking?",
        newStatus: "APPROVED" as const
      },
      cancel: {
        title: "Cancel Booking", 
        description: "Are you sure you want to cancel this booking? This action cannot be undone.",
        newStatus: "CANCELLED" as const
      }
    };

    const { title, description, newStatus } = actionDetails[action];

    setConfirmDialog({
      open: true,
      title,
      description,
      action: () => {
        const updatedBooking: Booking = {
          ...booking,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...(action === 'cancel' && { cancelReason: 'Cancelled by admin' })
        };
        handleUpdateBooking(updatedBooking);
        setConfirmDialog(null);
      }
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings Management</h1>
          <p className="text-muted-foreground">
            Manage EV charging reservations and track booking status
          </p>
        </div>
        <Button variant="accent" className="gap-2" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Booking
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {bookings.filter(b => b.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {bookings.filter(b => b.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <MapPin className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {bookings.filter(b => b.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by NIC, name, or station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </CardContent>
      </Card>

      {/* Business Rules Reminder */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium text-accent">Booking Rules</div>
              <div className="text-sm text-muted-foreground">
                • Bookings can only be created within 7 days from today
                • Modifications and cancellations require at least 12 hours notice before start time
                • Only pending bookings can be modified or cancelled
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>EV Owner</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.currentItems.map((booking) => {
                  const startDateTime = formatDateTime(booking.startAt);
                  const endDateTime = formatDateTime(booking.endAt);
                  const canModify = canModifyBooking(booking);

                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        {booking.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.ownerName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {booking.ownerNIC}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {booking.stationName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{startDateTime.date}</div>
                          <div className="text-sm text-muted-foreground">
                            {startDateTime.time} - {endDateTime.time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(booking.createdAt).date}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewBooking(booking)}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          
                          {/* Edit button for PENDING and APPROVED bookings */}
                          {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditBooking(booking)}
                              className="gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                          )}
                          
                          {/* Delete button for COMPLETED and CANCELLED bookings */}
                          {canDelete(booking) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteBooking(booking)}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
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
          
          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <div className="text-lg font-medium mb-2">No bookings found</div>
              <div className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Create the first booking to get started"
                }
              </div>
              <Button variant="accent" onClick={() => setCreateModalOpen(true)}>
                Create New Booking
              </Button>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {filteredBookings.length > 0 && (
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
      <CreateBookingModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateBooking={handleCreateBooking}
      />

      <ViewBookingModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        booking={selectedBooking}
      />

      <EditBookingModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        booking={selectedBooking}
        onUpdateBooking={handleUpdateBooking}
      />

      {confirmDialog && (
        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) => !open && setConfirmDialog(null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.action}
        />
      )}
    </div>
  );
}