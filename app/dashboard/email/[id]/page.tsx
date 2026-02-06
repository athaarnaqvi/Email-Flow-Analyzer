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


import React, { useEffect, useState } from "react";

interface EmailDetail {
  timestamp: string;
  email: {
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
  };
  message: {
    message_id: string;
    subject: string;
    content_type: string;
    body_text: string;
    body_html: string | null;
  };
  network: {
    protocol: string;
    source?: {
      ip?: string;
      port?: string;
      is_private?: boolean;
    };
    destination?: {
      ip?: string;
      port?: string;
      is_private?: boolean;
    };
  };
  attachments: any[];
  correlation: any;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


export default function EmailViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmail() {
      setLoading(true);
      const res = await fetch(`/api/email-search?id=${params.id}`);
      const data = await res.json();
      const hit = data.hits?.hits?.[0]?._source;
      setEmail(hit || null);
      setLoading(false);
    }
    if (params.id) fetchEmail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CheckCircle className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!email) {
    return <div className="p-8">Email not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>{email.message.subject || "(No Subject)"}</CardTitle>
          <CardDescription>
            <span className="font-mono text-xs">Message-ID: {email.message.message_id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Meta-Data Section */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div><strong>Time-Stamp:</strong> {email.timestamp ? new Date(email.timestamp).toLocaleString() : "-"}</div>
              {email.correlation?.radius?.msisdn && (
                <div><strong>MSISDN:</strong> {email.correlation.radius.msisdn}</div>
              )}
              <div><strong>Protocol:</strong> {email.network.protocol || "-"}</div>
              <div><strong>Content-Type:</strong> {email.message.content_type || "-"}</div>
              <div><strong>Correlation:</strong> <span className="text-xs">{email.correlation && (JSON.stringify(email.correlation))}</span></div>
            </div>
            <div>
              <div><strong>Source IP:</strong> {email.network.source?.ip || "-"} <strong>Port:</strong> {email.network.source?.port || "-"}</div>
              <div><strong>Destination IP:</strong> {email.network.destination?.ip || "-"} <strong>Port:</strong> {email.network.destination?.port || "-"}</div>
              {email.network.source?.public_ip && (
                <div><strong>Public IP:</strong> {email.network.source.public_ip}</div>
              )}
            </div>
          </div>

          {/* Email Fields */}
          <div className="mb-4">
            <div><strong>From:</strong> {email.email.from}</div>
            <div><strong>To:</strong> {email.email.to.join(", ")}</div>
            {email.email.cc.length > 0 && <div><strong>Cc:</strong> {email.email.cc.join(", ")}</div>}
            {email.email.bcc.length > 0 && <div><strong>Bcc:</strong> {email.email.bcc.join(", ")}</div>}
          </div>
          <div className="mb-4">
            <strong>Body:</strong>
            <div className="border rounded p-2 bg-muted mt-2 whitespace-pre-wrap">
              {email.message.body_text || email.message.body_html || "(No content)"}
            </div>
          </div>
          {/* Attachments */}
          <div className="mb-4">
            <strong>Attachments:</strong>
            {email.attachments.length === 0 ? (
              <div className="text-muted-foreground">No attachments</div>
            ) : (
              <ul className="list-disc ml-6">
                {email.attachments.map((att, idx) => (
                  <li key={idx} className="mb-2">
                    <div><strong>File Name:</strong> {att.file_name}</div>
                    <div><strong>MIME Type:</strong> {att.mime_type}</div>
                    <div><strong>File Size:</strong> {att.file_size} bytes</div>
                    <div><strong>File Hash:</strong> {att.file_hash}</div>
                    <Button variant="outline" size="sm" className="mt-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download Attachment
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={async () => {
              if (!params.id) return;
              const res = await fetch(`/api/email-download?id=${params.id}`);
              if (!res.ok) return;
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `email_${params.id}.eml`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Download Email (EML)
            </Button>
        </CardContent>
      </Card>
      <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
}
