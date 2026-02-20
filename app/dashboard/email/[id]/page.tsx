"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  FileText,
  Paperclip,
  Mail,
  Globe,
  Hash,
  Clock,
  Shield,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

interface EmailData {
  id: string;
  from: string[];
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  messageId: string;
  contentType: string;
  bodyText: string | null;
  bodyHtml: string | null;
  protocol: string;
  sourceIp: string;
  sourcePort: number | null;
  destinationIp: string;
  destinationPort: number | null;
  timestamp: string;
  attachments: any[];
  smtp: any | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
}

export default function EmailViewerPage() {
  const params = useParams();
  const router = useRouter();
  const emailId = params.id as string;

  const [email, setEmail] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadEml = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/email/${encodeURIComponent(emailId)}/eml`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email-${emailId}.eml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — the user can retry
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!emailId) return;

    const fetchEmail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/email/${encodeURIComponent(emailId)}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(
            res.status === 404
              ? "Email not found"
              : errData.details || errData.error || "Failed to load email"
          );
        }
        const data: EmailData = await res.json();
        setEmail(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEmail();
  }, [emailId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Email Viewer</h2>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                {error === "Email not found"
                  ? "Email Not Found"
                  : "Error Loading Email"}
              </p>
              <p className="text-sm text-muted-foreground">
                {error || "The requested email could not be loaded."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const senderDisplay = email.from.length > 0 ? email.from[0] : "Unknown sender";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Email Viewer</h2>
          <p className="text-muted-foreground">
            Viewing email ID: {emailId}
          </p>
        </div>
        <Button onClick={handleDownloadEml} disabled={downloading}>
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download EML
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Email Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {email.subject || (
                  <span className="text-muted-foreground italic">
                    (No Subject)
                  </span>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {senderDisplay}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex">
                  <span className="w-16 font-medium text-muted-foreground">
                    To:
                  </span>
                  <span>
                    {email.to.length > 0
                      ? email.to.join(", ")
                      : "—"}
                  </span>
                </div>
                {email.cc.length > 0 && (
                  <div className="flex">
                    <span className="w-16 font-medium text-muted-foreground">
                      Cc:
                    </span>
                    <span>{email.cc.join(", ")}</span>
                  </div>
                )}
                {email.bcc.length > 0 && (
                  <div className="flex">
                    <span className="w-16 font-medium text-muted-foreground">
                      Bcc:
                    </span>
                    <span>{email.bcc.join(", ")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Body */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Body</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {email.bodyHtml ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                  />
                ) : email.bodyText ? (
                  <pre className="whitespace-pre-wrap text-sm font-mono break-all">
                    {email.bodyText}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No email body available</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({email.attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {email.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No attachments
                </p>
              ) : (
                <div className="space-y-3">
                  {email.attachments.map((attachment: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {attachment.filename || `Attachment ${index + 1}`}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {attachment.size != null && (
                              <span>{formatFileSize(attachment.size)}</span>
                            )}
                            {attachment.content_type && (
                              <span>{attachment.content_type}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {(attachment.md5 || attachment.sha256) && (
                        <div className="grid gap-1 pl-11 text-xs">
                          {attachment.md5 && (
                            <div className="flex gap-2">
                              <span className="font-medium text-muted-foreground w-12 shrink-0">MD5</span>
                              <code className="font-mono text-muted-foreground break-all">
                                {attachment.md5}
                              </code>
                            </div>
                          )}
                          {attachment.sha256 && (
                            <div className="flex gap-2">
                              <span className="font-medium text-muted-foreground w-12 shrink-0">SHA256</span>
                              <code className="font-mono text-muted-foreground break-all">
                                {attachment.sha256}
                              </code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metadata Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Protocol</span>
                  <Badge variant="secondary" className="ml-auto">
                    {email.protocol || "—"}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground block">
                      Message-ID
                    </span>
                    <code className="text-xs font-mono break-all">
                      {email.messageId || "—"}
                    </code>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Source IP</span>
                  <code className="ml-auto text-sm font-mono">
                    {email.sourceIp || "—"}
                  </code>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Destination IP
                  </span>
                  <code className="ml-auto text-sm font-mono">
                    {email.destinationIp || "—"}
                  </code>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Content Type
                  </span>
                  <code className="ml-auto text-xs font-mono">
                    {email.contentType || "—"}
                  </code>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Received</span>
                  <span className="ml-auto text-sm">
                    {email.timestamp ? formatTimestamp(email.timestamp) : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Correlation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Info className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  Coming Soon
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  RADIUS and CGNAT correlation will be available in a future
                  update.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
