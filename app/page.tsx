import type { Metadata } from "next";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import SiteFooter from "@/components/SiteFooter";
import LandingHero from "@/components/landing/LandingHero";
import MotionReels from "@/components/landing/MotionReels";
import WorkspaceScroll from "@/components/landing/WorkspaceScroll";
import { MoodBento, PersonaEngine } from "@/components/landing/MoodLibrary";
import { ChannelsAndKeys, Credits, Manifesto } from "@/components/landing/LandingClose";
import { COUNTS } from "@/lib/landing-content";

export const metadata: Metadata = {
  title: "BhashaBot: one inbox, every language, the tone you choose",
  description: `A multilingual reply desk that reads Bengali, Banglish, Hindi, Spanish, French and English, answers in the same script, and holds one of ${COUNTS.moods} moods across ${COUNTS.platforms} channels on a free API key.`,
  openGraph: {
    title: "BhashaBot",
    description:
      "One inbox, every language, the tone you choose. Five workspaces, twelve moods, and a persona trained on your own exported chats.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <a href="#reels" className="skip-link">
        Skip to the reels
      </a>
      <AmbientBackdrop />

      <div className="relative z-10">
        <main>
          <LandingHero />
          <WorkspaceScroll />
          <MotionReels />
          <MoodBento />
          <PersonaEngine />
          <ChannelsAndKeys />
          <Manifesto />
          <Credits />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
