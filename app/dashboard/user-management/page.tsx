"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Loader2,
  Clock,
  Settings,
  Plus,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type Role = "admin" | "viewer" | "whitelist";

interface UserRow {
  email: string;
  msisdn: string;
  role: Role;
  created_at?: string | null;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Create user dialog state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", msisdn: "", password: "" });

  // Delete flow
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<UserRow | null>(null);

  // Whitelist convert
  const [convertIdentifier, setConvertIdentifier] = useState("");
  const [wlEntryValue, setWlEntryValue] = useState("");
  const [wlEntryType, setWlEntryType] = useState<"msisdn" | "email">("msisdn");

  // Data retention
  const [retentionDays, setRetentionDays] = useState("30");
  const [customDays, setCustomDays] = useState("");
  const [isUpdatingRetention, setIsUpdatingRetention] = useState(false);

  useEffect(() => {
    if (role === "admin") {
      fetchUsers();
      fetchRetentionPolicy();
    }
  }, [role]);

  async function fetchRetentionPolicy() {
    try {
      const res = await fetch("/api/admin/retention-policy", { method: "GET", credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setRetentionDays(data.days?.toString() || "30");
      }
    } catch (err) {
      console.error("Failed to fetch retention policy:", err);
    }
  }

  async function handleUpdateRetention() {
    const days = retentionDays === "custom" ? parseInt(customDays) : parseInt(retentionDays);
    
    if (isNaN(days) || days < 1) {
      toast.error("Please enter a valid number of days");
      return;
    }

    setIsUpdatingRetention(true);
    try {
      const res = await fetch("/api/admin/retention-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ days }),
      });

      if (res.ok) {
        toast.success(`Data retention policy updated to ${days} days`);
        if (retentionDays !== "custom") {
          setCustomDays("");
        }
      } else {
        toast.error("Failed to update retention policy");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating retention policy");
    } finally {
      setIsUpdatingRetention(false);
    }
  }

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/get-users", { method: "GET", credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load users");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleCreateUser() {
    if (!newUser.username || !newUser.email || !newUser.msisdn || !newUser.password) {
      toast.error("Please fill all fields");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUser.username, email: newUser.email, msisdn: newUser.msisdn, password: newUser.password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("User created");
        setShowAddUserDialog(false);
        setNewUser({ username: "", email: "", msisdn: "", password: "" });
        await new Promise((r) => setTimeout(r, 300));
        await fetchUsers();
      } else {
        toast.error(data.error || "Create user failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Create user failed");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteUser() {
    if (!selectedToDelete) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedToDelete.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("User deleted");
        setShowDeleteDialog(false);
        setSelectedToDelete(null);
        await new Promise((r) => setTimeout(r, 300));
        await fetchUsers();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRoleUpdate(email: string, newRole: Role) {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/update-role", {
        method: "PUT",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Role updated");
        await new Promise((r) => setTimeout(r, 300));
        await fetchUsers();
      } else {
        toast.error(data.error || "Role update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Role update failed");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConvert() {
    if (!convertIdentifier.trim()) {
      toast.error("Please provide email or msisdn");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/whitelist/convert", {
        method: "PUT",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: convertIdentifier }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("User converted to whitelist");
        setConvertIdentifier("");
        if (role === "admin") await fetchUsers();
      } else {
        toast.error(data.error || "Convert failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Convert failed");
    } finally {
      setIsProcessing(false);
    }
  }

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "admin":
        return "bg-destructive/20 text-destructive";
      case "whitelist":
        return "bg-warning/20 text-warning-foreground";
      case "viewer":
      default:
        return "bg-primary/20 text-primary";
    }
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "admin":
        return "Administrator";
      case "whitelist":
        return "Whitelist Manager";
      case "viewer":
      default:
        return "Viewer";
    }
  };

  // If viewer, show nothing / unauthorized
  if (!role || (role !== "admin" && role !== "whitelist")) {
    return <div className="text-destructive">Unauthorized</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage users and whitelist</p>
      </div>

      {role === "admin" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Retention
              </CardTitle>
              <CardDescription>Configure how long data is kept</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Retention Period</Label>
                <Select value={retentionDays} onValueChange={setRetentionDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {retentionDays === "custom" && (
                <div className="space-y-2">
                  <Label>Number of Days</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Enter days (1-365)"
                  />
                </div>
              )}
              <Button onClick={handleUpdateRetention} disabled={isUpdatingRetention} className="w-full">
                {isUpdatingRetention ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Update Retention
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

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
                  <p className="text-3xl font-bold">{users.filter((u) => u.role === "whitelist").length}</p>
                  <p className="text-sm text-muted-foreground">Whitelist Users</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold">{users.filter((u) => u.role === "admin").length}</p>
                  <p className="text-sm text-muted-foreground">Administrators</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin-only user table and create user */}
      {role === "admin" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">User Management</CardTitle>
                <CardDescription>View and manage system users</CardDescription>
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
                    <DialogTitle>Create User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>MSISDN</Label>
                      <Input value={newUser.msisdn} onChange={(e) => setNewUser({ ...newUser, msisdn: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddUserDialog(false)} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleCreateUser} disabled={isProcessing}>{isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create User"}</Button>
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
                    <TableHead>Email</TableHead>
                    <TableHead>MSISDN</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.email}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell className="text-muted-foreground">{u.msisdn}</TableCell>
                        <TableCell><Badge className={getRoleBadge(u.role)}>{getRoleLabel(u.role)}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{u.created_at || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleRoleUpdate(u.email, "viewer")} disabled={isProcessing || u.role === "viewer"}>Set as Viewer</Button>
                            <Button size="sm" onClick={() => handleRoleUpdate(u.email, "admin")} disabled={isProcessing || u.role === "admin"}>Set as Admin</Button>
                            <Button variant="destructive" size="sm" onClick={() => { setSelectedToDelete(u); setShowDeleteDialog(true); }} disabled={isProcessing}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Whitelist section (visible to admin and whitelist) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Whitelist Entry</CardTitle>
            </div>
            <CardDescription>Add or remove MSISDN or Email addresses from the whitelist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <Select value={wlEntryType} onValueChange={(v) => setWlEntryType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="msisdn">MSISDN</SelectItem>
                  <SelectItem value="email">Email Address</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{wlEntryType === "msisdn" ? "MSISDN" : "Email Address"}</Label>
              <Input value={wlEntryValue} onChange={(e) => setWlEntryValue(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!wlEntryValue.trim()) {
                    toast.error("Please enter a value to add");
                    return;
                  }
                  setIsProcessing(true);
                  try {
                    const res = await fetch("/api/whitelist/convert", {
                      method: "PUT",
                      credentials: "same-origin",
                      cache: "no-store",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ identifier: wlEntryValue.trim() }),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      toast.success("Entry converted to whitelist");
                      setWlEntryValue("");
                      // if admin, refresh users
                      if (role === "admin") {
                        await new Promise((r) => setTimeout(r, 300));
                        await fetchUsers();
                      }
                    } else if (res.status === 404) {
                      toast.error("User doesn't exist");
                    } else {
                      toast.error(data.error || "Convert to whitelist failed");
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Convert to whitelist failed");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : <><Plus className="mr-2 h-4 w-4" /> Add to Whitelist</>}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => { toast.success("Removed from whitelist (simulated)"); setWlEntryValue(""); }}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove from Whitelist
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Removed explicit convert card. Add button below will convert existing users by identifier via the API. */}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete {selectedToDelete?.email}?</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isProcessing}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isProcessing}>{isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
