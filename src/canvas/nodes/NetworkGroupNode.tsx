import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NetworkState } from '../../types/engine';
import { Network, Wifi } from 'lucide-react';

export interface NetworkNodeData {
  network: NetworkState;
}

export const NetworkGroupNode: React.FC<NodeProps<NetworkNodeData>> = memo(({ data, selected }) => {
  const { network } = data;

  return (
    <div
      className={`w-60 rounded-xl p-3 shadow-xl transition-all font-sans border bg-slate-900/90 border-indigo-500/50 shadow-indigo-500/5 ${
        selected ? 'ring-2 ring-indigo-400 border-indigo-400' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-indigo-400 !w-2.5 !h-2.5 !border-slate-900" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-indigo-400 !w-2.5 !h-2.5 !border-slate-900" />

      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
          <Network className="w-4 h-4" />
        </div>
        <div className="overflow-hidden">
          <div className="font-bold text-xs text-indigo-300 truncate">
            {network.name}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {network.subnet}
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center space-x-1">
          <Wifi className="w-3 h-3 text-indigo-400" />
          <span>Driver: {network.driver}</span>
        </span>
        <span className="font-mono text-[10px] text-indigo-300 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-900/40">
          {network.connectedContainerIds.length} connected
        </span>
      </div>
    </div>
  );
});
NetworkGroupNode.displayName = 'NetworkGroupNode';
