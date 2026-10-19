import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, Trash2 } from 'lucide-react';

export interface VirtualTerminalProps {
  logs: string[];
  onExecute: (command: string) => void;
  onClear: () => void;
}

const COMMON_COMMANDS = [
  'docker run -d -p 8080:80 --name my-web nginx',
  'docker ps',
  'docker ps -a',
  'docker stop my-web',
  'docker rm my-web',
  'docker images',
  'docker volume create my-data',
  'docker network create app-net',
  'docker build -t my-app .',
  'docker compose up -d',
  'undo',
  'help',
];

export const VirtualTerminal: React.FC<VirtualTerminalProps> = ({
  logs,
  onExecute,
  onClear,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 터미널 영역 클릭 시 인풋 포커스
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmed = input.trim();
    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    onExecute(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;

      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (history.length === 0 || historyIndex === -1) return;

      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // 간단한 자동완성 추천
      const match = COMMON_COMMANDS.find(c => c.startsWith(input));
      if (match) {
        setInput(match);
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className="flex flex-col h-full bg-[#0a0f1d] font-mono text-xs select-text cursor-text relative overflow-hidden"
    >
      {/* Terminal Title Bar */}
      <div className="h-9 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between text-slate-400 select-none shrink-0">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-slate-300">bash — Docker Virtual Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={e => {
              e.stopPropagation();
              onClear();
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="터미널 비우기 (clear)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body Logs */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 text-slate-300 leading-relaxed">
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={
              log.startsWith('$')
                ? 'text-sky-400 font-semibold flex items-center space-x-2'
                : log.startsWith('❌')
                ? 'text-rose-400 font-medium'
                : log.startsWith('🎉')
                ? 'text-emerald-400 font-semibold bg-emerald-950/40 p-2 rounded border border-emerald-800/40'
                : log.startsWith('↩️') || log.startsWith('↪️')
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300 whitespace-pre-wrap font-mono'
            }
          >
            {log}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Command Hints Pill Bar */}
      <div className="px-4 py-1.5 bg-slate-900/40 border-t border-slate-800/60 flex items-center space-x-2 overflow-x-auto text-[11px] text-slate-500 select-none shrink-0">
        <span className="text-[10px] uppercase font-bold text-slate-600">추천:</span>
        {['docker ps', 'docker images', 'undo', 'help'].map(cmd => (
          <button
            key={cmd}
            type="button"
            onClick={e => {
              e.stopPropagation();
              setInput(cmd);
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 hover:text-slate-200 text-slate-400 transition font-mono whitespace-nowrap"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Command Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2.5 shrink-0 select-none"
      >
        <span className="text-emerald-400 font-bold text-sm select-none">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="도커 명령어를 입력하세요 (방향키 ↑↓ 히스토리, Tab 자동완성)"
          className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder-slate-600 text-xs font-mono"
          autoFocus
        />
        <button
          type="submit"
          className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-sans font-medium transition shadow-md shadow-sky-600/20"
        >
          <span>실행</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
