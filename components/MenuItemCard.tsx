"use client";

import { useState } from "react";
import { useMenuStore } from "@/hooks/useMenuStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DietaryTagPicker } from "@/components/DietaryTagPicker";
import { cn } from "@/lib/utils";
import { Trash2, GripVertical, AlertTriangle } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MenuItem } from "@/types/menu";

interface MenuItemCardProps {
  categoryId: string;
  item: MenuItem;
  currency: string;
}

export function MenuItemCard({ categoryId, item, currency }: MenuItemCardProps) {
  const { updateItem, deleteItem } = useMenuStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLowConfidence = item.confidence < 0.7;

  const currencySymbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";

  function handleUpdate<K extends keyof MenuItem>(field: K, value: MenuItem[K]) {
    updateItem(categoryId, item.id, { [field]: value });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border bg-card p-3 text-card-foreground shadow-sm transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary/30 opacity-80",
        isLowConfidence && "border-yellow-300 bg-yellow-50/30"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={item.name}
              onChange={(e) => handleUpdate("name", e.target.value)}
              placeholder="Item name"
              className="h-8 flex-1 font-medium"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                value={item.price}
                min={0}
                step={0.01}
                onChange={(e) => handleUpdate("price", parseFloat(e.target.value) || 0)}
                className="h-8 w-24 text-right"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ConfidenceBadge confidence={item.confidence} />
            {isLowConfidence && (
              <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
                <AlertTriangle className="h-3 w-3" />
                Low confidence — review required
              </span>
            )}
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setIsExpanded((v) => !v)}
            >
              {isExpanded ? "Less" : "More"}
            </button>
          </div>

          {isExpanded && (
            <div className="space-y-2 pt-1">
              <Textarea
                value={item.description}
                onChange={(e) => handleUpdate("description", e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="text-sm"
              />
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Dietary Tags</span>
                <DietaryTagPicker
                  value={item.dietaryTags}
                  onChange={(tags) => handleUpdate("dietaryTags", tags)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={(e) => handleUpdate("available", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  Available
                </label>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => deleteItem(categoryId, item.id)}
          aria-label="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
