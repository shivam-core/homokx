import React from 'react';
import { ShieldCheck, FileCode, CheckCircle2 } from 'lucide-react';

export const SpecSection: React.FC = () => {
  return (
    <section id="spec" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Formal Cryptographic Architecture
        </h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          HomoKX Protocol Specification
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-muted sm:text-sm">
          Detailed cryptographic formulation of the 3-round commutative homomorphic blinding exchange.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Mathematical Group Setup */}
        <div className="rounded-card border border-card-border bg-card p-6">
          <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
            <FileCode className="h-5 w-5 text-status-ok" />
            <h3 className="text-base font-bold text-white">
              1. Mathematical Group & Subgroup Setup
            </h3>
          </div>

          <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
            <p>
              Let <code className="text-white">p = 2q + 1</code> be a safe prime where both <code className="text-white">p</code> and{' '}
              <code className="text-white">q</code> are prime. We operate in the unique cyclic subgroup{' '}
              <code className="text-white">G_q ⊂ Z_p*</code> of quadratic residues of prime order{' '}
              <code className="text-white">q</code>.
            </p>

            <div className="rounded-lg border border-[#1a1a1a] bg-[#050505] p-3 font-mono text-[11px] text-white">
              <div>Production Group: RFC 3526 §3 2048-bit MODP (Group 14)</div>
              <div className="mt-1 text-dim">Toy Group: p = 1019, q = 509 (for visualization and teaching)</div>
            </div>

            <p>
              Every message and secret contribution <code className="text-white">x</code> must satisfy subgroup membership:
            </p>
            <div className="rounded-lg border border-[#1a1a1a] bg-[#050505] p-2 text-center font-mono text-white">
              {'2 ≤ x ≤ p - 2  and  x^q ≡ 1 (mod p)'}
            </div>
          </div>
        </div>

        {/* Card 2: Homomorphic Exponentiation & Commutativity */}
        <div className="rounded-card border border-card-border bg-card p-6">
          <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
            <CheckCircle2 className="h-5 w-5 text-status-ok" />
            <h3 className="text-base font-bold text-white">
              2. Homomorphic Properties & Inversion Modulo q
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
            <div className="rounded-lg border border-[#171717] bg-[#0c0c0c] p-3.5">
              <span className="font-semibold text-white">Multiplicative Homomorphism</span>
              <div className="mt-2 rounded border border-[#1a1a1a] bg-[#050505] p-2 font-mono text-[11px] text-white">
                {'E_k(m1 · m2) ≡ E_k(m1) · E_k(m2) (mod p)'}
              </div>
              <p className="mt-2 text-dim text-[11px]">
                Exponentiation distributes across group products.
              </p>
            </div>

            <div className="rounded-lg border border-[#171717] bg-[#0c0c0c] p-3.5">
              <span className="font-semibold text-white">Commutativity</span>
              <div className="mt-2 rounded border border-[#1a1a1a] bg-[#050505] p-2 font-mono text-[11px] text-white">
                {'E_a(E_b(m)) ≡ E_b(E_a(m)) ≡ m^(a·b) (mod p)'}
              </div>
              <p className="mt-2 text-dim text-[11px]">
                Blinding operations commute under composition.
              </p>
            </div>

            <div className="rounded-lg border border-[#171717] bg-[#0c0c0c] p-3.5">
              <span className="font-semibold text-white">Invertibility Modulo q</span>
              <div className="mt-2 rounded border border-[#1a1a1a] bg-[#050505] p-2 font-mono text-[11px] text-white">
                {'E_(k^-1 mod q)(E_k(m)) ≡ m (mod p)'}
              </div>
              <p className="mt-2 text-dim text-[11px]">
                Because elements have order <code className="text-white">q</code>, exponents invert mod <code className="text-white">q</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: The 3 Rounds & Recovery */}
        <div className="rounded-card border border-card-border bg-card p-6">
          <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
            <FileCode className="h-5 w-5 text-status-ok" />
            <h3 className="text-base font-bold text-white">
              3. Three-Pass Execution Steps
            </h3>
          </div>

          <div className="mt-4 space-y-4 text-xs font-mono">
            {/* Round 1 */}
            <div className="rounded-lg border border-[#1a1a1a] bg-[#080808] p-3">
              <div className="font-semibold text-status-ok">Round 1: Initial Blinding</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-white sm:grid-cols-2">
                <div className="rounded border border-[#141414] bg-[#050505] p-2">
                  <span className="text-dim">Alice → Bob: </span>
                  <code>{'M1 = K_A^a1 mod p'}</code>
                </div>
                <div className="rounded border border-[#141414] bg-[#050505] p-2">
                  <span className="text-dim">Bob → Alice: </span>
                  <code>{'M2 = K_B^b2 mod p'}</code>
                </div>
              </div>
            </div>

            {/* Round 2 */}
            <div className="rounded-lg border border-[#1a1a1a] bg-[#080808] p-3">
              <div className="font-semibold text-status-ok">Round 2: Cross Super-Blinding</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-white sm:grid-cols-2">
                <div className="rounded border border-[#141414] bg-[#050505] p-2">
                  <span className="text-dim">Bob → Alice: </span>
                  <code>{'M3 = M1^b1 = K_A^(a1·b1) mod p'}</code>
                </div>
                <div className="rounded border border-[#141414] bg-[#050505] p-2">
                  <span className="text-dim">Alice → Bob: </span>
                  <code>{'M4 = M2^a2 = K_B^(b2·a2) mod p'}</code>
                </div>
              </div>
            </div>

            {/* Round 3 */}
            <div className="rounded-lg border border-[#1a1a1a] bg-[#080808] p-3">
              <div className="font-semibold text-status-ok">Round 3: Initiator Unblinding</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-white sm:grid-cols-2">
                <div className="rounded border border-[#141414] bg-[#050505] p-2">
                  <span className="text-dim">Alice → Bob: </span>
                  <code>{'M5 = M3^(a1^-1 mod q) = K_A^b1 mod p'}</code>
                </div>
                <div className="rounded border border-[#141414] bg-[#050505] p-2">
                  <span className="text-dim">Bob → Alice: </span>
                  <code>{'M6 = M4^(b2^-1 mod q) = K_B^a2 mod p'}</code>
                </div>
              </div>
            </div>

            {/* Secret Recovery */}
            <div className="rounded-lg border border-[#1a1a1a] bg-[#080808] p-3">
              <div className="font-semibold text-status-ok">Secret Recovery & Verification</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-white sm:grid-cols-2">
                <div className="rounded border border-[#141414] bg-[#050505] p-2">
                  <span className="text-dim">Bob recovers K_A: </span>
                  <code>{'K_A = M5^(b1^-1 mod q) mod p'}</code>
                </div>
                <div className="rounded border border-[#141414] bg-[#050505] p-2">
                  <span className="text-dim">Alice recovers K_B: </span>
                  <code>{'K_B = M6^(a2^-1 mod q) mod p'}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: KDF & Key Confirmation */}
        <div className="rounded-card border border-card-border bg-card p-6">
          <div className="flex items-center gap-2.5 border-b border-[#1f1f1f] pb-3">
            <ShieldCheck className="h-5 w-5 text-status-ok" />
            <h3 className="text-base font-bold text-white">
              4. Key Derivation (HKDF-SHA256) & Key Confirmation
            </h3>
          </div>

          <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
            <p>
              Once both sides possess <code className="text-white">K_A</code> and <code className="text-white">K_B</code>,
              the session key is derived by binding both contributed secrets with the full wire transcript:
            </p>
            <div className="rounded-lg border border-[#1a1a1a] bg-[#050505] p-3 font-mono text-[11px] text-white space-y-1">
              <div>{'ikm = I2OSP(K_A) ‖ I2OSP(K_B)'}</div>
              <div>{'salt = SHA-256(I2OSP(M1) ‖ ... ‖ I2OSP(M6))'}</div>
              <div>{'SK = HKDF-Extract-and-Expand(ikm, salt, info = "HomoKX v1", length = 32 bytes)'}</div>
            </div>

            <p>
              Each party then transmits a mutual key confirmation tag computed as:
            </p>
            <div className="rounded-lg border border-[#1a1a1a] bg-[#050505] p-2 text-center font-mono text-white">
              {'tag = HMAC-SHA256(SK, "confirm" ‖ role ‖ salt)'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
