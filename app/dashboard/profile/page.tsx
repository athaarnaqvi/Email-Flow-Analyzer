"use client";

import React from "react"

import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Lock,
  Shield,
  Calendar,
  Activity,
  CheckCircle,
  Loader2,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  target: string;
}

const mockActivityLogs: ActivityLog[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:32:00",
    action: "LOGIN",
    target: "System",
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:30:00",
    action: "EMAIL_SEARCH",
    target: "domain:example.com",
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:25:00",
    action: "EMAIL_DOWNLOAD",
    target: "msg-123456",
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:20:00",
    action: "WHITELIST_ADD",
    target: "****@****.com",
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:15:00",
    action: "WHITELIST_DELETE",
    target: "+***********",
  },
  {
    id: "6",
    timestamp: "2024-01-14 16:45:00",
    action: "LOGOUT",
    target: "System",
  },
];

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "wl_viewer":
      return "WL+Viewer";
    default:
      return "Viewer";
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-destructive/20 text-destructive";
    case "wl_viewer":
      return "bg-warning/20 text-warning-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getActionBadgeColor(action: string) {
  if (action.includes("LOGIN") || action.includes("LOGOUT")) {
    return "bg-chart-1/20 text-chart-1";
  }
  if (action.includes("WHITELIST")) {
    return "bg-warning/20 text-warning-foreground";
  }
  if (action.includes("DELETE")) {
    return "bg-destructive/20 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsChangingPassword(false);
    setPasswordSuccess(true);
    toast.success("Password changed successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          View and manage your account settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profilePicture || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-transparent"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold">{user?.username}</h3>
              <Badge className={cn("mt-1", getRoleBadgeColor(user?.role || "viewer"))}>
                {getRoleLabel(user?.role || "viewer")}
              </Badge>
            </div>

            <Separator />

            <div className="w-full space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{user?.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="text-sm">{getRoleLabel(user?.role || "viewer")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p className="text-sm">
                    {user?.lastLogin
                      ? new Date(user.lastLogin).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            {passwordSuccess && (
              <Alert className="mb-4 border-success bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your password has been changed successfully.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isChangingPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isChangingPassword}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Your recent activity (whitelist data masked for privacy)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Timestamp</TableHead>
                  <TableHead className="w-[150px]">Action</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockActivityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.target}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
