import { VirtualDockerEngine } from './engine/VirtualDockerEngine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

console.log('--- Virtual Docker Engine Sprint 1 Verification ---');

const engine = new VirtualDockerEngine();

// 1. Initial State
let state = engine.getState();
assert(Boolean(state.images['img-nginx-latest']), 'Initial image exists');
assert(Object.keys(state.containers).length === 0, 'No initial containers');

// 2. docker run
console.log('\n[Test 1] docker run -d -p 8080:80 --name my-web nginx');
const runRes = engine.execute('docker run -d -p 8080:80 --name my-web nginx');
assert(runRes.success, 'docker run succeeded');
state = engine.getState();
const webContainer = Object.values(state.containers).find(c => c.name === 'my-web');
assert(Boolean(webContainer), 'my-web container was created');
assert(webContainer?.status === 'running', 'my-web is running');
assert(webContainer?.ports[0]?.hostPort === 8080, 'my-web port 8080 bound');

// 3. docker ps
console.log('\n[Test 2] docker ps');
const psRes = engine.execute('docker ps');
assert(psRes.success && psRes.stdout.includes('my-web'), 'docker ps includes my-web');

// 4. docker stop
console.log('\n[Test 3] docker stop my-web');
const stopRes = engine.execute('docker stop my-web');
assert(stopRes.success, 'docker stop succeeded');
state = engine.getState();
assert(state.containers[webContainer!.id].status === 'stopped', 'container is stopped');

// 5. undo test
console.log('\n[Test 4] undo');
const undoRes = engine.execute('undo');
assert(undoRes.success, 'undo succeeded');
state = engine.getState();
assert(state.containers[webContainer!.id].status === 'running', 'my-web status rolled back to running');

// 6. redo test
console.log('\n[Test 5] redo');
const redoRes = engine.execute('redo');
assert(redoRes.success, 'redo succeeded');
state = engine.getState();
assert(state.containers[webContainer!.id].status === 'stopped', 'my-web status redone to stopped');

// 6.1. docker rm
console.log('\n[Test 5.1] docker rm my-web');
const rmRes = engine.execute('docker rm my-web');
assert(rmRes.success, 'docker rm succeeded');
state = engine.getState();
assert(!state.containers[webContainer!.id], 'my-web is completely removed from containers');

// 6.2. docker rm -f running container
console.log('\n[Test 5.2] docker run & docker rm -f');
engine.execute('docker run -d --name test-force nginx');
const forceRmRes = engine.execute('docker rm -f test-force');
assert(forceRmRes.success, 'docker rm -f succeeded');
state = engine.getState();
assert(!Object.values(state.containers).some(c => c.name === 'test-force'), 'test-force container removed');

// 7. docker volume
console.log('\n[Test 6] docker volume create my-vol');
const volRes = engine.execute('docker volume create my-vol');
assert(volRes.success, 'volume created');
state = engine.getState();
assert(Boolean(state.volumes['my-vol']), 'my-vol exists in engine');

// 8. docker network
console.log('\n[Test 7] docker network create my-net');
const netRes = engine.execute('docker network create my-net');
assert(netRes.success, 'network created');
state = engine.getState();
assert(Boolean(state.networks['my-net']), 'my-net exists in engine');

// 9. docker build
console.log('\n[Test 8] docker build -t custom-app:v1 .');
const buildRes = engine.execute('docker build -t custom-app:v1 .');
assert(buildRes.success, 'docker build succeeded');
state = engine.getState();
assert(Boolean(state.images['img-custom-app-v1']), 'custom-app:v1 built and stored');
assert(buildRes.stdout.includes('Successfully built'), 'build output contains success message');

// 10. docker compose
console.log('\n[Test 9] docker compose up -d');
const composeRes = engine.execute('docker compose up -d');
assert(composeRes.success, 'docker compose up succeeded');
state = engine.getState();
assert(Boolean(state.networks['app_default']), 'compose default network created');
const composeContainers = Object.values(state.containers).filter(c => c.name.startsWith('app-'));
assert(composeContainers.length > 0, 'compose containers created');

console.log('\n🎉 ALL SPRINT 1 CORE TESTS PASSED SUCCESSFULLY!');
