"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Trash2,
  Shield,
  AlertTriangle,
  Loader2,
  Clock,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  role: "admin" | "viewer" | "wl_viewer";
  lastLogin: string;
  status: "active" | "inactive";
}

const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    role: "admin",
    lastLogin: "2024-01-15 14:32:00",
    status: "active",
  },
  {
    id: "2",
    username: "viewer",
    role: "viewer",
    lastLogin: "2024-01-15 10:15:00",
    status: "active",
  },
  {
    id: "3",
    username: "wlviewer",
    role: "wl_viewer",
    lastLogin: "2024-01-14 16:45:00",
    status: "active",
  },
  {
    id: "4",
    username: "analyst1",
    role: "viewer",
    lastLogin: "2024-01-13 09:30:00",
    status: "inactive",
  },
  {
    id: "5",
    username: "supervisor",
    role: "wl_viewer",
    lastLogin: "2024-01-15 08:00:00",
    status: "active",
  },
];

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return "bg-destructive/20 text-destructive";
    case "wl_viewer":
      return "bg-warning/20 text-warning-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "wl_viewer":
      return "WL+Viewer";
    default:
      return "Viewer";
  }
}

export default function UserAdminPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [retentionDays, setRetentionDays] = useState("30");
  const [showRetentionDialog, setShowRetentionDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "viewer" as User["role"],
  });

  const handleRetentionUpdate = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setShowRetentionDialog(false);
    setIsLoading(false);
    toast.success(`Retention period updated to ${retentionDays} days`);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUsers([
      ...users,
      {
        id: String(users.length + 1),
        username: newUser.username,
        role: newUser.role,
        lastLogin: "Never",
        status: "inactive",
      },
    ]);
    setShowAddUserDialog(false);
    setNewUser({ username: "", password: "", role: "viewer" });
    setIsLoading(false);
    toast.success(`User "${newUser.username}" created successfully`);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUsers(users.filter((u) => u.id !== selectedUser.id));
    setShowDeleteDialog(false);
    setSelectedUser(null);
    setIsLoading(false);
    toast.success(`User "${selectedUser.username}" deleted`);
  };

  const handleRoleChange = async (userId: string, newRole: User["role"]) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setIsLoading(false);
    toast.success("User role updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Administration</h2>
        <p className="text-muted-foreground">
          Manage users and system configuration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Retention Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Data Retention
            </CardTitle>
            <CardDescription>
              Configure how long data is kept in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Retention Period (days)</Label>
              <Select value={retentionDays} onValueChange={setRetentionDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">365 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showRetentionDialog} onOpenChange={setShowRetentionDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Update Retention
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Confirm Retention Change
                  </DialogTitle>
                  <DialogDescription>
                    Changing the retention period will affect data storage. Data
                    older than {retentionDays} days will be automatically deleted.
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Reducing retention period may result in immediate data loss.
                  </AlertDescription>
                </Alert>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowRetentionDialog(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRetentionUpdate} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Confirm Change"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold">
                  {users.filter((u) => u.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold">
                  {users.filter((u) => u.role === "admin").length}
                </p>
                <p className="text-sm text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">User Management</CardTitle>
              <CardDescription>
                View and manage system users
              </CardDescription>
            </div>
            <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account for the system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(v) =>
                        setNewUser({ ...newUser, role: v as User["role"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="wl_viewer">WL+Viewer</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddUserDialog(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadge(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === "active" ? "default" : "secondary"}
                        className={
                          user.status === "active"
                            ? "bg-success/20 text-success"
                            : ""
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, "viewer")}
                            disabled={user.role === "viewer"}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Set as Viewer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, "wl_viewer")}
                            disabled={user.role === "wl_viewer"}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Set as WL+Viewer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, "admin")}
                            disabled={user.role === "admin"}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Set as Admin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{selectedUser?.username}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
