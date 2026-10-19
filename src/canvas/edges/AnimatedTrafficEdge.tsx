import React, { memo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

export const AnimatedTrafficEdge: React.FC<EdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = data?.edgeType || 'network'; // 'volume' | 'network' | 'image'

  let strokeColor = '#6366f1'; // indigo
  if (edgeType === 'volume') strokeColor = '#f59e0b'; // amber
  if (edgeType === 'image') strokeColor = '#0ea5e9'; // sky

  return (
    <>
      {/* Background shadow line */}
      <path
        id={`${id}-bg`}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={4}
        stroke={strokeColor}
        strokeOpacity={0.15}
        fill="none"
      />
      {/* Animated dashed line */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke={strokeColor}
        strokeDasharray="5 5"
        fill="none"
        style={{
          ...style,
          animation: 'dashdraw 0.8s linear infinite',
        }}
      />
      {/* Optional Label */}
      {data?.label && (
        <foreignObject
          width={120}
          height={24}
          x={labelX - 60}
          y={labelY - 12}
          className="pointer-events-none select-none"
        >
          <div className="flex items-center justify-center h-full">
            <span className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 font-mono text-[9px] text-slate-300 shadow">
              {data.label}
            </span>
          </div>
        </foreignObject>
      )}
      <style>{`
        @keyframes dashdraw {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
});
AnimatedTrafficEdge.displayName = 'AnimatedTrafficEdge';
