"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Language = "es" | "en" | "pt";

const buttonLabels: Record<Language, { pause: string; play: string }> = {
  es: { pause: "Pausar", play: "Reproducir" },
  en: { pause: "Pause", play: "Play" },
  pt: { pause: "Pausar", play: "Reproduzir" },
};

interface AnalysisResultsProps {
  description: string;
  recommendations: string;
  onDescriptionChange: (value: string) => void;
  onRecommendationsChange: (value: string) => void;
  onTTS: () => void;
  isPlayingTTS: boolean;
  isPausedTTS: boolean;
  language: Language;
  translations: Record<Language, Record<string, string>>;
}

export function AnalysisResults({
  description,
  recommendations,
  onDescriptionChange,
  onRecommendationsChange,
  onTTS,
  isPlayingTTS,
  isPausedTTS,
  language,
  translations,
}: AnalysisResultsProps) {
  const t = translations[language];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Label htmlFor="desc" className="font-black flex-1 text-foreground">
            {t.description}
          </Label>
          {(isPlayingTTS || isPausedTTS) && (
            <Button
              onClick={onTTS}
              variant={isPlayingTTS ? "destructive" : "outline"}
              size="sm"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {isPlayingTTS ? buttonLabels[language].pause : buttonLabels[language].play}
            </Button>
          )}
        </div>
        <Textarea
          id="desc"
          rows={7}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t.description_placeholder}
          className="bg-black/20 border-border text-foreground placeholder:text-muted-foreground rounded-2xl resize-y"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Label htmlFor="reco" className="font-black flex-1 text-foreground">
            {t.recommendations}
          </Label>
          {(isPlayingTTS || isPausedTTS) && (
            <Button
              onClick={onTTS}
              variant={isPlayingTTS ? "destructive" : "outline"}
              size="sm"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {isPlayingTTS ? buttonLabels[language].pause : buttonLabels[language].play}
            </Button>
          )}
        </div>
        <Textarea
          id="reco"
          rows={4}
          value={recommendations}
          onChange={(e) => onRecommendationsChange(e.target.value)}
          placeholder={t.recommendations_placeholder}
          className="bg-black/20 border-border text-foreground placeholder:text-muted-foreground rounded-2xl resize-y"
        />
      </div>
    </div>
  );
}
