"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type CameraFacing = "environment" | "user";
type StatusKind = "ok" | "err" | "warn" | "";
type Language = "es" | "en" | "pt";

interface CameraState {
  status: string;
  statusKind: StatusKind;
  isStreaming: boolean;
  overlayVisible: boolean;
  overlayTitle: string;
  overlayText: string;
}

const cameraTranslations: Record<Language, Record<string, string>> = {
  es: {
    press_activate: 'Presiona "Activar camara" para comenzar.',
    ready_title: "Listo para iniciar",
    ready_text: "Presiona Activar camara y acepta el permiso.",
    camera_stopped: "Camara detenida.",
    stopped_title: "Camara detenida",
    stopped_text: "Presiona Activar camara para volver a iniciar.",
    requesting_permission: "Solicitando permiso de camara...",
    no_browser_support: "Este navegador no soporta camara.",
    no_support_title: "Navegador no compatible",
    no_support_text: "Tu navegador no soporta acceso a camara desde la web.",
    no_https: "Contexto no seguro: la camara requiere HTTPS (o localhost).",
    https_required_title: "Se requiere HTTPS",
    https_required_text: "Abri esta pagina en HTTPS (o localhost). El acceso a camara no funciona en file:// ni en HTTP.",
    in_iframe_warning: "Advertencia: estas en un iframe/preview. Puede bloquear permisos de camara.",
    permission_denied: "No se pudo acceder a la camara (NotAllowedError).",
    permission_denied_title: "Permiso de camara bloqueado",
    how_to_enable: "Como habilitar la camara:",
    ensure_https: "1) Asegurate de abrir en HTTPS (no file://).",
    click_allow: '2) Cuando el navegador pregunte, elegi "Permitir".',
    denied_instructions: "3) Si lo negaste:",
    ios_safari: "   - iPhone/iPad (Safari): Ajustes -> Safari -> Camara -> Permitir.",
    ios_privacy: "   - Tambien: Ajustes -> Privacidad y seguridad -> Camara -> habilitar Safari.",
    browser_permission: "   - En el navegador: icono del candado -> Permisos -> Camara -> Permitir.",
    use_normal_tab: "4) Si estas en un preview/iframe: abri en una pestana normal del navegador.",
    typical_causes: "Causas tipicas:",
    permission_denied_short: "- Permiso denegado.",
    blocked_environment: "- Entorno bloqueado (iframe/preview).",
    not_secure: "- Sitio no seguro (no HTTPS).",
    camera_not_found: "No se encontro una camara disponible (NotFoundError).",
    camera_not_found_short: "- Verifica que el dispositivo tenga camara activa.",
    camera_in_use: "La camara esta en uso por otra app (NotReadableError).",
    camera_in_use_short: "- Cerra otras apps/pestanas que esten usando la camara.",
    constrain_error: "No se pudo aplicar la configuracion solicitada (OverconstrainedError).",
    constrain_error_short: "- Proba cambiar a la otra camara.",
    generic_error: "No se pudo abrir la camara.",
    generic_error_short: "- Verifica HTTPS/permiso.",
    camera_ready: "Camara lista.",
  },
  en: {
    press_activate: 'Press "Enable Camera" to start.',
    ready_title: "Ready to start",
    ready_text: "Press Enable Camera and accept the permission.",
    camera_stopped: "Camera stopped.",
    stopped_title: "Camera stopped",
    stopped_text: "Press Enable Camera to restart.",
    requesting_permission: "Requesting camera permission...",
    no_browser_support: "This browser does not support camera.",
    no_support_title: "Browser not compatible",
    no_support_text: "Your browser does not support web camera access.",
    no_https: "Insecure context: camera requires HTTPS (or localhost).",
    https_required_title: "HTTPS required",
    https_required_text: "Open this page in HTTPS (or localhost). Camera access doesn't work in file:// or HTTP.",
    in_iframe_warning: "Warning: you're in an iframe/preview. It may block camera permissions.",
    permission_denied: "Could not access the camera (NotAllowedError).",
    permission_denied_title: "Camera permission blocked",
    how_to_enable: "How to enable camera:",
    ensure_https: "1) Make sure to open in HTTPS (not file://).",
    click_allow: '2) When the browser asks, choose "Allow".',
    denied_instructions: "3) If you denied it:",
    ios_safari: "   - iPhone/iPad (Safari): Settings -> Safari -> Camera -> Allow.",
    ios_privacy: "   - Also: Settings -> Privacy and Security -> Camera -> enable Safari.",
    browser_permission: "   - In the browser: lock icon -> Permissions -> Camera -> Allow.",
    use_normal_tab: "4) If you're in a preview/iframe: open in a normal browser tab.",
    typical_causes: "Typical causes:",
    permission_denied_short: "- Permission denied.",
    blocked_environment: "- Blocked environment (iframe/preview).",
    not_secure: "- Insecure site (no HTTPS).",
    camera_not_found: "No camera device found (NotFoundError).",
    camera_not_found_short: "- Verify that the device has an active camera.",
    camera_in_use: "Camera is in use by another app (NotReadableError).",
    camera_in_use_short: "- Close other apps/tabs that are using the camera.",
    constrain_error: "Could not apply the requested configuration (OverconstrainedError).",
    constrain_error_short: "- Try switching to the other camera.",
    generic_error: "Could not open the camera.",
    generic_error_short: "- Verify HTTPS/permission.",
    camera_ready: "Camera ready.",
  },
  pt: {
    press_activate: 'Pressione "Ativar câmera" para começar.',
    ready_title: "Pronto para iniciar",
    ready_text: "Pressione Ativar câmera e aceite a permissão.",
    camera_stopped: "Câmera parada.",
    stopped_title: "Câmera parada",
    stopped_text: "Pressione Ativar câmera para reiniciar.",
    requesting_permission: "Solicitando permissão da câmera...",
    no_browser_support: "Este navegador não suporta câmera.",
    no_support_title: "Navegador não compatível",
    no_support_text: "Seu navegador não suporta acesso à câmera web.",
    no_https: "Contexto inseguro: a câmera requer HTTPS (ou localhost).",
    https_required_title: "HTTPS necessário",
    https_required_text: "Abra esta página em HTTPS (ou localhost). O acesso à câmera não funciona em file:// ou HTTP.",
    in_iframe_warning: "Aviso: você está em um iframe/visualização. Pode bloquear permissões de câmera.",
    permission_denied: "Não foi possível acessar a câmera (NotAllowedError).",
    permission_denied_title: "Permissão de câmera bloqueada",
    how_to_enable: "Como ativar a câmera:",
    ensure_https: "1) Certifique-se de abrir em HTTPS (não file://).",
    click_allow: '2) Quando o navegador perguntar, escolha "Permitir".',
    denied_instructions: "3) Se você negou:",
    ios_safari: "   - iPhone/iPad (Safari): Configurações -> Safari -> Câmera -> Permitir.",
    ios_privacy: "   - Também: Configurações -> Privacidade e segurança -> Câmera -> ativar Safari.",
    browser_permission: "   - No navegador: ícone de cadeado -> Permissões -> Câmera -> Permitir.",
    use_normal_tab: "4) Se você estiver em um visualizador/iframe: abrir em uma guia normal do navegador.",
    typical_causes: "Causas típicas:",
    permission_denied_short: "- Permissão negada.",
    blocked_environment: "- Ambiente bloqueado (iframe/visualização).",
    not_secure: "- Site não seguro (sem HTTPS).",
    camera_not_found: "Nenhum dispositivo de câmera encontrado (NotFoundError).",
    camera_not_found_short: "- Verifique se o dispositivo possui câmera ativa.",
    camera_in_use: "A câmera está sendo usada por outro aplicativo (NotReadableError).",
    camera_in_use_short: "- Feche outros aplicativos/abas que estão usando a câmera.",
    constrain_error: "Não foi possível aplicar a configuração solicitada (OverconstrainedError).",
    constrain_error_short: "- Tente mudar para a outra câmera.",
    generic_error: "Não foi possível abrir a câmera.",
    generic_error_short: "- Verifique HTTPS/permissão.",
    camera_ready: "Câmera pronta.",
  },
};

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

function permissionHowToText(t: Record<string, string>) {
  const lines = [
    t.how_to_enable,
    "",
    t.ensure_https,
    t.click_allow,
    t.denied_instructions,
  ];
  if (isIOS() && isSafari()) {
    lines.push(t.ios_safari);
    lines.push(t.ios_privacy);
  } else {
    lines.push(t.browser_permission);
  }
  lines.push(t.use_normal_tab);
  return lines.join("\n");
}

function notAllowedHelp(t: Record<string, string>) {
  const lines = [
    t.permission_denied,
    "",
    t.typical_causes,
    t.permission_denied_short,
    t.blocked_environment,
    t.not_secure,
    "",
    permissionHowToText(t),
  ];
  return lines.join("\n");
}

function explainError(e: Error & { name?: string }, t: Record<string, string>) {
  const name = e?.name || "";
  if (name === "NotAllowedError") return notAllowedHelp(t);
  if (name === "NotFoundError")
    return `${t.camera_not_found}\n${t.camera_not_found_short}`;
  if (name === "NotReadableError")
    return `${t.camera_in_use}\n${t.camera_in_use_short}`;
  if (name === "OverconstrainedError")
    return `${t.constrain_error}\n${t.constrain_error_short}`;
  return `${t.generic_error}\n${t.generic_error_short}`;
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

export function useCamera(language: Language = "es") {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const t = cameraTranslations[language];

  const [state, setState] = useState<CameraState>({
    status: t.press_activate,
    statusKind: "ok",
    isStreaming: false,
    overlayVisible: true,
    overlayTitle: t.ready_title,
    overlayText: t.ready_text,
  });

  // Update overlay text when language changes
  useEffect(() => {
    if (!state.isStreaming) {
      setState((prev) => ({
        ...prev,
        status: t.press_activate,
        overlayTitle: t.ready_title,
        overlayText: t.ready_text,
      }));
    }
  }, [language]);

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
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      status: t.camera_stopped,
      statusKind: "ok",
      overlayVisible: true,
      overlayTitle: t.stopped_title,
      overlayText: t.stopped_text,
    }));
  }, [t]);

  const startCamera = useCallback(
    async (facing: CameraFacing) => {
      try {
        setStatus(t.requesting_permission);

        if (!navigator.mediaDevices?.getUserMedia) {
          setStatus(t.no_browser_support, "err");
          setOverlay(t.no_support_title, t.no_support_text);
          return;
        }

        if (!isSecure()) {
          setStatus(t.no_https, "err");
          setOverlay(t.https_required_title, t.https_required_text);
          return;
        }

        if (inIframe()) {
          setStatus(t.in_iframe_warning, "warn");
        }

        const perm = await getCameraPermissionState();
        if (perm === "denied") {
          const msg = notAllowedHelp(t);
          setStatus(msg, "err");
          setOverlay(t.permission_denied_title, msg);
          return;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
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
          status: t.camera_ready,
          statusKind: "ok",
          overlayVisible: false,
        }));
      } catch (e) {
        const msg = explainError(e as Error, t);
        setStatus(msg, "err");
        setOverlay(t.permission_denied_title, msg);
      }
    },
    [setStatus, setOverlay, t]
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
    const msg = permissionHowToText(t);
    setStatus(msg, "warn");
    setOverlay(t.how_to_enable, msg);
  }, [setStatus, setOverlay, t]);

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
