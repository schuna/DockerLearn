import { useState, useRef, useEffect } from 'react';
import { VirtualDockerEngine } from './engine/VirtualDockerEngine';
import { DockerCanvas } from './canvas/DockerCanvas';
import { AnimationQueueManager } from './canvas/queue/AnimationQueue';
import { Header } from './components/layout/Header';
import { VirtualTerminal } from './components/terminal/VirtualTerminal';
import { TabbedEditor } from './components/editor/TabbedEditor';
import { MissionBanner } from './components/mission/MissionBanner';
import { MissionDialog } from './components/mission/MissionDialog';
import { MobileLandscapeOverlay } from './components/layout/MobileLandscapeOverlay';
import { ALL_LEVELS } from './levels';
import { EvaluationResult, STORAGE_KEY_PROGRESS, UserProgressStorage } from './types/level';
import { fireConfetti } from './utils/confetti';
import { Terminal, FileCode, CheckCircle2 } from 'lucide-react';

export default function App() {
  // 로컬 스토리지에서 진행도 불러오기
  const [completedLevels, setCompletedLevels] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (saved) {
        const parsed: UserProgressStorage = JSON.parse(saved);
        return parsed.completedLevels || [];
      }
    } catch (e) {
      // ignore
    }
    return [];
  });

  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (saved) {
        const parsed: UserProgressStorage = JSON.parse(saved);
        const idx = ALL_LEVELS.findIndex(l => l.id === parsed.lastActiveLevel);
        if (idx !== -1) return idx;
      }
    } catch (e) {
      // ignore
    }
    return 0;
  });

  const currentLevel = ALL_LEVELS[currentLevelIndex] || ALL_LEVELS[0];

  const [engine] = useState(() => new VirtualDockerEngine(currentLevel.initialState));
  const [state, setState] = useState(() => engine.getState());
  const [logs, setLogs] = useState<string[]>([
    'DockerLearn v3.0 Final (Interactive Learning Simulator)',
    `현재 미션: [${currentLevel.id}] ${currentLevel.title}`,
    '하단 터미널에서 명령어를 입력하거나 [에디터] 탭에서 Dockerfile을 수정하여 시작하세요.',
  ]);

  const [activeTab, setActiveTab] = useState<'terminal' | 'editor'>('terminal');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | undefined>();

  const [activeAnimationTargetId, setActiveAnimationTargetId] = useState<string | undefined>();
  const [activeStepLabel, setActiveStepLabel] = useState<string | undefined>();

  const animQueueRef = useRef(new AnimationQueueManager());

  // 진행도 localStorage 영속화
  useEffect(() => {
    try {
      const data: UserProgressStorage = {
        completedLevels,
        commandHistory: [],
        lastActiveLevel: currentLevel.id,
      };
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }, [completedLevels, currentLevel.id]);

  // 레벨 전환 처리
  const handleSelectLevel = (levelId: string) => {
    const idx = ALL_LEVELS.findIndex(l => l.id === levelId);
    if (idx !== -1) {
      setCurrentLevelIndex(idx);
      const targetLevel = ALL_LEVELS[idx];
      engine.reset(targetLevel.initialState);
      setState(engine.getState());
      setLastEvaluation(undefined);
      setLogs([
        `--- 레벨 전환: [${targetLevel.id}] ${targetLevel.title} ---`,
        `목표: ${targetLevel.goal}`,
      ]);
      setIsDialogOpen(true);
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < ALL_LEVELS.length - 1) {
      handleSelectLevel(ALL_LEVELS[currentLevelIndex + 1].id);
    }
  };

  const handleExecute = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // 만약 복합 쉘 커맨드(&&)인 경우 순차 실행 시뮬레이션
    const subCommands = trimmed.includes('&&')
      ? trimmed.split('&&').map(c => c.trim())
      : [trimmed];

    let finalState = state;
    const currentLogs = [...logs];

    for (const cmd of subCommands) {
      const result = engine.execute(cmd);
      currentLogs.push(`$ ${cmd}`);

      if (result.stdout) {
        if (result.stdout === '\x1bc') {
          currentLogs.length = 0;
        } else {
          currentLogs.push(result.stdout.trimEnd());
        }
      }
      if (result.stderr) {
        currentLogs.push(`❌ ${result.stderr.trimEnd()}`);
      }

      finalState = result.nextState;

      // 비동기 애니메이션 처리
      if (result.animationQueue && result.animationQueue.length > 0) {
        animQueueRef.current.clear();
        animQueueRef.current.enqueue(
          result.animationQueue,
          step => {
            setActiveAnimationTargetId(step.targetId);
            setActiveStepLabel(step.label);
          },
          () => {
            setTimeout(() => {
              setActiveAnimationTargetId(undefined);
              setActiveStepLabel(undefined);
            }, 800);
          }
        );
      }
    }

    setLogs(currentLogs);
    setState(finalState);

    // 부분 일치(Subset Matching) 검증 실행
    const evalResult = currentLevel.evaluate(finalState);
    setLastEvaluation(evalResult);

    if (evalResult.passed) {
      if (!completedLevels.includes(currentLevel.id)) {
        setCompletedLevels(prev => [...prev, currentLevel.id]);
        fireConfetti(); // 축하 폭죽 효과!
      }
      setLogs(prev => [...prev, `🎉 ${evalResult.message}`]);
    }
  };

  const handleUndo = () => {
    const res = engine.undo();
    if (res.success) {
      setLogs(prev => [...prev, `↩️ ${res.stdout}`]);
      setState(res.nextState);
      setLastEvaluation(currentLevel.evaluate(res.nextState));
    } else {
      setLogs(prev => [...prev, `⚠️ ${res.stderr}`]);
    }
  };

  const handleRedo = () => {
    const res = engine.redo();
    if (res.success) {
      setLogs(prev => [...prev, `↪️ ${res.stdout}`]);
      setState(res.nextState);
      setLastEvaluation(currentLevel.evaluate(res.nextState));
    } else {
      setLogs(prev => [...prev, `⚠️ ${res.stderr}`]);
    }
  };

  const handleResetLevel = () => {
    engine.reset(currentLevel.initialState);
    setState(engine.getState());
    setLastEvaluation(undefined);
    setLogs([`레벨 [${currentLevel.id}] 상태를 초기화했습니다.`]);
  };

  const handleEditorChange = (filename: string, content: string) => {
    engine.updateBuildContext(filename, content);
    setState(engine.getState());
  };

  const handleEditorQuickRun = (cmd: string) => {
    setActiveTab('terminal');
    handleExecute(cmd);
  };

  const isAllCompleted = completedLevels.length === ALL_LEVELS.length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Mobile Landscape Guide Overlay */}
      <MobileLandscapeOverlay />

      {/* Top Header */}
      <Header
        levels={ALL_LEVELS}
        currentLevel={currentLevel}
        completedLevels={completedLevels}
        onSelectLevel={handleSelectLevel}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetLevel={handleResetLevel}
        onOpenGuide={() => setIsDialogOpen(true)}
        canUndo={true}
        canRedo={true}
      />

      {/* All Completed Celebration Notice */}
      {isAllCompleted && (
        <div className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white text-xs py-1.5 px-4 text-center font-medium shadow-md flex items-center justify-center space-x-2 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span>축하합니다! 3단계 총 9개 도커 인터랙티브 학습 미션을 모두 완료하셨습니다! 🏆</span>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: React Flow Canvas with Mission Banner */}
        <div className="w-7/12 h-full border-r border-slate-800 relative">
          <MissionBanner
            currentLevel={currentLevel}
            lastEvaluation={lastEvaluation}
            onOpenDialog={() => setIsDialogOpen(true)}
            onNextLevel={handleNextLevel}
            hasNextLevel={currentLevelIndex < ALL_LEVELS.length - 1}
          />

          <DockerCanvas
            engineState={state}
            activeAnimationTargetId={activeAnimationTargetId}
            activeStepLabel={activeStepLabel}
          />
        </div>

        {/* Right: Tabbed Console (Terminal vs Editor) */}
        <div className="w-5/12 h-full flex flex-col bg-[#0b0f1c]">
          {/* Console Top Tabs */}
          <div className="h-10 border-b border-slate-800 bg-slate-900/90 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'terminal'
                    ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>가상 터미널 (Terminal)</span>
              </button>

              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'editor'
                    ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>파일 에디터 (Editor)</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              {activeTab === 'terminal' ? 'bash CLI' : 'Dockerfile / Compose'}
            </div>
          </div>

          {/* Console Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'terminal' ? (
              <VirtualTerminal
                logs={logs}
                onExecute={handleExecute}
                onClear={() => setLogs([])}
              />
            ) : (
              <TabbedEditor
                buildContext={state.buildContext}
                onChangeFile={handleEditorChange}
                onRunCommand={handleEditorQuickRun}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mission Guide Dialog Modal */}
      <MissionDialog
        level={currentLevel}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onRunRecommendedCommand={cmd => {
          setActiveTab('terminal');
          handleExecute(cmd);
        }}
      />
    </div>
  );
}
