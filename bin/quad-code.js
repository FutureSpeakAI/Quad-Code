#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const INSTANCE_COUNT = 4;

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const INSTANCE_COLORS = [COLORS.cyan, COLORS.green, COLORS.yellow, COLORS.magenta];

function printBanner() {
  console.log(`
${COLORS.bold}${COLORS.cyan}  ____                  _    ____          _
 / __ \\                | |  / ___|___   __| | ___
| |  | |_   _  __ _  __| | | |   / _ \\ / _\` |/ _ \\
| |__| | | | |/ _\` |/ _\` | | |__| (_) | (_| |  __/
 \\___\\_\\ |_| | (_| | (_| |  \\____\\___/ \\__,_|\\___|
        \\__,_|\\__,_|\\__,_|
${COLORS.reset}
${COLORS.dim}  Four simultaneous Claude Code instances${COLORS.reset}
${COLORS.dim}  by FutureSpeak.AI${COLORS.reset}
`);
}

function printUsage() {
  console.log(`${COLORS.bold}Usage:${COLORS.reset}

  ${COLORS.cyan}Single repo mode${COLORS.reset} (4 instances in one directory):
    quad-code /path/to/repo

  ${COLORS.cyan}Multi-repo mode${COLORS.reset} (one instance per repo):
    quad-code /path/to/repo1 /path/to/repo2 /path/to/repo3 /path/to/repo4

  ${COLORS.cyan}Current directory${COLORS.reset} (4 instances here):
    quad-code .

  ${COLORS.bold}Options:${COLORS.reset}
    -p, --prompt <text>    Send an initial prompt to all instances
    -h, --help             Show this help message
    -v, --version          Show version

  ${COLORS.bold}Examples:${COLORS.reset}
    quad-code .
    quad-code ~/projects/my-app
    quad-code ~/proj/frontend ~/proj/backend ~/proj/api ~/proj/infra
    quad-code . -p "Review the codebase for security issues"
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { paths: [], prompt: null, help: false, version: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      result.help = true;
    } else if (arg === '-v' || arg === '--version') {
      result.version = true;
    } else if (arg === '-p' || arg === '--prompt') {
      result.prompt = args[++i];
    } else if (!arg.startsWith('-')) {
      result.paths.push(arg);
    }
  }

  return result;
}

function validatePaths(paths) {
  for (const p of paths) {
    const resolved = resolve(p);
    if (!existsSync(resolved)) {
      console.error(`${COLORS.red}Error: Path does not exist: ${resolved}${COLORS.reset}`);
      process.exit(1);
    }
  }
}

function launchInstance(index, cwd, prompt) {
  const color = INSTANCE_COLORS[index];
  const label = `[Q${index + 1}]`;
  const resolvedCwd = resolve(cwd);

  console.log(`${color}${label}${COLORS.reset} Launching Claude Code in ${COLORS.dim}${resolvedCwd}${COLORS.reset}`);

  const args = [];
  if (prompt) {
    args.push('-p', prompt);
  }

  const child = spawn('claude', args, {
    cwd: resolvedCwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env },
  });

  child.on('error', (err) => {
    console.error(`${color}${label}${COLORS.reset} ${COLORS.red}Failed to launch: ${err.message}${COLORS.reset}`);
    if (err.message.includes('ENOENT')) {
      console.error(`${COLORS.dim}  Make sure Claude Code CLI is installed: npm install -g @anthropic-ai/claude-code${COLORS.reset}`);
    }
  });

  child.on('exit', (code) => {
    console.log(`${color}${label}${COLORS.reset} Instance exited with code ${code}`);
  });

  return child;
}

function launchInTerminals(paths, prompt) {
  const platform = process.platform;
  const children = [];

  for (let i = 0; i < paths.length; i++) {
    const resolvedCwd = resolve(paths[i]);
    const color = INSTANCE_COLORS[i];
    const label = `Q${i + 1}`;
    const claudeCmd = prompt ? `claude -p "${prompt.replace(/"/g, '\\"')}"` : 'claude';

    console.log(`${color}[${label}]${COLORS.reset} Launching in ${COLORS.dim}${resolvedCwd}${COLORS.reset}`);

    let terminalCmd;
    let terminalArgs;

    if (platform === 'win32') {
      terminalCmd = 'cmd.exe';
      terminalArgs = ['/c', 'start', `Quad Code - ${label}`, 'cmd', '/k', `cd /d "${resolvedCwd}" && title Quad Code - ${label} && ${claudeCmd}`];
    } else if (platform === 'darwin') {
      const script = `tell application "Terminal" to do script "cd '${resolvedCwd}' && ${claudeCmd}"`;
      terminalCmd = 'osascript';
      terminalArgs = ['-e', script];
    } else {
      // Linux — try common terminal emulators
      const terminals = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];
      terminalCmd = null;
      for (const t of terminals) {
        try {
          const { execSync } = await import('child_process');
          execSync(`which ${t}`, { stdio: 'ignore' });
          terminalCmd = t;
          break;
        } catch {
          continue;
        }
      }
      if (!terminalCmd) terminalCmd = 'xterm';

      if (terminalCmd === 'gnome-terminal') {
        terminalArgs = ['--title', `Quad Code - ${label}`, '--working-directory', resolvedCwd, '--', 'bash', '-c', claudeCmd];
      } else if (terminalCmd === 'konsole') {
        terminalArgs = ['--workdir', resolvedCwd, '-e', claudeCmd];
      } else {
        terminalArgs = ['-e', `cd "${resolvedCwd}" && ${claudeCmd}`];
      }
    }

    const child = spawn(terminalCmd, terminalArgs, {
      detached: true,
      stdio: 'ignore',
      shell: false,
    });

    child.unref();

    child.on('error', (err) => {
      console.error(`${color}[${label}]${COLORS.reset} ${COLORS.red}Failed: ${err.message}${COLORS.reset}`);
    });

    children.push(child);
  }

  return children;
}

// --- Main ---

const opts = parseArgs(process.argv);

if (opts.help) {
  printBanner();
  printUsage();
  process.exit(0);
}

if (opts.version) {
  console.log('quad-code v1.0.0');
  process.exit(0);
}

printBanner();

// Default to current directory if no paths given
if (opts.paths.length === 0) {
  opts.paths.push('.');
}

validatePaths(opts.paths);

// Build the list of working directories for 4 instances
let workingDirs;

if (opts.paths.length === 1) {
  // Single repo mode: 4 instances in the same directory
  const dir = opts.paths[0];
  workingDirs = [dir, dir, dir, dir];
  console.log(`${COLORS.bold}Mode:${COLORS.reset} Single repo (4 instances in ${resolve(dir)})\n`);
} else if (opts.paths.length <= INSTANCE_COUNT) {
  // Multi-repo mode: one instance per path, pad with last path if < 4
  workingDirs = [...opts.paths];
  while (workingDirs.length < INSTANCE_COUNT) {
    workingDirs.push(opts.paths[opts.paths.length - 1]);
  }
  console.log(`${COLORS.bold}Mode:${COLORS.reset} Multi-repo (${opts.paths.length} repos)\n`);
} else {
  console.error(`${COLORS.red}Error: Maximum ${INSTANCE_COUNT} paths supported.${COLORS.reset}`);
  process.exit(1);
}

if (opts.prompt) {
  console.log(`${COLORS.bold}Prompt:${COLORS.reset} ${COLORS.dim}${opts.prompt}${COLORS.reset}\n`);
}

// Launch each instance in its own terminal window
launchInTerminals(workingDirs, opts.prompt);

console.log(`\n${COLORS.green}${COLORS.bold}All ${INSTANCE_COUNT} instances launched.${COLORS.reset}`);
console.log(`${COLORS.dim}Each instance runs in its own terminal window.${COLORS.reset}\n`);
