"use client";

import React from "react";
import {
  Balloon,
  Bandaids,
  Briefcase,
  CloudRain,
  Compass,
  Fire,
  Handshake,
  HandHeart,
  Heart,
  Lightning,
  Smiley,
  Sparkle,
  Sun,
  Target,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Moods carry an icon name rather than an emoji, so the mark renders in the
 * same weight and colour as every other glyph in the interface.
 */
const ICONS: Record<string, React.ComponentType<any>> = {
  Sun,
  Briefcase,
  Lightning,
  Handshake,
  Balloon,
  Target,
  Bandaids,
  Compass,
  Heart,
  Sparkle,
  Smiley,
  UserCircle,
  Fire,
  CloudRain,
  HandHeart,
};

export default function MoodGlyph({
  icon,
  size = 18,
  weight = "fill",
  className,
}: {
  icon: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}) {
  const Icon = ICONS[icon] || Sun;
  return <Icon size={size} weight={weight} className={className} />;
}
