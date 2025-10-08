import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Search, Shield, User, MapPin, AlertCircle } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { WebUser } from "@/types/auth";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { ViewWebUserModal } from "@/components/users/ViewWebUserModal";
import { EditUserModal } from "@/components/users/EditUserModal";
import { UserStatusDialog } from "@/components/users/UserStatusDialog";
import { ConfirmationDialog } from "@/components/bookings/ConfirmationDialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { DataPagination } from "@/components/ui/data-pagination";

// Mock station data for assignments
const mockStations = [
  { id: "station-1", name: "City Mall Charging Hub", code: "CM001" },
  { id: "station-2", name: "Airport Terminal Station", code: "AT002" },
  { id: "station-3", name: "Downtown Business Center", code: "DBC003" },
  { id: "station-4", name: "Hospital Emergency Station", code: "HES004" },
  { id: "station-5", name: "University Campus Hub", code: "UCH005" },
];

// Mock data - replace with API calls
const mockUsers: WebUser[] = [
  {
    id: "1",
    email: "admin@evsystem.com",
    fullName: "Admin User",
    role: "BackOffice",
    phone: "+94771234567",
    status: "Active",
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "2",
    email: "operator@evsystem.com",
    fullName: "Station Operator",
    role: "StationOperator",
    phone: "+94772345678",
    assignedStationId: "station-1",
    status: "Active",
    createdAt: "2024-02-15T14:30:00Z",
    updatedAt: "2024-02-15T14:30:00Z",
  },
  {
    id: "3",
    email: "john.manager@evsystem.com",
    fullName: "John Manager",
    phone: "+94773456789",
    role: "BackOffice",
    status: "Active",
    createdAt: "2024-03-10T11:20:00Z",
    updatedAt: "2024-03-10T11:20:00Z",
  },
  {
    id: "4",
    fullName: "Jane Operator",
    email: "jane.operator@evsystem.com",
    phone: "+94774567890",
    role: "StationOperator",
    assignedStationId: "station-3",
    status: "Inactive",
    createdAt: "2024-04-05T09:15:00Z",
    updatedAt: "2024-11-25T10:30:00Z",
  },
];

function RoleBadge({ role }: { role: WebUser["role"] }) {
  return (
    <Badge
      variant="outline"
      className={
        role === "BackOffice"
          ? "bg-accent/10 text-accent border-accent/20"
          : "bg-muted/10 text-muted-foreground border-muted/20"
      }
    >
      {role === "BackOffice" ? "Back Office" : "Station Operator"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: WebUser["status"] }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "Active"
          ? "bg-success/10 text-success border-success/20"
          : "bg-muted text-muted-foreground border-muted/20"
      }
    >
      {status.toLowerCase()}
    </Badge>
  );
}

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [users, setUsers] = useState<WebUser[]>(mockUsers);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Selected user and actions
  const [selectedUser, setSelectedUser] = useState<WebUser | null>(null);
  const [statusAction, setStatusAction] = useState<"enable" | "disable">(
    "disable"
  );
  const [userToAction, setUserToAction] = useState<WebUser | null>(null);

  const filteredUsers = users.filter((webUser) => {
    const matchesSearch =
      webUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      webUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      webUser.phone?.includes(searchTerm);

    const matchesRole = roleFilter === "all" || webUser.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || webUser.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const pagination = usePagination(filteredUsers, {
    itemsPerPage,
    initialPage: 1,
  });

  // Reset to first page when filters change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [searchTerm, roleFilter, statusFilter]);

  // Only BackOffice users can access this page
  if (user?.role !== "BackOffice") {
    return <Navigate to="/dashboard" replace />;
  }

  const backOfficeUsers = users.filter((u) => u.role === "BackOffice").length;
  const operatorUsers = users.filter(
    (u) => u.role === "StationOperator"
  ).length;
  const activeUsers = users.filter((u) => u.status === "Active").length;

  // Handlers
  const handleCreateUser = (newUser: WebUser) => {
    setUsers((prev) => [...prev, newUser]);
    toast({
      title: "Success",
      description: "User created successfully",
    });
  };

  const handleUpdateUser = (updatedUser: WebUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    toast({
      title: "Success",
      description: "User updated successfully",
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUserToAction(users.find((u) => u.id === userId) || null);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToAction) {
      setUsers((prev) => prev.filter((u) => u.id !== userToAction.id));
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    }
    setDeleteConfirmOpen(false);
    setEditModalOpen(false);
    setUserToAction(null);
  };

  const handleStatusChange = (
    user: WebUser,
    newStatus: "Active" | "Inactive"
  ) => {
    const updatedUser = {
      ...user,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    toast({
      title: "Success",
      description: `User ${newStatus.toLowerCase()} successfully`,
    });
  };

  const handleStatusAction = (user: WebUser, action: "enable" | "disable") => {
    setUserToAction(user);
    setStatusAction(action);
    setStatusDialogOpen(true);
  };

  const confirmStatusAction = () => {
    if (userToAction) {
      const newStatus = statusAction === "enable" ? "Active" : "Inactive";
      handleStatusChange(userToAction, newStatus);
    }
    setStatusDialogOpen(false);
    setUserToAction(null);
  };

  const handleViewUser = (user: WebUser) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleEditUser = (user: WebUser) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Web Users & Roles
          </h1>
          <p className="text-muted-foreground">
            Manage system users and their role-based access (BackOffice only)
          </p>
        </div>
        <Button
          variant="accent"
          className="gap-2"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              BackOffice Users
            </CardTitle>
            <Shield className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {backOfficeUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Station Operators
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operatorUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeUsers}</div>
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
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="BackOffice">BackOffice</SelectItem>
                <SelectItem value="StationOperator">
                  Station Operator
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} system users
          </div>
        </CardContent>
      </Card>

      {/* Role-based Access Notice */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-accent mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium text-accent">
                Role-based Access Control
              </div>
              <div className="text-sm text-muted-foreground">
                • <strong>BackOffice:</strong> Full system administration
                access, user management, reports, settings •{" "}
                <strong>Station Operator:</strong> Limited to operational tasks
                - bookings, owners, assigned stations • Only BackOffice users
                can create, modify, or disable other system users • Station
                Operators can be assigned to specific charging stations
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System User Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Details</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Role & Access</TableHead>
                  <TableHead>Assigned Stations</TableHead>
                  <TableHead>Status & Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.currentItems.map((webUser) => (
                  <TableRow key={webUser.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{webUser.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {webUser.id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined{" "}
                          {new Date(webUser.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{webUser.email}</div>
                        {webUser.phone && (
                          <div className="text-sm text-muted-foreground">
                            {webUser.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={webUser.role} />
                    </TableCell>
                    <TableCell>
                      {webUser.assignedStationId ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {mockStations.find(
                              (s) => s.id === webUser.assignedStationId
                            )?.name || "Unknown Station"}
                          </div>
                          <div className="text-muted-foreground">
                            {mockStations.find(
                              (s) => s.id === webUser.assignedStationId
                            )?.code || ""}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {webUser.role === "BackOffice"
                            ? "All stations"
                            : "None assigned"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <StatusBadge status={webUser.status} />
                        <div className="text-xs text-muted-foreground">
                          Updated{" "}
                          {new Date(
                            webUser.updatedAt || webUser.createdAt || ""
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(webUser)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(webUser)}
                        >
                          Edit
                        </Button>
                        {webUser.status === "Active" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleStatusAction(webUser, "disable")
                            }
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() =>
                              handleStatusAction(webUser, "enable")
                            }
                          >
                            Enable
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <div className="text-lg font-medium mb-2">No users found</div>
              <div className="text-muted-foreground mb-4">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Add the first system user to get started"}
              </div>
              <Button variant="accent" onClick={() => setCreateModalOpen(true)}>
                Add User
              </Button>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
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
      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onUserCreated={handleCreateUser}
        availableStations={mockStations}
      />

      <ViewWebUserModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        user={selectedUser}
        availableStations={mockStations}
      />

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
        onUserUpdated={handleUpdateUser}
        onUserDeleted={handleDeleteUser}
        availableStations={mockStations}
      />

      {/* Confirmation Dialogs */}
      <UserStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        action={statusAction}
        userName={userToAction ? userToAction.fullName : ""}
        onConfirm={confirmStatusAction}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone and will remove all associated data."
        onConfirm={confirmDeleteUser}
        confirmText="Delete"
        destructive={true}
      />
    </div>
  );
}
