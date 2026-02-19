"use client";

import React from "react"

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Lock,
  Shield,
  Calendar,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "whitelist":
      return "Whitelist Manager";
    case "viewer":
      return "Viewer";
    default:
      return "Viewer";
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-destructive/20 text-destructive";
    case "whitelist":
      return "bg-warning/20 text-warning-foreground";
    case "viewer":
      return "bg-primary/20 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    console.log("Profile page mounted - User:", user);
  }, [user]);

  // Validate password in real-time
  useEffect(() => {
    const errors: string[] = [];

    if (newPassword && newPassword.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (newPassword && currentPassword === newPassword) {
      errors.push("New password must be different from current password");
    }

    setValidationErrors(errors);
  }, [newPassword, confirmPassword, currentPassword]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Password change clicked - user:", user);
    setPasswordSuccess(false);

    // Validate all fields
    const errors: string[] = [];

    if (!currentPassword) {
      errors.push("Current password is required");
    }

    if (!newPassword) {
      errors.push("New password is required");
    }

    if (!confirmPassword) {
      errors.push("Password confirmation is required");
    }

    if (newPassword && newPassword.length < 8) {
      errors.push("New password must be at least 8 characters");
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.push("New passwords do not match");
    }

    if (newPassword && currentPassword === newPassword) {
      errors.push("New password must be different from current password");
    }

    if (errors.length > 0) {
      console.warn("Validation errors:", errors);
      setValidationErrors(errors);
      toast.error(errors[0]);
      return;
    }

    if (!user?.email && !user?.id) {
      console.error("No user identifier found");
      setValidationErrors(["User identifier not found"]);
      toast.error("User not properly authenticated");
      return;
    }

    console.log("Starting password change for:", user.email || user.id);
    setIsChangingPassword(true);
    setValidationErrors([]);

    try {
      const payload = {
        email: user.email, // This will be the identifier (email or username from auth context)
        currentPassword,
        newPassword,
      };
      console.log("Sending payload:", { ...payload, currentPassword: "***", newPassword: "***" });

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        try {
          const error = await response.json();
          console.error("API error response:", error);
          const errorMsg = error.error || "Failed to change password";
          setValidationErrors([errorMsg]);
          toast.error(errorMsg);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          setValidationErrors(["Failed to change password"]);
          toast.error("Failed to change password");
        }
        return;
      }

      const result = await response.json();
      console.log("Password change successful:", result);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setValidationErrors([]);
      setPasswordSuccess(true);
      toast.success("Password changed successfully");

      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Password change exception:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setValidationErrors([errorMsg]);
      toast.error("Failed to change password: " + errorMsg);
    } finally {
      setIsChangingPassword(false);
    }
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
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="text-3xl font-bold text-primary">
                {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
              </span>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold">{user?.email}</h3>
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

            {validationErrors.length > 0 && (
              <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                <AlertTitle className="text-destructive">Validation Error</AlertTitle>
                <AlertDescription className="text-destructive/90 mt-2">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
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
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters required
                  </p>
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
                <Button 
                  type="submit" 
                  disabled={isChangingPassword || validationErrors.length > 0}
                >
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
    </div>
  );
}
