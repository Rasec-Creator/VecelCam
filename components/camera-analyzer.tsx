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
type Language = "es" | "en" | "pt";

const translations: Record<Language, Record<string, string>> = {
  es: {
    title: "Analizador de Cámara Online",
    requirements: "Requisitos de cámara: debe abrirse en HTTPS (o localhost). Si lo abris como archivo (file://) o dentro de un iframe sin permisos, el navegador puede bloquear la cámara.",
    analyzing: "Analizando imagen con IA...",
    ready: "Listo. Recomendaciones generadas.",
    error_capture: "Error al capturar la foto.",
    error_connection: "Error de conexion: ",
    camera_not_started: "Camara no iniciada.",
    description: "Descripcion",
    recommendations: "Recomendaciones",
    description_placeholder: "Aqui aparecera una descripcion breve.",
    recommendations_placeholder: "Aqui apareceran recomendaciones complementarias.",
    hint: "La descripcion y recomendaciones se generan con IA al capturar una foto.",
    playing: "Reproduciendo audio...",
    paused: "Audio pausado.",
    finished: "Audio finalizado.",
    error_tts: "Error en la reproduccion de audio.",
    error_tts_unavailable: "Text-to-Speech no disponible.",
    reading_description: "Descripción. ",
    reading_recommendations: "Recomendaciones. ",
  },
  en: {
    title: "Online Camera Analyzer",
    requirements: "Camera requirements: must be opened in HTTPS (or localhost). If you open it as a file (file://) or within an iframe without permissions, the browser may block the camera.",
    analyzing: "Analyzing image with AI...",
    ready: "Ready. Recommendations generated.",
    error_capture: "Error capturing the photo.",
    error_connection: "Connection error: ",
    camera_not_started: "Camera not started.",
    description: "Description",
    recommendations: "Recommendations",
    description_placeholder: "A brief description will appear here.",
    recommendations_placeholder: "Complementary recommendations will appear here.",
    hint: "The description and recommendations are generated with AI when capturing a photo.",
    playing: "Playing audio...",
    paused: "Audio paused.",
    finished: "Audio finished.",
    error_tts: "Error in audio reproduction.",
    error_tts_unavailable: "Text-to-Speech not available.",
    reading_description: "Description. ",
    reading_recommendations: "Recommendations. ",
  },
  pt: {
    title: "Analisador de Câmera Online",
    requirements: "Requisitos da câmera: deve ser aberto em HTTPS (ou localhost). Se você abri-lo como arquivo (file://) ou dentro de um iframe sem permissões, o navegador pode bloquear a câmera.",
    analyzing: "Analisando imagem com IA...",
    ready: "Pronto. Recomendações geradas.",
    error_capture: "Erro ao capturar a foto.",
    error_connection: "Erro de conexão: ",
    camera_not_started: "Câmera não iniciada.",
    description: "Descrição",
    recommendations: "Recomendações",
    description_placeholder: "Uma breve descrição aparecerá aqui.",
    recommendations_placeholder: "Recomendações complementares aparecerão aqui.",
    hint: "A descrição e recomendações são geradas com IA ao capturar uma foto.",
    playing: "Reproduzindo áudio...",
    paused: "Áudio pausado.",
    finished: "Áudio concluído.",
    error_tts: "Erro na reprodução de áudio.",
    error_tts_unavailable: "Text-to-Speech não disponível.",
    reading_description: "Descrição. ",
    reading_recommendations: "Recomendações. ",
  },
};

export function CameraAnalyzer() {
  const [language, setLanguage] = useState<Language>("es");
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
  } = useCamera(language);

  const [facing, setFacing] = useState<CameraFacing>("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [diagnostics, setDiagnostics] = useState<Record<string, string>>({});
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPausedTTS, setIsPausedTTS] = useState(false);
  const autoPlayStartedRef = useRef(false);

  const t = translations[language];

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
      setStatus(t.camera_not_started, "err");
      return;
    }

    setIsCapturing(true);
    const dataUrl = capturePhoto();
    if (!dataUrl) {
      setStatus(t.error_capture, "err");
      setIsCapturing(false);
      return;
    }

    setPhotoUrl(dataUrl);
    setStatus(t.analyzing, "warn");

    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image_data_url: dataUrl,
          language: language
        }),
      });

      const out = await res.json();

      if (!res.ok) {
        const errMsg = out?.error || `HTTP ${res.status}`;
        autoPlayStartedRef.current = false;
        setDescription(out?.description || "");
        setRecommendations(out?.recommendations || "");
        setStatus(`Error: ${errMsg}`, "err");
        return;
      }

      autoPlayStartedRef.current = false;
      setDescription(out?.description || "");
      setRecommendations(out?.recommendations || "");
      setStatus(t.ready, "ok");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido";
      autoPlayStartedRef.current = false;
      setDescription("");
      setRecommendations("");
      setStatus(`Error de conexion: ${errMsg}`, "err");
    } finally {
      setIsCapturing(false);
    }
  }, [state.isStreaming, capturePhoto, setStatus, language, t]);

  const startAutoTTS = useCallback(() => {
    const descText = description.trim();
    if (!descText && !recommendations.trim()) {
      return;
    }

    setIsPlayingTTS(true);
    setIsPausedTTS(false);
    const voices = window.speechSynthesis.getVoices();

    const getVoice = () => {
      const langMap: Record<Language, string[]> = {
        es: ["es-AR", "es-MX", "es-US", "es"],
        en: ["en-US", "en-GB", "en"],
        pt: ["pt-BR", "pt"],
      };
      
      const langs = langMap[language];
      const exactMatch = voices.find((v) => langs.includes(v.lang));
      if (exactMatch) return exactMatch;
      
      const partialMatch = voices.find((v) => v.lang.startsWith(langs[0]?.split("-")[0] || "es"));
      return partialMatch;
    };

    const speakText = (text: string, onComplete: () => void) => {
      if (!text.trim()) {
        onComplete();
        return;
      }

      try {
        const u = new SpeechSynthesisUtterance(text);
        const langMap: Record<Language, string> = {
          es: "es-AR",
          en: "en-US",
          pt: "pt-BR",
        };
        u.lang = langMap[language];
        u.rate = 0.95;
        u.pitch = 1.0;
        const voice = getVoice();
        if (voice) {
          u.voice = voice;
        }
        u.onend = onComplete;
        u.onerror = () => {
          setStatus(t.error_tts, "err");
          setIsPlayingTTS(false);
          setIsPausedTTS(true);
        };
        window.speechSynthesis.speak(u);
      } catch {
        setStatus(t.error_tts_unavailable, "err");
        setIsPlayingTTS(false);
        setIsPausedTTS(true);
      }
    };

    // Leer descripción primero
    if (descText) {
      speakText(t.reading_description + descText, () => {
        // Luego leer recomendaciones
        const recText = recommendations.trim();
        speakText(t.reading_recommendations + recText, () => {
          setStatus(t.finished, "ok");
          setIsPlayingTTS(false);
          setIsPausedTTS(true);
        });
      });
      setStatus(t.playing, "ok");
    } else {
      // Si no hay descripción, solo leer recomendaciones
      speakText(t.reading_recommendations + recommendations.trim(), () => {
        setStatus(t.finished, "ok");
        setIsPlayingTTS(false);
        setIsPausedTTS(true);
      });
      setStatus(t.playing, "ok");
    }
  }, [description, recommendations, setStatus, language, t]);

  const handleTTSToggle = useCallback(() => {
    if (isPlayingTTS && !isPausedTTS) {
      // Está reproduciendo, pausar
      window.speechSynthesis.pause();
      setIsPlayingTTS(false);
      setIsPausedTTS(true);
      setStatus(t.paused, "warn");
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
  }, [isPlayingTTS, isPausedTTS, startAutoTTS, setStatus, t]);

  // Lectura automática cuando cambien descripción o recomendaciones
  useEffect(() => {
    if ((description.trim() || recommendations.trim()) && !autoPlayStartedRef.current) {
      autoPlayStartedRef.current = true;
      startAutoTTS();
    }
  }, [description, recommendations, startAutoTTS]);

  // Resetear el flag cuando cambia el idioma
  useEffect(() => {
    autoPlayStartedRef.current = false;
  }, [language]);

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
                {t.title}
              </h1>
              <p className="mt-1 text-muted-foreground font-semibold">
                By CallBot
                <span className="text-orange-500 font-black">IA</span>
              </p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-foreground font-semibold cursor-pointer hover:border-primary transition-colors"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
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
              language={language}
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
              language={language}
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
              language={language}
              translations={translations}
            />
          </div>

          {/* Status */}
          <div className="mt-4">
            <StatusBar message={state.status} kind={state.statusKind} />
          </div>

          {/* Hint */}
          <p className="mt-3 text-muted-foreground text-xs">
            {t.hint}
          </p>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} hidden />
        </div>
      </div>
    </div>
  );
}
