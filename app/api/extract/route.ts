import { NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/google-vision";
import { parseMenuText } from "@/lib/menuParser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const { rawText, confidence } = await extractTextFromImage(base64);

    if (!rawText) {
      return NextResponse.json(
        { error: "No text found in the image. Please try a clearer menu photo." },
        { status: 422 }
      );
    }

    const menu = parseMenuText(rawText, confidence);
    return NextResponse.json(menu);
  } catch (error) {
    console.error("Extraction error:", error);
    const message =
      error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
