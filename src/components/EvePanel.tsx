import React, { useState } from 'react';
import { ShieldCheck, Radio, AlertOctagon, Copy, Check } from 'lucide-react';
import { ProtocolMessage } from '../crypto/protocol';
import { EveSessionResult } from '../crypto/eve';
import { formatBigIntTruncated } from '../crypto/bigint';

interface EvePanelProps {
  eveActive: boolean;
  authenticated: boolean;
  eveResult: EveSessionResult | null;
  publicMessages: ProtocolMessage[];
  currentStep: number;
}

export const EvePanel: React.FC<EvePanelProps> = ({
  eveActive,
  authenticated,
  eveResult,
  publicMessages,
  currentStep,
}) => {
  const [activeTab, setActiveTab] = useState<'passive' | 'active'>('passive');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const displayedMessages = publicMessages.slice(0, currentStep);

  return (
    <div className="mt-6 rounded-card border border-card-border bg-[#080808] p-5">
      {/* Header and Mode Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#1a1a1a] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#141414]">
            <Radio className="h-4 w-4 text-muted" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Adversary Analysis: Eve</h3>
            <p className="text-xs text-muted">
              Passive Wiretap Inspection & Active Man-In-The-Middle Interception
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg border border-[#222] bg-[#0f0f0f] p-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('passive')}
            className={`rounded-md px-3 py-1 transition ${
              activeTab === 'passive'
                ? 'bg-[#222] text-white shadow-sm'
                : 'text-muted hover:text-white'
            }`}
          >
            Eavesdropper Sees (Passive)
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`rounded-md px-3 py-1 transition ${
              activeTab === 'active'
                ? 'bg-[#222] text-white shadow-sm'
                : 'text-muted hover:text-white'
            }`}
          >
            Active MITM Attack
          </button>
        </div>
      </div>

      {/* Tab 1: Passive Eavesdropper View */}
      {activeTab === 'passive' && (
        <div className="mt-4 animate-fade-in space-y-3">
          <div className="flex items-center justify-between text-xs text-dim">
            <span>Publicly Visible On-the-Wire Transcripts (M1..M6)</span>
            <span>{displayedMessages.length} Messages Observed</span>
          </div>

          {displayedMessages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1f1f1f] p-6 text-center text-xs text-dim">
              No wiretap data yet. Advance the simulation to observe wiretap captures.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {displayedMessages.map((msg, idx) => (
                <div
                  key={msg.id + idx}
                  className="rounded-lg border border-[#171717] bg-[#0c0c0c] p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-dim">
                      {msg.from} → {msg.to}
                    </span>
                  </div>

                  <div className="mt-1 font-mono text-[11px] text-muted truncate">
                    {formatBigIntTruncated(msg.value, 6, 6)}
                  </div>

                  <div className="mt-2 text-[10px] text-dim">
                    Formula: <code className="text-[#a0a0a0]">{msg.formula}</code>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 rounded-lg border border-[#171717] bg-[#060606] p-3 text-xs text-muted leading-relaxed">
            <span className="font-semibold text-white">Adversary Limitation: </span>
            A passive eavesdropper observing <code className="text-white">M1..M6</code> cannot isolate{' '}
            <code className="text-white">K_A</code> or <code className="text-white">K_B</code> without solving the
            Discrete Logarithm Problem (DLP) or breaking the commutativity assumptions of the cyclic subgroup.
          </div>
        </div>
      )}

      {/* Tab 2: Active MITM View */}
      {activeTab === 'active' && (
        <div className="mt-4 animate-fade-in space-y-4">
          {!eveActive ? (
            <div className="rounded-lg border border-dashed border-[#222] bg-[#0a0a0a] p-6 text-center text-xs text-muted">
              <AlertOctagon className="mx-auto h-8 w-8 text-dim mb-2" />
              <p className="font-medium text-white">Active MITM is currently toggled OFF</p>
              <p className="mt-1 text-dim">
                Enable the &quot;Active attacker (MITM)&quot; switch in the controls above to simulate Eve intercepting and forging messages.
              </p>
            </div>
          ) : (
            <div>
              {/* Outcome 1: Unauthenticated -> Compromised */}
              {!authenticated && eveResult?.compromised && (
                <div className="rounded-xl border border-[#4d1515] bg-[#1a0808] p-4 text-xs">
                  <div className="flex items-center gap-2.5 text-status-fail">
                    <AlertOctagon className="h-5 w-5" />
                    <span className="text-sm font-bold">
                      Session compromised — Eve holds both keys
                    </span>
                  </div>
                  <p className="mt-2 text-muted leading-relaxed">
                    Because messages lack cryptographic origin authentication, Eve intercepted the blinding rounds,
                    super-blinded with her own private exponents <code className="text-white">eB1</code> and{' '}
                    <code className="text-white">eA2</code>, and successfully recovered both secret contributions.
                  </p>

                  {/* Intercepted Secrets Grid */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#301111] bg-[#120606] p-3">
                      <div className="text-[10px] font-semibold uppercase text-dim">
                        Recovered Secret K_A
                      </div>
                      <div className="mt-1 font-mono text-status-fail truncate">
                        {eveResult.recoveredKA
                          ? formatBigIntTruncated(eveResult.recoveredKA, 8, 8)
                          : '—'}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#301111] bg-[#120606] p-3">
                      <div className="text-[10px] font-semibold uppercase text-dim">
                        Recovered Secret K_B
                      </div>
                      <div className="mt-1 font-mono text-status-fail truncate">
                        {eveResult.recoveredKB
                          ? formatBigIntTruncated(eveResult.recoveredKB, 8, 8)
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Derived Dual Session Keys */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-[#301111] bg-[#120606] px-3 py-2 font-mono">
                      <span className="text-muted">Alice&apos;s SK (with Eve):</span>
                      <div className="flex items-center gap-2 text-status-fail truncate">
                        <span>{eveResult.eveKeyWithAliceHex?.slice(0, 16)}...</span>
                        {eveResult.eveKeyWithAliceHex && (
                          <button
                            onClick={() =>
                              copyToClipboard('eveAlice', eveResult.eveKeyWithAliceHex!)
                            }
                            className="text-dim hover:text-white"
                          >
                            {copiedKey === 'eveAlice' ? (
                              <Check className="h-3 w-3 text-status-ok" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-[#301111] bg-[#120606] px-3 py-2 font-mono">
                      <span className="text-muted">Bob&apos;s SK (with Eve):</span>
                      <div className="flex items-center gap-2 text-status-fail truncate">
                        <span>{eveResult.eveKeyWithBobHex?.slice(0, 16)}...</span>
                        {eveResult.eveKeyWithBobHex && (
                          <button
                            onClick={() =>
                              copyToClipboard('eveBob', eveResult.eveKeyWithBobHex!)
                            }
                            className="text-dim hover:text-white"
                          >
                            {copiedKey === 'eveBob' ? (
                              <Check className="h-3 w-3 text-status-ok" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-status-fail font-semibold">
                    Notice: Alice&apos;s SK ≠ Bob&apos;s SK. Eve transparently decrypts, reads, and re-encrypts all communications.
                  </div>
                </div>
              )}

              {/* Outcome 2: Authenticated -> Blocked */}
              {authenticated && (
                <div className="rounded-xl border border-[#163a16] bg-[#081708] p-4 text-xs">
                  <div className="flex items-center gap-2.5 text-status-ok">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-bold">
                      Attack blocked — signature invalid, session aborted
                    </span>
                  </div>
                  <p className="mt-2 text-muted leading-relaxed">
                    Alice and Bob have pre-shared pinned ECDSA P-256 public keys. Every wire message is signed over{' '}
                    <code className="text-white">(round ‖ message ‖ session_id)</code>. When Eve injects forged
                    packets, the signature verification fails immediately and the protocol aborts.
                  </p>
                  <div className="mt-3 rounded-lg border border-[#1b441b] bg-[#0a1f0a] px-3 py-2 font-mono text-[11px] text-status-ok">
                    Abort Log: Peer signature check failed for intercepted message. Protocol cleanly terminated.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
