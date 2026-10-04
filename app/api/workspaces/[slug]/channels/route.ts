import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_WORKSPACES, ChannelItem } from "@/lib/workspace";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;

  try {
    const ws = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        channels: { orderBy: { createdAt: "asc" } },
      },
    });

    if (ws) {
      return NextResponse.json({ channels: ws.channels });
    }

    const fallbackWs = DEFAULT_WORKSPACES.find((w) => w.slug === slug);
    return NextResponse.json({
      channels: fallbackWs ? fallbackWs.channels : DEFAULT_WORKSPACES[0].channels,
    });
  } catch (error) {
    console.warn(`[GET /api/workspaces/${slug}/channels] DB fallback:`, error);
    const fallbackWs = DEFAULT_WORKSPACES.find((w) => w.slug === slug);
    return NextResponse.json({
      channels: fallbackWs ? fallbackWs.channels : DEFAULT_WORKSPACES[0].channels,
      fallback: true,
    });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;

  try {
    const body = await request.json();
    const { name: rawName, topic } = body;

    if (!rawName) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    const name = rawName
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      const ws = await prisma.workspace.findUnique({
        where: { slug },
      });

      if (!ws) {
        throw new Error(`Workspace ${slug} not found in DB`);
      }

      const channel = await prisma.channel.create({
        data: {
          workspaceId: ws.id,
          name,
          topic: topic || null,
        },
      });

      return NextResponse.json({ success: true, channel });
    } catch (dbErr) {
      console.warn(`[POST /api/workspaces/${slug}/channels] DB fallback:`, dbErr);
      const fallbackChannel: ChannelItem = {
        id: `chan_${Date.now()}_${name}`,
        workspaceId: slug,
        name,
        topic: topic || `Tactile channel for ${name}`,
      };
      return NextResponse.json({
        success: true,
        channel: fallbackChannel,
        fallback: true,
      });
    }
  } catch (error) {
    console.error(`[POST /api/workspaces/${slug}/channels error]`, error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}
