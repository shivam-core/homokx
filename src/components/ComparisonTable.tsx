import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export const ComparisonTable: React.FC = () => {
  const comparisons = [
    {
      feature: 'Interactive Rounds',
      dh: '1 round',
      homokx: '3 rounds',
      dhNote: 'Minimal latency (two unidirectional passes)',
      homoNote: '3-pass blinding (Shamir/Massey–Omura lineage)',
    },
    {
      feature: 'Wire Messages Exchanged',
      dh: '2 messages (g^a, g^b)',
      homokx: '6 messages (M1..M6)',
      dhNote: 'Single exchange of public components',
      homoNote: 'Parallel blinding, super-blinding, and unblinding',
    },
    {
      feature: 'Modular Exponentiations / Party',
      dh: '2 exponentiations',
      homokx: '~6 exponentiations',
      dhNote: '1 to generate public key, 1 to derive secret',
      homoNote: 'Blinding, super-blinding, inversion, & unblinding',
    },
    {
      feature: 'Contributory Key Material',
      dh: 'Yes (Mutual)',
      homokx: 'Yes (Mutual)',
      dhNote: 'Both sides pick exponents that form g^(ab)',
      homoNote: 'Both sides pick independent secrets K_A and K_B',
      isBothYes: true,
    },
    {
      feature: 'Forward Secrecy (PFS)',
      dh: 'Yes (with ephemeral keys)',
      homokx: 'Yes (with ephemeral keys)',
      dhNote: 'Ephemeral private keys discarded after session',
      homoNote: 'Fresh random exponents and secrets per session',
      isBothYes: true,
    },
    {
      feature: 'Authentication Mechanism',
      dh: 'None by default (needs SIGMA / TLS)',
      homokx: 'None by default / Optional ECDSA P-256',
      dhNote: 'Vulnerable to active MITM without PKI/signatures',
      homoNote: 'Vulnerable to active MITM unless signed with ECDSA',
    },
    {
      feature: 'Hardness Assumption',
      dh: 'CDH / DDH / DLP',
      homokx: 'DLP-family (Subgroup DL)',
      dhNote: 'Decades of cryptanalysis and standardized groups',
      homoNote: 'Three-pass security is less widely studied than DH',
      isWarning: true,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Protocol Analysis
        </h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Diffie-Hellman vs. HomoKX
        </p>
        <p className="mx-auto mt-2 max-w-xl text-xs text-muted sm:text-sm">
          A side-by-side comparison of communication complexity, computational overhead, and underlying cryptographic guarantees.
        </p>
      </div>

      <div className="overflow-hidden rounded-card border border-card-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1f1f1f] bg-[#0c0c0c] text-muted">
                <th className="py-4 px-6 font-semibold uppercase tracking-wider">
                  Dimension / Property
                </th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-white">
                  Diffie-Hellman (RFC 3526)
                </th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-white">
                  HomoKX (Homomorphic 3-Pass)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]">
              {comparisons.map((row, idx) => (
                <tr
                  key={idx}
                  className="transition hover:bg-[#0f0f0f]"
                >
                  {/* Property Name */}
                  <td className="py-4 px-6 font-medium text-white">
                    {row.feature}
                  </td>

                  {/* Diffie Hellman */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {row.isBothYes ? (
                        <Check className="h-4 w-4 text-status-ok shrink-0" />
                      ) : null}
                      <span className="font-semibold text-[#e0e0e0]">
                        {row.dh}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-dim">{row.dhNote}</p>
                  </td>

                  {/* HomoKX */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {row.isBothYes ? (
                        <Check className="h-4 w-4 text-status-ok shrink-0" />
                      ) : row.isWarning ? (
                        <AlertCircle className="h-4 w-4 text-status-warning shrink-0" />
                      ) : null}
                      <span className="font-semibold text-white">
                        {row.homokx}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-dim">{row.homoNote}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
