import React, { useState } from 'react';
import { FileCode, Play, RotateCcw, Copy, Check } from 'lucide-react';

export interface TabbedEditorProps {
  buildContext: Record<string, string>;
  onChangeFile: (filename: string, content: string) => void;
  onRunCommand: (command: string) => void;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  Dockerfile: `# 베이스 이미지 선택
FROM nginx:alpine

# 웹 정적 파일 복사
COPY . /usr/share/nginx/html

# 80번 포트 노출
EXPOSE 80

# Nginx 데몬 기동
CMD ["nginx", "-g", "daemon off;"]
`,
  'compose.yaml': `services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - "web-data:/usr/share/nginx/html"

  db:
    image: mysql:latest
    environment:
      - MYSQL_ROOT_PASSWORD=secret
    volumes:
      - "db-data:/var/lib/mysql"

volumes:
  web-data:
  db-data:
`,
};

export const TabbedEditor: React.FC<TabbedEditorProps> = ({
  buildContext,
  onChangeFile,
  onRunCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'Dockerfile' | 'compose.yaml'>('Dockerfile');
  const [copied, setCopied] = useState(false);

  const currentContent = buildContext[activeTab] ?? DEFAULT_TEMPLATES[activeTab];
  const lines = currentContent.split('\n');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeFile(activeTab, e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab 키 입력 시 2칸 들여쓰기 삽입
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        currentContent.substring(0, start) + '  ' + currentContent.substring(end);
      onChangeFile(activeTab, newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleResetToTemplate = () => {
    onChangeFile(activeTab, DEFAULT_TEMPLATES[activeTab]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickRun = () => {
    if (activeTab === 'Dockerfile') {
      onRunCommand('docker build -t my-app .');
    } else {
      onRunCommand('docker compose up -d');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1322] font-mono text-xs select-none">
      {/* Editor Tabs Header */}
      <div className="h-9 border-b border-slate-800 bg-slate-900/90 px-2 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1">
          {(['Dockerfile', 'compose.yaml'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition ${
                activeTab === tab
                  ? 'bg-[#0d1322] text-sky-400 border-t-2 border-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-[11px]"
            title="클립보드에 복사"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? '복사됨' : '복사'}</span>
          </button>
          <button
            onClick={handleResetToTemplate}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-[11px]"
            title="기본 템플릿으로 복원"
          >
            <RotateCcw className="w-3 h-3" />
            <span>초기화</span>
          </button>
          <button
            onClick={handleQuickRun}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-sans text-xs font-medium transition shadow-sm"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{activeTab === 'Dockerfile' ? '빌드 (docker build)' : '기동 (compose up)'}</span>
          </button>
        </div>
      </div>

      {/* Editor Code Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers */}
        <div className="w-10 py-3 bg-[#090d18] text-slate-600 text-right pr-2.5 select-none font-mono text-[11px] leading-5 shrink-0 border-r border-slate-800/60">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={currentContent}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-200 font-mono text-xs leading-5 resize-none outline-none selection:bg-sky-500/30 whitespace-pre overflow-auto"
        />
      </div>

      {/* Footer Info */}
      <div className="h-6 px-3 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <span>파일: {activeTab} (가상 파일 시스템 buildContext에 실시간 저장됨)</span>
        <span>UTF-8 • Lines: {lines.length}</span>
      </div>
    </div>
  );
};
