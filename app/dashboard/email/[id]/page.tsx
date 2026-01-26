"use client";

import { useParams, useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  Download,
  FileText,
  Paperclip,
  CheckCircle,
  XCircle,
  Mail,
  Globe,
  Hash,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock email data
const mockEmail = {
  id: "1",
  from: "john.doe@example.com",
  to: ["jane.smith@company.org", "bob.wilson@company.org"],
  cc: ["team@company.org"],
  bcc: [],
  subject: "Q4 Financial Report - Final Review",
  body: `
    <div style="font-family: Arial, sans-serif;">
      <p>Dear Team,</p>
      
      <p>Please find attached the Q4 Financial Report for your review. This document contains:</p>
      
      <ul>
        <li>Revenue analysis for Q4 2024</li>
        <li>Expense breakdown by department</li>
        <li>Year-over-year comparison</li>
        <li>Projected forecasts for Q1 2025</li>
      </ul>
      
      <p>Key highlights:</p>
      <ul>
        <li>Total revenue increased by 15% compared to Q3</li>
        <li>Operating expenses reduced by 8%</li>
        <li>Net profit margin improved to 22%</li>
      </ul>
      
      <p>Please review and provide your feedback by end of day Friday.</p>
      
      <p>Best regards,<br/>
      John Doe<br/>
      Financial Analyst</p>
    </div>
  `,
  attachments: [
    { name: "Q4_Financial_Report.pdf", size: 2456789, hash: "a1b2c3d4e5f6..." },
    { name: "Revenue_Charts.xlsx", size: 156234, hash: "f6e5d4c3b2a1..." },
    { name: "Expense_Analysis.docx", size: 89012, hash: "1a2b3c4d5e6f..." },
  ],
  metadata: {
    protocol: "SMTP",
    messageId: "<abc123@mail.example.com>",
    sourceIp: "203.0.113.50",
    destinationIp: "192.168.1.100",
    contentType: "multipart/mixed",
    receivedAt: "2024-01-15 14:32:00",
    radiusCorrelated: true,
    cgnatCorrelated: false,
  },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EmailViewerPage() {
  const params = useParams();
  const router = useRouter();
  const emailId = params.id;

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
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Download EML
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Email Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{mockEmail.subject}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {mockEmail.from}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex">
                  <span className="w-16 font-medium text-muted-foreground">
                    To:
                  </span>
                  <span>{mockEmail.to.join(", ")}</span>
                </div>
                {mockEmail.cc.length > 0 && (
                  <div className="flex">
                    <span className="w-16 font-medium text-muted-foreground">
                      Cc:
                    </span>
                    <span>{mockEmail.cc.join(", ")}</span>
                  </div>
                )}
                {mockEmail.bcc.length > 0 && (
                  <div className="flex">
                    <span className="w-16 font-medium text-muted-foreground">
                      Bcc:
                    </span>
                    <span>{mockEmail.bcc.join(", ")}</span>
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
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: mockEmail.body }}
                />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({mockEmail.attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockEmail.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="text-xs text-muted-foreground font-mono">
                        {attachment.hash}
                      </code>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                    {mockEmail.metadata.protocol}
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
                      {mockEmail.metadata.messageId}
                    </code>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Source IP</span>
                  <code className="ml-auto text-sm font-mono">
                    {mockEmail.metadata.sourceIp}
                  </code>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Destination IP
                  </span>
                  <code className="ml-auto text-sm font-mono">
                    {mockEmail.metadata.destinationIp}
                  </code>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Content Type
                  </span>
                  <code className="ml-auto text-xs font-mono">
                    {mockEmail.metadata.contentType}
                  </code>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Received</span>
                  <span className="ml-auto text-sm">
                    {mockEmail.metadata.receivedAt}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Correlation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">RADIUS Correlation</span>
                {mockEmail.metadata.radiusCorrelated ? (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Matched
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Unmatched
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CGNAT Correlation</span>
                {mockEmail.metadata.cgnatCorrelated ? (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Matched
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Unmatched
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
