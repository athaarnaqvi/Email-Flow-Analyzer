"use client";

import React from "react"

import { useState, useRef } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

export default function BulkOperationsPage() {
  const [whitelistText, setWhitelistText] = useState("");
  const [whitelistFile, setWhitelistFile] = useState<File | null>(null);
  const [cgnatFile, setCgnatFile] = useState<File | null>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"whitelist" | "cgnat" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const whitelistFileRef = useRef<HTMLInputElement>(null);
  const cgnatFileRef = useRef<HTMLInputElement>(null);

  const handleWhitelistFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWhitelistFile(file);
    }
  };

  const handleCgnatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".tar.gz") && !file.name.endsWith(".tgz")) {
        toast.error("Please upload a TAR.GZ file");
        return;
      }
      setCgnatFile(file);
    }
  };

  const initiateUpload = (type: "whitelist" | "cgnat") => {
    setPendingAction(type);
    setShowWarningDialog(true);
  };

  const confirmUpload = async () => {
    setShowWarningDialog(false);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    clearInterval(progressInterval);
    setUploadProgress(100);

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      if (pendingAction === "whitelist") {
        setWhitelistText("");
        setWhitelistFile(null);
      } else {
        setCgnatFile(null);
      }
      setPendingAction(null);
      toast.success(
        pendingAction === "whitelist"
          ? "Whitelist entries uploaded successfully"
          : "CGNAT mapping file uploaded successfully"
      );
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bulk Operations</h2>
        <p className="text-muted-foreground">
          Upload bulk whitelist entries or CGNAT mapping files
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Whitelist Bulk Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bulk Whitelist Upload
            </CardTitle>
            <CardDescription>
              Upload multiple whitelist entries at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Paste Entries (one per line)</Label>
              <Textarea
                placeholder="Enter MSISDN or email addresses, one per line...
+1234567890
user@example.com
+0987654321"
                className="min-h-[150px] font-mono text-sm"
                value={whitelistText}
                onChange={(e) => setWhitelistText(e.target.value)}
                disabled={isUploading}
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
              />
              <div
                className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => whitelistFileRef.current?.click()}
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
              onClick={() => initiateUpload("whitelist")}
              disabled={isUploading || (!whitelistText.trim() && !whitelistFile)}
            >
              {isUploading && pendingAction === "whitelist" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
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

        {/* CGNAT Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              CGNAT Mapping Upload
            </CardTitle>
            <CardDescription>
              Upload CGNAT mapping files in TAR.GZ format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Uploading a CGNAT mapping file will replace existing mappings.
                This operation cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Upload TAR.GZ File</Label>
              <input
                type="file"
                ref={cgnatFileRef}
                className="hidden"
                accept=".tar.gz,.tgz"
                onChange={handleCgnatFileChange}
              />
              <div
                className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => cgnatFileRef.current?.click()}
              >
                {cgnatFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm">{cgnatFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCgnatFile(null);
                      }}
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
                      TAR.GZ file only
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => initiateUpload("cgnat")}
              disabled={isUploading || !cgnatFile}
            >
              {isUploading && pendingAction === "cgnat" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CGNAT Mapping
                </>
              )}
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
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Upload
            </DialogTitle>
            <DialogDescription>
              {pendingAction === "whitelist" ? (
                "You are about to upload whitelist entries. This will add new entries to the system. Are you sure you want to proceed?"
              ) : (
                "You are about to upload a CGNAT mapping file. This will REPLACE all existing CGNAT mappings. This operation is IRREVERSIBLE. Are you sure you want to proceed?"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWarningDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={pendingAction === "cgnat" ? "destructive" : "default"}
              onClick={confirmUpload}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
