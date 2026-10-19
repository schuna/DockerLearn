import React, { useState, useEffect } from 'react';
import { LevelDefinition, EvaluationResult } from '../../types/level';
import { Lightbulb, CheckCircle, AlertCircle, ArrowRight, Play, Eye, EyeOff, Target, HelpCircle } from 'lucide-react';

export interface MissionBannerProps {
  currentLevel: LevelDefinition;
  lastEvaluation?: EvaluationResult;
  onOpenDialog: () => void;
  onNextLevel?: () => void;
  hasNextLevel?: boolean;
  onRunHintCommand?: (cmd: string) => void;
}

export const MissionBanner: React.FC<MissionBannerProps> = ({
  currentLevel,
  lastEvaluation,
  onOpenDialog,
  onNextLevel,
  hasNextLevel,
  onRunHintCommand,
}) => {
  const [showHint, setShowHint] = useState<boolean>(false);
  const isPassed = lastEvaluation?.passed;

  // 레벨이 바뀌면 힌트는 기본 접힘 상태로 리셋
  useEffect(() => {
    setShowHint(false);
  }, [currentLevel.id]);

  const stageBadgeColor =
    currentLevel.stage === 1
      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
      : currentLevel.stage === 2
      ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
      : 'bg-rose-950/80 text-rose-400 border-rose-800/80';

  const stageText =
    currentLevel.stage === 1 ? '1단계: 초보' : currentLevel.stage === 2 ? '2단계: 중급' : '3단계: 고급';

  return (
    <div className="absolute top-4 left-5 right-5 z-20 pointer-events-none flex flex-col space-y-2">
      {/* Main Mission Dashboard Card */}
      <div className="pointer-events-auto bg-slate-900/95 border border-slate-800/90 shadow-2xl backdrop-blur-md rounded-2xl p-3.5 px-4 text-xs font-sans transition-all">
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/70">
          <div className="flex items-center space-x-2.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-mono font-semibold ${stageBadgeColor}`}>
              {stageText}
            </span>
            <span className="font-mono font-bold text-sky-400 text-xs">
              레벨 {currentLevel.id}
            </span>
            <span className="text-slate-200 font-bold text-sm truncate max-w-sm">
              {currentLevel.title}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* 힌트 보기 토글 버튼 */}
            {currentLevel.recommendedCommand && (
              <button
                onClick={() => setShowHint(!showHint)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition shadow-sm border ${
                  showHint
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400/90 border-slate-700/60'
                }`}
                title="정답 힌트 열기/접기"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>{showHint ? '힌트 접기' : '힌트 보기'}</span>
                {showHint ? <EyeOff className="w-3 h-3 ml-0.5" /> : <Eye className="w-3 h-3 ml-0.5" />}
              </button>
            )}

            {/* 상세 설명 모달 버튼 */}
            <button
              onClick={onOpenDialog}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition border border-slate-700/50"
              title="미션 상세 설명 보기"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>상세 가이드</span>
            </button>
          </div>
        </div>

        {/* Goal Section (항상 화면에 직접 표시) */}
        <div className="flex items-start space-x-2 text-slate-200">
          <div className="flex items-center space-x-1 font-semibold text-emerald-400 shrink-0 mt-0.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>미션 목표:</span>
          </div>
          <div className="font-medium text-slate-100 leading-snug">
            {currentLevel.goal}
          </div>
        </div>

        {/* Expandable Hint Section */}
        {showHint && currentLevel.recommendedCommand && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/30 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center space-x-2 overflow-hidden mr-2">
              <span className="text-[11px] font-semibold text-amber-400 shrink-0">추천 명령어:</span>
              <code className="text-[11px] font-mono text-sky-300 truncate bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {currentLevel.recommendedCommand}
              </code>
            </div>

            {onRunHintCommand && (
              <button
                onClick={() => onRunHintCommand(currentLevel.recommendedCommand!)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition shadow shrink-0"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>바로 실행</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Evaluation Feedback Toast Banner */}
      {lastEvaluation && (
        <div
          className={`pointer-events-auto shadow-2xl backdrop-blur-md rounded-xl p-3 px-4 flex items-center justify-between text-xs transition-all animate-in slide-in-from-top-2 duration-300 border ${
            isPassed
              ? 'bg-emerald-950/95 border-emerald-500/70 text-emerald-100 shadow-emerald-500/10'
              : 'bg-rose-950/95 border-rose-500/70 text-rose-100 shadow-rose-500/10'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {isPassed ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}

            <div>
              <span className="font-bold">{lastEvaluation.message}</span>
              {lastEvaluation.hint && !isPassed && (
                <span className="block text-[11px] text-rose-300/90 font-mono mt-0.5">
                  도움말: {lastEvaluation.hint}
                </span>
              )}
            </div>
          </div>

          {isPassed && hasNextLevel && onNextLevel && (
            <button
              onClick={onNextLevel}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/30 shrink-0 ml-3"
            >
              <span>다음 레벨 도전</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
