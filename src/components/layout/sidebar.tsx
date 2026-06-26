"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: "🏠" },
  { href: "/challenge/new", label: "Tantangan Baru", icon: "➕" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Navigasi utama">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="app-nav-link"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <span className="app-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
