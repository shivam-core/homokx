import React, { useState } from 'react';
import { Eye, EyeOff, Key, ShieldCheck, Check, Copy } from 'lucide-react';
import { PartySecrets } from '../crypto/protocol';
import { formatBigIntTruncated } from '../crypto/bigint';

interface PartyCardProps {
  role: 'Alice' | 'Bob';
  secrets: PartySecrets;
  authenticated: boolean;
  fingerprint?: string;
  sessionKeyHex?: string;
  confirmationValid?: boolean;
  isActiveSender: boolean;
  isActiveReceiver: boolean;
  groupByteLength: number;
}

export const PartyCard: React.FC<PartyCardProps> = ({
  role,
  secrets,
  authenticated,
  fingerprint,
  sessionKeyHex,
  confirmationValid,
  isActiveSender,
  isActiveReceiver,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const isAlice = role === 'Alice';
  const exp1Label = isAlice ? 'a1' : 'b1';
  const exp2Label = isAlice ? 'a2' : 'b2';
  const ownSecretLabel = isAlice ? 'K_A' : 'K_B';
  const recSecretLabel = isAlice ? 'K_B' : 'K_A';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div
      className={`relative flex flex-col rounded-card border bg-card p-5 transition-all duration-300 ${
        isActiveSender
          ? 'border-white/40 ring-1 ring-white/20 shadow-[0_0_20px_rgba(255,255,255,0.06)]'
          : isActiveReceiver
          ? 'border-status-ok/40 ring-1 ring-status-ok/20'
          : 'border-card-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#141414] font-bold text-white">
            {role[0]}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{role}</h3>
            <span className="text-[11px] text-muted">
              {isAlice ? 'Initiator (Party A)' : 'Responder (Party B)'}
            </span>
          </div>
        </div>

        {/* Reveal toggle button */}
        <button
          onClick={() => setRevealed(!revealed)}
          title={revealed ? 'Hide private secrets' : 'Reveal private secrets'}
          className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#121212] px-2.5 py-1 text-xs text-muted transition hover:border-[#444] hover:text-white"
        >
          {revealed ? (
            <>
              <EyeOff className="h-3.5 w-3.5 text-muted" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5 text-muted" />
              <span>Reveal</span>
            </>
          )}
        </button>
      </div>

      {/* Auth Fingerprint Badge */}
      {authenticated && fingerprint && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-[#1e1e1e] bg-[#0d0d0d] px-2.5 py-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-status-ok">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-semibold">ECDSA P-256 Pinned</span>
          </div>
          <code className="font-mono text-dim">{fingerprint}</code>
        </div>
      )}

      {/* Secrets section */}
      <div className="mt-4 space-y-2.5 text-xs">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-dim">
          Private Secrets
        </div>

        {/* Exponent 1 */}
        <div className="flex items-center justify-between rounded-lg border border-[#171717] bg-[#0c0c0c] px-3 py-2">
          <span className="font-mono text-muted">{exp1Label} (private exp)</span>
          <span
            className={`font-mono text-white transition-all duration-200 ${
              revealed ? 'filter-none select-all' : 'blur-sm select-none'
            }`}
          >
            {revealed ? formatBigIntTruncated(secrets.e1, 7, 7) : '••••••••••••'}
          </span>
        </div>

        {/* Exponent 2 */}
        <div className="flex items-center justify-between rounded-lg border border-[#171717] bg-[#0c0c0c] px-3 py-2">
          <span className="font-mono text-muted">{exp2Label} (private exp)</span>
          <span
            className={`font-mono text-white transition-all duration-200 ${
              revealed ? 'filter-none select-all' : 'blur-sm select-none'
            }`}
          >
            {revealed ? formatBigIntTruncated(secrets.e2, 7, 7) : '••••••••••••'}
          </span>
        </div>

        {/* Own Secret Contribution */}
        <div className="flex items-center justify-between rounded-lg border border-[#171717] bg-[#0c0c0c] px-3 py-2">
          <span className="font-mono text-muted">{ownSecretLabel} (contribution)</span>
          <span
            className={`font-mono text-white transition-all duration-200 ${
              revealed ? 'filter-none select-all' : 'blur-sm select-none'
            }`}
          >
            {revealed ? formatBigIntTruncated(secrets.kOwn, 7, 7) : '••••••••••••'}
          </span>
        </div>

        {/* Recovered Peer Secret */}
        <div className="flex items-center justify-between rounded-lg border border-[#171717] bg-[#0c0c0c] px-3 py-2">
          <span className="font-mono text-muted">{recSecretLabel} (recovered)</span>
          {secrets.kRecovered ? (
            <span
              className={`font-mono text-status-ok transition-all duration-200 ${
                revealed ? 'filter-none select-all' : 'blur-sm select-none'
              }`}
            >
              {revealed
                ? formatBigIntTruncated(secrets.kRecovered, 7, 7)
                : '••••••••••••'}
            </span>
          ) : (
            <span className="font-mono text-dim italic">pending recovery</span>
          )}
        </div>
      </div>

      {/* Derived Session Key */}
      <div className="mt-4 border-t border-[#1a1a1a] pt-3">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-dim">
          <span>Derived Session Key (SK)</span>
          {confirmationValid !== undefined && (
            <span
              className={`font-mono ${
                confirmationValid ? 'text-status-ok' : 'text-status-fail'
              }`}
            >
              {confirmationValid ? 'Confirmed ✓' : 'Mismatch ✗'}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between rounded-lg border border-[#171717] bg-[#080808] px-3 py-2">
          {sessionKeyHex ? (
            <>
              <div className="flex items-center gap-1.5 overflow-hidden font-mono text-xs text-white">
                <Key className="h-3.5 w-3.5 text-muted shrink-0" />
                <span className="truncate">
                  {sessionKeyHex.slice(0, 16)}...
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(sessionKeyHex)}
                title="Copy full 32-byte session key hex"
                className="ml-2 flex items-center text-muted hover:text-white"
              >
                {copiedKey ? (
                  <Check className="h-3.5 w-3.5 text-status-ok" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </>
          ) : (
            <span className="font-mono text-xs text-dim italic">
              Awaiting protocol completion...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
