"use client";

import { useSettings } from "./providers/AppProviders";

/**
 * Two fixed, pointer-events-none layers: a pair of slow radial blooms and a
 * grain field. Fixed on purpose — blur and noise over scrolling content
 * repaints the GPU on every frame.
 */
export default function AmbientBackdrop() {
  const { settings } = useSettings();
  const still = settings.ui.reduceMotion;

  return (
    <>
      <div className="ambient-glow" aria-hidden="true">
        <span className={`glow-1 ${still ? "" : "animate-drift"}`} />
        <span
          className={`glow-2 ${still ? "" : "animate-drift"}`}
          style={still ? undefined : { animationDelay: "-13s" }}
        />
      </div>
      <div className="ambient-grain" aria-hidden="true" />
    </>
  );
}
