#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { resolve, basename } from 'path';
import { createInterface } from 'readline';

const MAX_INSTANCES = 16;
const VERSION = '2.1.0';

const C = {
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
  bgCyan: '\x1b[46m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

const INSTANCE_COLORS = [
  C.cyan, C.green, C.yellow, C.magenta,
  C.blue, C.red, C.white, C.cyan,
  C.green, C.yellow, C.magenta, C.blue,
  C.red, C.white, C.cyan, C.green,
];

// --- Swarm role database (scales dynamically to any count 1-16) ---
const ALL_ROLES = [
  { role: 'Lead Architect', focus: 'Architecture review, dependency analysis, module boundaries, design patterns' },
  { role: 'Security Auditor', focus: 'Security vulnerabilities, OWASP top 10, injection risks, auth/authz' },
  { role: 'Test Engineer', focus: 'Test coverage gaps, missing edge cases, flaky tests, test quality' },
  { role: 'Optimizer', focus: 'Performance bottlenecks, memory leaks, algorithmic complexity, bundle size' },
  { role: 'Code Reviewer', focus: 'Code quality, DRY violations, naming conventions, dead code, code smells' },
  { role: 'Documentation', focus: 'Missing docs, outdated README, inline comments, API documentation' },
  { role: 'Type Safety', focus: 'Type errors, any types, missing annotations, type soundness, strict mode' },
  { role: 'Dependency Auditor', focus: 'Outdated deps, CVE scan, license compliance, unused packages' },
  { role: 'Integration Tester', focus: 'Integration tests, E2E tests, API contract tests, cross-module tests' },
  { role: 'Memory Analyst', focus: 'Memory leaks, resource cleanup, event listener cleanup, GC pressure' },
  { role: 'Error Handling', focus: 'Missing error handling, uncaught promises, error boundaries, recovery' },
  { role: 'Accessibility', focus: 'WCAG compliance, screen reader support, keyboard navigation, contrast' },
  { role: 'Secrets Scanner', focus: 'Hardcoded secrets, API keys, tokens, credentials in code or config' },
  { role: 'Dead Code Hunter', focus: 'Unused exports, unreachable code, unused dependencies, orphan files' },
  { role: 'Bundle Optimizer', focus: 'Bundle size, tree shaking, code splitting, lazy loading, chunk analysis' },
  { role: 'API Documentation', focus: 'API docs, endpoint documentation, request/response examples, schemas' },
];

// --- Boot animation ---

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function bootAnimation() {
  const frames = [
    `${C.dim}  Initializing Quad Code...${C.reset}`,
    `${C.cyan}  [=                   ]${C.reset}  ${C.dim}Loading core...${C.reset}`,
    `${C.cyan}  [====                ]${C.reset}  ${C.dim}Detecting platform...${C.reset}`,
    `${C.cyan}  [========            ]${C.reset}  ${C.dim}Scanning for Claude CLI...${C.reset}`,
    `${C.cyan}  [============        ]${C.reset}  ${C.dim}Preparing terminal pool...${C.reset}`,
    `${C.cyan}  [================    ]${C.reset}  ${C.dim}Loading swarm roles...${C.reset}`,
    `${C.cyan}  [====================]${C.reset}  ${C.green}Ready.${C.reset}`,
  ];

  process.stdout.write('\n');
  for (const frame of frames) {
    process.stdout.write(`\r${frame}`);
    await sleep(200);
  }
  process.stdout.write('\n\n');
}

async function printLogo() {
  const logo = `
${C.bold}${C.cyan}   ██████╗ ██╗   ██╗ █████╗ ██████╗      ██████╗ ██████╗ ██████╗ ███████╗
  ██╔═══██╗██║   ██║██╔══██╗██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ██║   ██║██║   ██║███████║██║  ██║    ██║     ██║   ██║██║  ██║█████╗
  ██║▄▄ ██║██║   ██║██╔══██║██║  ██║    ██║     ██║   ██║██║  ██║██╔══╝
  ╚██████╔╝╚██████╔╝██║  ██║██████╔╝    ╚██████╗╚██████╔╝██████╔╝███████╗
   ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝      ╚═════╝ ╚═════╝╚═════╝ ╚══════╝${C.reset}

                ${C.dim}Up to 16 parallel Claude Code instances${C.reset}
                ${C.dim}by ${C.bold}FutureSpeak.AI${C.reset}

  ${C.bgCyan}${C.bold} POWERED BY ${C.reset} ${C.cyan}Asimov's Mind${C.reset} ${C.dim}— Governed recursive self-improvement${C.reset}
  ${C.dim}             https://github.com/FutureSpeakAI/Agent-Friday${C.reset}
`;

  // Print logo line by line with slight delay for effect
  const lines = logo.split('\n');
  for (const line of lines) {
    console.log(line);
    await sleep(40);
  }
}

function printUsage() {
  console.log(`${C.bold}Usage:${C.reset}

  ${C.cyan}Interactive mode${C.reset} (guided setup):
    quad-code

  ${C.cyan}Direct mode${C.reset} (skip prompts):
    quad-code .                                     # 4 instances, current dir
    quad-code -n 12 .                               # 12 instances
    quad-code -n 16 -s .                            # 16 with specialized roles
    quad-code -n 8 -s -b .                          # 8 on separate branches
    quad-code https://github.com/user/repo          # Clone + launch

  ${C.bold}Options:${C.reset}
    -n, --instances <N>    Number of instances: 1-16 (default: 4)
    -s, --swarm            Assign specialized roles to each instance
    -b, --branches         Each instance works on its own branch
    -p, --prompt <text>    Send an initial prompt to all instances
    --orchestrate          Programmatic mode (used by Asimov's Mind)
    -h, --help             Show this help message
    -v, --version          Show version
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
    branches: false,
    orchestrate: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') result.help = true;
    else if (arg === '-v' || arg === '--version') result.version = true;
    else if (arg === '-s' || arg === '--swarm') result.swarm = true;
    else if (arg === '-b' || arg === '--branches') result.branches = true;
    else if (arg === '--orchestrate') result.orchestrate = true;
    else if (arg === '-p' || arg === '--prompt') result.prompt = args[++i];
    else if (arg === '-n' || arg === '--instances') {
      const n = parseInt(args[++i], 10);
      if (isNaN(n) || n < 1 || n > MAX_INSTANCES) {
        console.error(`${C.red}Error: Instance count must be 1-16. Got: ${args[i]}${C.reset}`);
        process.exit(1);
      }
      result.instances = n;
    } else if (!arg.startsWith('-')) {
      result.paths.push(arg);
    }
  }

  return result;
}

// --- Helpers ---

function rl() {
  return createInterface({ input: process.stdin, output: process.stdout });
}

function ask(iface, question) {
  return new Promise((res) => {
    iface.question(question, (answer) => res(answer.trim()));
  });
}

function isGitHubUrl(str) {
  return /^https?:\/\/(www\.)?github\.com\//.test(str) || /^git@github\.com:/.test(str);
}

function cloneRepo(url) {
  let repoName = basename(url).replace(/\.git$/, '');
  const cloneDir = resolve(process.cwd(), repoName);

  if (existsSync(cloneDir)) {
    console.log(`${C.dim}  Directory ${cloneDir} already exists, using it${C.reset}`);
    return cloneDir;
  }

  console.log(`${C.cyan}  Cloning ${url}...${C.reset}`);
  try {
    execSync(`git clone "${url}" "${cloneDir}"`, { stdio: 'pipe' });
    console.log(`${C.green}  Cloned to ${cloneDir}${C.reset}`);
    return cloneDir;
  } catch (err) {
    console.error(`${C.red}  Failed to clone: ${err.message}${C.reset}`);
    process.exit(1);
  }
}

function normalizePath(inputPath) {
  if (process.platform === 'win32') {
    const match = inputPath.match(/^\/([a-zA-Z])\/(.*)/);
    if (match) return `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, '\\')}`;
  }
  return inputPath;
}

function resolvePathOrUrl(input) {
  if (isGitHubUrl(input)) return cloneRepo(input);
  const resolved = resolve(normalizePath(input));
  if (!existsSync(resolved)) {
    console.error(`${C.red}Error: Path does not exist: ${resolved}${C.reset}`);
    process.exit(1);
  }
  return resolved;
}

// --- Branch management ---

function createBranch(repoPath, branchName) {
  try {
    execSync(`git -C "${repoPath}" checkout -b "${branchName}"`, { stdio: 'pipe' });
    return true;
  } catch {
    // Branch might already exist
    try {
      execSync(`git -C "${repoPath}" checkout "${branchName}"`, { stdio: 'pipe' });
      return true;
    } catch (err) {
      console.error(`${C.red}  Failed to create branch ${branchName}: ${err.message}${C.reset}`);
      return false;
    }
  }
}

function getCurrentBranch(repoPath) {
  try {
    return execSync(`git -C "${repoPath}" rev-parse --abbrev-ref HEAD`, { stdio: 'pipe' }).toString().trim();
  } catch {
    return 'main';
  }
}

function returnToOriginalBranch(repoPath, branch) {
  try {
    execSync(`git -C "${repoPath}" checkout "${branch}"`, { stdio: 'pipe' });
  } catch { /* best effort */ }
}

// --- Federation detection ---

function detectGitHubOrg(repoPath) {
  try {
    const remote = execSync(`git -C "${repoPath}" remote get-url origin`, { stdio: 'pipe' }).toString().trim();
    const match = remote.match(/github\.com[:/]([^/]+)\//);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function checkFederationPotential(paths) {
  const orgs = paths.map(p => detectGitHubOrg(p)).filter(Boolean);
  const uniqueOrgs = [...new Set(orgs)];
  if (uniqueOrgs.length === 1 && orgs.length > 1) {
    return uniqueOrgs[0];
  }
  return null;
}

// --- Interactive setup ---

async function interactiveSetup() {
  const iface = rl();

  // Step 1: What are you working on?
  console.log(`${C.bold}What would you like to work on?${C.reset}\n`);
  const modeChoice = await ask(
    iface,
    `  ${C.cyan}[1]${C.reset} A single project\n  ${C.cyan}[2]${C.reset} Multiple projects\n\n  ${C.bold}Choose (1 or 2): ${C.reset}`
  );

  let paths = [];
  let singleRepo = false;

  if (modeChoice === '1') {
    singleRepo = true;
    console.log('');
    const input = await ask(
      iface,
      `  ${C.bold}Project path or GitHub URL${C.reset} ${C.dim}(Enter for current dir)${C.reset}: `
    );
    const dir = input === '' ? process.cwd() : resolvePathOrUrl(input);
    paths = [dir];
  } else if (modeChoice === '2') {
    console.log(`\n  ${C.dim}Enter project paths or GitHub URLs (one per line, empty line to finish)${C.reset}\n`);
    for (let i = 0; i < MAX_INSTANCES; i++) {
      const input = await ask(iface, `  ${INSTANCE_COLORS[i]}[${i + 1}]${C.reset} Path or URL: `);
      if (input === '') {
        if (paths.length === 0) {
          console.error(`${C.red}  Error: You must provide at least one path.${C.reset}`);
          process.exit(1);
        }
        break;
      }
      paths.push(resolvePathOrUrl(input));
    }
  } else {
    console.error(`${C.red}  Invalid choice.${C.reset}`);
    iface.close();
    process.exit(1);
  }

  // Step 2: How many instances?
  const maxForMode = singleRepo ? MAX_INSTANCES : paths.length;
  const defaultCount = singleRepo ? 4 : paths.length;
  console.log('');
  const countStr = await ask(
    iface,
    `  ${C.bold}How many simultaneous sessions?${C.reset} ${C.dim}(1-${maxForMode}, default ${defaultCount})${C.reset}: `
  );
  const instanceCount = countStr === '' ? defaultCount : parseInt(countStr, 10);
  if (isNaN(instanceCount) || instanceCount < 1 || instanceCount > MAX_INSTANCES) {
    console.error(`${C.red}  Invalid count. Must be 1-${MAX_INSTANCES}.${C.reset}`);
    iface.close();
    process.exit(1);
  }

  // Expand paths to match instance count
  if (singleRepo) {
    paths = Array(instanceCount).fill(paths[0]);
  } else {
    while (paths.length < instanceCount) {
      paths.push(paths[paths.length - 1]);
    }
    paths = paths.slice(0, instanceCount);
  }

  // Step 3: Branches? (only for single repo)
  let useBranches = false;
  if (singleRepo && instanceCount > 1) {
    console.log('');
    const branchChoice = await ask(
      iface,
      `  ${C.bold}Give each instance its own branch?${C.reset} ${C.dim}(y/N)${C.reset}: `
    );
    useBranches = branchChoice.toLowerCase() === 'y';
  }

  // Step 4: Swarm roles?
  console.log('');
  const swarmChoice = await ask(
    iface,
    `  ${C.bold}Assign specialized roles to each instance?${C.reset} ${C.dim}(y/N)${C.reset}: `
  );
  const swarm = swarmChoice.toLowerCase() === 'y';

  // Step 5: Custom prompt?
  console.log('');
  const prompt = await ask(
    iface,
    `  ${C.bold}Initial prompt for all instances${C.reset} ${C.dim}(Enter to skip)${C.reset}: `
  );

  iface.close();
  return { paths, prompt: prompt || null, instances: instanceCount, swarm, branches: useBranches };
}

// --- Prompt generation ---

function buildInstancePrompt(index, totalCount, basePrompt, swarmMode, branchName) {
  const parts = [];

  if (swarmMode) {
    const role = ALL_ROLES[index % ALL_ROLES.length];
    parts.push(
      `You are agent Q${index + 1} of ${totalCount} in a coordinated Quad Code swarm.`,
      `Your role: ${role.role}.`,
      `Your focus: ${role.focus}.`,
      `Work autonomously within your specialization. Do not duplicate work other agents are handling.`,
      `Begin by scanning the codebase for issues in your focus area, then fix what you find.`
    );
  }

  if (branchName) {
    parts.push(`You are working on branch "${branchName}". Commit your changes to this branch.`);
  }

  if (basePrompt) {
    parts.push(`\nAdditional instruction: ${basePrompt}`);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

// --- Launch ---

function launchTerminal(index, cwd, instancePrompt, branchCmd) {
  const platform = process.platform;
  const color = INSTANCE_COLORS[index % INSTANCE_COLORS.length];
  const label = `Q${index + 1}`;

  let claudeCmd = 'claude --dangerously-skip-permissions';
  if (instancePrompt) {
    const escaped = instancePrompt.replace(/"/g, '\\"').replace(/`/g, '\\`');
    claudeCmd += ` -p "${escaped}"`;
  }

  // Prepend branch checkout if needed
  const preCmd = branchCmd ? `${branchCmd} && ` : '';

  if (platform === 'win32') {
    const winPath = cwd.replace(/\//g, '\\');
    const fullCmd = `start "Quad Code - ${label}" cmd /k "cd /d "${winPath}" && title Quad Code - ${label} && ${preCmd}${claudeCmd}"`;
    const child = spawn(fullCmd, [], { detached: true, stdio: 'ignore', shell: true });
    child.unref();
    child.on('error', (err) => {
      console.error(`${color}[${label}]${C.reset} ${C.red}Failed: ${err.message}${C.reset}`);
    });
  } else if (platform === 'darwin') {
    const script = `tell application "Terminal" to do script "cd '${cwd}' && ${preCmd}${claudeCmd}"`;
    const child = spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' });
    child.unref();
  } else {
    const terminals = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];
    let terminalCmd = 'xterm';
    for (const t of terminals) {
      try { execSync(`which ${t}`, { stdio: 'ignore' }); terminalCmd = t; break; }
      catch { continue; }
    }
    let terminalArgs;
    const fullClaudeCmd = `${preCmd}${claudeCmd}`;
    if (terminalCmd === 'gnome-terminal') {
      terminalArgs = ['--title', `Quad Code - ${label}`, '--working-directory', cwd, '--', 'bash', '-c', fullClaudeCmd];
    } else if (terminalCmd === 'konsole') {
      terminalArgs = ['--workdir', cwd, '-e', fullClaudeCmd];
    } else {
      terminalArgs = ['-e', `cd "${cwd}" && ${fullClaudeCmd}`];
    }
    const child = spawn(terminalCmd, terminalArgs, { detached: true, stdio: 'ignore' });
    child.unref();
  }
}

function launchAll(paths, prompt, instanceCount, swarmMode, useBranches) {
  let originalBranch = null;
  const repoPath = paths[0];

  if (useBranches) {
    originalBranch = getCurrentBranch(repoPath);
    console.log(`${C.dim}  Base branch: ${originalBranch}${C.reset}\n`);
  }

  // Check federation potential
  const federationOrg = checkFederationPotential(paths);
  if (federationOrg) {
    console.log(`${C.bgMagenta}${C.bold} FEDERATION ${C.reset} ${C.magenta}All repos belong to ${C.bold}${federationOrg}${C.reset}${C.magenta} — federation ready${C.reset}\n`);
  }

  for (let i = 0; i < instanceCount; i++) {
    const cwd = resolve(paths[i]);
    const color = INSTANCE_COLORS[i % INSTANCE_COLORS.length];
    const label = `Q${i + 1}`;

    let branchName = null;
    let branchCmd = null;

    if (useBranches) {
      branchName = `quad-code/q${i + 1}-${Date.now()}`;
      branchCmd = `git checkout -b "${branchName}"`;
    }

    const instancePrompt = buildInstancePrompt(i, instanceCount, prompt, swarmMode, branchName);

    console.log(`${color}[${label}]${C.reset} ${C.dim}${cwd}${C.reset}`);
    if (swarmMode) {
      const role = ALL_ROLES[i % ALL_ROLES.length];
      console.log(`${color}     ${C.dim}Role: ${role.role}${C.reset}`);
    }
    if (branchName) {
      console.log(`${color}     ${C.dim}Branch: ${branchName}${C.reset}`);
    }

    launchTerminal(i, cwd, instancePrompt, branchCmd);
  }

  // Return to original branch in the orchestrator's context
  if (useBranches && originalBranch) {
    returnToOriginalBranch(repoPath, originalBranch);
  }
}

// --- Main ---

const opts = parseArgs(process.argv);

if (opts.help) {
  await printLogo();
  printUsage();
  process.exit(0);
}

if (opts.version) {
  console.log(`quad-code v${VERSION}`);
  process.exit(0);
}

// Boot sequence
await printLogo();
await bootAnimation();

let workingDirs, prompt, instanceCount, swarmMode, useBranches;

if (opts.paths.length === 0 && !opts.orchestrate) {
  // Interactive mode
  const setup = await interactiveSetup();
  workingDirs = setup.paths;
  prompt = setup.prompt;
  instanceCount = setup.instances;
  swarmMode = setup.swarm;
  useBranches = setup.branches;
} else {
  // Direct mode
  const resolvedPaths = opts.paths.map(resolvePathOrUrl);
  prompt = opts.prompt;
  instanceCount = opts.instances;
  swarmMode = opts.swarm;
  useBranches = opts.branches;

  if (resolvedPaths.length <= 1) {
    const dir = resolvedPaths[0] || process.cwd();
    workingDirs = Array(instanceCount).fill(dir);
  } else {
    workingDirs = [...resolvedPaths];
    while (workingDirs.length < instanceCount) {
      workingDirs.push(resolvedPaths[resolvedPaths.length - 1]);
    }
    workingDirs = workingDirs.slice(0, instanceCount);
  }
}

// Summary
console.log(`${C.bold}Configuration:${C.reset}`);
console.log(`  Instances:  ${C.cyan}${instanceCount}${C.reset}`);
console.log(`  Mode:       ${new Set(workingDirs).size === 1 ? 'Single repo' : `Multi-repo (${new Set(workingDirs).size} repos)`}`);
if (swarmMode) console.log(`  Swarm:      ${C.green}Specialized roles assigned${C.reset}`);
if (useBranches) console.log(`  Branches:   ${C.green}Each instance on its own branch${C.reset}`);
if (prompt) console.log(`  Prompt:     ${C.dim}${prompt}${C.reset}`);
console.log('');

// Launch
launchAll(workingDirs, prompt, instanceCount, swarmMode, useBranches);

console.log(`\n${C.green}${C.bold}  All ${instanceCount} instances launched.${C.reset}`);
console.log(`${C.dim}  Each instance runs in its own terminal window.${C.reset}`);

if (useBranches) {
  console.log(`\n${C.yellow}${C.bold}  Branch merge workflow:${C.reset}`);
  console.log(`${C.dim}  When instances finish, review and merge their branches:${C.reset}`);
  console.log(`${C.dim}    git log --oneline --all --graph${C.reset}`);
  console.log(`${C.dim}    git merge quad-code/q1-...${C.reset}`);
}

console.log(`\n${C.bgCyan}${C.bold} ASIMOV'S MIND ${C.reset} ${C.dim}Want governed swarm intelligence? Try Agent Friday:${C.reset}`);
console.log(`${C.dim}  https://github.com/FutureSpeakAI/Agent-Friday${C.reset}\n`);
