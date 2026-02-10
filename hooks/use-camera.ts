"use client";

import { useState, useRef, useCallback } from "react";

type CameraFacing = "environment" | "user";
type StatusKind = "ok" | "err" | "warn" | "";

interface CameraState {
  status: string;
  statusKind: StatusKind;
  isStreaming: boolean;
  overlayVisible: boolean;
  overlayTitle: string;
  overlayText: string;
}

function isSecure() {
  if (typeof window === "undefined") return true;
  return (
    window.isSecureContext ||
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  );
}

function inIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isIOS() {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua);
}

function isSafari() {
  const ua = navigator.userAgent || "";
  const isWebKit = /AppleWebKit/.test(ua);
  const isChrome = /CriOS|Chrome/.test(ua);
  const isEdge = /EdgiOS|Edg/.test(ua);
  return isWebKit && !isChrome && !isEdge;
}

function permissionHowToText() {
  const lines = [
    "Como habilitar la camara:",
    "",
    "1) Asegurate de abrir en HTTPS (no file://).",
    '2) Cuando el navegador pregunte, elegi "Permitir".',
    "3) Si lo negaste:",
  ];
  if (isIOS() && isSafari()) {
    lines.push(
      "   - iPhone/iPad (Safari): Ajustes -> Safari -> Camara -> Permitir."
    );
    lines.push(
      "   - Tambien: Ajustes -> Privacidad y seguridad -> Camara -> habilitar Safari."
    );
  } else {
    lines.push(
      "   - En el navegador: icono del candado -> Permisos -> Camara -> Permitir."
    );
  }
  lines.push(
    "4) Si estas en un preview/iframe: abri en una pestana normal del navegador."
  );
  return lines.join("\n");
}

function notAllowedHelp() {
  const lines = [
    "No se pudo acceder a la camara (NotAllowedError).",
    "",
    "Causas tipicas:",
    "- Permiso denegado.",
    "- Entorno bloqueado (iframe/preview).",
    "- Sitio no seguro (no HTTPS).",
    "",
    permissionHowToText(),
  ];
  return lines.join("\n");
}

function explainError(e: Error & { name?: string }) {
  const name = e?.name || "";
  if (name === "NotAllowedError") return notAllowedHelp();
  if (name === "NotFoundError")
    return "No se encontro una camara disponible (NotFoundError).\n- Verifica que el dispositivo tenga camara activa.";
  if (name === "NotReadableError")
    return "La camara esta en uso por otra app (NotReadableError).\n- Cerra otras apps/pestanas que esten usando la camara.";
  if (name === "OverconstrainedError")
    return "No se pudo aplicar la configuracion solicitada (OverconstrainedError).\n- Proba cambiar a la otra camara.";
  return "No se pudo abrir la camara.\n- Verifica HTTPS/permiso.";
}

async function getCameraPermissionState() {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const p = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });
    return p?.state || "unknown";
  } catch {
    return "unknown";
  }
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>({
    status: 'Presiona "Activar camara" para comenzar.',
    statusKind: "ok",
    isStreaming: false,
    overlayVisible: true,
    overlayTitle: "Listo para iniciar",
    overlayText: "Presiona Activar camara y acepta el permiso.",
  });

  const setStatus = useCallback((msg: string, kind: StatusKind = "") => {
    setState((prev) => ({ ...prev, status: msg, statusKind: kind }));
  }, []);

  const setOverlay = useCallback((title: string, text: string) => {
    setState((prev) => ({
      ...prev,
      overlayVisible: true,
      overlayTitle: title,
      overlayText: text,
    }));
  }, []);

  const hideOverlay = useCallback(() => {
    setState((prev) => ({ ...prev, overlayVisible: false }));
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      status: "Camara detenida.",
      statusKind: "ok",
      overlayVisible: true,
      overlayTitle: "Camara detenida",
      overlayText: "Presiona Activar camara para volver a iniciar.",
    }));
  }, []);

  const startCamera = useCallback(
    async (facing: CameraFacing) => {
      try {
        setStatus("Solicitando permiso de camara...");

        if (!navigator.mediaDevices?.getUserMedia) {
          setStatus("Este navegador no soporta camara.", "err");
          setOverlay(
            "Navegador no compatible",
            "Tu navegador no soporta acceso a camara desde la web."
          );
          return;
        }

        if (!isSecure()) {
          setStatus(
            "Contexto no seguro: la camara requiere HTTPS (o localhost).",
            "err"
          );
          setOverlay(
            "Se requiere HTTPS",
            "Abri esta pagina en HTTPS (o localhost). El acceso a camara no funciona en file:// ni en HTTP."
          );
          return;
        }

        if (inIframe()) {
          setStatus(
            "Advertencia: estas en un iframe/preview. Puede bloquear permisos de camara.",
            "warn"
          );
        }

        const perm = await getCameraPermissionState();
        if (perm === "denied") {
          const msg = notAllowedHelp();
          setStatus(msg, "err");
          setOverlay("Permiso de camara bloqueado", msg);
          return;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setState((prev) => ({
          ...prev,
          isStreaming: true,
          status: "Camara lista.",
          statusKind: "ok",
          overlayVisible: false,
        }));
      } catch (e) {
        console.error(e);
        const msg = explainError(e as Error);
        setStatus(msg, "err");
        setOverlay("No se pudo iniciar la camara", msg);
      }
    },
    [setStatus, setOverlay]
  );

  const capturePhoto = useCallback((): string | null => {
    if (!streamRef.current || !videoRef.current || !canvasRef.current)
      return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Scale down to max 800px to reduce payload size for API
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const scale = Math.min(1, 800 / Math.max(vw, vh));
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const showHowTo = useCallback(() => {
    const msg = permissionHowToText();
    setStatus(msg, "warn");
    setOverlay("Como habilitar la camara", msg);
  }, [setStatus, setOverlay]);

  const getDiagnostics = useCallback(() => {
    if (typeof window === "undefined") return {};
    return {
      protocol: location.protocol,
      secure: isSecure() ? "OK" : "NO (usa HTTPS o localhost)",
      iframe: inIframe() ? "Si" : "No",
      permissionsApi: !!navigator.permissions?.query ? "Si" : "No",
      userAgent: navigator.userAgent,
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    state,
    startCamera,
    stopCamera,
    capturePhoto,
    showHowTo,
    hideOverlay,
    setStatus,
    getDiagnostics,
  };
}
