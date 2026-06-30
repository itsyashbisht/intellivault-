import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db-config";
import { workspaceInvites, workspaceMembers } from "@/schema";

/*
1. Auth check — the person must be logged in to accept
2. Get token from params
3. Find the invite row where token matches
4. Check invite exists — if not, return 404
5. Check status is "pending" — if "accepted" or "expired", reject
6. Check expiresAt is in the future — if expired, update status to "expired" and reject
7. Transaction:
  a. Insert into workspace_members (workspaceId, userId, role: "viewer")
  b. Update invite status to "accepted"
8. Redirect to /w/[workspaceId]

 */

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { userId } = await auth();

    // Authentication
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation token is required.",
        },
        { status: 400 },
      );
    }

    const invite = await db.query.workspaceInvites.findFirst({
      columns: {
        token: true,
        email: true,
        status: true,
        expiresAt: true,
        workspaceId: true,
      },
      where: eq(workspaceInvites.token, token),
    });

    const user = await currentUser();

    if (user?.primaryEmailAddress?.emailAddress !== invite?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "This invitation belongs to another user.",
        },
        {
          status: 403,
        },
      );
    }
    if (!invite) {
      return NextResponse.json(
        {
          success: false,
          message: "No invitation found.",
        },
        { status: 404 },
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation status is either accepted or rejected.",
        },
        { status: 409 },
      );
    }

    if (invite.expiresAt < new Date()) {
      // update to expired
      // return 410
      await db
        .update(workspaceInvites)
        .set({
          status: "expired",
        })
        .where(eq(workspaceInvites.token, token));

      return NextResponse.json(
        {
          success: false,
          message: "Invitation expired.",
        },
        { status: 410 },
      );
    }

    // Check whether the user already exists.
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, invite.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    });

    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          message: "Already a workspace member.",
        },
        {
          status: 409,
        },
      );
    }

    // Inserting targetUser in workspaceMember + Updating Invite status -> accepted.
    await db.transaction(async (tx) => {
      await tx.insert(workspaceMembers).values({
        workspaceId: invite.workspaceId,
        role: "viewer",
        userId,
      });

      await tx
        .update(workspaceInvites)
        .set({
          status: "accepted",
        })
        .where(eq(workspaceInvites.token, token));
    });

    // Redirect to workspace
    return NextResponse.redirect(
      new URL(`/workspace/${invite.workspaceId}`, req.url),
    );
  } catch (error) {
    console.error(`[POST /api/invites/[token] ]`, error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 },
    );
  }
}
