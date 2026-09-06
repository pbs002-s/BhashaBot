import type { Metadata } from "next";
import MoodIndex from "@/components/MoodIndex";
import { MOODS } from "@/lib/settings-schema";

export const metadata: Metadata = {
  title: "Moods — BhashaBot",
  description: `Every reply mood on its own page: ${MOODS.map((m) => m.id).join(", ")}. Try one before you switch the desk over to it.`,
};

export default function MoodsPage() {
  return <MoodIndex />;
}
