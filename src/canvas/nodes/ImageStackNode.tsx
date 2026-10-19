import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ImageState } from '../../types/engine';
import { Layers, Database } from 'lucide-react';

export interface ImageNodeData {
  image: ImageState;
  activeLayerIndex?: number;
}

export const ImageStackNode: React.FC<NodeProps<ImageNodeData>> = memo(({ data, selected }) => {
  const { image, activeLayerIndex } = data;

  return (
    <div
      className={`w-64 rounded-xl p-3.5 shadow-2xl transition-all font-sans border bg-slate-900/95 border-sky-500/50 shadow-sky-500/5 ${
        selected ? 'ring-2 ring-sky-400 border-sky-400' : ''
      }`}
    >
      <Handle type="source" position={Position.Right} id="right" className="!bg-sky-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-sky-400 !w-2.5 !h-2.5 !border-slate-900" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-sky-300 leading-tight">
              {image.repository}:{image.tag}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              ID: {image.id.slice(0, 12)}
            </div>
          </div>
        </div>

        <div className="text-[11px] font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
          {image.size}
        </div>
      </div>

      {/* Layer Stack */}
      <div className="pt-2.5 space-y-1.5">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Database className="w-3 h-3 text-sky-400" />
            <span>Image Layers ({image.layers.length})</span>
          </span>
          <span className="text-[9px] text-slate-600">Bottom-up</span>
        </div>

        <div className="flex flex-col-reverse gap-1 max-h-48 overflow-y-auto pr-1">
          {image.layers.map((layer, idx) => {
            const isActive = activeLayerIndex === idx;
            const isBase = idx === 0;

            return (
              <div
                key={idx}
                className={`p-1.5 rounded text-[11px] font-mono leading-tight transition-all border ${
                  isActive
                    ? 'bg-sky-500/30 border-sky-400 text-sky-200 ring-1 ring-sky-400 shadow-md'
                    : isBase
                    ? 'bg-slate-800/90 border-slate-700/80 text-slate-300'
                    : 'bg-slate-800/50 border-slate-700/40 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] text-slate-500 select-none">L{idx + 1}</span>
                  <span className="truncate">{layer}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
ImageStackNode.displayName = 'ImageStackNode';
