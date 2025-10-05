import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  AlertCircle,
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
import { EVOwner } from "@/types/entities";
import { CreateOwnerModal } from "@/components/owners/CreateOwnerModal";
import { EditOwnerModal } from "@/components/owners/EditOwnerModal";
import { ViewUserModal } from "@/components/bookings/ViewUserModal";
import { ConfirmationDialog } from "@/components/bookings/ConfirmationDialog";
import { ReactivationDialog } from "@/components/owners/ReactivationDialog";
import { usePagination } from "@/hooks/usePagination";
import { DataPagination } from "@/components/ui/data-pagination";

// Mock data - replace with API calls
const mockOwners: EVOwner[] = [
  {
    nic: "123456789V",
    firstName: "John",
    lastName: "Doe",
    phone: "+94771234567",
    email: "john.doe@email.com",
    addressLine1: "123 Main Street",
    city: "Colombo",
    vehicleModel: "Tesla Model 3",
    vehiclePlate: "ABC-1234",
    status: "ACTIVE",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    nic: "987654321V",
    firstName: "Jane",
    lastName: "Smith",
    phone: "+94772345678",
    email: "jane.smith@email.com",
    addressLine1: "456 Oak Avenue",
    addressLine2: "Apartment 3B",
    city: "Kandy",
    vehicleModel: "Nissan Leaf",
    vehiclePlate: "XYZ-5678",
    status: "ACTIVE",
    createdAt: "2024-02-20T14:30:00Z",
    updatedAt: "2024-11-01T09:15:00Z",
  },
  {
    nic: "456789123V",
    firstName: "Bob",
    lastName: "Wilson",
    phone: "+94773456789",
    email: "bob.wilson@email.com",
    addressLine1: "789 Pine Road",
    city: "Galle",
    vehicleModel: "BMW i3",
    status: "DEACTIVATED",
    createdAt: "2024-03-10T11:45:00Z",
    updatedAt: "2024-10-15T16:20:00Z",
  },
  {
    nic: "789123456V",
    firstName: "Alice",
    lastName: "Johnson",
    phone: "+94774567890",
    email: "alice.johnson@email.com",
    addressLine1: "321 Cedar Lane",
    city: "Colombo",
    vehicleModel: "Hyundai Kona Electric",
    vehiclePlate: "DEF-9012",
    status: "ACTIVE",
    createdAt: "2024-04-05T08:20:00Z",
    updatedAt: "2024-04-05T08:20:00Z",
  },
];

function StatusBadge({ status }: { status: EVOwner["status"] }) {
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

function formatNIC(nic: string) {
  // Format NIC for display (basic formatting)
  if (nic.length === 10) {
    return `${nic.slice(0, 9)}${nic.slice(9)}`;
  }
  return nic;
}

export default function Owners() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [owners, setOwners] = useState<EVOwner[]>(mockOwners);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<EVOwner | null>(null);
  
  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reactivateConfirmOpen, setReactivateConfirmOpen] = useState(false);
  const [ownerToAction, setOwnerToAction] = useState<EVOwner | null>(null);

  const filteredOwners = owners.filter((owner) => {
    const matchesSearch =
      owner.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.phone.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || owner.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pagination = usePagination(filteredOwners, {
    itemsPerPage,
    initialPage: 1,
  });

  // Reset to first page when filters change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [searchTerm, statusFilter]);

  const activeOwners = owners.filter((o) => o.status === "ACTIVE").length;
  const deactivatedOwners = owners.filter(
    (o) => o.status === "DEACTIVATED"
  ).length;

  // Handler functions
  const handleCreateOwner = (newOwner: EVOwner) => {
    setOwners(prev => [...prev, newOwner]);
  };

  const handleUpdateOwner = (updatedOwner: EVOwner) => {
    setOwners(prev => 
      prev.map(owner => 
        owner.nic === updatedOwner.nic ? updatedOwner : owner
      )
    );
  };

  const handleDeleteOwner = (nic: string) => {
    setOwnerToAction(owners.find(o => o.nic === nic) || null);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteOwner = () => {
    if (ownerToAction) {
      setOwners(prev => prev.filter(owner => owner.nic !== ownerToAction.nic));
      toast({
        title: "Success",
        description: "EV Owner deleted successfully",
      });
    }
    setDeleteConfirmOpen(false);
    setOwnerToAction(null);
    setEditModalOpen(false);
  };

  const handleStatusChange = (owner: EVOwner, newStatus: EVOwner["status"]) => {
    if (newStatus === "ACTIVE") {
      setOwnerToAction(owner);
      setReactivateConfirmOpen(true);
    } else {
      const updatedOwner = {
        ...owner,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      setOwners(prev => 
        prev.map(o => o.nic === owner.nic ? updatedOwner : o)
      );
      toast({
        title: "Success",
        description: `Owner ${newStatus.toLowerCase()} successfully`,
      });
    }
  };

  const confirmReactivateOwner = () => {
    if (ownerToAction) {
      const updatedOwner = {
        ...ownerToAction,
        status: "ACTIVE" as const,
        updatedAt: new Date().toISOString(),
      };
      setOwners(prev => 
        prev.map(o => o.nic === ownerToAction.nic ? updatedOwner : o)
      );
      toast({
        title: "Success",
        description: "Owner reactivated successfully",
      });
    }
    setReactivateConfirmOpen(false);
    setOwnerToAction(null);
  };

  const handleViewOwner = (owner: EVOwner) => {
    setSelectedOwner(owner);
    setViewModalOpen(true);
  };

  const handleEditOwner = (owner: EVOwner) => {
    setSelectedOwner(owner);
    setEditModalOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            EV Owners Management
          </h1>
          <p className="text-muted-foreground">
            Manage EV owner profiles and account status (NIC as primary key)
          </p>
        </div>
        <Button variant="accent" className="gap-2" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add EV Owner
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{owners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Accounts
            </CardTitle>
            <User className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {activeOwners}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deactivated</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {deactivatedOwners}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Vehicles</CardTitle>
            <Car className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {owners.filter((o) => o.vehicleModel).length}
            </div>
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
                  placeholder="Search by NIC, name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredOwners.length} of {owners.length} EV owners
          </div>
        </CardContent>
      </Card>

      {/* NIC Primary Key Notice */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium text-accent">NIC as Primary Key</div>
              <div className="text-sm text-muted-foreground">
                • National Identity Card (NIC) serves as the unique primary key
                for all EV owners • NIC cannot be modified after account
                creation • Deactivated accounts can only be reactivated by
                BackOffice users • All bookings are linked to the owner's NIC
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>EV Owner Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIC (Primary Key)</TableHead>
                  <TableHead>Owner Details</TableHead>
                  {/* <TableHead>Contact Info</TableHead> */}
                  <TableHead>Location</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.currentItems.map((owner) => (
                  <TableRow key={owner.nic}>
                    <TableCell className="font-mono font-medium">
                      {formatNIC(owner.nic)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {owner.firstName} {owner.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Joined{" "}
                          {new Date(owner.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {owner.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {owner.phone}
                        </div>
                      </div>
                    </TableCell> */}
                    <TableCell>
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground mt-1" />
                        <div className="text-sm">
                          <div>{owner.addressLine1}</div>
                          {owner.addressLine2 && (
                            <div className="text-muted-foreground">
                              {owner.addressLine2}
                            </div>
                          )}
                          <div className="text-muted-foreground">
                            {owner.city}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {owner.vehicleModel ? (
                        <div className="flex items-start gap-1">
                          <Car className="w-3 h-3 text-muted-foreground mt-1" />
                          <div className="text-sm">
                            <div>{owner.vehicleModel}</div>
                            {owner.vehiclePlate && (
                              <div className="text-muted-foreground font-mono">
                                {owner.vehiclePlate}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Not specified
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={owner.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOwner(owner)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditOwner(owner)}
                        >
                          Edit
                        </Button>
                        {owner.status === "ACTIVE" ? (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleStatusChange(owner, "DEACTIVATED")}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleStatusChange(owner, "ACTIVE")}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOwners.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <div className="text-lg font-medium mb-2">No EV owners found</div>
              <div className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Add the first EV owner to get started"}
              </div>
              <Button variant="accent" onClick={() => setCreateModalOpen(true)}>
                Add EV Owner
              </Button>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {filteredOwners.length > 0 && (
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
      <CreateOwnerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onOwnerCreated={handleCreateOwner}
      />

      <EditOwnerModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        owner={selectedOwner}
        onOwnerUpdated={handleUpdateOwner}
        onOwnerDeleted={handleDeleteOwner}
      />

      <ViewUserModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        user={selectedOwner}
      />

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete EV Owner"
        description="Are you sure you want to delete this EV owner? This action cannot be undone and will remove all associated data."
        onConfirm={confirmDeleteOwner}
        confirmText="Delete"
        destructive={true}
      />

      <ReactivationDialog
        open={reactivateConfirmOpen}
        onOpenChange={setReactivateConfirmOpen}
        onConfirm={confirmReactivateOwner}
      />
    </div>
  );
}
