"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCamera } from "@/hooks/use-camera";
import { CameraViewer } from "@/components/camera-viewer";
import { CameraControls } from "@/components/camera-controls";
import { AnalysisResults } from "@/components/analysis-results";
import { StatusBar } from "@/components/status-bar";
import { DiagnosticsPanel } from "@/components/diagnostics-panel";
import { AlertTriangle } from "lucide-react";

type CameraFacing = "environment" | "user";

export function CameraAnalyzer() {
  const {
    videoRef,
    canvasRef,
    state,
    startCamera,
    stopCamera,
    capturePhoto,
    showHowTo,
    setStatus,
    getDiagnostics,
  } = useCamera();

  const [facing, setFacing] = useState<CameraFacing>("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [diagnostics, setDiagnostics] = useState<Record<string, string>>({});
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPausedTTS, setIsPausedTTS] = useState(false);
  const autoPlayStartedRef = useRef(false);

  useEffect(() => {
    setDiagnostics(getDiagnostics());
  }, [getDiagnostics]);

  // Preload speech synthesis voices so they're ready for TTS
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const handleStart = useCallback(() => {
    startCamera(facing);
  }, [startCamera, facing]);

  const handleFacingChange = useCallback(
    (value: CameraFacing) => {
      setFacing(value);
      if (state.isStreaming) {
        startCamera(value);
      }
    },
    [state.isStreaming, startCamera]
  );

  const handleSnap = useCallback(async () => {
    if (!state.isStreaming) {
      setStatus("Camara no iniciada.", "err");
      return;
    }

    setIsCapturing(true);
    const dataUrl = capturePhoto();
    if (!dataUrl) {
      setStatus("Error al capturar la foto.", "err");
      setIsCapturing(false);
      return;
    }

    setPhotoUrl(dataUrl);
    setStatus("Analizando imagen con IA...", "warn");

    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data_url: dataUrl }),
      });

      const out = await res.json();

      if (!res.ok) {
        const errMsg = out?.error || `HTTP ${res.status}`;
        setDescription(out?.description || "");
        setRecommendations(out?.recommendations || "");
        autoPlayStartedRef.current = false;
        setStatus(`Error: ${errMsg}`, "err");
        return;
      }

      setDescription(out?.description || "");
      setRecommendations(out?.recommendations || "");
      autoPlayStartedRef.current = false;
      setStatus("Listo. Recomendaciones generadas.", "ok");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido";
      setDescription("");
      setRecommendations("");
      autoPlayStartedRef.current = false;
      setStatus(`Error de conexion: ${errMsg}`, "err");
    } finally {
      setIsCapturing(false);
    }
  }, [state.isStreaming, capturePhoto, setStatus]);

  const startAutoTTS = useCallback(() => {
    const descText = description.trim();
    if (!descText && !recommendations.trim()) {
      return;
    }

    setIsPlayingTTS(true);
    setIsPausedTTS(false);
    const voices = window.speechSynthesis.getVoices();

    const getVoice = () => {
      const arVoice = voices.find(
        (v) =>
          v.lang === "es-AR" ||
          v.lang === "es_AR" ||
          (v.lang.startsWith("es") && v.name.toLowerCase().includes("argentin")),
      );
      const latamVoice = voices.find(
        (v) =>
          v.lang === "es-MX" ||
          v.lang === "es-US" ||
          v.lang === "es_MX" ||
          v.lang === "es_US",
      );
      const anySpanish = voices.find((v) => v.lang.startsWith("es"));
      return arVoice || latamVoice || anySpanish;
    };

    const speakText = (text: string, onComplete: () => void) => {
      if (!text.trim()) {
        onComplete();
        return;
      }

      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-AR";
        u.rate = 0.95;
        u.pitch = 1.0;
        const voice = getVoice();
        if (voice) {
          u.voice = voice;
        }
        u.onend = onComplete;
        u.onerror = () => {
          setStatus("Error en la reproduccion de audio.", "err");
          setIsPlayingTTS(false);
          setIsPausedTTS(true);
        };
        window.speechSynthesis.speak(u);
      } catch {
        setStatus("Text-to-Speech no disponible.", "err");
        setIsPlayingTTS(false);
        setIsPausedTTS(true);
      }
    };

    // Leer descripción primero
    if (descText) {
      speakText(descText, () => {
        // Luego leer recomendaciones
        const recText = recommendations.trim();
        speakText(recText, () => {
          setStatus("Audio finalizado.", "ok");
          setIsPlayingTTS(false);
          setIsPausedTTS(true);
        });
      });
      setStatus("Reproduciendo audio...", "ok");
    } else {
      // Si no hay descripción, solo leer recomendaciones
      speakText(recommendations.trim(), () => {
        setStatus("Audio finalizado.", "ok");
        setIsPlayingTTS(false);
        setIsPausedTTS(true);
      });
      setStatus("Reproduciendo audio...", "ok");
    }
  }, [description, recommendations, setStatus]);

  const handleTTSToggle = useCallback(() => {
    if (isPlayingTTS && !isPausedTTS) {
      // Está reproduciendo, pausar
      window.speechSynthesis.pause();
      setIsPlayingTTS(false);
      setIsPausedTTS(true);
      setStatus("Audio pausado.", "warn");
    } else if (isPausedTTS) {
      // Está pausado, reiniciar desde el principio
      window.speechSynthesis.cancel();
      setIsPlayingTTS(true);
      setIsPausedTTS(false);
      autoPlayStartedRef.current = false;
      // Usar setTimeout para asegurar que el cancel se procese
      setTimeout(() => {
        startAutoTTS();
      }, 50);
    } else {
      // No se está reproduciendo, comenzar
      autoPlayStartedRef.current = false;
      startAutoTTS();
    }
  }, [isPlayingTTS, isPausedTTS, startAutoTTS, setStatus]);

  // Lectura automática cuando cambien descripción o recomendaciones
  useEffect(() => {
    if ((description.trim() || recommendations.trim()) && !autoPlayStartedRef.current) {
      autoPlayStartedRef.current = true;
      startAutoTTS();
    }
  }, [description, recommendations]);

  return (
    <div className="min-h-screen py-6 px-4">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 600px at 20% 0%, rgba(59,130,246,0.2), transparent 60%), radial-gradient(900px 600px at 90% 10%, rgba(37,99,235,0.15), transparent 55%)",
        }}
      />

      <div className="max-w-[860px] mx-auto">
        <div className="rounded-[20px] border border-border bg-card/60 backdrop-blur-sm p-5 md:p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Online Camera Analyzer
              </h1>
              <p className="mt-1 text-muted-foreground font-semibold">
                By CallBot
                <span className="text-orange-500 font-black">IA</span>
              </p>
            </div>
          </div>

          {/* Camera viewer */}
          <div className="mt-4">
            <CameraViewer
              videoRef={videoRef}
              overlayVisible={state.overlayVisible}
              overlayTitle={state.overlayTitle}
              overlayText={state.overlayText}
              onRetry={handleStart}
              onHowTo={showHowTo}
            />
          </div>

          {/* Controls */}
          <div className="mt-4">
            <CameraControls
              isStreaming={state.isStreaming}
              facing={facing}
              isCapturing={isCapturing}
              onStart={handleStart}
              onStop={stopCamera}
              onSnap={handleSnap}
              onFacingChange={handleFacingChange}
            />
          </div>

          {/* Photo preview */}
          {photoUrl && (
            <img
              src={photoUrl || "/placeholder.svg"}
              alt="Foto capturada"
              className="mt-4 w-full rounded-2xl border border-border"
            />
          )}

          {/* Analysis results */}
          <div className="mt-5">
            <AnalysisResults
              description={description}
              recommendations={recommendations}
              onDescriptionChange={setDescription}
              onRecommendationsChange={setRecommendations}
              onTTS={handleTTSToggle}
              isPlayingTTS={isPlayingTTS}
              isPausedTTS={isPausedTTS}
            />
          </div>

          {/* Status */}
          <div className="mt-4">
            <StatusBar message={state.status} kind={state.statusKind} />
          </div>

          {/* Diagnostics */}
          <div className="mt-3">
            <DiagnosticsPanel diagnostics={diagnostics} />
          </div>

          {/* Hint */}
          <p className="mt-3 text-muted-foreground text-xs">
            La descripcion y recomendaciones se generan con IA al capturar una foto.
          </p>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} hidden />
        </div>
      </div>
    </div>
  );
}
