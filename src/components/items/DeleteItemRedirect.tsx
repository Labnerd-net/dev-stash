"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DeleteItemButton } from "./DeleteItemButton";
import { restoreItem } from "@/actions/trash";

interface DeleteItemRedirectProps {
  id: string;
  redirectTo: string;
}

export function DeleteItemRedirect({ id, redirectTo }: DeleteItemRedirectProps) {
  const router = useRouter();

  function handleSuccess() {
    toast("Item moved to trash.", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: async () => {
          const result = await restoreItem(id);
          if (result.success) {
            toast.success("Item restored.");
          } else {
            toast.error("Could not restore item.");
          }
        },
      },
    });
    router.push(redirectTo);
  }

  return <DeleteItemButton id={id} onSuccess={handleSuccess} />;
}
