export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  variants?: { name: string; price: number }[];
  dietaryTags: string[];
  available: boolean;
  confidence: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface ExtractedMenu {
  categories: MenuCategory[];
  currency: string;
  extractionConfidence: number;
  rawText: string;
}

export interface Menu extends ExtractedMenu {
  id: string;
  createdAt: string;
  updatedAt: string;
}
