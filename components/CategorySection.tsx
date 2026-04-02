"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useMenuStore } from "@/hooks/useMenuStore";
import { MenuItemCard } from "@/components/MenuItemCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { MenuCategory, MenuItem } from "@/types/menu";

interface CategorySectionProps {
  category: MenuCategory;
  currency: string;
}

export function CategorySection({ category, currency }: CategorySectionProps) {
  const { updateCategory, deleteCategory, addItem, reorderItems } = useMenuStore();
  const [collapsed, setCollapsed] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = category.items.findIndex((i) => i.id === active.id);
      const newIndex = category.items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(category.items, oldIndex, newIndex);
      reorderItems(category.id, reordered);
    }
  }

  function handleAddItem(item: MenuItem) {
    addItem(category.id, item);
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-2 p-3 border-b">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand category" : "Collapse category"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <Input
          value={category.name}
          onChange={(e) => updateCategory(category.id, { name: e.target.value })}
          className={cn(
            "h-8 flex-1 font-semibold text-base border-transparent bg-transparent px-1 hover:border-input focus:border-input"
          )}
        />

        <span className="text-xs text-muted-foreground shrink-0">
          {category.items.length} item{category.items.length !== 1 ? "s" : ""}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setAddDialogOpen(true)}
          aria-label="Add item"
          title="Add item"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => deleteCategory(category.id)}
          aria-label="Delete category"
          title="Delete category"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2">
          {category.items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No items yet.{" "}
              <button
                type="button"
                className="underline hover:no-underline"
                onClick={() => setAddDialogOpen(true)}
              >
                Add one
              </button>
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={category.items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    categoryId={category.id}
                    item={item}
                    currency={currency}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddItem}
      />
    </div>
  );
}
