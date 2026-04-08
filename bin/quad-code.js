#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { resolve, basename, join } from 'path';
import { createInterface } from 'readline';

const MAX_INSTANCES = 16;
const VALID_COUNTS = [4, 8, 12, 16];
const VERSION = '2.0.0';

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
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

// 16 distinct colors for instance labels
const INSTANCE_COLORS = [
  COLORS.cyan, COLORS.green, COLORS.yellow, COLORS.magenta,
  COLORS.blue, COLORS.red, COLORS.white, COLORS.cyan,
  COLORS.green, COLORS.yellow, COLORS.magenta, COLORS.blue,
  COLORS.red, COLORS.white, COLORS.cyan, COLORS.green,
];

// --- Role templates for coordinated swarm work ---
const SWARM_ROLES = {
  4: [
    { role: 'Lead Architect', focus: 'Architecture review, dependency analysis, structural improvements' },
    { role: 'Security Auditor', focus: 'Security vulnerabilities, OWASP top 10, dependency risks, secrets scanning' },
    { role: 'Test Engineer', focus: 'Test coverage, missing tests, test quality, edge cases, flaky tests' },
    { role: 'Optimizer', focus: 'Performance bottlenecks, memory leaks, bundle size, startup time' },
  ],
  8: [
    { role: 'Lead Architect', focus: 'Architecture review, dependency analysis, module boundaries' },
    { role: 'Security Auditor', focus: 'Security vulnerabilities, OWASP top 10, injection risks' },
    { role: 'Test Engineer', focus: 'Test coverage gaps, missing edge cases, integration tests' },
    { role: 'Optimizer', focus: 'Performance bottlenecks, memory leaks, algorithmic complexity' },
    { role: 'Code Reviewer', focus: 'Code quality, DRY violations, naming conventions, dead code' },
    { role: 'Documentation', focus: 'Missing docs, outdated README, inline comments, API docs' },
    { role: 'Type Safety', focus: 'Type errors, any types, missing type annotations, type soundness' },
    { role: 'Dependency Auditor', focus: 'Outdated deps, vulnerability scan, license compliance, unused packages' },
  ],
  12: [
    { role: 'Lead Architect', focus: 'Architecture review, module boundaries, circular dependencies' },
    { role: 'Security Auditor', focus: 'Security vulnerabilities, OWASP top 10, injection risks' },
    { role: 'Test Engineer', focus: 'Unit test coverage gaps, missing assertions' },
    { role: 'Integration Tester', focus: 'Integration tests, E2E tests, API contract tests' },
    { role: 'Optimizer', focus: 'Performance bottlenecks, hot paths, algorithmic complexity' },
    { role: 'Memory Analyst', focus: 'Memory leaks, resource cleanup, garbage collection pressure' },
    { role: 'Code Reviewer', focus: 'Code quality, DRY violations, naming, dead code removal' },
    { role: 'Documentation', focus: 'Missing docs, outdated README, API documentation' },
    { role: 'Type Safety', focus: 'Type errors, any types, type soundness, generic constraints' },
    { role: 'Dependency Auditor', focus: 'Outdated deps, CVE scan, license audit, unused packages' },
    { role: 'Error Handling', focus: 'Missing error handling, uncaught promises, error boundaries' },
    { role: 'Accessibility & UX', focus: 'Accessibility issues, UX improvements, responsive design' },
  ],
  16: [
    { role: 'Lead Architect', focus: 'Architecture review, module boundaries, design patterns' },
    { role: 'Security Auditor', focus: 'OWASP top 10, injection risks, auth/authz issues' },
    { role: 'Secrets Scanner', focus: 'Hardcoded secrets, API keys, tokens, credentials in code or config' },
    { role: 'Unit Tester', focus: 'Unit test coverage gaps, missing assertions, edge cases' },
    { role: 'Integration Tester', focus: 'Integration tests, E2E tests, API contract tests' },
    { role: 'Performance Profiler', focus: 'Hot paths, algorithmic complexity, render performance' },
    { role: 'Memory Analyst', focus: 'Memory leaks, resource cleanup, event listener cleanup' },
    { role: 'Bundle Optimizer', focus: 'Bundle size, tree shaking, code splitting, lazy loading' },
    { role: 'Code Quality', focus: 'DRY violations, complexity, naming conventions, code smells' },
    { role: 'Dead Code Hunter', focus: 'Unused exports, unreachable code, unused dependencies' },
    { role: 'Documentation', focus: 'Missing docs, outdated README, inline comments, changelogs' },
    { role: 'API Documentation', focus: 'API docs, OpenAPI specs, endpoint documentation, examples' },
    { role: 'Type Safety', focus: 'Type errors, any types, type soundness, strict mode compliance' },
    { role: 'Dependency Auditor', focus: 'Outdated deps, CVE scan, license compliance' },
    { role: 'Error Handling', focus: 'Missing error handling, uncaught promises, error recovery' },
    { role: 'Accessibility', focus: 'WCAG compliance, screen reader support, keyboard navigation' },
  ],
};

function printBanner(count) {
  const label = count ? `${count} simultaneous` : 'Up to 16 simultaneous';
  console.log(`
${COLORS.bold}${COLORS.cyan}  ____                  _    ____          _
 / __ \\                | |  / ___|___   __| | ___
| |  | |_   _  __ _  __| | | |   / _ \\ / _\` |/ _ \\
| |__| | | | |/ _\` |/ _\` | | |__| (_) | (_| |  __/
 \\___\\_\\ |_| | (_| | (_| |  \\____\\___/ \\__,_|\\___|
        \\__,_|\\__,_|\\__,_|
${COLORS.reset}
${COLORS.dim}  ${label} Claude Code instances${COLORS.reset}
${COLORS.dim}  by FutureSpeak.AI${COLORS.reset}
`);
}

function printUsage() {
  console.log(`${COLORS.bold}Usage:${COLORS.reset}

  ${COLORS.cyan}Interactive mode${COLORS.reset} (guided setup):
    quad-code

  ${COLORS.cyan}Direct mode${COLORS.reset} (skip prompts):
    quad-code /path/to/repo
    quad-code -n 16 /path/to/repo
    quad-code https://github.com/user/repo

  ${COLORS.bold}Options:${COLORS.reset}
    -n, --instances <N>    Number of instances: 4, 8, 12, or 16 (default: 4)
    -p, --prompt <text>    Send an initial prompt to all instances
    -s, --swarm            Assign specialized roles to each instance
    --orchestrate          Run as orchestrator (used internally by Asimov's Mind)
    -h, --help             Show this help message
    -v, --version          Show version

  ${COLORS.bold}Examples:${COLORS.reset}
    quad-code                                       # Interactive setup
    quad-code .                                     # 4 instances, current dir
    quad-code -n 8 .                                # 8 instances, current dir
    quad-code -n 16 -s .                            # 16 specialized agents
    quad-code -n 8 -s . -p "Fix all test failures"  # 8 agents + custom prompt
    quad-code -n 4 ~/fe ~/be ~/api ~/infra          # Multi-repo
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    paths: [],
    prompt: null,
    help: false,
    version: false,
    instances: 4,
    swarm: false,
    orchestrate: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      result.help = true;
    } else if (arg === '-v' || arg === '--version') {
      result.version = true;
    } else if (arg === '-p' || arg === '--prompt') {
      result.prompt = args[++i];
    } else if (arg === '-n' || arg === '--instances') {
      const n = parseInt(args[++i], 10);
      if (!VALID_COUNTS.includes(n)) {
        console.error(`${COLORS.red}Error: Instance count must be 4, 8, 12, or 16. Got: ${n}${COLORS.reset}`);
        process.exit(1);
      }
      result.instances = n;
    } else if (arg === '-s' || arg === '--swarm') {
      result.swarm = true;
    } else if (arg === '--orchestrate') {
      result.orchestrate = true;
    } else if (!arg.startsWith('-')) {
      result.paths.push(arg);
    }
  }

  return result;
}

// --- Interactive prompt helpers ---

function createPromptInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((res) => {
    rl.question(question, (answer) => res(answer.trim()));
  });
}

function isGitHubUrl(str) {
  return /^https?:\/\/(www\.)?github\.com\//.test(str) || /^git@github\.com:/.test(str);
}

function cloneRepo(url) {
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

function normalizePath(inputPath) {
  if (process.platform === 'win32') {
    const match = inputPath.match(/^\/([a-zA-Z])\/(.*)/);
    if (match) {
      return `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, '\\')}`;
    }
  }
  return inputPath;
}

function resolvePathOrUrl(input) {
  if (isGitHubUrl(input)) {
    return cloneRepo(input);
  }
  const normalized = normalizePath(input);
  const resolved = resolve(normalized);
  if (!existsSync(resolved)) {
    console.error(`${COLORS.red}Error: Path does not exist: ${resolved}${COLORS.reset}`);
    process.exit(1);
  }
  return resolved;
}

async function interactiveSetup() {
  const rl = createPromptInterface();

  console.log(`${COLORS.bold}Let's set up your Claude Code swarm.${COLORS.reset}\n`);

  // Ask for instance count
  const countStr = await ask(
    rl,
    `${COLORS.bold}How many instances?${COLORS.reset} ${COLORS.dim}(4, 8, 12, or 16 — default 4)${COLORS.reset}: `
  );
  const instanceCount = countStr === '' ? 4 : parseInt(countStr, 10);
  if (!VALID_COUNTS.includes(instanceCount)) {
    console.error(`${COLORS.red}Invalid count. Must be 4, 8, 12, or 16.${COLORS.reset}`);
    rl.close();
    process.exit(1);
  }

  // Ask for mode
  console.log('');
  const mode = await ask(
    rl,
    `${COLORS.cyan}[1]${COLORS.reset} Single project (${instanceCount} instances, one repo)\n${COLORS.cyan}[2]${COLORS.reset} Multiple projects (one instance per repo)\n\n${COLORS.bold}Choose mode (1 or 2): ${COLORS.reset}`
  );

  let paths = [];

  if (mode === '1') {
    console.log('');
    const input = await ask(
      rl,
      `${COLORS.bold}Enter the project path or GitHub URL${COLORS.reset}\n${COLORS.dim}(or press Enter for current directory)${COLORS.reset}: `
    );

    const dir = input === '' ? process.cwd() : resolvePathOrUrl(input);
    paths = Array(instanceCount).fill(dir);
  } else if (mode === '2') {
    console.log(`\n${COLORS.dim}Enter up to ${instanceCount} project paths or GitHub URLs (one per line).${COLORS.reset}`);
    console.log(`${COLORS.dim}Press Enter on an empty line when done.${COLORS.reset}\n`);

    for (let i = 0; i < instanceCount; i++) {
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

    while (paths.length < instanceCount) {
      paths.push(paths[paths.length - 1]);
    }
  } else {
    console.error(`${COLORS.red}Invalid choice.${COLORS.reset}`);
    rl.close();
    process.exit(1);
  }

  // Ask about swarm roles
  console.log('');
  const swarmChoice = await ask(
    rl,
    `${COLORS.bold}Assign specialized roles to each instance?${COLORS.reset} ${COLORS.dim}(y/N)${COLORS.reset}: `
  );
  const swarm = swarmChoice.toLowerCase() === 'y';

  // Ask for optional prompt
  console.log('');
  const prompt = await ask(
    rl,
    `${COLORS.bold}Initial prompt for all instances${COLORS.reset} ${COLORS.dim}(optional, press Enter to skip)${COLORS.reset}: `
  );

  rl.close();
  return { paths, prompt: prompt || null, instances: instanceCount, swarm };
}

// --- Prompt generation ---

function buildInstancePrompt(index, totalCount, basePrompt, swarmMode) {
  const parts = [];

  if (swarmMode) {
    const roles = SWARM_ROLES[totalCount] || SWARM_ROLES[4];
    const role = roles[index % roles.length];
    parts.push(
      `You are agent Q${index + 1} of ${totalCount} in a coordinated Quad Code swarm.`,
      `Your role: ${role.role}.`,
      `Your focus: ${role.focus}.`,
      `Work autonomously within your specialization. Do not duplicate work other agents are handling.`,
      `Begin by scanning the codebase for issues in your focus area, then fix what you find.`
    );
  }

  if (basePrompt) {
    parts.push(`\nAdditional instruction from the orchestrator: ${basePrompt}`);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

// --- Launch logic ---

function launchInTerminals(paths, prompt, instanceCount, swarmMode) {
  const platform = process.platform;

  for (let i = 0; i < paths.length; i++) {
    const resolvedCwd = resolve(paths[i]);
    const color = INSTANCE_COLORS[i % INSTANCE_COLORS.length];
    const label = `Q${i + 1}`;

    const instancePrompt = buildInstancePrompt(i, instanceCount, prompt, swarmMode);

    let claudeCmd = 'claude --dangerously-skip-permissions';
    if (instancePrompt) {
      const escaped = instancePrompt.replace(/"/g, '\\"').replace(/`/g, '\\`');
      claudeCmd += ` -p "${escaped}"`;
    }

    console.log(`${color}[${label}]${COLORS.reset} Launching in ${COLORS.dim}${resolvedCwd}${COLORS.reset}`);
    if (swarmMode) {
      const roles = SWARM_ROLES[instanceCount] || SWARM_ROLES[4];
      const role = roles[i % roles.length];
      console.log(`${color}     ${COLORS.dim}Role: ${role.role}${COLORS.reset}`);
    }

    if (platform === 'win32') {
      const winPath = resolvedCwd.replace(/\//g, '\\');
      const fullCmd = `start "Quad Code - ${label}" cmd /k "cd /d "${winPath}" && title Quad Code - ${label} && ${claudeCmd}"`;

      const child = spawn(fullCmd, [], {
        detached: true,
        stdio: 'ignore',
        shell: true,
      });
      child.unref();
      child.on('error', (err) => {
        console.error(`${color}[${label}]${COLORS.reset} ${COLORS.red}Failed: ${err.message}${COLORS.reset}`);
      });
    } else if (platform === 'darwin') {
      const script = `tell application "Terminal" to do script "cd '${resolvedCwd}' && ${claudeCmd}"`;
      const child = spawn('osascript', ['-e', script], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    } else {
      // Linux
      const terminals = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];
      let terminalCmd = null;
      for (const t of terminals) {
        try {
          execSync(`which ${t}`, { stdio: 'ignore' });
          terminalCmd = t;
          break;
        } catch { continue; }
      }
      if (!terminalCmd) terminalCmd = 'xterm';

      let terminalArgs;
      if (terminalCmd === 'gnome-terminal') {
        terminalArgs = ['--title', `Quad Code - ${label}`, '--working-directory', resolvedCwd, '--', 'bash', '-c', claudeCmd];
      } else if (terminalCmd === 'konsole') {
        terminalArgs = ['--workdir', resolvedCwd, '-e', claudeCmd];
      } else {
        terminalArgs = ['-e', `cd "${resolvedCwd}" && ${claudeCmd}`];
      }

      const child = spawn(terminalCmd, terminalArgs, { detached: true, stdio: 'ignore' });
      child.unref();
    }
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
  console.log(`quad-code v${VERSION}`);
  process.exit(0);
}

printBanner(opts.instances);

let workingDirs;
let prompt;
let instanceCount;
let swarmMode;

if (opts.paths.length === 0 && !opts.orchestrate) {
  // Interactive mode
  const setup = await interactiveSetup();
  workingDirs = setup.paths;
  prompt = setup.prompt;
  instanceCount = setup.instances;
  swarmMode = setup.swarm;
} else {
  // Direct mode
  const resolvedPaths = opts.paths.map(resolvePathOrUrl);
  prompt = opts.prompt;
  instanceCount = opts.instances;
  swarmMode = opts.swarm;

  if (resolvedPaths.length <= 1) {
    const dir = resolvedPaths[0] || process.cwd();
    workingDirs = Array(instanceCount).fill(dir);
    console.log(`${COLORS.bold}Mode:${COLORS.reset} Single repo (${instanceCount} instances in ${dir})`);
  } else if (resolvedPaths.length <= instanceCount) {
    workingDirs = [...resolvedPaths];
    while (workingDirs.length < instanceCount) {
      workingDirs.push(resolvedPaths[resolvedPaths.length - 1]);
    }
    console.log(`${COLORS.bold}Mode:${COLORS.reset} Multi-repo (${resolvedPaths.length} repos across ${instanceCount} instances)`);
  } else {
    console.error(`${COLORS.red}Error: Too many paths (${resolvedPaths.length}) for ${instanceCount} instances.${COLORS.reset}`);
    process.exit(1);
  }
}

if (swarmMode) {
  console.log(`${COLORS.bold}Swarm:${COLORS.reset} ${COLORS.green}Specialized roles assigned${COLORS.reset}`);
}
if (prompt) {
  console.log(`${COLORS.bold}Prompt:${COLORS.reset} ${COLORS.dim}${prompt}${COLORS.reset}`);
}
console.log('');

// Launch
launchInTerminals(workingDirs, prompt, instanceCount, swarmMode);

console.log(`\n${COLORS.green}${COLORS.bold}All ${instanceCount} instances launched.${COLORS.reset}`);
console.log(`${COLORS.dim}Each instance runs in its own terminal window.${COLORS.reset}\n`);
