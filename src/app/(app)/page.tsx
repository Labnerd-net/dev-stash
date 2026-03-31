import Link from "next/link";
import { Package, FolderOpen, Star, Bookmark } from "lucide-react";

const stats = [
  {
    label: "Your Items",
    value: 0,
    icon: Package,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    label: "Collections",
    value: 0,
    icon: FolderOpen,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    label: "Favorite Items",
    value: 0,
    icon: Star,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    label: "Favorite Collections",
    value: 0,
    icon: Bookmark,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your developer knowledge hub
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-4 flex items-center gap-4"
          >
            <div className={`${bg} ${color} rounded-md p-2`}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Collections</h2>
          <Link
            href="/collections"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      </div>
    </div>
  );
}
