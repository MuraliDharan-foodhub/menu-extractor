"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const DIETARY_TAGS = [
  { key: "V", label: "V", title: "Vegetarian", color: "bg-green-100 text-green-800 border-green-300" },
  { key: "VG", label: "VG", title: "Vegan", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { key: "GF", label: "GF", title: "Gluten-Free", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "DF", label: "DF", title: "Dairy-Free", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "N", label: "N", title: "Contains Nuts", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { key: "S", label: "S", title: "Spicy", color: "bg-red-100 text-red-800 border-red-300" },
  { key: "H", label: "H", title: "Halal", color: "bg-teal-100 text-teal-800 border-teal-300" },
  { key: "K", label: "K", title: "Kosher", color: "bg-purple-100 text-purple-800 border-purple-300" },
];

interface DietaryTagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function DietaryTagPicker({ value, onChange, className }: DietaryTagPickerProps) {
  function toggle(key: string) {
    if (value.includes(key)) {
      onChange(value.filter((t) => t !== key));
    } else {
      onChange([...value, key]);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {DIETARY_TAGS.map((tag) => {
        const selected = value.includes(tag.key);
        return (
          <button
            key={tag.key}
            type="button"
            title={tag.title}
            onClick={() => toggle(tag.key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition-all cursor-pointer",
              selected
                ? tag.color
                : "bg-background text-muted-foreground border-muted-foreground/30 hover:border-muted-foreground/60"
            )}
          >
            {tag.label}
            {selected && <X className="h-3 w-3" />}
          </button>
        );
      })}
    </div>
  );
}

export { DIETARY_TAGS };
