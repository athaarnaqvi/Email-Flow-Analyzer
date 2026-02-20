import { NextRequest, NextResponse } from "next/server";
import { client, INDEX_NAME } from "@/lib/opensearch";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";
import { buildEml } from "@/lib/eml-builder";

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
