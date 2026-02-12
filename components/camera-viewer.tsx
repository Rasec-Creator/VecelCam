"use client";

import { RefObject } from "react";
import { Camera, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Language = "es" | "en" | "pt";

const buttonLabels: Record<Language, { retry: string; howTo: string }> = {
  es: { retry: "Reintentar", howTo: "Como habilitar" },
  en: { retry: "Retry", howTo: "How to enable" },
  pt: { retry: "Tentar novamente", howTo: "Como ativar" },
};

interface CameraViewerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayVisible: boolean;
  overlayTitle: string;
  overlayText: string;
  onRetry: () => void;
  onHowTo: () => void;
  language?: Language;
}

export function CameraViewer({
  videoRef,
  overlayVisible,
  overlayTitle,
  overlayText,
  onRetry,
  onHowTo,
  language = "es",
}: CameraViewerProps) {
  return (
    <div className="relative w-full aspect-video bg-black/40 rounded-2xl overflow-hidden border border-border">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {overlayVisible && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm text-center">
          <div className="max-w-[580px] p-5 rounded-2xl border border-border bg-background/80">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Camera className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">{overlayTitle}</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {overlayText}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <Button onClick={onRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {buttonLabels[language].retry}
              </Button>
              <Button onClick={onHowTo} variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                {buttonLabels[language].howTo}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
