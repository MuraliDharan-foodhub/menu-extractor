"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DietaryTagPicker } from "@/components/DietaryTagPicker";
import { AddMenuItemFormSchema, type AddMenuItemFormValues } from "@/lib/validation";
import type { MenuItem } from "@/types/menu";

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: MenuItem) => void;
}

export function AddItemDialog({ open, onOpenChange, onAdd }: AddItemDialogProps) {
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMenuItemFormValues>({
    resolver: zodResolver(AddMenuItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      dietaryTags: [],
      available: true,
    },
  });

  function onSubmit(data: AddMenuItemFormValues) {
    const item: MenuItem = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      price: data.price,
      dietaryTags,
      available: data.available,
      confidence: 1.0,
    };
    onAdd(item);
    reset();
    setDietaryTags([]);
    onOpenChange(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      reset();
      setDietaryTags([]);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Menu Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Name *</Label>
            <Input
              id="item-name"
              placeholder="e.g. Grilled Salmon"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              placeholder="Brief description..."
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-price">Price</Label>
            <Input
              id="item-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("price")}
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Dietary Tags</Label>
            <DietaryTagPicker value={dietaryTags} onChange={setDietaryTags} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
