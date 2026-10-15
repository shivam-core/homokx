import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Sparkles,
  Zap,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface SimulatorControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onNewSecrets: () => void;
  onRunFullSize: () => void;
  isFullSizeRunning: boolean;

  is2048Bit: boolean;
  onToggleGroupSize: () => void;

  authenticated: boolean;
  onToggleAuthenticated: () => void;

  eveActive: boolean;
  onToggleEve: () => void;

  canStep: boolean;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  onNewSecrets,
  onRunFullSize,
  isFullSizeRunning,
  is2048Bit,
  onToggleGroupSize,
  authenticated,
  onToggleAuthenticated,
  eveActive,
  onToggleEve,
  canStep,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-card-border bg-[#090909] p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
      {/* Playback action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Step */}
        <button
          onClick={onStep}
          disabled={!canStep || isPlaying}
          className="flex items-center gap-1.5 rounded-btn border border-[#2a2a2a] bg-[#121212] px-3.5 py-2 font-medium text-white transition hover:border-[#444] hover:bg-[#1a1a1a] disabled:opacity-40 disabled:hover:border-[#2a2a2a] disabled:hover:bg-[#121212]"
        >
          <StepForward className="h-3.5 w-3.5 text-muted" />
          <span>Step</span>
        </button>

        {/* Auto-play */}
        <button
          onClick={onTogglePlay}
          disabled={!canStep && !isPlaying}
          className={`flex items-center gap-1.5 rounded-btn px-4 py-2 font-semibold transition ${
            isPlaying
              ? 'border border-[#444] bg-white text-black shadow-md'
              : 'border border-[#2a2a2a] bg-[#141414] text-white hover:border-[#444] hover:bg-[#1f1f1f]'
          } disabled:opacity-40`}
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5 fill-black text-black" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white text-white" />
              <span>Auto-play</span>
            </>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-btn border border-[#222] bg-[#0f0f0f] px-3 py-2 text-muted transition hover:border-[#333] hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>

        {/* New random secrets */}
        <button
          onClick={onNewSecrets}
          className="flex items-center gap-1.5 rounded-btn border border-[#222] bg-[#0f0f0f] px-3 py-2 text-muted transition hover:border-[#333] hover:text-white"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>New Secrets</span>
        </button>

        {/* Run full-size 2048-bit benchmark */}
        <button
          onClick={onRunFullSize}
          disabled={isFullSizeRunning}
          className="flex items-center gap-1.5 rounded-btn border border-[#333] bg-[#1a1a1a] px-3.5 py-2 font-semibold text-white shadow-sm transition hover:border-white hover:bg-white hover:text-black"
        >
          <Zap className="h-3.5 w-3.5 text-status-warning" />
          <span>{isFullSizeRunning ? 'Running...' : 'Run 2048-bit'}</span>
        </button>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0 border-t border-[#1a1a1a] sm:border-t-0">
        {/* Group size toggle */}
        <button
          onClick={onToggleGroupSize}
          className={`flex items-center gap-1.5 rounded-btn border px-3 py-1.5 transition ${
            is2048Bit
              ? 'border-white/40 bg-[#171717] text-white'
              : 'border-[#222] bg-[#0c0c0c] text-muted hover:text-white'
          }`}
        >
          <span className="font-mono text-[11px]">
            {is2048Bit ? '2048-bit Group' : 'Toy Group (1019)'}
          </span>
        </button>

        {/* Authenticated toggle */}
        <button
          onClick={onToggleAuthenticated}
          className={`flex items-center gap-1.5 rounded-btn border px-3 py-1.5 transition ${
            authenticated
              ? 'border-status-ok/40 bg-[#0c1a0c] text-status-ok'
              : 'border-[#222] bg-[#0c0c0c] text-muted hover:text-white'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Authenticated</span>
        </button>

        {/* Eve active toggle */}
        <button
          onClick={onToggleEve}
          className={`flex items-center gap-1.5 rounded-btn border px-3 py-1.5 transition ${
            eveActive
              ? 'border-status-fail/40 bg-[#1c0c0c] text-status-fail'
              : 'border-[#222] bg-[#0c0c0c] text-muted hover:text-white'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Active MITM (Eve)</span>
        </button>
      </div>
    </div>
  );
};
