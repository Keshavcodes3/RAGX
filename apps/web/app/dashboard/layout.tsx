"use client";

import { useState } from "react";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { TopBar, CommandPalette } from "../../components/dashboard/TopBar";
import { MobileNav } from "../../components/dashboard/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [palette, setPalette] = useState(false);
  return (
    <div className="min-h-screen bg-white font-sans text-[#1D1D1F] antialiased">
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <TopBar onPalette={() => setPalette(true)} />
          <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-8 lg:pb-16">{children}</main>
        </div>
      </div>
      <MobileNav />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
