"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ImageUploader";
import { ProgressStepper } from "@/components/ProgressStepper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMenuStore } from "@/hooks/useMenuStore";
import type { ExtractedMenu } from "@/types/menu";
import { Loader2, Utensils, AlertCircle } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { setExtractedMenu, setOriginalImageUrl, setCurrentStep, reset } =
    useMenuStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  async function handleExtract() {
    if (!selectedFile) {
      toast.error("Please select a menu image first.");
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setCurrentStep("extract");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as
        | ExtractedMenu
        | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Extraction failed");
      }

      const menu = data as ExtractedMenu;

      // Store the image URL for preview in editor
      const imageUrl = URL.createObjectURL(selectedFile);
      setOriginalImageUrl(imageUrl);
      setExtractedMenu(menu);
      setCurrentStep("edit");

      toast.success(
        `Extracted ${menu.categories.length} categories with ${menu.categories.reduce((s, c) => s + c.items.length, 0)} items!`
      );
      router.push("/editor");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      setExtractError(message);
      setCurrentStep("upload");
      toast.error(message);
    } finally {
      setIsExtracting(false);
    }
  }

  function handleStartOver() {
    reset();
    setSelectedFile(null);
    setExtractError(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Utensils className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Menu Extractor
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Upload a menu image and let AI extract, structure, and digitize it
            instantly.
          </p>
        </div>

        <ProgressStepper currentStep="upload" />

        <Card>
          <CardHeader>
            <CardTitle>Upload Menu Image</CardTitle>
            <CardDescription>
              JPEG, PNG, or WebP · Maximum 10 MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUploader
              onFileSelect={setSelectedFile}
              disabled={isExtracting}
            />

            {extractError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Extraction Failed</AlertTitle>
                <AlertDescription>{extractError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleExtract}
                disabled={!selectedFile || isExtracting}
                className="flex-1"
                size="lg"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting…
                  </>
                ) : (
                  "Extract Menu"
                )}
              </Button>
              {extractError && (
                <Button variant="outline" onClick={handleStartOver} size="lg">
                  Start Over
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
