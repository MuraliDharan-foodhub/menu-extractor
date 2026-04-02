"use client";

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
import { CategorySection } from "@/components/CategorySection";
import { ImageViewer } from "@/components/ImageViewer";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { Undo2, Redo2, Plus } from "lucide-react";
import type { MenuCategory } from "@/types/menu";

export function MenuEditor() {
  const {
    extractedMenu,
    originalImageUrl,
    reorderCategories,
    addCategory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMenuStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!extractedMenu) return null;

  function handleDragEnd(event: DragEndEvent) {
    if (!extractedMenu) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = extractedMenu.categories.findIndex(
        (c) => c.id === active.id
      );
      const newIndex = extractedMenu.categories.findIndex(
        (c) => c.id === over.id
      );
      const reordered = arrayMove(extractedMenu.categories, oldIndex, newIndex);
      reorderCategories(reordered as MenuCategory[]);
    }
  }

  function handleAddCategory() {
    const newCategory: MenuCategory = {
      id: crypto.randomUUID(),
      name: "New Category",
      items: [],
    };
    addCategory(newCategory);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Image viewer */}
      {originalImageUrl && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Original Menu</h2>
          <ImageViewer imageUrl={originalImageUrl} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall extraction:</span>
            <ConfidenceBadge confidence={extractedMenu.extractionConfidence} />
          </div>
        </div>
      )}

      {/* Right: Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Menu Editor</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCategory}
              className="ml-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={extractedMenu.categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {extractedMenu.categories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  currency={extractedMenu.currency}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {extractedMenu.categories.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No categories yet.{" "}
              <button
                type="button"
                className="underline hover:no-underline"
                onClick={handleAddCategory}
              >
                Add one
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
