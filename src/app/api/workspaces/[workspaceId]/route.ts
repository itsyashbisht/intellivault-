import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateSlug, generateUniqueSlug } from "@/app/api/workspaces/route";
import { db } from "@/lib/db-config";
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

/*
1. Auth check — get userId
2. Get workspaceId from params
3. Validate body — { name: string }
4. Check requester is owner (not editor, not viewer — owner only)
5. If name changed, regenerate slug + check uniqueness (same logic as creation)
6. Update workspace row
7. Optionally log to activity_logs — "workspace.renamed" (will add later).
8. Return updated workspace
*/
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    // Auth check
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

    // Validations
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

    const { name } = await req.json();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json(
        {
          success: false,
          message: "No name found to update in request body.",
        },
        { status: 400 },
      );
    }

    // Check requester is owner
    const owner = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.role, "owner"),
      ),
    });

    if (!owner) {
      return NextResponse.json(
        {
          success: false,
          message: "Only owner can update the name.",
        },
        { status: 403 },
      );
    }

    const [workspace] = await db
      .select({
        name: workspaces.name,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (workspace.name === trimmedName) {
      return NextResponse.json(
        {
          success: false,
          message: "This name is already updated.",
        },
        { status: 400 },
      );
    }

    // If name is new -> generate unique slug
    let slug = generateSlug(trimmedName);
    while (true) {
      const existingSlug = await db.query.workspaces.findFirst({
        where: eq(workspaces.slug, slug),
      });

      if (!existingSlug) break;
      slug = generateUniqueSlug(slug);
    }

    // Update in workspace
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({
        name: trimmedName,
        slug: slug,
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return NextResponse.json(
      {
        success: true,
        workspace: updatedWorkspace,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("[PATCH /api/[workspaceId] ]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
