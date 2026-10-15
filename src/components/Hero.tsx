import React from 'react';
import { ArrowDown } from 'lucide-react';

export const Hero: React.FC = () => {
  const scrollToSimulator = () => {
    const el = document.getElementById('simulator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8">
      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-border-badge bg-[#0a0a0a]/90 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm sm:text-sm">
        <span className="h-2 w-2 rounded-full bg-status-ok animate-pulse-glow" />
        <span>v1.0 Prototype • 2048-bit MODP Group</span>
      </div>

      {/* Hero Headline */}
      <h1 className="mt-8 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
        <span className="gradient-text block">Key Exchange,</span>
        <span className="gradient-text block">Reimagined.</span>
      </h1>

      {/* Subtext */}
      <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg lg:text-xl">
        Two parties agree on a secret by blinding and unblinding a value with commutative homomorphic functions — no shared key, no Diffie-Hellman public keys.
      </p>

      {/* Secondary Gray Paragraph */}
      <p className="mx-auto mt-4 max-w-2xl text-xs text-dim sm:text-sm">
        HomoKX uses the multiplicative homomorphism of modular exponentiation, mutual key contribution, and subgroup validation.
      </p>

      {/* Primary CTA */}
      <div className="mt-9 flex flex-col items-center">
        <button
          onClick={scrollToSimulator}
          className="btn-primary-glow group flex items-center gap-2 rounded-btn bg-white px-7 py-3.5 text-sm font-bold text-black shadow-lg transition-all"
        >
          <span>Run Simulation ↓</span>
          <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
        </button>

        {/* Gray Caption Line */}
        <p className="mt-3 text-xs text-dim">
          Educational prototype. Not for production use.
        </p>
      </div>
    </section>
  );
};
