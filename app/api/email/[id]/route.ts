import { NextRequest, NextResponse } from "next/server";
import { client, INDEX_NAME } from "@/lib/opensearch";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";

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

        const source: any = response.body._source ?? {};

        const user = await verifyJWTMiddleware(request);
        if (user) {
            const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
            logDashboardAction({ user: user.username || user.email, role: user.role, action: "VIEW", target: id, ipAddress: ip });
        }

        return NextResponse.json({
            id: response.body._id,
            from: source.email?.from || [],
            to: source.email?.to || [],
            cc: source.email?.cc || [],
            bcc: source.email?.bcc || [],
            subject: source.message?.subject || "",
            messageId: source.message?.message_id || "",
            contentType: source.message?.content_type || "",
            bodyText: source.message?.body_text || null,
            bodyHtml: source.message?.body_html || null,
            protocol: source.network?.protocol || "",
            sourceIp: source.network?.source?.ip || "",
            sourcePort: source.network?.source?.port || null,
            destinationIp: source.network?.destination?.ip || "",
            destinationPort: source.network?.destination?.port || null,
            timestamp: source.timestamp || "",
            attachments: source.attachments || [],
            smtp: source.smtp || null,
        });
    } catch (error: any) {
        if (error?.meta?.statusCode === 404) {
            return NextResponse.json(
                { error: "Email not found" },
                { status: 404 }
            );
        }

        logAppEvent({ level: "ERROR", message: `Failed to fetch email: ${error?.meta?.body?.error?.reason || error?.message || String(error)}` });
        return NextResponse.json(
            {
                error: "Failed to fetch email",
                details: error?.meta?.body?.error?.reason || error.message,
            },
            { status: 500 }
        );
    }
}
