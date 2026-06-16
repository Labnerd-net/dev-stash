import Link from "next/link";

interface EmptyStateProps {
  message: string;
  action?: { label: string; href: string };
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Link href={action.href} className="mt-3 text-sm text-primary hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}
