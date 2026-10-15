import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Maximize2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { ProtocolMessage } from '../crypto/protocol';
import { formatBigIntTruncated } from '../crypto/bigint';

interface ChannelProps {
  messages: ProtocolMessage[];
  currentStep: number;
  totalSteps: number;
  eveActive: boolean;
  authenticated: boolean;
}

export const Channel: React.FC<ChannelProps> = ({
  messages,
  currentStep,
  eveActive,
  authenticated,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<ProtocolMessage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyValue = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col rounded-card border border-card-border bg-[#070707] p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-status-ok animate-pulse-glow" />
          <h3 className="text-sm font-bold text-white">Public Insecure Channel</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {eveActive && (
            <span className="flex items-center gap-1 rounded-md border border-[#3b1212] bg-[#1a0a0a] px-2 py-0.5 text-status-fail font-semibold">
              <AlertTriangle className="h-3 w-3" /> MITM Active
            </span>
          )}
          {authenticated && (
            <span className="flex items-center gap-1 rounded-md border border-[#142814] bg-[#091509] px-2 py-0.5 text-status-ok font-semibold">
              <ShieldCheck className="h-3 w-3" /> Signed
            </span>
          )}
        </div>
      </div>

      {/* Messages stream */}
      <div className="my-3 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-dim">
            <p>No messages transmitted yet.</p>
            <p className="mt-1">Click &quot;Step&quot; or &quot;Auto-play&quot; to begin the key exchange.</p>
          </div>
        ) : (
          messages.slice(0, currentStep).map((msg, idx) => {
            const isLatest = idx === currentStep - 1;
            const isAliceToBob = msg.from === 'Alice' && msg.to === 'Bob';
            const isBobToAlice = msg.from === 'Bob' && msg.to === 'Alice';
            const isEveInvolved = msg.from === 'Eve' || msg.to === 'Eve';

            return (
              <div
                key={msg.id + idx}
                className={`group relative rounded-xl border p-3 transition-all duration-300 animate-fade-in ${
                  isLatest
                    ? 'border-[#333] bg-[#121212] ring-1 ring-white/10 shadow-md'
                    : 'border-[#171717] bg-[#0a0a0a]'
                }`}
              >
                {/* Packet metadata bar */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">
                      {msg.name}
                    </span>
                    <span className="text-[11px] text-dim">
                      Round {msg.round}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        msg.from === 'Alice'
                          ? 'text-white'
                          : msg.from === 'Bob'
                          ? 'text-white'
                          : 'text-status-fail'
                      }`}
                    >
                      {msg.from}
                    </span>
                    {isAliceToBob && (
                      <ArrowRight className="h-3 w-3 text-muted" />
                    )}
                    {isBobToAlice && (
                      <ArrowLeft className="h-3 w-3 text-muted" />
                    )}
                    {isEveInvolved && (
                      <span className="text-status-fail">⇄</span>
                    )}
                    <span
                      className={`font-semibold ${
                        msg.to === 'Alice'
                          ? 'text-white'
                          : msg.to === 'Bob'
                          ? 'text-white'
                          : 'text-status-fail'
                      }`}
                    >
                      {msg.to}
                    </span>
                  </div>
                </div>

                {/* Mathematical formula */}
                <div className="mt-2 text-xs text-muted">
                  <span className="text-[10px] uppercase text-dim">Formula: </span>
                  <code className="font-mono text-white/90">{msg.formula}</code>
                </div>

                {/* Value readout with copy & inspect */}
                <div className="mt-2 flex items-center justify-between rounded-lg border border-[#141414] bg-[#050505] px-2.5 py-1.5 font-mono text-xs">
                  <span className="truncate text-[#cccccc]">
                    {formatBigIntTruncated(msg.value, 8, 8)}
                  </span>

                  <div className="ml-2 flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyValue(msg.id + idx, msg.value.toString(10))}
                      title="Copy decimal value"
                      className="rounded p-1 text-dim hover:bg-[#1a1a1a] hover:text-white"
                    >
                      {copiedId === msg.id + idx ? (
                        <Check className="h-3 w-3 text-status-ok" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedMessage(msg)}
                      title="Inspect full value & signature"
                      className="rounded p-1 text-dim hover:bg-[#1a1a1a] hover:text-white"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Signature status */}
                {msg.signature && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted">
                    <ShieldCheck className="h-3 w-3 text-status-ok" />
                    <span className="font-mono text-dim truncate">
                      Sig: {msg.signature.slice(0, 16)}...
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Dialog for inspecting full message */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-card border border-card-border bg-[#0d0d0d] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <h4 className="text-base font-bold text-white">
                  Message Details: {selectedMessage.name}
                </h4>
                <p className="text-xs text-muted">
                  Round {selectedMessage.round} • {selectedMessage.from} → {selectedMessage.to}
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="rounded-lg border border-[#262626] bg-[#141414] px-2.5 py-1 text-xs text-muted hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-dim">Formula:</span>
                <div className="mt-1 rounded-lg border border-[#222] bg-[#050505] p-2 font-mono text-white">
                  {selectedMessage.formula}
                </div>
              </div>

              <div>
                <span className="font-semibold text-dim">Full Value (Decimal):</span>
                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-[#222] bg-[#050505] p-2 font-mono text-[11px] text-[#cccccc] break-all select-all">
                  {selectedMessage.value.toString(10)}
                </div>
              </div>

              <div>
                <span className="font-semibold text-dim">Full Value (Hex):</span>
                <div className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-[#222] bg-[#050505] p-2 font-mono text-[11px] text-[#cccccc] break-all select-all">
                  0x{selectedMessage.value.toString(16)}
                </div>
              </div>

              {selectedMessage.signature && (
                <div>
                  <span className="font-semibold text-dim">ECDSA P-256 Signature (Hex):</span>
                  <div className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-[#222] bg-[#050505] p-2 font-mono text-[11px] text-status-ok break-all select-all">
                    {selectedMessage.signature}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
