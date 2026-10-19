import React from 'react';
import { LevelDefinition } from '../../types/level';
import { Undo2, Redo2, RotateCcw, ChevronDown, Award, HelpCircle } from 'lucide-react';

export interface HeaderProps {
  levels: LevelDefinition[];
  currentLevel: LevelDefinition;
  completedLevels: string[];
  onSelectLevel: (levelId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetLevel: () => void;
  onOpenGuide: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  levels,
  currentLevel,
  completedLevels,
  onSelectLevel,
  onUndo,
  onRedo,
  onResetLevel,
  onOpenGuide,
  canUndo,
  canRedo,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-5 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Brand & Level Picker */}
      <div className="flex items-center space-x-4">
        {/* Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-base shadow-sm">
            🐳
          </div>
          <div>
            <div className="font-bold text-base text-slate-100 tracking-tight leading-tight flex items-center space-x-2">
              <span className="text-sky-400">Docker</span>
              <span>Learn</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono -mt-0.5">
              Interactive Web Simulator
            </div>
          </div>
        </div>

        {/* Level Dropdown */}
        <div className="relative flex items-center">
          <select
            value={currentLevel.id}
            onChange={e => onSelectLevel(e.target.value)}
            className="appearance-none bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium cursor-pointer outline-none focus:ring-1 focus:ring-sky-500 transition max-w-[260px] truncate"
          >
            <optgroup label="🟢 1단계: 초보 (Beginner)">
              {levels
                .filter(l => l.stage === 1)
                .map(l => (
                  <option key={l.id} value={l.id}>
                    {completedLevels.includes(l.id) ? '✓ ' : ''}
                    {l.id}. {l.title}
                  </option>
                ))}
            </optgroup>
            <optgroup label="🟡 2단계: 중급 (Intermediate)">
              {levels
                .filter(l => l.stage === 2)
                .map(l => (
                  <option key={l.id} value={l.id}>
                    {completedLevels.includes(l.id) ? '✓ ' : ''}
                    {l.id}. {l.title}
                  </option>
                ))}
            </optgroup>
            <optgroup label="🔴 3단계: 고급 (Advanced)">
              {levels
                .filter(l => l.stage === 3)
                .map(l => (
                  <option key={l.id} value={l.id}>
                    {completedLevels.includes(l.id) ? '✓ ' : ''}
                    {l.id}. {l.title}
                  </option>
                ))}
            </optgroup>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* Progress Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[11px]">
            {completedLevels.length}/{levels.length} 달성
          </span>
        </div>
      </div>

      {/* Right Controls: Undo / Redo / Reset / Guide */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            canUndo
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
          }`}
          title="되돌리기 (undo)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>되돌리기</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            canRedo
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
          }`}
          title="다시 실행 (redo)"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span>다시 실행</span>
        </button>

        <button
          onClick={onResetLevel}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 text-xs font-medium transition ml-1"
          title="현재 레벨 초기화"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>레벨 리셋</span>
        </button>

        <button
          onClick={onOpenGuide}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition ml-2 shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>미션 목표</span>
        </button>
      </div>
    </header>
  );
};
