import { promises as fs } from "fs";
import path from "path";
import type { ExtractedMenu, Menu } from "@/types/menu";

const DATA_FILE = path.join(process.cwd(), "data", "menus.json");

export interface MenuRepository {
  findAll(): Promise<Menu[]>;
  findById(id: string): Promise<Menu | null>;
  create(menu: Omit<Menu, "id" | "createdAt" | "updatedAt">): Promise<Menu>;
  update(id: string, data: Partial<ExtractedMenu>): Promise<Menu | null>;
  delete(id: string): Promise<boolean>;
}

async function readMenus(): Promise<Menu[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Menu[];
  } catch {
    return [];
  }
}

async function writeMenus(menus: Menu[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(menus, null, 2), "utf-8");
}

export class JsonFileMenuRepository implements MenuRepository {
  async findAll(): Promise<Menu[]> {
    return readMenus();
  }

  async findById(id: string): Promise<Menu | null> {
    const menus = await readMenus();
    return menus.find((m) => m.id === id) ?? null;
  }

  async create(
    menu: Omit<Menu, "id" | "createdAt" | "updatedAt">
  ): Promise<Menu> {
    const menus = await readMenus();
    const now = new Date().toISOString();
    const newMenu: Menu = {
      ...menu,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    menus.push(newMenu);
    await writeMenus(menus);
    return newMenu;
  }

  async update(
    id: string,
    data: Partial<ExtractedMenu>
  ): Promise<Menu | null> {
    const menus = await readMenus();
    const index = menus.findIndex((m) => m.id === id);
    if (index === -1) return null;
    menus[index] = {
      ...menus[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeMenus(menus);
    return menus[index];
  }

  async delete(id: string): Promise<boolean> {
    const menus = await readMenus();
    const filtered = menus.filter((m) => m.id !== id);
    if (filtered.length === menus.length) return false;
    await writeMenus(filtered);
    return true;
  }
}

export const menuRepository = new JsonFileMenuRepository();
