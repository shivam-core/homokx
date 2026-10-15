import React from 'react';
import { BookOpen, Github } from 'lucide-react';

export const Navbar: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1f1f1f] bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo mark + Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] shadow-inner">
            <span className="font-mono text-base font-bold tracking-tighter text-white">
              H
            </span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            HomoKX
          </span>
          <span className="hidden rounded-full border border-[#222222] bg-[#0a0a0a] px-2.5 py-0.5 text-xs text-[#8a8a8a] md:inline-block">
            Homomorphic Key Exchange
          </span>
        </div>

        {/* Right: Ghost buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => scrollTo('spec')}
            className="flex items-center gap-2 rounded-btn border border-border-ghost bg-transparent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:border-[#444] hover:bg-[#141414] sm:text-sm"
          >
            <BookOpen className="h-4 w-4 text-[#8a8a8a]" />
            <span>Protocol Spec</span>
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-btn border border-border-ghost bg-transparent px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:border-[#444] hover:bg-[#141414] sm:text-sm"
          >
            <Github className="h-4 w-4 text-[#8a8a8a]" />
            <span>GitHub Repo</span>
          </a>
        </div>
      </div>
    </header>
  );
};
