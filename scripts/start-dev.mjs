import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const EDGE_RUNTIME_CONTAINER = 'supabase_edge_runtime_carpathian';
const DOCKER_TIMEOUT_MS = 120_000;
const DOCKER_POLL_MS = 2_000;

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: options.stdio ?? 'inherit',
    encoding: 'utf8',
  });

  return result;
};

const runRequired = (command, args) => {
  const result = run(command, args);

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const openDockerDesktop = () => {
  if (process.platform !== 'darwin') {
    return;
  }

  console.log('Opening Docker Desktop...');
  run('open', ['-a', 'Docker']);
};

const waitForDocker = async () => {
  console.log('Waiting for Docker daemon...');

  const startedAt = Date.now();

  while (Date.now() - startedAt < DOCKER_TIMEOUT_MS) {
    const result = run('docker', ['info'], { stdio: 'ignore' });

    if (result.status === 0) {
      console.log('Docker daemon is ready.');
      return;
    }

    await sleep(DOCKER_POLL_MS);
  }

  console.error('Docker did not become ready within 120 seconds.');
  process.exit(1);
};

const startEdgeRuntimeContainerIfPresent = () => {
  const inspectResult = run('docker', ['container', 'inspect', EDGE_RUNTIME_CONTAINER], {
    stdio: 'ignore',
  });

  if (inspectResult.status !== 0) {
    console.log(`${EDGE_RUNTIME_CONTAINER} does not exist yet; Supabase CLI will create it if needed.`);
    return;
  }

  const runningResult = run(
    'docker',
    ['inspect', '-f', '{{.State.Running}}', EDGE_RUNTIME_CONTAINER],
    { stdio: 'pipe' },
  );

  if (runningResult.stdout.trim() === 'true') {
    console.log(`${EDGE_RUNTIME_CONTAINER} is already running.`);
    return;
  }

  console.log(`Starting ${EDGE_RUNTIME_CONTAINER}...`);
  run('docker', ['start', EDGE_RUNTIME_CONTAINER]);
};

const runDevServer = () => {
  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
};

openDockerDesktop();
await waitForDocker();
startEdgeRuntimeContainerIfPresent();
runRequired('npx', ['supabase', 'start', '--debug']);
runDevServer();
