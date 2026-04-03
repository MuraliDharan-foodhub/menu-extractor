import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Menu Published!</CardTitle>
            <CardDescription>
              Your menu has been successfully extracted and saved to the backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You can view all published menus via the{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                GET /api/menus
              </code>{" "}
              endpoint.
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Extract Another Menu
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
