import { NextResponse } from "next/server";
import { menuRepository } from "@/lib/menuRepository";
import { ExtractedMenuSchema } from "@/lib/validation";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const menu = await menuRepository.findById(params.id);
    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch (error) {
    console.error("GET /api/menus/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body: unknown = await request.json();
    const result = ExtractedMenuSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid menu data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const menu = await menuRepository.update(params.id, result.data);
    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch (error) {
    console.error("PUT /api/menus/[id] error:", error);
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const deleted = await menuRepository.delete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/menus/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 });
  }
}
