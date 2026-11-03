import Link from "next/link";
import {
  Code2,
  File,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { DemoButton } from "@/components/auth/DemoButton";

interface ItemTypeCard {
  name: string;
  description: string;
  color: string;
  icon: LucideIcon;
}

interface Feature {
  title: string;
  description: string;
}

const ITEM_TYPES: ItemTypeCard[] = [
  { name: "Snippets", description: "Reusable code with syntax highlighting", color: "#3b82f6", icon: Code2 },
  { name: "Prompts", description: "AI prompts you can copy and refine", color: "#a855f7", icon: Sparkles },
  { name: "Notes", description: "Rich-text docs and references", color: "#f59e0b", icon: FileText },
  { name: "Commands", description: "Terminal one-liners you keep retyping", color: "#22c55e", icon: Terminal },
  { name: "Files", description: "Templates and context files", color: "#94a3b8", icon: File },
  { name: "Images", description: "Screenshots and diagrams", color: "#ec4899", icon: ImageIcon },
  { name: "Links", description: "Bookmarks worth keeping", color: "#14b8a6", icon: LinkIcon },
];

const FEATURES: Feature[] = [
  {
    title: "Search everything",
    description:
      "Full-text search across titles, content, and tags. Press Cmd+K from anywhere to jump straight to an item.",
  },
  {
    title: "Collections",
    description:
      "Group mixed item types together, such as a React patterns collection holding snippets, notes, and links.",
  },
  {
    title: "AI assistance",
    description:
      "Suggest tags, summarize notes, explain code, and optimize prompts with Claude Haiku. Results are never stored.",
  },
  {
    title: "Built for speed",
    description:
      "One-click copy, favorites, pins, keyboard shortcuts, and a recently used list keep your best material within reach.",
  },
  {
    title: "Your data stays yours",
    description:
      "Export everything as JSON or Markdown at any time. Deleted items sit in the trash for 30 days before being purged.",
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">DevStash</span>
        <nav className="flex items-center gap-2">
          <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonVariants()}>
            Sign up
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            One home for everything you know as a developer
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Snippets, prompts, commands, notes, files, and links are usually scattered across
            editors, chats, bookmarks, and bash history. DevStash puts them in one searchable place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Get started
            </Link>
            <DemoButton />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            No sign-up needed. The demo comes pre-filled with sample items and resets every hour.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20" aria-labelledby="types-heading">
          <h2 id="types-heading" className="text-center text-2xl font-semibold tracking-tight">
            Seven ways to store what matters
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ITEM_TYPES.map(({ name, description, color, icon: Icon }) => (
              <li key={name} className="rounded-lg border border-border bg-card p-4">
                <div
                  className="flex size-9 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-medium">{name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </li>
            ))}
            <li className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Search className="size-5 shrink-0" aria-hidden="true" />
              All of it searchable from one place
            </li>
          </ul>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-center text-2xl font-semibold tracking-tight">
            Find it fast, use it faster
          </h2>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ title, description }) => (
              <div key={title}>
                <dt className="font-medium">{title}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Stop hunting for that one snippet</h2>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Create an account
            </Link>
            <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        DevStash &mdash; store smarter, build faster.
      </footer>
    </div>
  );
}
