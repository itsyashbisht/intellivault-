import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db-config";
import { and, eq } from "drizzle-orm";
import { workspaceMembers, workspaces } from "@/schema";

/*
 * 1. get params and validate
 * 2. get userId for auth + validate
 * 3.  Query the database:
 *    - Find the workspace
 *    - Ensure the user is a member
 * 4. if no -> throw error , otherwise -> retrieve workspace and return response.
 * */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace id required.",
        },
        {
          status: 400,
        },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const workspace = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        createdAt: workspaces.createdAt,
      })
      .from(workspaces)
      .innerJoin(
        workspaceMembers,
        eq(workspaces.id, workspaceMembers.workspaceId),
      )
      .where(
        and(
          eq(workspaces.id, workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!workspace || workspace.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No workspace found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workspace fetched successfully",
        data: workspace[0],
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("[GET /api/[workspaceId] ]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
