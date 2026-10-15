import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#1f1f1f] bg-black py-10 text-center text-xs text-dim">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-[#222] bg-[#0c0c0c] font-mono text-xs font-bold text-white">
            H
          </div>
          <span className="font-semibold text-muted">HomoKX</span>
          <span>— A Key Exchange Built on Homomorphic Functions</span>
        </div>

        <p className="text-dim">
          Built for Cybersecurity Course Project • Educational use only
        </p>
      </div>
    </footer>
  );
};
