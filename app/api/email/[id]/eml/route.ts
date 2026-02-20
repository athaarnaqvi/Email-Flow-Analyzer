import { NextRequest, NextResponse } from "next/server";
import { client, INDEX_NAME } from "@/lib/opensearch";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";

function escapeHeaderValue(value: string): string {
    return value.replace(/\r?\n/g, " ").trim();
}

function buildBodyParts(bodyText: string | null, bodyHtml: string | null, altBoundary: string): string[] {
    const lines: string[] = [];

    if (bodyHtml && bodyText) {
        lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
        lines.push("");
        lines.push(`--${altBoundary}`);
        lines.push("Content-Type: text/plain; charset=UTF-8");
        lines.push("Content-Transfer-Encoding: 8bit");
        lines.push("");
        lines.push(bodyText);
        lines.push("");
        lines.push(`--${altBoundary}`);
        lines.push("Content-Type: text/html; charset=UTF-8");
        lines.push("Content-Transfer-Encoding: 8bit");
        lines.push("");
        lines.push(bodyHtml);
        lines.push("");
        lines.push(`--${altBoundary}--`);
    } else if (bodyHtml) {
        lines.push("Content-Type: text/html; charset=UTF-8");
        lines.push("Content-Transfer-Encoding: 8bit");
        lines.push("");
        lines.push(bodyHtml);
    } else if (bodyText) {
        lines.push("Content-Type: text/plain; charset=UTF-8");
        lines.push("Content-Transfer-Encoding: 8bit");
        lines.push("");
        lines.push(bodyText);
    } else {
        lines.push("Content-Type: text/plain; charset=UTF-8");
        lines.push("");
        lines.push("");
    }

    return lines;
}

function buildAttachmentPart(att: any): string[] {
    const lines: string[] = [];
    const filename = att.filename || "unknown";
    const contentType = att.content_type || "application/octet-stream";
    const disposition = att.content_disposition || "attachment";

    lines.push(`Content-Type: ${contentType}; name="${filename}"`);
    lines.push(`Content-Disposition: ${disposition}; filename="${filename}"`);
    lines.push("Content-Transfer-Encoding: base64");
    if (att.md5) lines.push(`Content-MD5: ${att.md5}`);
    lines.push(`X-Attachment-Size: ${att.size ?? 0}`);
    if (att.sha256) lines.push(`X-Attachment-SHA256: ${att.sha256}`);
    lines.push("");
    lines.push("[Binary content not available - metadata only]");

    return lines;
}

function buildEml(source: any, id: string): string {
    const lines: string[] = [];

    const from = source.email?.from?.[0] || "unknown@unknown";
    const to = (source.email?.to || []).join(", ");
    const cc = (source.email?.cc || []).join(", ");
    const bcc = (source.email?.bcc || []).join(", ");
    const subject = source.message?.subject || "";
    const messageId = source.message?.message_id || `<${id}@email-flow-analyzer>`;
    const date = source.timestamp || new Date().toUTCString();
    const bodyHtml = source.message?.body_html || null;
    const bodyText = source.message?.body_text || null;
    const attachments: any[] = source.attachments || [];

    lines.push(`From: ${escapeHeaderValue(from)}`);
    if (to) lines.push(`To: ${escapeHeaderValue(to)}`);
    if (cc) lines.push(`Cc: ${escapeHeaderValue(cc)}`);
    if (bcc) lines.push(`Bcc: ${escapeHeaderValue(bcc)}`);
    lines.push(`Subject: ${escapeHeaderValue(subject)}`);
    lines.push(`Message-ID: ${escapeHeaderValue(messageId)}`);
    lines.push(`Date: ${escapeHeaderValue(date)}`);
    lines.push("MIME-Version: 1.0");

    if (attachments.length > 0) {
        const mixedBoundary = `----=_Mixed_${id}_${Date.now()}`;
        const altBoundary = `----=_Alt_${id}_${Date.now()}`;

        lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
        lines.push("");

        // Body part
        lines.push(`--${mixedBoundary}`);
        lines.push(...buildBodyParts(bodyText, bodyHtml, altBoundary));
        lines.push("");

        // Attachment parts
        for (const att of attachments) {
            lines.push(`--${mixedBoundary}`);
            lines.push(...buildAttachmentPart(att));
            lines.push("");
        }

        lines.push(`--${mixedBoundary}--`);
    } else {
        lines.push(...buildBodyParts(bodyText, bodyHtml, `----=_Alt_${id}_${Date.now()}`));
    }

    return lines.join("\r\n");
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const response = await client.get({
            index: INDEX_NAME,
            id,
        });

        const source = response.body._source;
        const eml = buildEml(source, id);
        const filename = `email-${id}.eml`;

        const user = await verifyJWTMiddleware(request);
        if (user) {
            const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
            logDashboardAction({ user: user.username || user.email, role: user.role, action: "DOWNLOAD", target: id, ipAddress: ip });
        }

        return new NextResponse(eml, {
            status: 200,
            headers: {
                "Content-Type": "message/rfc822",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        if (error?.meta?.statusCode === 404) {
            return NextResponse.json(
                { error: "Email not found" },
                { status: 404 }
            );
        }

        logAppEvent({ level: "ERROR", message: `Failed to generate EML: ${error?.meta?.body?.error?.reason || error?.message || String(error)}` });
        return NextResponse.json(
            {
                error: "Failed to generate EML",
                details: error?.meta?.body?.error?.reason || error.message,
            },
            { status: 500 }
        );
    }
}
