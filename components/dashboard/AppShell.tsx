"use client";

import { Suspense } from "react";
import Sidebar, { MobileTabs } from "./Sidebar";

/** Persistent sidebar frame shared by /desk, /moods and /servers. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[100rem] gap-5 p-4">
      <Suspense fallback={<aside className="hidden w-60 shrink-0 lg:block" />}>
        <Sidebar />
      </Suspense>
      <div className="min-w-0 flex-1">
        <Suspense fallback={null}>
          <MobileTabs />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
