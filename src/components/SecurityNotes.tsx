import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const SecurityNotes: React.FC = () => {
  const notes = [
    'This is an educational prototype, not production cryptography.',
    'Unauthenticated, the protocol is vulnerable to man-in-the-middle attacks, exactly like plain Diffie-Hellman. The authenticated mode fixes this with signatures.',
    'It is a variant of the Shamir three-pass / Massey–Omura construction. It is less studied than Diffie-Hellman and costs 3 rounds instead of 1.',
    'Security relies on the hardness of discrete logarithms in the order-q subgroup.',
    'Exponents are never reused across runs. Received values are validated against small-subgroup attacks.',
    'Use X25519 or ECDH with authentication in real systems.',
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-card border border-card-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3 border-b border-[#1f1f1f] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#332511] bg-[#1a1208]">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Security Notes</h2>
            <p className="text-xs text-muted">
              Cryptographic limitations, adversarial boundaries, and academic considerations
            </p>
          </div>
        </div>

        {/* Verbatim bullet points list */}
        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {notes.map((note, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-[#171717] bg-[#0c0c0c] p-4 text-xs transition hover:border-[#262626]"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
              <p className="leading-relaxed text-[#d4d4d4]">{note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
