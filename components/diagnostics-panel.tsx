"use client";

interface DiagnosticsPanelProps {
  diagnostics: {
    protocol?: string;
    secure?: string;
    iframe?: string;
    permissionsApi?: string;
    userAgent?: string;
  };
}

export function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  if (!diagnostics.protocol) return null;

  return (
    <div className="p-3 rounded-2xl border border-border bg-black/20 text-muted-foreground text-xs leading-relaxed">
      <span className="font-bold text-foreground">Diagnostico rapido</span>
      <div className="mt-1.5 flex flex-col gap-0.5">
        <span>
          Protocolo: <code className="text-foreground">{diagnostics.protocol}</code>
        </span>
        <span>
          Contexto seguro: <code className="text-foreground">{diagnostics.secure}</code>
        </span>
        <span>
          En iframe/preview: <code className="text-foreground">{diagnostics.iframe}</code>
        </span>
        <span>
          Permissions API: <code className="text-foreground">{diagnostics.permissionsApi}</code>
        </span>
        <span>
          Navegador:{" "}
          <code className="text-foreground text-[10px] break-all">
            {diagnostics.userAgent}
          </code>
        </span>
      </div>
    </div>
  );
}
