export interface PortBinding {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
}

export interface VolumeMount {
  volumeName: string;
  containerPath: string;
  mode: 'rw' | 'ro';
}

export interface ContainerState {
  id: string;
  name: string;
  imageId: string;
  status: 'running' | 'stopped' | 'exited';
  ports: PortBinding[];
  env: Record<string, string>;
  volumeMounts: VolumeMount[];
  networkNames: string[];
  createdAt: string;
}

export interface ImageState {
  id: string;
  repository: string;
  tag: string;
  size: string;
  layers: string[];
  createdAt: string;
}

export interface VolumeState {
  name: string;
  driver: 'local';
  data: Record<string, string>;
  createdAt: string;
}

export interface NetworkState {
  name: string;
  driver: 'bridge' | 'host' | 'none';
  subnet: string;
  connectedContainerIds: string[];
}

export interface DockerEngineState {
  images: Record<string, ImageState>;
  containers: Record<string, ContainerState>;
  volumes: Record<string, VolumeState>;
  networks: Record<string, NetworkState>;
  buildContext: Record<string, string>; // e.g. { 'Dockerfile': '...', 'compose.yaml': '...' }
}

export interface StateHistoryManager {
  past: DockerEngineState[];
  present: DockerEngineState;
  future: DockerEngineState[];
}

export interface AnimationEvent {
  id: string;
  type: 'layer_build' | 'container_start' | 'container_stop' | 'network_packet';
  targetId: string;
  description: string;
  durationMs?: number;
}
