import type { ChatMessage, ServerState } from "../App";

interface Props { messages: ChatMessage[]; serverState: ServerState | null; onClose: () => void; }

export default function EvidencePanel({ messages, serverState, onClose }: Props) {
  const lastMsg = messages.filter((m) => m.role === "assistant" && m.evidence).at(-1);
  const ev = lastMsg?.evidence;
  const diags = ev?.diagnostics || serverState?.diagnostics || [];
  const cmd = ev?.commandEvidence || serverState?.commandEvidence;
  const provider = ev?.provider || serverState?.provider;

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div><p className="text-xs text-blue-400 font-medium tracking-wide">EVIDENCE</p><h2 className="text-sm font-semibold">Command Trail</h2></div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm px-1" title="Close evidence">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-xs">
        {/* Map Summary */}
        {serverState && (
          <div className="bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="text-gray-400 font-medium">Map Summary</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-300">
              <span>Revision</span><span className="text-right font-mono">{serverState.summary.revision}</span>
              <span>Sources</span><span className="text-right">{serverState.summary.sourceCount}</span>
              <span>Layers</span><span className="text-right">{serverState.summary.layerCount}</span>
            </div>
          </div>
        )}

        {/* Command Evidence */}
        {cmd && (
          <div className="bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="text-gray-400 font-medium">Last Command</p>
            <div className="space-y-0.5 text-gray-300">
              <p>Commands: <span className="font-mono">{cmd.commandCount ?? "--"}</span></p>
              <p>Committed: <span className={cmd.committed ? "text-green-400" : "text-red-400"}>{String(cmd.committed)}</span></p>
              <p>Rolled back: <span className={cmd.rolledBack ? "text-yellow-400" : "text-gray-500"}>{String(cmd.rolledBack)}</span></p>
              {cmd.failed != null && <p>Failed: <span className={cmd.failed ? "text-red-400" : "text-gray-500"}>{String(cmd.failed)}</span></p>}
              <p>Paths changed: <span className="font-mono">{cmd.changedPathCount}</span></p>
            </div>
          </div>
        )}

        {/* Provider Info */}
        {provider && (
          <div className="bg-gray-800 rounded-lg p-3 space-y-1">
            <p className="text-gray-400 font-medium">AI Provider</p>
            <p className="text-gray-300 font-mono">{provider.providerId}</p>
            {provider.confidence && (
              <p className="text-gray-500">Confidence: {provider.confidence.level} ({(provider.confidence.score * 100).toFixed(0)}%)</p>
            )}
          </div>
        )}

        {/* Diagnostics */}
        <div className="space-y-1">
          <p className="text-gray-400 font-medium">Diagnostics ({diags.length})</p>
          {diags.length === 0 ? (
            <p className="text-gray-600 italic">No issues</p>
          ) : (
            diags.slice(0, 20).map((d, i) => (
              <div key={i} className={`rounded p-2 ${d.severity === "error" ? "bg-red-900/30 border border-red-800/50" : d.severity === "warning" ? "bg-yellow-900/20 border border-yellow-800/30" : "bg-gray-800/50"}`}>
                <p className="text-gray-300 font-mono text-[11px]">{d.code}</p>
                <p className="text-gray-400 mt-0.5">{d.message}</p>
                {d.path && <p className="text-gray-600 text-[10px] mt-0.5">path: {d.path}</p>}
              </div>
            ))
          )}
        </div>

        {/* No data state */}
        {!cmd && !provider && diags.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <p>Send a message to see</p>
            <p>command evidence here.</p>
          </div>
        )}
      </div>
    </>
  );
}
