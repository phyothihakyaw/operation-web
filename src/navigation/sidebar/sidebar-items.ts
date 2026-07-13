import { type LucideIcon, Settings, UserCheck } from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

/**
 * Navigation is intentionally trimmed to the two live screens. The template's
 * other dashboard pages still exist under src/app/(main)/dashboard and remain
 * directly routable — they are only hidden from the sidebar and command search
 * until they are needed.
 */
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Platform",
    items: [
      {
        id: "mentors",
        title: "Mentor Vetting",
        url: "/dashboard/mentors",
        icon: UserCheck,
      },
      {
        id: "settings",
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];
