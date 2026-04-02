"use client";

import { useRouter } from "next/navigation";
import { DeleteCollectionButton } from "./DeleteCollectionButton";

interface DeleteCollectionRedirectProps {
  id: string;
  redirectTo: string;
}

export function DeleteCollectionRedirect({
  id,
  redirectTo,
}: DeleteCollectionRedirectProps) {
  const router = useRouter();
  return (
    <DeleteCollectionButton id={id} onSuccess={() => router.push(redirectTo)} />
  );
}
