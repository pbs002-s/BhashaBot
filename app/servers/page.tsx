import type { Metadata } from "next";
import ServersManager from "@/components/ServersManager";

export const metadata: Metadata = {
  title: "Bot Clients & Servers — BhashaBot",
  description: "Start, stop, and inspect local personal account client scripts (Telegram, WhatsApp) and web widgets.",
};

export default function ServersPage() {
  return <ServersManager />;
}
