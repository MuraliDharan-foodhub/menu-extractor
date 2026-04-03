"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExtractedMenu, MenuCategory, MenuItem } from "@/types/menu";

type Step = "upload" | "extract" | "edit" | "review" | "submit";

interface MenuStore {
  extractedMenu: ExtractedMenu | null;
  originalImageUrl: string | null;
  currentStep: Step;

  history: ExtractedMenu[];
  historyIndex: number;

  canUndo: boolean;
  canRedo: boolean;

  setExtractedMenu: (menu: ExtractedMenu) => void;
  setOriginalImageUrl: (url: string) => void;
  setCurrentStep: (step: Step) => void;

  updateCategory: (categoryId: string, updates: Partial<MenuCategory>) => void;
  addCategory: (category: MenuCategory) => void;
  deleteCategory: (categoryId: string) => void;
  reorderCategories: (newOrder: MenuCategory[]) => void;

  updateItem: (
    categoryId: string,
    itemId: string,
    updates: Partial<MenuItem>
  ) => void;
  addItem: (categoryId: string, item: MenuItem) => void;
  deleteItem: (categoryId: string, itemId: string) => void;
  reorderItems: (categoryId: string, newOrder: MenuItem[]) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;
}

function pushHistory(
  history: ExtractedMenu[],
  historyIndex: number,
  menu: ExtractedMenu
): { history: ExtractedMenu[]; historyIndex: number } {
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(menu);
  // Cap history at 50 entries
  if (newHistory.length > 50) {
    newHistory.shift();
    return { history: newHistory, historyIndex: newHistory.length - 1 };
  }
  return { history: newHistory, historyIndex: newHistory.length - 1 };
}

function applyMenuChange(
  state: MenuStore,
  updater: (menu: ExtractedMenu) => ExtractedMenu
): Partial<MenuStore> {
  if (!state.extractedMenu) return {};
  const newMenu = updater(state.extractedMenu);
  const { history, historyIndex } = pushHistory(
    state.history,
    state.historyIndex,
    newMenu
  );
  return {
    extractedMenu: newMenu,
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: false,
  };
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      extractedMenu: null,
      originalImageUrl: null,
      currentStep: "upload",
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,

      setExtractedMenu: (menu) =>
        set((state) => {
          const { history, historyIndex } = pushHistory(
            state.history,
            state.historyIndex,
            menu
          );
          return {
            extractedMenu: menu,
            history,
            historyIndex,
            canUndo: historyIndex > 0,
            canRedo: false,
          };
        }),

      setOriginalImageUrl: (url) => set({ originalImageUrl: url }),

      setCurrentStep: (step) => set({ currentStep: step }),

      updateCategory: (categoryId, updates) =>
        set((state) =>
          applyMenuChange(state, (menu) => ({
            ...menu,
            categories: menu.categories.map((c) =>
              c.id === categoryId ? { ...c, ...updates } : c
            ),
          }))
        ),

      addCategory: (category) =>
        set((state) =>
          applyMenuChange(state, (menu) => ({
            ...menu,
            categories: [...menu.categories, category],
          }))
        ),

      deleteCategory: (categoryId) =>
        set((state) =>
          applyMenuChange(state, (menu) => ({
            ...menu,
            categories: menu.categories.filter((c) => c.id !== categoryId),
          }))
        ),

      reorderCategories: (newOrder) =>
        set((state) =>
          applyMenuChange(state, (menu) => ({
            ...menu,
            categories: newOrder,
          }))
        ),

      updateItem: (categoryId, itemId, updates) =>
        set((state) =>
          applyMenuChange(state, (menu) => ({
            ...menu,
            categories: menu.categories.map((c) =>
              c.id === categoryId
                ? {
                    ...c,
                    items: c.items.map((item) =>
                      item.id === itemId ? { ...item, ...updates } : item
                    ),
                  }
                : c
            ),
          }))
        ),

      addItem: (categoryId, item) =>
        set((state) =>
          applyMenuChange(state, (menu) => ({
            ...menu,
            categories: menu.categories.map((c) =>
              c.id === categoryId ? { ...c, items: [...c.items, item] } : c
            ),
          }))
        ),

      deleteItem: (categoryId, itemId) =>
        set((state) =>
          applyMenuChange(state, (menu) => ({
            ...menu,
            categories: menu.categories.map((c) =>
              c.id === categoryId
                ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
                : c
            ),
          }))
        ),

      reorderItems: (categoryId, newOrder) =>
        set((state) =>
          applyMenuChange(state, (menu) => ({
            ...menu,
            categories: menu.categories.map((c) =>
              c.id === categoryId ? { ...c, items: newOrder } : c
            ),
          }))
        ),

      undo: () =>
        set((state) => {
          if (state.historyIndex <= 0) return {};
          const newIndex = state.historyIndex - 1;
          const menu = state.history[newIndex];
          return {
            extractedMenu: menu,
            historyIndex: newIndex,
            canUndo: newIndex > 0,
            canRedo: true,
          };
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return {};
          const newIndex = state.historyIndex + 1;
          const menu = state.history[newIndex];
          return {
            extractedMenu: menu,
            historyIndex: newIndex,
            canUndo: true,
            canRedo: newIndex < state.history.length - 1,
          };
        }),

      reset: () =>
        set({
          extractedMenu: null,
          originalImageUrl: null,
          currentStep: "upload",
          history: [],
          historyIndex: -1,
          canUndo: false,
          canRedo: false,
        }),
    }),
    {
      name: "menu-extractor-store",
      partialize: (state) => ({
        extractedMenu: state.extractedMenu,
        originalImageUrl: state.originalImageUrl,
        currentStep: state.currentStep,
        history: state.history,
        historyIndex: state.historyIndex,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
      }),
    }
  )
);

export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = useMenuStore();
  return { undo, redo, canUndo, canRedo };
}
