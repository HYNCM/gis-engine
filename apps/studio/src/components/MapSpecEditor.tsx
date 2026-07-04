import { useCallback, useEffect, useRef, useState } from "react";

export interface ValidationDiagnostic {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  path?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  diagnostics: ValidationDiagnostic[];
  readOnly?: boolean;
}

function severityColor(severity: ValidationDiagnostic["severity"]) {
  if (severity === "error") return "border-red-500/50 bg-red-950/30 text-red-300";
  if (severity === "warning") return "border-yellow-500/50 bg-yellow-950/30 text-yellow-300";
  return "border-blue-500/50 bg-blue-950/30 text-blue-300";
}

export default function MapSpecEditor({ value, onChange, diagnostics, readOnly = false }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorLine, setCursorLine] = useState<number | null>(null);

  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warningCount = diagnostics.filter((d) => d.severity === "warning").length;
  const isValid = errorCount === 0;

  // Sync external value changes into the textarea
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.slice(0, pos);
    const line = textBefore.split("\n").length;
    setCursorLine(line);
  }, []);

  // Auto-format (indent) the JSON on blur if it's valid
  const handleFormatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Don't format invalid JSON
    }
  }, [value, onChange]);

  // Line numbers
  const lineCount = value.split("\n").length;

  // Scroll sync between line numbers and textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const lineNumEl = textarea.parentElement?.querySelector(".line-numbers");
    if (!lineNumEl) return;
    const syncScroll = () => {
      (lineNumEl as HTMLElement).scrollTop = textarea.scrollTop;
    };
    textarea.addEventListener("scroll", syncScroll);
    return () => textarea.removeEventListener("scroll", syncScroll);
  }, []);

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-blue-400 tracking-wide">MAPSPEC</p>
          <span
            className={`h-2 w-2 rounded-full ${isValid ? "bg-green-400" : "bg-red-400 animate-pulse"}`}
            title={isValid ? "Valid JSON" : `${errorCount} error(s)`}
          />
        </div>
        <div className="flex items-center gap-2">
          {cursorLine !== null && <span className="font-mono text-[10px] text-gray-600">Ln {cursorLine}</span>}
          <button
            onClick={handleFormatJson}
            className="rounded bg-gray-800 px-2 py-0.5 text-[11px] text-gray-400 transition hover:bg-gray-700 hover:text-gray-200 disabled:opacity-40"
            disabled={readOnly || errorCount > 0}
            title="Format JSON"
          >
            Format
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Line numbers */}
        <div
          className="line-numbers select-none overflow-hidden border-r border-gray-800 bg-gray-950/50 py-3 pr-0 pl-1 text-right font-mono text-[11px] leading-5 text-gray-700"
          style={{ width: "3rem", minWidth: "3rem" }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="px-1">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onSelect={handleSelect}
          readOnly={readOnly}
          spellCheck={false}
          className="flex-1 resize-none bg-gray-950/80 px-3 py-3 font-mono text-[12px] leading-5 text-gray-200 outline-none placeholder-gray-700"
          placeholder='{"version": "0.1", ...}'
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Diagnostics strip */}
      {diagnostics.length > 0 && (
        <div className="max-h-32 shrink-0 overflow-y-auto border-t border-gray-800 bg-gray-950">
          {diagnostics.slice(0, 10).map((diag, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 border-b border-gray-800/50 px-3 py-1.5 text-[11px] ${severityColor(diag.severity)}`}
            >
              <span className="shrink-0 font-mono">
                {diag.severity === "error" ? "✕" : diag.severity === "warning" ? "!" : "i"}
              </span>
              <div className="min-w-0">
                <p className="break-words">{diag.message}</p>
                {diag.path && <p className="text-gray-600 font-mono text-[10px]">{diag.path}</p>}
                {diag.code && <p className="text-gray-700 font-mono text-[10px]">{diag.code}</p>}
              </div>
            </div>
          ))}
          {diagnostics.length > 10 && (
            <p className="px-3 py-1 text-[10px] text-gray-600">+{diagnostics.length - 10} more</p>
          )}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-gray-800 bg-gray-950/60 px-3 py-1.5 shrink-0">
        <span className="font-mono text-[10px] text-gray-600">
          {lineCount} lines · {value.length} chars
        </span>
        <span className="font-mono text-[10px] text-gray-600">
          {errorCount > 0 ? `${errorCount} error(s)` : warningCount > 0 ? `${warningCount} warning(s)` : "valid"}
        </span>
      </div>
    </div>
  );
}
