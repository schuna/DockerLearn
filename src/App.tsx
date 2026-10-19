import React, { useState } from 'react';
import { VirtualDockerEngine } from './engine/VirtualDockerEngine';
import { Terminal, Box, Layers, HardDrive, Network, Undo2, Redo2 } from 'lucide-react';

export default function App() {
  const [engine] = useState(() => new VirtualDockerEngine());
  const [state, setState] = useState(() => engine.getState());
  const [inputCmd, setInputCmd] = useState('');
  const [logs, setLogs] = useState<string[]>([
    'DockerLearn v1.0.0 (Virtual In-Memory Engine)',
    'Type "docker run -d -p 8080:80 --name my-web nginx" or "help" to start.',
  ]);

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

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
            🐳
          </div>
          <span className="font-bold text-lg text-sky-400 tracking-wide">DockerLearn</span>
          <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-mono">
            Sprint 1 (Core Engine)
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
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: State Inspector Preview (Preparing for React Flow in Sprint 2) */}
        <div className="w-1/2 border-r border-slate-800 p-6 flex flex-col space-y-6 overflow-y-auto bg-slate-900/30">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Box className="w-4 h-4 text-emerald-400" />
              <span>활성 컨테이너 ({Object.keys(state.containers).length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {Object.values(state.containers).length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-slate-800 text-center text-sm text-slate-500">
                  실행 중인 컨테이너가 없습니다. 터미널에서 <code>docker run</code>을 실행해 보세요.
                </div>
              ) : (
                Object.values(state.containers).map(c => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-lg border transition ${
                      c.status === 'running'
                        ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5'
                        : 'bg-slate-900/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            c.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-200">{c.name}</span>
                        <span className="text-xs text-slate-500 font-mono">({c.id.slice(0, 8)})</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono ${
                          c.status === 'running'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1 font-mono">
                      <div>이미지: {state.images[c.imageId]?.repository || c.imageId}</div>
                      <div>포트: {c.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ') || '없음'}</div>
                      <div>네트워크: {c.networkNames.join(', ')}</div>
                      {c.volumeMounts.length > 0 && (
                        <div>
                          볼륨: {c.volumeMounts.map(v => `${v.volumeName} → ${v.containerPath}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>로컬 도커 이미지 ({Object.keys(state.images).length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(state.images).map(img => (
                <div key={img.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 font-mono text-xs">
                  <div className="font-semibold text-sky-300">
                    {img.repository}:{img.tag}
                  </div>
                  <div className="text-slate-500 mt-1">용량: {img.size}</div>
                  <div className="text-slate-500">레이어: {img.layers.length}개 스택</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>볼륨 ({Object.keys(state.volumes).length})</span>
              </h2>
              <div className="space-y-2">
                {Object.values(state.volumes).length === 0 ? (
                  <div className="text-xs text-slate-600">볼륨 없음</div>
                ) : (
                  Object.values(state.volumes).map(v => (
                    <div key={v.name} className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-amber-300/90">
                      💾 {v.name}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <Network className="w-4 h-4 text-indigo-400" />
                <span>네트워크 ({Object.keys(state.networks).length})</span>
              </h2>
              <div className="space-y-2">
                {Object.values(state.networks).map(net => (
                  <div key={net.name} className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300/90">
                    🌐 {net.name} ({net.subnet})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Terminal */}
        <div className="w-1/2 flex flex-col bg-slate-950 font-mono">
          <div className="h-9 border-b border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span>Interactive Virtual Terminal</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="text-[11px] text-slate-400">In-Memory Engine Ready</span>
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
          <form onSubmit={handleExecute} className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center space-x-2">
            <span className="text-emerald-400 font-bold text-sm">$</span>
            <input
              type="text"
              value={inputCmd}
              onChange={e => setInputCmd(e.target.value)}
              placeholder="명령어를 입력하세요 (예: docker run -d -p 8080:80 --name my-web nginx, undo, help)"
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
