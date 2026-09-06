import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MoodDetail from "@/components/MoodDetail";
import { MOODS, isMoodId, moodMeta } from "@/lib/settings-schema";

/** Ten moods, ten static pages. */
export function generateStaticParams() {
  return MOODS.map((mood) => ({ mood: mood.id }));
}

export function generateMetadata({ params }: { params: { mood: string } }): Metadata {
  if (!isMoodId(params.mood)) return { title: "Mood — BhashaBot" };
  const mood = moodMeta(params.mood);
  const name = mood.id.charAt(0).toUpperCase() + mood.id.slice(1);
  return {
    title: `${name} mood — BhashaBot`,
    description: mood.blurb.en,
    openGraph: { title: `${name} mood — BhashaBot`, description: mood.blurb.en, type: "article" },
  };
}

export default function MoodPage({ params }: { params: { mood: string } }) {
  if (!isMoodId(params.mood)) notFound();
  return <MoodDetail moodId={params.mood} />;
}
