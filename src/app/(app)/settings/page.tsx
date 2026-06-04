import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium">Export Your Data</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Download all your items in your preferred format.
          </p>
        </div>

        <div className="border border-border rounded-lg divide-y divide-border">
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium">JSON</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All items with tags and metadata in a single structured file.
              </p>
            </div>
            <a
              href="/api/export/items?format=json"
              download
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              Export JSON
            </a>
          </div>

          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium">Markdown ZIP</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                One Markdown file per item, packaged as a ZIP archive.
              </p>
            </div>
            <a
              href="/api/export/items?format=zip"
              download
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              Export Markdown
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
