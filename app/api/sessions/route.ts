import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");

    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          turns: { orderBy: { createdAt: "asc" } },
          actions: { orderBy: { createdAt: "asc" } },
          glossary: { orderBy: { createdAt: "asc" } },
        },
      });
      return NextResponse.json({ session });
    }

    const sessions = await prisma.session.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        turns: { orderBy: { createdAt: "asc" } },
        actions: { orderBy: { createdAt: "asc" } },
        glossary: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[GET /api/sessions error]", error);
    return NextResponse.json(
      { error: "Database offline or unconfigured", fallback: true, sessions: [] },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      title = "Sprint Planning Call",
      turns = [],
      actions = [],
      notes = [],
      recaps = [],
      jargon = [],
    } = body;

    // Check if session exists to update, or create a fresh one
    const existingSession = sessionId
      ? await prisma.session.findUnique({ where: { id: sessionId } })
      : null;

    if (existingSession) {
      // Atomic update
      const session = await prisma.session.update({
        where: { id: sessionId },
        data: {
          title,
          summaryRecaps: recaps,
          simplifiedNotes: notes,
          turns: {
            deleteMany: {},
            create: turns.map((t: { speaker: string; role: string; text: string; timestamp: string }) => ({
              speaker: t.speaker,
              role: t.role,
              text: t.text,
              timestamp: t.timestamp,
            })),
          },
          actions: {
            deleteMany: {},
            create: actions.map((a: { task: string; assignee?: string; priority?: string; due?: string; done?: boolean; completed?: boolean }) => ({
              task: a.task,
              assignee: a.assignee || "Team",
              priority: a.priority || "Medium",
              due: a.due || "TBD",
              completed: a.done ?? a.completed ?? false,
            })),
          },
        },
        include: {
          turns: { orderBy: { createdAt: "asc" } },
          actions: { orderBy: { createdAt: "asc" } },
          glossary: { orderBy: { createdAt: "asc" } },
        },
      });

      return NextResponse.json({ success: true, session });
    }

    // Create fresh session
    const session = await prisma.session.create({
      data: {
        title,
        summaryRecaps: recaps,
        simplifiedNotes: notes,
        turns: {
          create: turns.map((t: { speaker: string; role: string; text: string; timestamp: string }) => ({
            speaker: t.speaker,
            role: t.role,
            text: t.text,
            timestamp: t.timestamp,
          })),
        },
        actions: {
          create: actions.map((a: { task: string; assignee?: string; priority?: string; due?: string; done?: boolean; completed?: boolean }) => ({
            task: a.task,
            assignee: a.assignee || "Team",
            priority: a.priority || "Medium",
            due: a.due || "TBD",
            completed: a.done ?? a.completed ?? false,
          })),
        },
        glossary: {
          create: jargon.map((j: { term: string; definition: string }) => ({
            term: j.term,
            definition: j.definition,
          })),
        },
      },
      include: {
        turns: { orderBy: { createdAt: "asc" } },
        actions: { orderBy: { createdAt: "asc" } },
        glossary: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("[POST /api/sessions error]", error);
    return NextResponse.json(
      { error: "Database offline or failed to persist session", fallback: true },
      { status: 500 }
    );
  }
}
