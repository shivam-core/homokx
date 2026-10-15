import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: 1,
      title: 'Blind',
      description: 'Each party raises a secret value to a private exponent.',
      formula: 'M_1 = K_A^{a_1} \\bmod p',
    },
    {
      num: 2,
      title: 'Swap',
      description:
        'Values are exchanged and blinded again by the other party; exponentiation commutes.',
      formula: 'M_3 = M_1^{b_1} = K_A^{a_1 \\cdot b_1} \\bmod p',
    },
    {
      num: 3,
      title: 'Unblind',
      description:
        'Each party removes its own exponent using a modular inverse, revealing the contributed secret.',
      formula: 'K_A = (M_3^{a_1^{-1}})^{b_1^{-1}} \\bmod p',
    },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          How It Works
        </h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Three-Pass Homomorphic Blinding
        </p>
      </div>

      {/* 3-column row with numbered circle badges */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.num}
            className="group relative flex flex-col items-center rounded-card border border-card-border bg-card p-8 text-center transition-all hover:border-[#2a2a2a] hover:bg-[#0e0e0e]"
          >
            {/* Circular numbered badge */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#121212] font-mono text-base font-bold text-white shadow-sm transition-transform group-hover:scale-105">
              {step.num}
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              {step.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted">
              {step.description}
            </p>

            <div className="mt-4 w-full rounded-lg border border-[#1a1a1a] bg-[#050505] px-3 py-2">
              <code className="font-mono text-xs text-[#a0a0a0]">
                {step.formula}
              </code>
            </div>
          </div>
        ))}
      </div>

      {/* One-line final-key formula */}
      <div className="mt-10 flex flex-col items-center justify-center rounded-card border border-card-border bg-[#070707] px-6 py-4 text-center">
        <span className="text-xs uppercase tracking-wider text-dim">
          Final Key Derivation Formula
        </span>
        <code className="mt-1.5 overflow-x-auto font-mono text-xs text-white sm:text-sm">
          SK = HKDF-SHA256(ikm = I2OSP(K_A) ‖ I2OSP(K_B), salt = SHA-256(M_1..M_6), info = &quot;HomoKX v1&quot;)
        </code>
      </div>
    </section>
  );
};
