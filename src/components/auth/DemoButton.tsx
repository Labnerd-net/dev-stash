"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startDemo } from "@/actions/demo";

interface DemoButtonProps {
  size?: "default" | "lg";
  variant?: "default" | "outline";
}

export function DemoButton({ size = "lg", variant = "outline" }: DemoButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError("");
    startTransition(async () => {
      const result = await startDemo();
      if (!result.success) {
        setError(result.error ?? "Could not start the demo.");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button type="button" size={size} variant={variant} onClick={handleClick} disabled={isPending}>
        {isPending ? "Loading demo…" : "Try the demo"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
