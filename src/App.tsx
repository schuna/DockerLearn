import React, { useState, useRef } from 'react';
import { VirtualDockerEngine } from './engine/VirtualDockerEngine';
import { DockerCanvas } from './canvas/DockerCanvas';
import { AnimationQueueManager } from './canvas/queue/AnimationQueue';
import { Terminal, Undo2, Redo2, RotateCcw } from 'lucide-react';

export default function App() {
  const [engine] = useState(() => new VirtualDockerEngine());
  const [state, setState] = useState(() => engine.getState());
  const [inputCmd, setInputCmd] = useState('');
  const [logs, setLogs] = useState<string[]>([
    'DockerLearn v1.0.0 (Interactive Virtual Canvas)',
    'Type "docker run -d -p 8080:80 --name my-web nginx" or "help" to start.',
  ]);

  const [activeAnimationTargetId, setActiveAnimationTargetId] = useState<string | undefined>();
  const [activeStepLabel, setActiveStepLabel] = useState<string | undefined>();

  const animQueueRef = useRef(new AnimationQueueManager());

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;

    const cmd = inputCmd.trim();
    const result = engine.execute(cmd);
    const newLogs = [...logs, `$ ${cmd}`];

    if (result.stdout) {
      if (result.stdout === '\x1bc') {
        setLogs([]);
      } else {
        newLogs.push(result.stdout.trimEnd());
      }
    }
    if (result.stderr) {
      newLogs.push(`❌ ${result.stderr.trimEnd()}`);
    }

    if (result.stdout !== '\x1bc') {
      setLogs(newLogs);
    }
    setState(result.nextState);
    setInputCmd('');

    // 비동기 스텝 애니메이션 큐 처리
    if (result.animationQueue && result.animationQueue.length > 0) {
      animQueueRef.current.clear();
      animQueueRef.current.enqueue(
        result.animationQueue,
        (step, isLast) => {
          setActiveAnimationTargetId(step.targetId);
          setActiveStepLabel(step.label);
          if (isLast) {
            setTimeout(() => {
              setActiveAnimationTargetId(undefined);
              setActiveStepLabel(undefined);
            }, 1200);
          }
        },
        () => {
          setTimeout(() => {
            setActiveAnimationTargetId(undefined);
            setActiveStepLabel(undefined);
          }, 600);
        }
      );
    }
  };

  const handleUndo = () => {
    const res = engine.undo();
    if (res.success) {
      setLogs(prev => [...prev, `↩️ ${res.stdout}`]);
      setState(res.nextState);
    } else {
      setLogs(prev => [...prev, `⚠️ ${res.stderr}`]);
    }
  };

  const handleRedo = () => {
    const res = engine.redo();
    if (res.success) {
      setLogs(prev => [...prev, `↪️ ${res.stdout}`]);
      setState(res.nextState);
    } else {
      setLogs(prev => [...prev, `⚠️ ${res.stderr}`]);
    }
  };

  const handleReset = () => {
    engine.reset();
    setState(engine.getState());
    setLogs(['엔진 상태를 초기화했습니다. (Reset complete)']);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
            🐳
          </div>
          <span className="font-bold text-lg text-sky-400 tracking-wide">DockerLearn</span>
          <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-mono">
            Sprint 2 (React Flow Canvas)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>되돌리기 (Undo)</span>
          </button>
          <button
            onClick={handleRedo}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>다시 실행</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-xs font-medium text-slate-400 transition ml-2"
            title="엔진 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>초기화</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Left React Flow Canvas, Right Terminal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: React Flow Canvas */}
        <div className="w-7/12 h-full border-r border-slate-800 relative">
          <DockerCanvas
            engineState={state}
            activeAnimationTargetId={activeAnimationTargetId}
            activeStepLabel={activeStepLabel}
          />
        </div>

        {/* Right: Interactive Terminal */}
        <div className="w-5/12 h-full flex flex-col bg-slate-950 font-mono">
          <div className="h-9 border-b border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span>Interactive Virtual Terminal</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <span className="text-[11px] text-slate-400 font-mono">Engine Active</span>
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs leading-relaxed text-slate-300">
            {logs.map((log, index) => (
              <div
                key={index}
                className={
                  log.startsWith('$')
                    ? 'text-sky-400 font-semibold'
                    : log.startsWith('❌')
                    ? 'text-rose-400'
                    : log.startsWith('↩️') || log.startsWith('↪️')
                    ? 'text-amber-400 font-semibold'
                    : 'text-slate-300 whitespace-pre-wrap'
                }
              >
                {log}
              </div>
            ))}
          </div>

          {/* Command Prompt Form */}
          <form onSubmit={handleExecute} className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center space-x-2 shrink-0">
            <span className="text-emerald-400 font-bold text-sm">$</span>
            <input
              type="text"
              value={inputCmd}
              onChange={e => setInputCmd(e.target.value)}
              placeholder="명령어 입력 (예: docker run -d -p 8080:80 --name my-web nginx, undo)"
              className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder-slate-600 text-xs font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-sans font-medium transition"
            >
              실행
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
