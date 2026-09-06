import { spawn, exec, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

export type ServerId = "telegram" | "whatsapp" | "messenger";

export interface ServerState {
  id: ServerId;
  name: string;
  description: string;
  status: "stopped" | "starting" | "running" | "error";
  pid?: number;
  startedAt?: number;
  logs: string[];
  qrCode?: string | null;
  connectedAccount?: string | null;
  error?: string | null;
  hasSession?: boolean;
}

interface InternalServerState extends ServerState {
  process?: ChildProcess | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __BHASHABOT_SERVERS__: Record<ServerId, InternalServerState> | undefined;
}

function getStore(): Record<ServerId, InternalServerState> {
  if (!globalThis.__BHASHABOT_SERVERS__) {
    globalThis.__BHASHABOT_SERVERS__ = {
      telegram: {
        id: "telegram",
        name: "Telegram UserBot",
        description: "Listens for private messages on personal Telegram account & replies in real time.",
        status: "stopped",
        logs: [],
        qrCode: null,
        connectedAccount: null,
        error: null,
      },
      whatsapp: {
        id: "whatsapp",
        name: "WhatsApp UserBot",
        description: "Connects to personal WhatsApp via QR code to automatically handle 1-on-1 chats.",
        status: "stopped",
        logs: [],
        qrCode: null,
        connectedAccount: null,
        error: null,
      },
      messenger: {
        id: "messenger",
        name: "Messenger UserBot",
        description: "Connects to personal Facebook Messenger account via appstate.json session.",
        status: "stopped",
        logs: [],
        qrCode: null,
        connectedAccount: null,
        error: null,
      },
    };
  }
  return globalThis.__BHASHABOT_SERVERS__;
}

function appendLog(server: InternalServerState, raw: string) {
  const lines = raw.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  for (const line of lines) {
    // Parse Telegram status
    if (line.includes("[TG_CONNECTED]:")) {
      const user = line.split("[TG_CONNECTED]:")[1]?.trim();
      server.connectedAccount = user || "Connected";
      server.status = "running";
    } else if (line.includes("Listening for messages as")) {
      const match = line.match(/Listening for messages as ([^.]+)/);
      if (match && match[1]) {
        server.connectedAccount = match[1].trim();
        server.status = "running";
      }
    }

    // Parse WhatsApp status
    if (line.includes("[WA_QR_DATA]:")) {
      const qr = line.split("[WA_QR_DATA]:")[1]?.trim();
      server.qrCode = qr;
      server.status = "running";
    } else if (line.includes("[WA_CONNECTED]:")) {
      const phone = line.split("[WA_CONNECTED]:")[1]?.trim();
      server.connectedAccount = phone ? `+${phone}` : "Connected";
      server.qrCode = null;
      server.status = "running";
    }

    // Parse Facebook status
    if (line.includes("[FB_CONNECTED]:")) {
      const user = line.split("[FB_CONNECTED]:")[1]?.trim();
      server.connectedAccount = user || "Connected";
      server.status = "running";
      server.error = null;
    } else if (line.includes("[FB_NO_APPSTATE]")) {
      server.status = "error";
      server.error = "Missing appstate.json";
    }

    server.logs.push(`[${new Date().toLocaleTimeString()}] ${line}`);
    if (server.logs.length > 250) {
      server.logs.shift();
    }
  }
}

export function getAllServers(): ServerState[] {
  const store = getStore();
  return Object.values(store).map((s) => {
    let hasSession = false;
    if (s.id === "telegram") {
      hasSession = fs.existsSync(path.join(process.cwd(), ".userbot-session"));
    } else if (s.id === "whatsapp") {
      hasSession = fs.existsSync(path.join(process.cwd(), ".whatsapp-session"));
    } else if (s.id === "messenger") {
      hasSession =
        fs.existsSync(path.join(process.cwd(), "appstate.json")) ||
        fs.existsSync(path.join(process.cwd(), ".fb-appstate.json"));
    }
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      status: s.status,
      pid: s.pid,
      startedAt: s.startedAt,
      logs: s.logs,
      qrCode: s.qrCode,
      connectedAccount: s.connectedAccount,
      error: s.error,
      hasSession,
    };
  });
}

export function saveAppState(cookiesJson: string): { ok: boolean; message: string; count?: number } {
  try {
    let parsed = JSON.parse(cookiesJson.trim());
    if (!Array.isArray(parsed) && parsed && typeof parsed === "object" && Array.isArray((parsed as any).cookies)) {
      parsed = (parsed as any).cookies;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { ok: false, message: "Invalid format: cookies must be a non-empty JSON array." };
    }
    fs.writeFileSync(path.join(process.cwd(), "appstate.json"), JSON.stringify(parsed, null, 2), "utf8");

    const store = getStore();
    if (store.messenger && store.messenger.error === "Missing appstate.json") {
      store.messenger.error = null;
    }
    return { ok: true, message: `Successfully saved ${parsed.length} cookies to appstate.json`, count: parsed.length };
  } catch (err: any) {
    return { ok: false, message: `Invalid JSON: ${err.message}` };
  }
}

export function deleteAppState(): { ok: boolean; message: string } {
  const p1 = path.join(process.cwd(), "appstate.json");
  const p2 = path.join(process.cwd(), ".fb-appstate.json");
  let deleted = false;
  if (fs.existsSync(p1)) {
    fs.unlinkSync(p1);
    deleted = true;
  }
  if (fs.existsSync(p2)) {
    fs.unlinkSync(p2);
    deleted = true;
  }
  return { ok: true, message: deleted ? "Removed appstate.json" : "No cookies file found" };
}

function killExistingScriptProcess(scriptName: string): Promise<void> {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      exec(
        `powershell -Command "Get-CimInstance Win32_Process -Filter \\"Name = 'node.exe'\\" | Where-Object { $_.CommandLine -like '*${scriptName}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
        () => resolve()
      );
    } else {
      exec(`pkill -f "${scriptName}"`, () => resolve());
    }
  });
}

export async function startServer(id: ServerId): Promise<ServerState> {
  const store = getStore();
  const server = store[id];
  if (!server) throw new Error(`Unknown server: ${id}`);

  const scriptName =
    id === "telegram"
      ? "telegram-userbot.js"
      : id === "whatsapp"
      ? "whatsapp-userbot.js"
      : "messenger-userbot.js";
  const scriptPath = path.join(process.cwd(), "scripts", scriptName);

  // Terminate any dangling processes running this script to prevent duplicate connection collisions (code 440)
  await killExistingScriptProcess(scriptName);

  server.status = "starting";
  server.error = null;
  server.qrCode = null;
  server.startedAt = Date.now();
  server.logs.push(`--- Starting ${server.name} (${new Date().toLocaleTimeString()}) ---`);

  try {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    server.process = child;
    server.pid = child.pid;
    server.status = "running";

    child.stdout?.on("data", (data) => {
      appendLog(server, data.toString());
    });

    child.stderr?.on("data", (data) => {
      appendLog(server, data.toString());
    });

    child.on("error", (err) => {
      server.status = "error";
      server.error = err.message;
      appendLog(server, `[ERROR]: ${err.message}`);
    });

    child.on("close", (code) => {
      server.status = "stopped";
      server.pid = undefined;
      server.process = null;
      appendLog(server, `--- Process exited with code ${code ?? 0} ---`);
    });
  } catch (err: any) {
    server.status = "error";
    server.error = err?.message || String(err);
    appendLog(server, `[FAILED TO START]: ${server.error}`);
  }

  return getAllServers().find((s) => s.id === id)!;
}

export async function stopServer(id: ServerId): Promise<ServerState> {
  const store = getStore();
  const server = store[id];
  if (!server) throw new Error(`Unknown server: ${id}`);

  const pid = server.pid;
  if (pid) {
    server.logs.push(`--- Stopping ${server.name} (PID ${pid})... ---`);
    try {
      if (process.platform === "win32") {
        exec(`taskkill /pid ${pid} /T /F`);
      } else {
        process.kill(pid, "SIGTERM");
      }
    } catch {
      try {
        server.process?.kill("SIGKILL");
      } catch {}
    }
  }

  server.status = "stopped";
  server.process = null;
  server.pid = undefined;
  server.qrCode = null;

  return getAllServers().find((s) => s.id === id)!;
}

export async function restartServer(id: ServerId): Promise<ServerState> {
  await stopServer(id);
  // Brief pause for port / file locks to release
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return await startServer(id);
}

export function clearServerLogs(id: ServerId): ServerState {
  const store = getStore();
  const server = store[id];
  if (server) {
    server.logs = [];
  }
  return getAllServers().find((s) => s.id === id)!;
}
