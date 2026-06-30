import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db-config";
import { workspaceMembers, workspaces } from "@/schema";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, "Name is required")
    .max(50, "Name muse be under 50 characters")
    .trim(),
});

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .slice(0, 100);
}

export function generateUniqueSlug(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name } = parsed.data;

    let slug = generateSlug(name);

    const existingSlug = await db.query.workspaces.findFirst({
      where: (w, { eq }) => eq(w.slug, slug),
    });
    if (existingSlug) {
      slug = generateUniqueSlug(slug);
    }

    const workspace = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(workspaces)
        .values({ name, slug })
        .returning();

      await tx.insert(workspaceMembers).values({
        workspaceId: created.id,
        userId,
        role: "owner",
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Workspace created successfully.",
        data: workspace,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("[POST /api/workspaces]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
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

    const memberships = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, userId),
      with: {
        workspace: true,
      },
    });
    console.log(memberships);

    const userWorkspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "User workspaces found.",
        data: userWorkspaces,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("[GET /api/workspaces]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
