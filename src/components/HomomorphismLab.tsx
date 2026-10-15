import React, { useState, useMemo } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { TOY_GROUP_P, TOY_GROUP_Q } from '../crypto/params';
import { modInv } from '../crypto/bigint';
import {
  E,
  sampleSubgroupElement,
  samplePrivateExponent,
  isValidGroupElement,
} from '../crypto/homomorphic';

export const HomomorphismLab: React.FC = () => {
  const p = TOY_GROUP_P; // 1019
  const q = TOY_GROUP_Q; // 509

  // State for Multiplicative Homomorphism
  const [m1, setM1] = useState<bigint>(() => sampleSubgroupElement(p, q));
  const [m2, setM2] = useState<bigint>(() => sampleSubgroupElement(p, q));
  const [k, setK] = useState<bigint>(() => samplePrivateExponent(q));

  // State for Commutativity & Inversion
  const [commM, setCommM] = useState<bigint>(() => sampleSubgroupElement(p, q));
  const [expA, setExpA] = useState<bigint>(() => samplePrivateExponent(q));
  const [expB, setExpB] = useState<bigint>(() => samplePrivateExponent(q));

  // Calculations for Multiplicative Homomorphism: E_k(m1 * m2) == E_k(m1) * E_k(m2)
  const isM1Valid = isValidGroupElement(m1, p, q);
  const isM2Valid = isValidGroupElement(m2, p, q);

  const em1 = useMemo(() => (isM1Valid ? E(m1, k, p) : 0n), [m1, k, p, isM1Valid]);
  const em2 = useMemo(() => (isM2Valid ? E(m2, k, p) : 0n), [m2, k, p, isM2Valid]);

  const productInside = useMemo(
    () => (isM1Valid && isM2Valid ? (m1 * m2) % p : 0n),
    [m1, m2, p, isM1Valid, isM2Valid]
  );
  const leftSide = useMemo(
    () => (isM1Valid && isM2Valid ? E(productInside, k, p) : 0n),
    [productInside, k, p, isM1Valid, isM2Valid]
  );
  const rightSide = useMemo(
    () => (isM1Valid && isM2Valid ? (em1 * em2) % p : 0n),
    [em1, em2, p, isM1Valid, isM2Valid]
  );
  const isH1Equal = isM1Valid && isM2Valid && leftSide === rightSide;

  // Calculations for Commutativity: E_a(E_b(m)) == E_b(E_a(m))
  const isCommMValid = isValidGroupElement(commM, p, q);
  const ebM = useMemo(
    () => (isCommMValid ? E(commM, expB, p) : 0n),
    [commM, expB, p, isCommMValid]
  );
  const eaEbM = useMemo(
    () => (isCommMValid ? E(ebM, expA, p) : 0n),
    [ebM, expA, p, isCommMValid]
  );

  const eaM = useMemo(
    () => (isCommMValid ? E(commM, expA, p) : 0n),
    [commM, expA, p, isCommMValid]
  );
  const ebEaM = useMemo(
    () => (isCommMValid ? E(eaM, expB, p) : 0n),
    [eaM, expB, p, isCommMValid]
  );
  const isH2Equal = isCommMValid && eaEbM === ebEaM;

  // Invertibility: E_{k^-1}(E_k(m)) == m
  const kInv = useMemo(() => {
    try {
      return modInv(k, q);
    } catch {
      return 0n;
    }
  }, [k, q]);
  const unblindedM1 = useMemo(
    () => (isM1Valid && kInv > 0n ? E(em1, kInv, p) : 0n),
    [em1, kInv, p, isM1Valid]
  );
  const isH3Equal = isM1Valid && unblindedM1 === m1;

  // Randomizers
  const randomizeH1 = () => {
    setM1(sampleSubgroupElement(p, q));
    setM2(sampleSubgroupElement(p, q));
    setK(samplePrivateExponent(q));
  };

  const randomizeH2 = () => {
    setCommM(sampleSubgroupElement(p, q));
    setExpA(samplePrivateExponent(q));
    setExpB(samplePrivateExponent(q));
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Interactive Laboratory
        </h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Homomorphism & Commutativity Lab
        </p>
        <p className="mx-auto mt-2 max-w-xl text-xs text-muted sm:text-sm">
          Experiment live with the algebraic properties powering HomoKX in the toy group (p = 1019, q = 509).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Lab Card 1: Multiplicative Homomorphism */}
        <div className="flex flex-col rounded-card border border-card-border bg-card p-6">
          <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-status-ok">
                Property (H1)
              </span>
              <h3 className="text-base font-bold text-white">
                Multiplicative Homomorphism
              </h3>
            </div>
            <button
              onClick={randomizeH1}
              className="flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#121212] px-2.5 py-1 text-xs text-muted hover:border-[#444] hover:text-white"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Randomize</span>
            </button>
          </div>

          <p className="mt-3 text-xs text-muted">
            Raising elements to exponent <code className="text-white">k</code> preserves multiplication mod p:
          </p>
          <div className="mt-2 rounded-lg border border-[#1a1a1a] bg-[#050505] p-2 text-center font-mono text-xs text-white">
            {'E_k(m1 · m2) ≡ E_k(m1) · E_k(m2) (mod p)'}
          </div>

          {/* Inputs */}
          <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-dim">m1 (subgroup):</label>
              <input
                type="number"
                value={m1.toString()}
                onChange={(e) => {
                  try {
                    setM1(BigInt(e.target.value));
                  } catch {
                    // ignore invalid input
                  }
                }}
                className="mt-1 w-full rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-2 font-mono text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-dim">m2 (subgroup):</label>
              <input
                type="number"
                value={m2.toString()}
                onChange={(e) => {
                  try {
                    setM2(BigInt(e.target.value));
                  } catch {
                    // ignore invalid input
                  }
                }}
                className="mt-1 w-full rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-2 font-mono text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-dim">k (exponent):</label>
              <input
                type="number"
                value={k.toString()}
                onChange={(e) => {
                  try {
                    setK(BigInt(e.target.value));
                  } catch {
                    // ignore invalid input
                  }
                }}
                className="mt-1 w-full rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-2 font-mono text-white focus:border-white focus:outline-none"
              />
            </div>
          </div>

          {/* Live Computations */}
          <div className="mt-5 space-y-2 rounded-xl border border-[#1a1a1a] bg-[#080808] p-3 text-xs font-mono">
            <div className="flex justify-between text-muted">
              <span>E(m1) = {m1.toString()}^{k.toString()} mod 1019:</span>
              <span className="text-white">{em1.toString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>E(m2) = {m2.toString()}^{k.toString()} mod 1019:</span>
              <span className="text-white">{em2.toString()}</span>
            </div>
            <div className="border-t border-[#1a1a1a] pt-2 flex justify-between text-muted">
              <span>E(m1 · m2 mod p):</span>
              <span className="text-white">{leftSide.toString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>E(m1) · E(m2) mod p:</span>
              <span className="text-white">{rightSide.toString()}</span>
            </div>
          </div>

          {/* EQUAL Badge */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3.5 py-2.5">
            <span className="text-xs text-muted">Verification Status:</span>
            {isH1Equal ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ok/30 bg-[#0c240c] px-3 py-0.5 text-xs font-bold text-status-ok">
                <CheckCircle2 className="h-3.5 w-3.5" />
                EQUAL ✓
              </span>
            ) : (
              <span className="text-xs font-bold text-status-fail">
                Invalid Subgroup Element ✗
              </span>
            )}
          </div>
        </div>

        {/* Lab Card 2: Commutativity & Invertibility */}
        <div className="flex flex-col rounded-card border border-card-border bg-card p-6">
          <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-status-ok">
                Property (H2 & H3)
              </span>
              <h3 className="text-base font-bold text-white">
                Commutativity & Invertibility
              </h3>
            </div>
            <button
              onClick={randomizeH2}
              className="flex items-center gap-1.5 rounded-lg border border-[#222] bg-[#121212] px-2.5 py-1 text-xs text-muted hover:border-[#444] hover:text-white"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Randomize</span>
            </button>
          </div>

          <p className="mt-3 text-xs text-muted">
            Exponentiation commutes under successive applications, enabling unblinding in any order:
          </p>
          <div className="mt-2 rounded-lg border border-[#1a1a1a] bg-[#050505] p-2 text-center font-mono text-xs text-white">
            {'E_a(E_b(m)) ≡ E_b(E_a(m)) ≡ m^(a·b) (mod p)'}
          </div>

          {/* Inputs */}
          <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-dim">m (subgroup):</label>
              <input
                type="number"
                value={commM.toString()}
                onChange={(e) => {
                  try {
                    setCommM(BigInt(e.target.value));
                  } catch {
                    // ignore invalid input
                  }
                }}
                className="mt-1 w-full rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-2 font-mono text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-dim">a (exp A):</label>
              <input
                type="number"
                value={expA.toString()}
                onChange={(e) => {
                  try {
                    setExpA(BigInt(e.target.value));
                  } catch {
                    // ignore invalid input
                  }
                }}
                className="mt-1 w-full rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-2 font-mono text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-dim">b (exp B):</label>
              <input
                type="number"
                value={expB.toString()}
                onChange={(e) => {
                  try {
                    setExpB(BigInt(e.target.value));
                  } catch {
                    // ignore invalid input
                  }
                }}
                className="mt-1 w-full rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-2 font-mono text-white focus:border-white focus:outline-none"
              />
            </div>
          </div>

          {/* Live Computations */}
          <div className="mt-5 space-y-2 rounded-xl border border-[#1a1a1a] bg-[#080808] p-3 text-xs font-mono">
            <div className="flex justify-between text-muted">
              <span>E_a(E_b(m)) = ({ebM.toString()})^{expA.toString()} mod 1019:</span>
              <span className="text-white">{eaEbM.toString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>E_b(E_a(m)) = ({eaM.toString()})^{expB.toString()} mod 1019:</span>
              <span className="text-white">{ebEaM.toString()}</span>
            </div>
            <div className="border-t border-[#1a1a1a] pt-2 flex justify-between text-muted">
              <span>{`Inversion: k^-1 mod ${q}:`}</span>
              <span className="text-white">{kInv.toString()}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{`Unblind E_${kInv.toString()}(E_k(m1)):`}</span>
              <span className="text-status-ok">{unblindedM1.toString()} (orig: {m1.toString()})</span>
            </div>
          </div>

          {/* Commutativity & Invertibility Status */}
          <div className="mt-4 flex items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3.5 py-2.5">
            <span className="text-xs text-muted">Commutativity Check:</span>
            {isH2Equal && isH3Equal ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ok/30 bg-[#0c240c] px-3 py-0.5 text-xs font-bold text-status-ok">
                <CheckCircle2 className="h-3.5 w-3.5" />
                E_a(E_b(m)) == E_b(E_a(m)) ✓
              </span>
            ) : (
              <span className="text-xs font-bold text-status-fail">
                Verification Failed ✗
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
