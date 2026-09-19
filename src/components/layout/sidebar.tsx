"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Plus, Settings, type LucideIcon } from "lucide-react";

import { Icon } from "@/components/ui/icon";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/challenge/new", label: "Tantangan Baru", icon: Plus },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

interface Props {
  /** Defaults to the current URL. */
  currentPath?: string | undefined;
}

export function Sidebar({ currentPath }: Props) {
  const routerPath = usePathname();
  const pathname = currentPath ?? routerPath;

  return (
    <nav className="app-nav" aria-label="Navigasi utama">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="app-nav-link"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <span className="app-nav-icon">
              <Icon icon={item.icon} size={20} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
