"use client";

import { useRef, useState } from "react";

interface TagSelectorProps {
  userTags: { id: string; name: string }[];
  initialTagNames?: string[];
}

export function TagSelector({ userTags, initialTagNames = [] }: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagNames);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = (s: string) => s.trim().toLowerCase();

  const suggestions = inputValue.trim()
    ? userTags.filter(
        (t) =>
          t.name.includes(normalized(inputValue)) &&
          !selectedTags.includes(t.name)
      )
    : [];

  function addTag(name: string) {
    const norm = normalized(name);
    if (!norm || norm.length > 50 || selectedTags.includes(norm)) return;
    setSelectedTags((prev) => [...prev, norm]);
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function removeTag(name: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        Tags <span className="text-muted-foreground text-xs">(optional)</span>
      </label>

      {/* Hidden sentinel + hidden inputs for selected tags */}
      <input type="hidden" name="hasTagSelector" value="1" />
      {selectedTags.map((tag) => (
        <input key={tag} type="hidden" name="tagName" value={tag} />
      ))}

      <div
        className="flex flex-wrap gap-1.5 min-h-[38px] w-full rounded-lg border border-border bg-background px-3 py-2 cursor-text focus-within:ring-2 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-foreground leading-none"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={selectedTags.length === 0 ? "Type a tag and press Enter…" : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="rounded-lg border border-border bg-popover shadow-md overflow-hidden text-sm">
          {suggestions.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(t.name);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-muted transition-colors"
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add. Separate multiple tags.
      </p>
    </div>
  );
}
