import { useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { DockerEngineState } from '../types/engine';
import { ContainerNode, ContainerNodeData } from './nodes/ContainerNode';
import { ImageStackNode, ImageNodeData } from './nodes/ImageStackNode';
import { VolumeNode, VolumeNodeData } from './nodes/VolumeNode';
import { NetworkGroupNode, NetworkNodeData } from './nodes/NetworkGroupNode';
import { AnimatedTrafficEdge } from './edges/AnimatedTrafficEdge';

const nodeTypes = {
  containerNode: ContainerNode,
  imageNode: ImageStackNode,
  volumeNode: VolumeNode,
  networkNode: NetworkGroupNode,
};

const edgeTypes = {
  animatedTraffic: AnimatedTrafficEdge,
};

interface DockerCanvasInnerProps {
  engineState: DockerEngineState;
  activeAnimationTargetId?: string;
  activeStepLabel?: string;
}

function DockerCanvasInner({
  engineState,
  activeAnimationTargetId,
  activeStepLabel,
}: DockerCanvasInnerProps) {
  const { fitView } = useReactFlow();

  // 엔진 상태를 기반으로 노드 및 엣지 자동 산출
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. 이미지 노드 (좌측 열 x: 60)
    const imagesList = Object.values(engineState.images);
    imagesList.forEach((img, index) => {
      nodes.push({
        id: `img-${img.id}`,
        type: 'imageNode',
        position: { x: 50, y: 50 + index * 260 },
        data: {
          image: img,
          activeLayerIndex: activeAnimationTargetId === img.id ? img.layers.length - 1 : undefined,
        } as ImageNodeData,
      });
    });

    // 2. 컨테이너 노드 (중앙 열 x: 380)
    const containersList = Object.values(engineState.containers);
    containersList.forEach((cnt, index) => {
      const img = engineState.images[cnt.imageId];
      const imageRepoTag = img ? `${img.repository}:${img.tag}` : cnt.imageId;

      nodes.push({
        id: `cnt-${cnt.id}`,
        type: 'containerNode',
        position: { x: 390, y: 50 + index * 230 },
        data: {
          container: cnt,
          imageRepoTag,
          isAnimated: activeAnimationTargetId === cnt.id,
        } as ContainerNodeData,
      });

      // 이미지 -> 컨테이너 연결선
      if (img) {
        edges.push({
          id: `edge-img-${img.id}-to-cnt-${cnt.id}`,
          source: `img-${img.id}`,
          target: `cnt-${cnt.id}`,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'animatedTraffic',
          data: {
            edgeType: 'image',
            label: 'base',
          },
        });
      }

      // 컨테이너 -> 볼륨 연결선
      cnt.volumeMounts.forEach(vm => {
        edges.push({
          id: `edge-cnt-${cnt.id}-to-vol-${vm.volumeName}`,
          source: `cnt-${cnt.id}`,
          target: `vol-${vm.volumeName}`,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'animatedTraffic',
          data: {
            edgeType: 'volume',
            label: vm.containerPath,
          },
        });
      });

      // 컨테이너 -> 네트워크 연결선
      cnt.networkNames.forEach(netName => {
        edges.push({
          id: `edge-cnt-${cnt.id}-to-net-${netName}`,
          source: `cnt-${cnt.id}`,
          target: `net-${netName}`,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'animatedTraffic',
          data: {
            edgeType: 'network',
            label: 'net',
          },
        });
      });
    });

    // 3. 볼륨 노드 (우측 상단 열 x: 740)
    const volumesList = Object.values(engineState.volumes);
    volumesList.forEach((vol, index) => {
      const mountedCount = containersList.filter(c =>
        c.volumeMounts.some(m => m.volumeName === vol.name)
      ).length;

      nodes.push({
        id: `vol-${vol.name}`,
        type: 'volumeNode',
        position: { x: 740, y: 50 + index * 120 },
        data: {
          volume: vol,
          mountedContainerCount: mountedCount,
        } as VolumeNodeData,
      });
    });

    // 4. 네트워크 노드 (우측 하단 열 x: 740)
    const networksList = Object.values(engineState.networks);
    const volumeOffsetY = Math.max(volumesList.length * 120 + 70, 200);
    networksList.forEach((net, index) => {
      nodes.push({
        id: `net-${net.name}`,
        type: 'networkNode',
        position: { x: 740, y: volumeOffsetY + index * 120 },
        data: {
          network: net,
        } as NetworkNodeData,
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [engineState, activeAnimationTargetId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 엔진 상태 변경 시 노드 및 엣지 동기화
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // 최초 렌더 또는 컨테이너 변경 시 부드러운 뷰 맞춤
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.25, duration: 400 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView, initialNodes.length]);

  return (
    <div className="w-full h-full relative bg-[#0b1120]">
      {/* Active animation overlay badge */}
      {activeStepLabel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-sky-950/90 border border-sky-500/60 shadow-lg shadow-sky-500/20 backdrop-blur flex items-center space-x-2 text-xs text-sky-200 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
          <span className="font-mono">{activeStepLabel}</span>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'animatedTraffic' }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#1e293b" />
        <Controls className="!bg-slate-900 !border-slate-800 !rounded-lg !overflow-hidden shadow-xl" />
        <MiniMap
          nodeColor={n => {
            if (n.type === 'containerNode') return '#10b981';
            if (n.type === 'imageNode') return '#0ea5e9';
            if (n.type === 'volumeNode') return '#f59e0b';
            if (n.type === 'networkNode') return '#6366f1';
            return '#64748b';
          }}
          className="!bg-slate-950/80 !border-slate-800 !rounded-lg shadow-xl"
          maskColor="rgba(15, 23, 42, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}

export interface DockerCanvasProps {
  engineState: DockerEngineState;
  activeAnimationTargetId?: string;
  activeStepLabel?: string;
}

export function DockerCanvas(props: DockerCanvasProps) {
  return (
    <ReactFlowProvider>
      <DockerCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
