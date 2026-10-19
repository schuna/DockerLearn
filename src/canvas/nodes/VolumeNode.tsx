import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { VolumeState } from '../../types/engine';
import { HardDrive, CheckCircle2 } from 'lucide-react';

export interface VolumeNodeData {
  volume: VolumeState;
  mountedContainerCount: number;
}

export const VolumeNode: React.FC<NodeProps<VolumeNodeData>> = memo(({ data, selected }) => {
  const { volume, mountedContainerCount } = data;

  return (
    <div
      className={`w-56 rounded-xl p-3 shadow-xl transition-all font-sans border bg-slate-900/95 border-amber-500/50 shadow-amber-500/5 ${
        selected ? 'ring-2 ring-amber-400 border-amber-400' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-amber-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-amber-400 !w-2.5 !h-2.5 !border-slate-900" />

      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <HardDrive className="w-4 h-4" />
        </div>
        <div className="overflow-hidden">
          <div className="font-bold text-xs text-amber-300 truncate">
            {volume.name}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Driver: {volume.driver}
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Persistent</span>
        </span>
        <span className="font-mono text-[10px] text-amber-400/90 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
          {mountedContainerCount} container(s)
        </span>
      </div>
    </div>
  );
});
VolumeNode.displayName = 'VolumeNode';
