import { NextRequest, NextResponse } from "next/server";
import { initializeUsersIndex } from "@/lib/opensearch-index-init";

export async function GET(request: NextRequest) {
  try {
    // Initialize the users index
    await initializeUsersIndex();

    return NextResponse.json(
      {
        success: true,
        message: 'Users index initialized successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Index initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize users index" },
      { status: 500 }
    );
  }
}
