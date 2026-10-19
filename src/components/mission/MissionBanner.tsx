import React from 'react';
import { LevelDefinition, EvaluationResult } from '../../types/level';
import { HelpCircle, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export interface MissionBannerProps {
  currentLevel: LevelDefinition;
  lastEvaluation?: EvaluationResult;
  onOpenDialog: () => void;
  onNextLevel?: () => void;
  hasNextLevel?: boolean;
}

export const MissionBanner: React.FC<MissionBannerProps> = ({
  currentLevel,
  lastEvaluation,
  onOpenDialog,
  onNextLevel,
  hasNextLevel,
}) => {
  const isPassed = lastEvaluation?.passed;

  return (
    <div className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
      {/* Level Info Pill */}
      <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md rounded-xl p-2.5 px-4 flex items-center space-x-3 max-w-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
            {currentLevel.id}
          </span>
          <span className="font-semibold text-xs text-slate-100 truncate max-w-xs">
            {currentLevel.title}
          </span>
        </div>

        <button
          onClick={onOpenDialog}
          className="flex items-center space-x-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          title="미션 설명 및 힌트 보기"
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>미션 가이드</span>
        </button>
      </div>

      {/* Evaluation Feedback Pill */}
      {lastEvaluation && (
        <div
          className={`pointer-events-auto shadow-2xl backdrop-blur-md rounded-xl p-2.5 px-4 flex items-center space-x-2.5 text-xs transition-all animate-in slide-in-from-top-2 duration-300 border ${
            isPassed
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/60 text-rose-200'
          }`}
        >
          {isPassed ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}

          <div className="max-w-md">
            <span className="font-semibold">{lastEvaluation.message}</span>
            {lastEvaluation.hint && !isPassed && (
              <span className="block text-[11px] text-rose-300/80 font-mono mt-0.5">
                힌트: {lastEvaluation.hint}
              </span>
            )}
          </div>

          {isPassed && hasNextLevel && onNextLevel && (
            <button
              onClick={onNextLevel}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md shadow-emerald-600/30 shrink-0 ml-2"
            >
              <span>다음 레벨</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
