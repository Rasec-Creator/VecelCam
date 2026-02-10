"use client";

import { Camera, CameraOff, Aperture } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type CameraFacing = "environment" | "user";

interface CameraControlsProps {
  isStreaming: boolean;
  facing: CameraFacing;
  isCapturing: boolean;
  onStart: () => void;
  onStop: () => void;
  onSnap: () => void;
  onFacingChange: (value: CameraFacing) => void;
}

export function CameraControls({
  isStreaming,
  facing,
  isCapturing,
  onStart,
  onStop,
  onSnap,
  onFacingChange,
}: CameraControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={onStart}
          disabled={isStreaming}
          className="bg-gradient-to-br from-primary to-blue-700 text-primary-foreground hover:from-blue-500 hover:to-blue-800 min-w-[160px]"
        >
          <Camera className="h-4 w-4 mr-2" />
          Activar camara
        </Button>
        <Button
          onClick={onStop}
          disabled={!isStreaming}
          variant="destructive"
          className="min-w-[120px]"
        >
          <CameraOff className="h-4 w-4 mr-2" />
          Detener
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-3 rounded-2xl border border-border bg-black/20">
          <RadioGroup
            value={facing}
            onValueChange={(v) => onFacingChange(v as CameraFacing)}
            className="flex items-center gap-5"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="environment" id="cam-back" />
              <Label htmlFor="cam-back" className="font-bold cursor-pointer text-foreground">
                Camara trasera
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="user" id="cam-front" />
              <Label htmlFor="cam-front" className="font-bold cursor-pointer text-foreground">
                Camara delantera
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={onSnap}
          disabled={!isStreaming || isCapturing}
          className="bg-gradient-to-br from-primary to-blue-700 text-primary-foreground hover:from-blue-500 hover:to-blue-800 min-w-[160px]"
        >
          <Aperture className="h-4 w-4 mr-2" />
          {isCapturing ? "Capturando..." : "Sacar fotografia"}
        </Button>
      </div>
    </div>
  );
}
