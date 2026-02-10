"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AnalysisResultsProps {
  description: string;
  recommendations: string;
  onDescriptionChange: (value: string) => void;
  onRecommendationsChange: (value: string) => void;
  onTTS: () => void;
}

export function AnalysisResults({
  description,
  recommendations,
  onDescriptionChange,
  onRecommendationsChange,
  onTTS,
}: AnalysisResultsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="desc" className="font-black text-foreground">
          Descripcion
        </Label>
        <Textarea
          id="desc"
          rows={7}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Aqui aparecera una descripcion breve."
          className="bg-black/20 border-border text-foreground placeholder:text-muted-foreground rounded-2xl resize-y"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Label htmlFor="reco" className="font-black flex-1 text-foreground">
            Recomendaciones
          </Label>
          <Button onClick={onTTS} variant="outline" size="sm">
            <Volume2 className="h-4 w-4 mr-2" />
            Text-to-Speech
          </Button>
        </div>
        <Textarea
          id="reco"
          rows={4}
          value={recommendations}
          onChange={(e) => onRecommendationsChange(e.target.value)}
          placeholder="Aqui apareceran recomendaciones complementarias."
          className="bg-black/20 border-border text-foreground placeholder:text-muted-foreground rounded-2xl resize-y"
        />
      </div>
    </div>
  );
}
