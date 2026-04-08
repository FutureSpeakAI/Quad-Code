#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve, basename } from 'path';
import { createInterface } from 'readline';
import { tmpdir } from 'os';

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

  ${COLORS.cyan}Interactive mode${COLORS.reset} (guided setup):
    quad-code

  ${COLORS.cyan}Direct mode${COLORS.reset} (skip prompts):
    quad-code /path/to/repo
    quad-code /path/to/repo1 /path/to/repo2 /path/to/repo3 /path/to/repo4
    quad-code https://github.com/user/repo

  ${COLORS.bold}Options:${COLORS.reset}
    -p, --prompt <text>    Send an initial prompt to all instances
    -h, --help             Show this help message
    -v, --version          Show version

  ${COLORS.bold}Examples:${COLORS.reset}
    quad-code
    quad-code .
    quad-code ~/projects/my-app
    quad-code ~/proj/frontend ~/proj/backend ~/proj/api ~/proj/infra
    quad-code https://github.com/user/repo -p "Review for security issues"
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

// --- Interactive prompt helpers ---

function createPrompt() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function isGitHubUrl(str) {
  return /^https?:\/\/(www\.)?github\.com\//.test(str) || /^git@github\.com:/.test(str);
}

function cloneRepo(url) {
  // Extract repo name from URL
  let repoName = basename(url).replace(/\.git$/, '');
  const cloneDir = resolve(process.cwd(), repoName);

  if (existsSync(cloneDir)) {
    console.log(`${COLORS.dim}  Directory ${cloneDir} already exists, using it${COLORS.reset}`);
    return cloneDir;
  }

  console.log(`${COLORS.cyan}  Cloning ${url}...${COLORS.reset}`);
  try {
    execSync(`git clone "${url}" "${cloneDir}"`, { stdio: 'pipe' });
    console.log(`${COLORS.green}  Cloned to ${cloneDir}${COLORS.reset}`);
    return cloneDir;
  } catch (err) {
    console.error(`${COLORS.red}  Failed to clone: ${err.message}${COLORS.reset}`);
    process.exit(1);
  }
}

function resolvePathOrUrl(input) {
  if (isGitHubUrl(input)) {
    return cloneRepo(input);
  }
  const resolved = resolve(input);
  if (!existsSync(resolved)) {
    console.error(`${COLORS.red}Error: Path does not exist: ${resolved}${COLORS.reset}`);
    process.exit(1);
  }
  return resolved;
}

async function interactiveSetup() {
  const rl = createPrompt();

  console.log(`${COLORS.bold}Let's set up your four Claude Code instances.${COLORS.reset}\n`);

  const mode = await ask(
    rl,
    `${COLORS.cyan}[1]${COLORS.reset} Single project (4 instances, one repo)\n${COLORS.cyan}[2]${COLORS.reset} Multiple projects (one instance per repo)\n\n${COLORS.bold}Choose mode (1 or 2): ${COLORS.reset}`
  );

  let paths = [];

  if (mode === '1') {
    console.log('');
    const input = await ask(
      rl,
      `${COLORS.bold}Enter the project path or GitHub URL${COLORS.reset}\n${COLORS.dim}(or press Enter for current directory)${COLORS.reset}: `
    );

    const dir = input === '' ? process.cwd() : resolvePathOrUrl(input);
    paths = [dir, dir, dir, dir];
    console.log(`\n${COLORS.bold}Mode:${COLORS.reset} Single repo (4 instances in ${dir})\n`);
  } else if (mode === '2') {
    console.log(`\n${COLORS.dim}Enter up to 4 project paths or GitHub URLs (one per line).${COLORS.reset}`);
    console.log(`${COLORS.dim}Press Enter on an empty line when done.${COLORS.reset}\n`);

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      const color = INSTANCE_COLORS[i];
      const input = await ask(rl, `${color}[Q${i + 1}]${COLORS.reset} Path or URL: `);

      if (input === '') {
        if (paths.length === 0) {
          console.error(`${COLORS.red}Error: You must provide at least one path.${COLORS.reset}`);
          process.exit(1);
        }
        break;
      }

      paths.push(resolvePathOrUrl(input));
    }

    // Pad remaining slots with the last path
    while (paths.length < INSTANCE_COUNT) {
      paths.push(paths[paths.length - 1]);
    }

    console.log(`\n${COLORS.bold}Mode:${COLORS.reset} Multi-repo (${new Set(paths).size} repos)\n`);
  } else {
    console.error(`${COLORS.red}Invalid choice. Please enter 1 or 2.${COLORS.reset}`);
    rl.close();
    process.exit(1);
  }

  // Ask for optional prompt
  const prompt = await ask(
    rl,
    `${COLORS.bold}Initial prompt for all instances${COLORS.reset} ${COLORS.dim}(optional, press Enter to skip)${COLORS.reset}: `
  );

  rl.close();
  return { paths, prompt: prompt || null };
}

// --- Launch logic ---

function launchInTerminals(paths, prompt) {
  const platform = process.platform;

  for (let i = 0; i < paths.length; i++) {
    const resolvedCwd = resolve(paths[i]);
    const color = INSTANCE_COLORS[i];
    const label = `Q${i + 1}`;
    const claudeCmd = prompt
      ? `claude --dangerously-skip-permissions -p "${prompt.replace(/"/g, '\\"')}"`
      : 'claude --dangerously-skip-permissions';

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
  }
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

let workingDirs;
let prompt;

if (opts.paths.length === 0) {
  // No args — run interactive mode
  const setup = await interactiveSetup();
  workingDirs = setup.paths;
  prompt = setup.prompt;
} else {
  // Direct mode — resolve paths/URLs from args
  const resolvedPaths = opts.paths.map(resolvePathOrUrl);
  prompt = opts.prompt;

  if (resolvedPaths.length === 1) {
    workingDirs = [resolvedPaths[0], resolvedPaths[0], resolvedPaths[0], resolvedPaths[0]];
    console.log(`${COLORS.bold}Mode:${COLORS.reset} Single repo (4 instances in ${resolvedPaths[0]})\n`);
  } else if (resolvedPaths.length <= INSTANCE_COUNT) {
    workingDirs = [...resolvedPaths];
    while (workingDirs.length < INSTANCE_COUNT) {
      workingDirs.push(resolvedPaths[resolvedPaths.length - 1]);
    }
    console.log(`${COLORS.bold}Mode:${COLORS.reset} Multi-repo (${resolvedPaths.length} repos)\n`);
  } else {
    console.error(`${COLORS.red}Error: Maximum ${INSTANCE_COUNT} paths supported.${COLORS.reset}`);
    process.exit(1);
  }
}

if (prompt) {
  console.log(`${COLORS.bold}Prompt:${COLORS.reset} ${COLORS.dim}${prompt}${COLORS.reset}\n`);
}

// Launch each instance in its own terminal window
launchInTerminals(workingDirs, prompt);

console.log(`\n${COLORS.green}${COLORS.bold}All ${INSTANCE_COUNT} instances launched.${COLORS.reset}`);
console.log(`${COLORS.dim}Each instance runs in its own terminal window.${COLORS.reset}\n`);
