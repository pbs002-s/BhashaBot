import { NextRequest, NextResponse } from "next/server";
import {
  getAllServers,
  startServer,
  stopServer,
  restartServer,
  clearServerLogs,
  saveAppState,
  deleteAppState,
  type ServerId,
} from "@/lib/server-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const servers = getAllServers();
  return NextResponse.json({ ok: true, servers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, server, appStateText } = body as {
      action: "start" | "stop" | "restart" | "clear-logs" | "save-appstate" | "delete-appstate";
      server?: ServerId;
      appStateText?: string;
    };

    if (action === "save-appstate") {
      const res = saveAppState(appStateText || "");
      const servers = getAllServers();
      return NextResponse.json({ ...res, servers }, { status: res.ok ? 200 : 400 });
    }

    if (action === "delete-appstate") {
      const res = deleteAppState();
      const servers = getAllServers();
      return NextResponse.json({ ...res, servers });
    }

    if (!server || !["telegram", "whatsapp", "messenger"].includes(server)) {
      return NextResponse.json({ ok: false, error: "Invalid server id" }, { status: 400 });
    }

    let updated;
    switch (action) {
      case "start":
        updated = await startServer(server);
        break;
      case "stop":
        updated = await stopServer(server);
        break;
      case "restart":
        updated = await restartServer(server);
        break;
      case "clear-logs":
        updated = clearServerLogs(server);
        break;
      default:
        return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, server: updated });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
