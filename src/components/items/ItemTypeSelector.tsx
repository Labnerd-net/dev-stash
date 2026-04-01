"use client";

interface ItemType {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface ItemTypeSelectorProps {
  types: ItemType[];
  value: string;
  onChange: (typeId: string) => void;
  disabled?: boolean;
}

export function ItemTypeSelector({ types, value, onChange, disabled }: ItemTypeSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {types.map((type) => {
        const isSelected = type.id === value;
        return (
          <button
            key={type.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type.id)}
            className={[
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors text-left",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50",
              isSelected
                ? "border-ring bg-muted font-medium"
                : "border-border bg-background hover:bg-muted/50",
            ].join(" ")}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: type.color ?? "#888" }}
            />
            <span className="truncate">{type.name}</span>
          </button>
        );
      })}
    </div>
  );
}
