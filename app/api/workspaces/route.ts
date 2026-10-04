import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_WORKSPACES, WorkspaceItem } from "@/lib/workspace";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const ws = await prisma.workspace.findUnique({
        where: { slug },
        include: {
          channels: { orderBy: { createdAt: "asc" } },
        },
      });
      if (ws) {
        return NextResponse.json({ workspace: ws });
      }
      const fallbackWs = DEFAULT_WORKSPACES.find((w) => w.slug === slug);
      return NextResponse.json({ workspace: fallbackWs || DEFAULT_WORKSPACES[0] });
    }

    const dbWorkspaces = await prisma.workspace.findMany({
      include: {
        channels: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (dbWorkspaces && dbWorkspaces.length > 0) {
      return NextResponse.json({ workspaces: dbWorkspaces });
    }

    return NextResponse.json({ workspaces: DEFAULT_WORKSPACES });
  } catch (error) {
    console.warn("[GET /api/workspaces] DB fallback active:", error);
    return NextResponse.json({
      workspaces: DEFAULT_WORKSPACES,
      fallback: true,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug: rawSlug } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    const slug = (
      rawSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    ).replace(/^-|-$/g, "");

    try {
      // Find an admin user or first user to be owner
      const firstUser = await prisma.user.findFirst();
      const ownerId = firstUser?.id || "fallback-admin-id";

      const created = await prisma.workspace.create({
        data: {
          name,
          slug,
          ownerId,
          channels: {
            create: [
              {
                name: "general",
                topic: `Main discussions for ${name}`,
              },
            ],
          },
        },
        include: {
          channels: true,
        },
      });

      return NextResponse.json({ success: true, workspace: created });
    } catch (dbErr) {
      console.warn("[POST /api/workspaces] DB offline, returning local workspace fallback:", dbErr);
      const fallbackNew: WorkspaceItem = {
        id: `ws_${Date.now()}`,
        name,
        slug,
        role: "ADMIN",
        channels: [
          {
            id: `chan_${Date.now()}_gen`,
            workspaceId: `ws_${Date.now()}`,
            name: "general",
            topic: `Main discussions for ${name}`,
          },
        ],
      };
      return NextResponse.json({ success: true, workspace: fallbackNew, fallback: true });
    }
  } catch (error) {
    console.error("[POST /api/workspaces error]", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
