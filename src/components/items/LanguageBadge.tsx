interface LanguageBadgeProps {
  language: string | null | undefined;
  className?: string;
}

export function LanguageBadge({ language, className }: LanguageBadgeProps) {
  if (!language) return null;
  return (
    <span
      className={`shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-mono${className ? ` ${className}` : ""}`}
    >
      {language}
    </span>
  );
}
