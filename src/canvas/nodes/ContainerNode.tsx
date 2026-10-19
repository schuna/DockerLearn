import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ContainerState } from '../../types/engine';
import { Box, Globe, HardDrive, Network, Radio } from 'lucide-react';

export interface ContainerNodeData {
  container: ContainerState;
  imageRepoTag?: string;
  isAnimated?: boolean;
}

export const ContainerNode: React.FC<NodeProps<ContainerNodeData>> = memo(({ data, selected }) => {
  const { container, imageRepoTag, isAnimated } = data;
  const isRunning = container.status === 'running';

  return (
    <div
      className={`relative w-72 rounded-xl p-3.5 shadow-2xl transition-all duration-300 font-sans border ${
        isRunning
          ? 'bg-slate-900/95 border-emerald-500/60 shadow-emerald-500/10 ring-1 ring-emerald-500/30'
          : 'bg-slate-900/50 border-slate-700/60 opacity-75 grayscale-[30%]'
      } ${selected ? 'ring-2 ring-sky-400 border-sky-400' : ''} ${
        isAnimated ? 'scale-105 transition-transform' : ''
      }`}
    >
      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-sky-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-amber-400 !w-2.5 !h-2.5 !border-slate-900" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}
          >
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-100 leading-tight truncate max-w-[130px]">
              {container.name}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              ID: {container.id.slice(0, 8)}
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono ${
            isRunning
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {isRunning ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Running</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>
              <span>Exited</span>
            </>
          )}
        </div>
      </div>

      {/* Body details */}
      <div className="pt-2.5 space-y-2 text-xs">
        {/* Base Image */}
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px]">Image:</span>
          <span className="font-mono text-[11px] text-sky-400 font-medium truncate max-w-[160px]">
            {imageRepoTag || container.imageId.slice(0, 12)}
          </span>
        </div>

        {/* Port Bindings */}
        {container.ports.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Globe className="w-3 h-3 text-sky-400" />
              <span>Port Bindings</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {container.ports.map((p, idx) => (
                <div
                  key={idx}
                  className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 font-mono text-[11px] text-sky-300 flex items-center space-x-1 shadow-sm"
                >
                  <Radio className="w-2.5 h-2.5 text-sky-400 animate-pulse" />
                  <span>
                    {p.hostPort}:{p.containerPort}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volume Mounts */}
        {container.volumeMounts.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-amber-400" />
              <span>Volumes</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {container.volumeMounts.map((v, idx) => (
                <div
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 font-mono text-[10px] text-amber-300 truncate max-w-full"
                  title={`${v.volumeName} → ${v.containerPath}`}
                >
                  💾 {v.volumeName} → {v.containerPath}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Networks */}
        {container.networkNames.length > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1 text-slate-500">
              <Network className="w-3 h-3 text-indigo-400" />
              <span>Network:</span>
            </span>
            <span className="font-mono text-indigo-300">{container.networkNames.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
});
ContainerNode.displayName = 'ContainerNode';
