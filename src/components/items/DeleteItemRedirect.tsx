"use client";

import { useRouter } from "next/navigation";
import { DeleteItemButton } from "./DeleteItemButton";

interface DeleteItemRedirectProps {
  id: string;
  redirectTo: string;
}

export function DeleteItemRedirect({ id, redirectTo }: DeleteItemRedirectProps) {
  const router = useRouter();
  return (
    <DeleteItemButton id={id} onSuccess={() => router.push(redirectTo)} />
  );
}
