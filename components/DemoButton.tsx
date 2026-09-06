"use client";

import { useState } from "react";
import { CircleNotch, ShuffleAngular } from "@phosphor-icons/react/dist/ssr";
import { useT } from "./providers/AppProviders";
import { Button } from "./ui/primitives";

/** Fires one realistic multilingual message at the webhook so an empty desk
 *  can be seen working end to end. */
export default function DemoButton({ onSent }: { onSent?: () => void }) {
  const t = useT();
  const [loading, setLoading] = useState(false);

  async function trigger() {
    setLoading(true);
    try {
      await fetch("/api/seed", { method: "POST" });
      onSent?.();
    } catch (err) {
      console.error("Test event failed:", err);
    } finally {
      window.setTimeout(() => setLoading(false), 320);
    }
  }

  return (
    <Button
      onClick={trigger}
      disabled={loading}
      leadingIcon={
        loading ? (
          <CircleNotch size={13} className="animate-spin" />
        ) : (
          <ShuffleAngular size={13} />
        )
      }
    >
      {loading ? t("action.firing") : t("action.fireTest")}
    </Button>
  );
}
