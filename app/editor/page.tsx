"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMenuStore } from "@/hooks/useMenuStore";
import { MenuEditor } from "@/components/MenuEditor";
import { ProgressStepper } from "@/components/ProgressStepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function EditorPage() {
  const router = useRouter();
  const { extractedMenu, setCurrentStep } = useMenuStore();

  useEffect(() => {
    if (!extractedMenu) {
      router.replace("/");
    }
  }, [extractedMenu, router]);

  if (!extractedMenu) return null;

  function handleContinue() {
    setCurrentStep("review");
    router.push("/review");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ProgressStepper currentStep="edit" />

        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Edit Extracted Menu</h1>
          <Button onClick={handleContinue} className="gap-1">
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <MenuEditor />
      </div>
    </main>
  );
}
