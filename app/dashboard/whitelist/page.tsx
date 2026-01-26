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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Trash2, Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { toast } from "sonner";

type EntryType = "msisdn" | "email";

export default function WhitelistPage() {
  const [entryValue, setEntryValue] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("msisdn");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleAdd = async () => {
    if (!entryValue.trim()) {
      setNotification({ type: "error", message: "Please enter a value" });
      return;
    }

    setIsAdding(true);
    setNotification(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setNotification({
      type: "success",
      message: `Successfully added ${entryType === "msisdn" ? "MSISDN" : "Email"} to whitelist`,
    });
    toast.success(`Successfully added ${entryType === "msisdn" ? "MSISDN" : "Email"} to whitelist`);
    setEntryValue("");
    setIsAdding(false);
  };

  const handleDelete = async () => {
    if (!entryValue.trim()) {
      setNotification({ type: "error", message: "Please enter a value to delete" });
      return;
    }

    setIsDeleting(true);
    setNotification(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setNotification({
      type: "success",
      message: `Successfully removed ${entryType === "msisdn" ? "MSISDN" : "Email"} from whitelist`,
    });
    toast.success(`Successfully removed ${entryType === "msisdn" ? "MSISDN" : "Email"} from whitelist`);
    setEntryValue("");
    setIsDeleting(false);
  };

  const isLoading = isAdding || isDeleting;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Whitelist Management</h2>
        <p className="text-muted-foreground">
          Add or remove entries from the monitoring whitelist
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Whitelist Entry</CardTitle>
            </div>
            <CardDescription>
              Add or remove MSISDN or Email addresses from the whitelist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notification && (
              <Alert
                variant={notification.type === "error" ? "destructive" : "default"}
                className={
                  notification.type === "success"
                    ? "border-success bg-success/10"
                    : ""
                }
              >
                {notification.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {notification.type === "success" ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription>{notification.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="entryType">Entry Type</Label>
              <Select
                value={entryType}
                onValueChange={(value) => setEntryType(value as EntryType)}
                disabled={isLoading}
              >
                <SelectTrigger id="entryType">
                  <SelectValue placeholder="Select entry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="msisdn">MSISDN</SelectItem>
                  <SelectItem value="email">Email Address</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryValue">
                {entryType === "msisdn" ? "MSISDN" : "Email Address"}
              </Label>
              <Input
                id="entryValue"
                placeholder={
                  entryType === "msisdn"
                    ? "Enter MSISDN (e.g., +1234567890)"
                    : "Enter email address"
                }
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleAdd}
                disabled={isLoading}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Whitelist
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove from Whitelist
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Information</CardTitle>
            <CardDescription>
              Important notes about whitelist management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Privacy Notice</AlertTitle>
              <AlertDescription>
                For security reasons, existing whitelist entries are not displayed.
                All operations are logged for audit purposes.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>MSISDN Format:</strong> International format with country
                code (e.g., +1234567890)
              </p>
              <p>
                <strong>Email Format:</strong> Standard email format
                (user@domain.com)
              </p>
              <p>
                <strong>Note:</strong> Whitelist entries prevent monitoring of
                specified targets. Use with caution.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
