import { NextResponse } from "next/server";
import { menuRepository } from "@/lib/menuRepository";
import { ExtractedMenuSchema } from "@/lib/validation";

export async function GET() {
  try {
    const menus = await menuRepository.findAll();
    return NextResponse.json(menus);
  } catch (error) {
    console.error("GET /api/menus error:", error);
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = ExtractedMenuSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid menu data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const menu = await menuRepository.create(result.data);
    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error("POST /api/menus error:", error);
    return NextResponse.json({ error: "Failed to create menu" }, { status: 500 });
  }
}
