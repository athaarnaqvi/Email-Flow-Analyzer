import { NextRequest, NextResponse } from "next/server";
import { client, INDEX_NAME } from "@/lib/opensearch";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";
import { buildEml } from "@/lib/eml-builder";
import archiver from "archiver";
import { PassThrough } from "stream";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const ids: string[] = body.ids;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "No email IDs provided" },
                { status: 400 }
            );
        }

        if (ids.length > 100) {
            return NextResponse.json(
                { error: "Maximum 100 emails per download" },
                { status: 400 }
            );
        }

        const mgetResponse = await client.mget({
            index: INDEX_NAME,
            body: { ids },
        });

        const docs = mgetResponse.body.docs;
        const found = docs.filter((doc: any) => doc.found);

        if (found.length === 0) {
            return NextResponse.json(
                { error: "No emails found for the provided IDs" },
                { status: 404 }
            );
        }

        const passthrough = new PassThrough();
        const archive = archiver("tar", { gzip: true, gzipOptions: { level: 6 } });

        archive.on("error", (err: Error) => {
            passthrough.destroy(err);
        });

        archive.pipe(passthrough);

        for (const doc of found) {
            const eml = buildEml(doc._source, doc._id);
            archive.append(eml, { name: `email-${doc._id}.eml` });
        }

        archive.finalize();

        const user = await verifyJWTMiddleware(request);
        if (user) {
            const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
            logDashboardAction({
                user: user.username || user.email,
                role: user.role,
                action: "BULK_DOWNLOAD",
                target: `${found.length} emails [${ids.join(", ")}]`,
                ipAddress: ip,
            });
        }

        const readableStream = new ReadableStream({
            start(controller) {
                passthrough.on("data", (chunk: Buffer) => {
                    controller.enqueue(new Uint8Array(chunk));
                });
                passthrough.on("end", () => {
                    controller.close();
                });
                passthrough.on("error", (err: Error) => {
                    controller.error(err);
                });
            },
        });

        const filename = `emails-${new Date().toISOString().slice(0, 10)}.tar.gz`;

        return new NextResponse(readableStream, {
            status: 200,
            headers: {
                "Content-Type": "application/gzip",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        logAppEvent({
            level: "ERROR",
            message: `Failed to generate bulk download: ${error?.message || String(error)}`,
        });
        return NextResponse.json(
            {
                error: "Failed to generate bulk download",
                details: error?.message,
            },
            { status: 500 }
        );
    }
}
