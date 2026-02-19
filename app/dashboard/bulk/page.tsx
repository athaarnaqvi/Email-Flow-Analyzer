"use client";

import React from "react";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function BulkOperationsPage() {
  const { user } = useAuth();
  const [whitelistText, setWhitelistText] = useState("");
  const [whitelistFile, setWhitelistFile] = useState<File | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [missingEntries, setMissingEntries] = useState<string[]>([]);
  const [successEntries, setSuccessEntries] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const whitelistFileRef = useRef<HTMLInputElement>(null);

  const canAccessWhitelist = user && (user.role === "admin" || user.role === "whitelist");

  useEffect(() => {
    if (!canAccessWhitelist && user) {
      toast.error("You don't have permission to access bulk whitelist upload");
    }
  }, [canAccessWhitelist, user]);

  const handleWhitelistFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWhitelistFile(file);
    }
  };

  const getEntriesFromInput = (): string[] => {
    const text = whitelistText.trim();
    if (text) {
      return text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    }
    if (whitelistFile) {
      // For file upload, we would need to read it
      return [];
    }
    return [];
  };

  const initiateUpload = () => {
    const entries = getEntriesFromInput();
    if (entries.length === 0) {
      toast.error("Please enter at least one entry");
      return;
    }
    setShowWarningDialog(true);
  };

  const confirmUpload = async () => {
    setShowWarningDialog(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const entries = getEntriesFromInput();
      
      // Call backend to validate and update
      const response = await fetch("/api/admin/bulk-whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        throw new Error("Failed to process whitelist entries");
      }

      const result = await response.json();
      setUploadProgress(100);

      // Filter success entries to only show what user actually typed
      const userEnteredSet = new Set(entries.map(e => e.trim().toLowerCase()));
      let successDisplayEntries: string[] = [];
      
      for (const entry of entries) {
        const normalizedEntry = entry.trim();
        // Check if this entry was successfully updated
        const found = result.updated.some((updated: string) => 
          updated.toLowerCase() === normalizedEntry.toLowerCase()
        );
        if (found) {
          successDisplayEntries.push(normalizedEntry);
        }
      }

      // Show success dialog if there are successful entries
      if (successDisplayEntries.length > 0) {
        setSuccessEntries(successDisplayEntries);
        setShowSuccessDialog(true);
        toast.success(`✓ ${successDisplayEntries.length} entries successfully updated to whitelist`);
      }

      // If there are missing entries, show dialog
      if (result.missing && result.missing.length > 0) {
        setMissingEntries(result.missing);
        setShowMissingDialog(true);
        toast.warning(`⚠ ${result.missing.length} entries not found in the system`);
      }

      // Clear inputs after successful upload
      if (successDisplayEntries.length > 0 || (result.missing.length === 0)) {
        setWhitelistText("");
        setWhitelistFile(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload whitelist entries");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bulk Operations</h2>
        <p className="text-muted-foreground">
          Upload bulk whitelist entries
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Whitelist Bulk Upload */}
        <Card className={!canAccessWhitelist ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bulk Whitelist Upload
            </CardTitle>
            <CardDescription>
              {canAccessWhitelist 
                ? "Add multiple MSISDNs or emails to whitelist" 
                : "Admin and Whitelist users only"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canAccessWhitelist && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <Lock className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                  Only Admin and Whitelist users can perform bulk whitelist operations.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label>Paste Entries (one per line)</Label>
              <Textarea
                placeholder="Enter MSISDN or email addresses, one per line or tab-separated:

Option 1 - Each on separate line:
ambreen@gmail.com
+921231231231
fiza@gmail.com
+921231231232

Option 2 - Email and phone on same line (tab or space separated):
ambreen@gmail.com	+921231231231
fiza@gmail.com	+921231231232"
                className="min-h-[150px] font-mono text-sm"
                value={whitelistText}
                onChange={(e) => setWhitelistText(e.target.value)}
                disabled={isUploading || !canAccessWhitelist}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload Text File</Label>
              <input
                type="file"
                ref={whitelistFileRef}
                className="hidden"
                accept=".txt,.csv"
                onChange={handleWhitelistFileChange}
                disabled={!canAccessWhitelist}
              />
              <div
                className={`flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors ${
                  canAccessWhitelist ? "cursor-pointer hover:border-primary/50" : "cursor-not-allowed opacity-50"
                }`}
                onClick={() => canAccessWhitelist && whitelistFileRef.current?.click()}
              >
                {whitelistFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm">{whitelistFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWhitelistFile(null);
                      }}
                      disabled={!canAccessWhitelist}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      TXT or CSV file
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={initiateUpload}
              disabled={isUploading || (!whitelistText.trim() && !whitelistFile) || !canAccessWhitelist}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Whitelist Entries
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* CGNAT Upload - Disabled */}
        <Card className="opacity-60 pointer-events-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              CGNAT Mapping Upload
            </CardTitle>
            <CardDescription>
              Coming soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-muted bg-muted/50">
              <Lock className="h-4 w-4" />
              <AlertTitle>Currently Unavailable</AlertTitle>
              <AlertDescription>
                CGNAT mapping upload is not available at this time.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 opacity-50">
              <Label>Upload TAR.GZ File</Label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6 bg-muted/20">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload disabled
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              disabled
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CGNAT Mapping
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing entries...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Entries Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Successfully Updated
            </DialogTitle>
            <DialogDescription>
              The following entries have been successfully updated to whitelist users:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 max-h-[300px] overflow-y-auto border border-green-200 dark:border-green-900">
              <ul className="space-y-1">
                {successEntries.map((entry, index) => (
                  <li key={index} className="text-sm font-mono flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {entry}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              These users now have "whitelist" role and can perform whitelist operations.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missing Entries Dialog */}
      <Dialog open={showMissingDialog} onOpenChange={setShowMissingDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Entries Not Found
            </DialogTitle>
            <DialogDescription>
              The following entries were not found in the system and were NOT updated:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 p-4 max-h-[300px] overflow-y-auto border border-yellow-200 dark:border-yellow-900">
              <ul className="space-y-1">
                {missingEntries.map((entry, index) => (
                  <li key={index} className="text-sm font-mono">
                    • {entry}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Please verify these entries and ensure they exist in the user database before retrying.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMissingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Upload
            </DialogTitle>
            <DialogDescription>
              You are about to update the role of the following {getEntriesFromInput().length} entries to whitelist users. Any missing entries will be skipped. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUpload}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
