import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Copy, Check, ShieldAlert } from 'lucide-react';

interface StatusBarProps {
  currentRound: number;
  totalRounds: number;
  validationPassed: boolean;
  finalKeyHex?: string;
  keysMatch?: boolean;
  durationMs?: number;
  eveCompromised?: boolean;
  eveBlocked?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentRound,
  totalRounds,
  validationPassed,
  finalKeyHex,
  keysMatch,
  durationMs,
  eveCompromised,
  eveBlocked,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);

  const copyKey = () => {
    if (!finalKeyHex) return;
    navigator.clipboard.writeText(finalKeyHex);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="mt-4 rounded-card border border-card-border bg-[#090909] p-4 text-xs">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Protocol Progress */}
        <div className="flex items-center gap-3 rounded-lg border border-[#171717] bg-[#0c0c0c] px-3.5 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#222] bg-[#141414] font-mono text-sm font-bold text-white">
            {currentRound}/{totalRounds}
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-dim">
              Protocol Round
            </div>
            <div className="font-semibold text-white">
              {currentRound === 0
                ? 'Ready to Start'
                : currentRound < totalRounds
                ? `Executing Round ${currentRound}`
                : 'Key Exchange Complete'}
            </div>
          </div>
        </div>

        {/* Validation Check */}
        <div className="flex items-center gap-3 rounded-lg border border-[#171717] bg-[#0c0c0c] px-3.5 py-2.5">
          {validationPassed ? (
            <CheckCircle2 className="h-6 w-6 text-status-ok shrink-0" />
          ) : (
            <XCircle className="h-6 w-6 text-status-fail shrink-0" />
          )}
          <div>
            <div className="text-[10px] uppercase font-semibold text-dim">
              Subgroup Validation
            </div>
            <div className="font-mono text-xs text-white">
              {validationPassed ? (
                <span className="text-status-ok">x^q ≡ 1 (mod p) ✓</span>
              ) : (
                <span className="text-status-fail">Validation Failed ✗</span>
              )}
            </div>
          </div>
        </div>

        {/* Key Confirmation */}
        <div className="flex items-center gap-3 rounded-lg border border-[#171717] bg-[#0c0c0c] px-3.5 py-2.5">
          {eveBlocked ? (
            <ShieldAlert className="h-6 w-6 text-status-ok shrink-0" />
          ) : keysMatch === true ? (
            <CheckCircle2 className="h-6 w-6 text-status-ok shrink-0" />
          ) : keysMatch === false ? (
            <XCircle className="h-6 w-6 text-status-fail shrink-0" />
          ) : (
            <div className="h-6 w-6 rounded-full border border-dashed border-[#333] shrink-0" />
          )}

          <div>
            <div className="text-[10px] uppercase font-semibold text-dim">
              Key Confirmation
            </div>
            <div className="font-semibold">
              {eveBlocked ? (
                <span className="text-status-ok">Attack Blocked ✓</span>
              ) : eveCompromised ? (
                <span className="text-status-fail font-bold">Compromised ✗</span>
              ) : keysMatch === true ? (
                <span className="text-status-ok">Keys match ✓</span>
              ) : keysMatch === false ? (
                <span className="text-status-fail">Mismatch ✗</span>
              ) : (
                <span className="text-dim italic">Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Timing / Benchmark Readout */}
        <div className="flex items-center justify-between rounded-lg border border-[#171717] bg-[#0c0c0c] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-dim shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-dim">
                Execution Time
              </div>
              <div className="font-mono text-xs font-semibold text-white">
                {durationMs !== undefined ? `${durationMs.toFixed(1)} ms` : '—'}
              </div>
            </div>
          </div>

          {/* Copy Key Button */}
          {finalKeyHex && (
            <button
              onClick={copyKey}
              className="flex items-center gap-1 rounded border border-[#222] bg-[#141414] px-2 py-1 text-[11px] text-muted hover:text-white"
              title="Copy session key hex"
            >
              {copiedKey ? (
                <Check className="h-3 w-3 text-status-ok" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>{copiedKey ? 'Copied' : 'Key'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
