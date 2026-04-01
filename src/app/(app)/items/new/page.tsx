import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { or, isNull, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { itemTypes } from "@/db/schema";
import { ItemForm } from "@/components/items/ItemForm";

export default async function NewItemPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const types = await db
    .select()
    .from(itemTypes)
    .where(or(isNull(itemTypes.userId), eq(itemTypes.userId, session.user.id)));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Item</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new item to your stash.
        </p>
      </div>
      <ItemForm mode="create" types={types} />
    </div>
  );
}
