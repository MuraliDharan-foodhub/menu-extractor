"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageViewerProps {
  imageUrl: string;
  className?: string;
}

export function ImageViewer({ imageUrl, className }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  function handleZoomIn() {
    setScale((s) => Math.min(s + 0.25, 4));
  }

  function handleZoomOut() {
    setScale((s) => {
      const next = Math.max(s - 0.25, 0.5);
      if (next <= 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function handleReset() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
    dragStart.current = null;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-1 justify-end">
        <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <div
        className="relative overflow-hidden rounded-lg border bg-muted/20 h-[400px]"
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Menu"
          className="absolute inset-0 w-full h-full object-contain select-none"
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: isDragging ? "none" : "transform 0.15s ease",
          }}
          draggable={false}
        />
        <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
