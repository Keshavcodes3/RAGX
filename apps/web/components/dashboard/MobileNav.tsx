"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileText, KeyRound, LayoutGrid, Search } from "lucide-react";

const TABS = [
  { href: "/dashboard", icon: LayoutGrid, label: "Home" },
  { href: "/dashboard/documents", icon: FileText, label: "Docs" },
  { href: "/dashboard/search", icon: Search, label: "Search" },
  { href: "/dashboard/projects", icon: Boxes, label: "Projects" },
  { href: "/dashboard/api-keys", icon: KeyRound, label: "Keys" },
];

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#E8E8ED] bg-white/95 backdrop-blur-xl lg:hidden">
      {TABS.map((t) => {
        const active = t.href === "/dashboard" ? path === t.href : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] ${
              active ? "font-semibold text-[#0071E3]" : "text-[#6E6E73]"
            }`}
          >
            <t.icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
