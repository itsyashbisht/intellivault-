/*
-> get allMembers
1. auth -check + validation
2. get workspace-id from params + validate
3. db query -> in workspace member -> select members from workspace members and
4. handler errors and use try catch
5. return response. 
* */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db-config";
import { workspaceMembers } from "@/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const workspaceRoleSchema = z.enum(["owner", "editor", "viewer"]);

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      workspaceId: string;
    }>;
  },
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

    const authorized = await db
      .select({
        id: workspaceMembers.id,
      })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .limit(1);
    if (authorized.length === 0) {
      return NextResponse.json(
        { success: false, message: "Workspace not found." },
        { status: 404 },
      );
    }

    const members = await db
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        workspaceId: workspaceMembers.workspaceId,
      })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId)));

    if (!members) {
      return NextResponse.json(
        {
          success: false,
          message: "Members not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: members,
        message: "Members fetched successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/workspaces/[workspaceId]/members ]", error);
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
 1. Get workspaceId from params.
 2. Authenticate the user.
 3. Parse request body (memberId, role).
 4. Validate input.
    - workspaceId
    - memberId
    - role
  5. Verify the requester is a member of the workspace.
  6. Verify the requester has permission.
    - role === "owner"
  7. Verify the target member exists in the workspace.
  8. (Optional business rules)
    - Prevent changing your own role.
    - Prevent removing the last owner.
    - Prevent assigning the same role.
  9. Update the member's role.
  10. Return the updated member.
*/
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const { userId } = await auth();
    const { role, memberId } = await req.json();

    // Validation.
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

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace ID is required.",
        },
        { status: 400 },
      );
    }

    if (!memberId) {
      return NextResponse.json(
        {
          success: false,
          message: "Member ID is required.",
        },
        { status: 400 },
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message: "Role is required.",
        },
        { status: 400 },
      );
    }
    const parsedRole = workspaceRoleSchema.safeParse(role);
    if (!parsedRole.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid workspace role.",
        },
        { status: 400 },
      );
    }

    const member = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, memberId),
        ),
      );
    if (member.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Member not found.",
        },
        { status: 404 },
      );
    }

    // Don't update the same role
    if (member[0].role === parsedRole.data) {
      return NextResponse.json(
        {
          success: false,
          message: "Member already has this role.",
        },
        {
          status: 400,
        },
      );
    }

    const owner = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.role, "owner"),
        ),
      )
      .limit(1);
    if (!owner || owner.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    // Owner cannot change its own role.
    if (memberId === userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot change your own role.",
        },
        {
          status: 400,
        },
      );
    }

    const [updatedMember] = await db
      .update(workspaceMembers)
      .set({
        role: parsedRole.data,
      })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, memberId),
        ),
      )
      .returning();

    if (!updatedMember) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update member.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Member role updated successfully.",
        data: updatedMember,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("[GET /api/[workspaceId]/members ]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
