import React from 'react';
import { LevelDefinition } from '../../types/level';
import { X, Play, Lightbulb, CheckCircle2 } from 'lucide-react';

export interface MissionDialogProps {
  level: LevelDefinition;
  isOpen: boolean;
  onClose: () => void;
  onRunRecommendedCommand?: (cmd: string) => void;
}

export const MissionDialog: React.FC<MissionDialogProps> = ({
  level,
  isOpen,
  onClose,
  onRunRecommendedCommand,
}) => {
  if (!isOpen) return null;

  const stageBadgeColor =
    level.stage === 1
      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
      : level.stage === 2
      ? 'bg-amber-950 text-amber-400 border-amber-800'
      : 'bg-rose-950 text-rose-400 border-rose-800';

  const stageText =
    level.stage === 1 ? '1단계: 초보 (Beginner)' : level.stage === 2 ? '2단계: 중급 (Intermediate)' : '3단계: 고급 (Advanced)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Stage & Title */}
        <div className="flex items-center space-x-2 mb-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-semibold ${stageBadgeColor}`}>
            {stageText}
          </span>
          <span className="text-xs text-slate-500 font-mono">레벨 {level.id}</span>
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-3">{level.title}</h2>

        {/* Description */}
        <p className="text-sm text-slate-300 leading-relaxed mb-4 whitespace-pre-line bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
          {level.description}
        </p>

        {/* Goal */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>미션 달성 목표</span>
          </h3>
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs font-medium text-emerald-200">
            {level.goal}
          </div>
        </div>

        {/* Recommended Command */}
        {level.recommendedCommand && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>추천 실행 명령어</span>
            </h3>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <code className="text-xs font-mono text-sky-400 truncate pr-2">
                {level.recommendedCommand}
              </code>
              {onRunRecommendedCommand && (
                <button
                  onClick={() => {
                    onRunRecommendedCommand(level.recommendedCommand!);
                    onClose();
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shrink-0 transition"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>바로 실행</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            확인 및 학습 시작
          </button>
        </div>
      </div>
    </div>
  );
};
