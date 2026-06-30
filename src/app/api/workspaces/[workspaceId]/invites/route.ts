import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { WorkspaceInviteEmail } from "@/components/email-template";
import { db } from "@/lib/db-config";
import { workspaceInvites, workspaceMembers, workspaces } from "@/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

/*
1. Auth check — get userId
2. Validate body — just { email: string }
3. Check requester is a member with role owner or editor
4. Check if that email is already a member — if yes, reject
5. Check if a pending invite for that email already exists — if yes, reject
6. Generate a token (crypto.randomUUID())
7. Set expiresAt = 7 days from now
8. Insert into workspace_invites table
9. Send email with link → /invite/[token]
10. Return success
*/

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
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

    const { workspaceId } = await params;
    const { email } = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "Workspace ID is required." },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required for invitation." },
        { status: 400 },
      );
    }

    // 3. Requester must be owner or editor
    const ownership = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
          inArray(workspaceMembers.role, ["owner", "editor"]),
        ),
      )
      .limit(1);

    if (ownership.length === 0) {
      return NextResponse.json(
        { success: false, message: "Forbidden." },
        { status: 403 },
      );
    }

    // 4. Optional dedup check — only if the invitee already has a Clerk account.
    // If they don't have an account yet, this is skipped — they'll go through
    // signup during accept, and the accept route re-checks membership anyway.
    const client = await clerkClient();
    const users = await client.users.getUserList({ emailAddress: [email] });
    const clerkUser = users.data[0];

    let invitedByName = "A team member";

    if (clerkUser) {
      invitedByName = clerkUser.fullName ?? invitedByName;

      const member = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, clerkUser.id),
        ),
      });

      if (member) {
        return NextResponse.json(
          {
            success: false,
            message: "This user is already a member of this workspace.",
          },
          { status: 409 },
        );
      }
    }

    // 5. Reject if a pending invite already exists for this email
    const alreadyInvited = await db.query.workspaceInvites.findFirst({
      where: and(
        eq(workspaceInvites.workspaceId, workspaceId),
        eq(workspaceInvites.email, email),
        eq(workspaceInvites.status, "pending"),
      ),
    });

    if (alreadyInvited) {
      return NextResponse.json(
        {
          success: false,
          message: "This email already has a pending invite to this workspace.",
        },
        { status: 409 },
      );
    }

    // 6 + 7. Generate token + expiry
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 8. Insert invite row
    const [invite] = await db
      .insert(workspaceInvites)
      .values({
        workspaceId,
        email,
        token,
        role: "viewer",
        invitedBy: userId,
        status: "pending",
        expiresAt,
      })
      .returning();

    const [workspace] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));

    // 9. Send invite email
    await resend.emails.send({
      from: "IntelliVault <invites@intellivault.com>",
      to: email,
      subject: `You're invited to join ${workspace.name} on IntelliVault`,
      react: WorkspaceInviteEmail({
        invitedByName,
        workspaceName: workspace.name,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
        expiresInDays: 7,
      }),
    });

    // 10. Return success
    return NextResponse.json(
      {
        success: true,
        message: "Invitation sent.",
        data: invite,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(`[POST /api/workspaces/[workspaceId]/invites]`, error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 },
    );
  }
}
