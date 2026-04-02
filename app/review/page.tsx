"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMenuStore } from "@/hooks/useMenuStore";
import { ProgressStepper } from "@/components/ProgressStepper";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Menu } from "@/types/menu";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ReviewPage() {
  const router = useRouter();
  const { extractedMenu, setCurrentStep, reset } = useMenuStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!extractedMenu) {
      router.replace("/");
    }
  }, [extractedMenu, router]);

  if (!extractedMenu) return null;

  const totalItems = extractedMenu.categories.reduce(
    (sum, c) => sum + c.items.length,
    0
  );
  const lowConfidenceItems = extractedMenu.categories.flatMap((c) =>
    c.items.filter((i) => i.confidence < 0.7)
  );

  async function handleSubmit() {
    if (!extractedMenu) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setCurrentStep("submit");

    try {
      const response = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractedMenu),
      });

      const data = (await response.json()) as Menu | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Submission failed");
      }

      toast.success("Menu published successfully!");
      reset();
      router.push("/success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setSubmitError(message);
      setCurrentStep("review");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ProgressStepper currentStep="review" />

        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/editor")}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Button>
          <h1 className="text-xl font-bold">Review & Submit</h1>
          <div />
        </div>

        <div className="space-y-4">
          {/* Summary card */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Summary</CardTitle>
              <CardDescription>
                Review your menu before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-2xl font-bold">
                    {extractedMenu.categories.length}
                  </div>
                  <div className="text-muted-foreground">Categories</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <div className="text-muted-foreground">Items</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Extraction confidence:
                </span>
                <ConfidenceBadge confidence={extractedMenu.extractionConfidence} />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-medium">{extractedMenu.currency}</span>
              </div>
            </CardContent>
          </Card>

          {/* Low confidence warning */}
          {lowConfidenceItems.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Low-Confidence Items</AlertTitle>
              <AlertDescription>
                {lowConfidenceItems.length} item
                {lowConfidenceItems.length !== 1 ? "s" : ""} ha
                {lowConfidenceItems.length !== 1 ? "ve" : "s"} low confidence
                scores and may need manual review:
                <ul className="mt-2 list-disc pl-5 text-xs space-y-0.5">
                  {lowConfidenceItems.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      {item.name} ({Math.round(item.confidence * 100)}%)
                    </li>
                  ))}
                  {lowConfidenceItems.length > 5 && (
                    <li>…and {lowConfidenceItems.length - 5} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {extractedMenu.categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">
                      {cat.items.length} item
                      {cat.items.length !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Submission Failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Publish Menu
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
