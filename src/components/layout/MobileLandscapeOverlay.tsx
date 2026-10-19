import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X } from 'lucide-react';

export const MobileLandscapeOverlay: React.FC = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortraitMobile || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
          title="안내 닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto mb-4 relative">
          <Smartphone className="w-8 h-8" />
          <RotateCw className="w-5 h-5 absolute -bottom-1 -right-1 text-sky-400 animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2">
          가로 모드(Landscape) 권장
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          DockerLearn은 실시간 인터랙티브 캔버스와 터미널 동시 학습에 최적화되어 있습니다. 기기를 가로로 회전하거나 데스크톱 환경에서 더욱 쾌적하게 학습하실 수 있습니다.
        </p>

        <button
          onClick={() => setDismissed(true)}
          className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition shadow-lg shadow-sky-600/20"
        >
          이해했습니다 (현재 화면으로 계속)
        </button>
      </div>
    </div>
  );
};
