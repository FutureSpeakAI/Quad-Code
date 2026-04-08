#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, basename, join } from 'path';
import { createInterface } from 'readline';
import { tmpdir } from 'os';
import {
  MAX_INSTANCES, VERSION, C, INSTANCE_COLORS, ALL_ROLES, ASIMOV_AGENTS,
  isGitHubUrl, normalizePath, parseArgs, buildInstancePrompt,
} from '../lib/core.js';

// --- Swarm role database lives in lib/core.js ---

// --- Cached Linux terminal detection (detect once, not per-launch) ---

let _cachedLinuxTerminal = null;
function detectLinuxTerminal() {
  if (_cachedLinuxTerminal) return _cachedLinuxTerminal;
  const terminals = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];
  for (const t of terminals) {
    try { execSync(`which ${t}`, { stdio: 'ignore' }); _cachedLinuxTerminal = t; return t; }
    catch { continue; }
  }
  _cachedLinuxTerminal = 'xterm';
  return 'xterm';
}

// --- Boot animation ---

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function bootAnimation() {
  const steps = [
    { bar: '=                   ', msg: 'Loading core...' },
    { bar: '====                ', msg: 'Detecting platform...' },
    { bar: '========            ', msg: 'Scanning for Claude CLI...' },
    { bar: '============        ', msg: 'Preparing terminal pool...' },
    { bar: '================    ', msg: 'Loading swarm roles...' },
    { bar: '====================', msg: 'Ready.' },
  ];

  for (const step of steps) {
    const color = step.msg === 'Ready.' ? C.green : C.dim;
    console.log(`  ${C.cyan}[${step.bar}]${C.reset}  ${color}${step.msg}${C.reset}`);
    await sleep(250);
  }
  console.log('');
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
    -a, --asimov           Deploy as Asimov's Mind agents with radio
    -b, --branches         Each instance works on its own branch
    -p, --prompt <text>    Send an initial prompt to all instances
    --orchestrate          Programmatic mode (used by Asimov's Mind)
    -h, --help             Show this help message
    -v, --version          Show version
`);
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
      const input = await ask(iface, `  ${INSTANCE_COLORS[i % INSTANCE_COLORS.length]}[${i + 1}]${C.reset} Path or URL: `);
      if (input === '') {
        if (paths.length === 0) {
          console.error(`${C.red}  Error: You must provide at least one path.${C.reset}`);
          iface.close();
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

  // Step 2: Agent mode? (asked before count so we know the cap)
  console.log('');
  const agentChoice = await ask(
    iface,
    `  ${C.bold}Agent mode:${C.reset}\n  ${C.cyan}[1]${C.reset} Plain Claude Code (no roles)\n  ${C.cyan}[2]${C.reset} Swarm roles (specialized focus per instance)\n  ${C.cyan}[3]${C.reset} ${C.magenta}Asimov's Mind${C.reset} agents with radio ${C.dim}(requires Asimov's Mind plugin)${C.reset}\n\n  ${C.bold}Choose (1, 2, or 3, default 1): ${C.reset}`
  );
  const swarm = agentChoice === '2';
  const asimov = agentChoice === '3';

  // Step 3: How many instances?
  // Standalone (plain/swarm): max 4. Asimov's Mind: max 16.
  const STANDALONE_MAX = 4;
  const cap = asimov ? MAX_INSTANCES : STANDALONE_MAX;
  const maxForMode = singleRepo ? cap : Math.min(paths.length, cap);
  const defaultCount = singleRepo ? Math.min(4, cap) : Math.min(paths.length, cap);
  console.log('');
  if (!asimov && singleRepo) {
    console.log(`  ${C.dim}Standalone mode: max ${STANDALONE_MAX} sessions. Install Asimov's Mind for up to 16.${C.reset}`);
  }
  const countStr = await ask(
    iface,
    `  ${C.bold}How many simultaneous sessions?${C.reset} ${C.dim}(1-${maxForMode}, default ${defaultCount})${C.reset}: `
  );
  const instanceCount = countStr === '' ? defaultCount : parseInt(countStr, 10);
  if (isNaN(instanceCount) || instanceCount < 1 || instanceCount > maxForMode) {
    console.error(`${C.red}  Invalid count. Must be 1-${maxForMode}.${C.reset}`);
    if (!asimov && instanceCount > STANDALONE_MAX) {
      console.error(`${C.magenta}  Unlock up to 16 sessions with Asimov's Mind: https://github.com/FutureSpeakAI/Agent-Friday${C.reset}`);
    }
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

  // Step 4: Branches? (only for single repo)
  let useBranches = false;
  if (singleRepo && instanceCount > 1) {
    console.log('');
    const branchChoice = await ask(
      iface,
      `  ${C.bold}Give each instance its own branch?${C.reset} ${C.dim}(y/N)${C.reset}: `
    );
    useBranches = branchChoice.toLowerCase() === 'y';
  }

  // Step 5: Custom prompt?
  console.log('');
  const prompt = await ask(
    iface,
    `  ${C.bold}Initial prompt for all instances${C.reset} ${C.dim}(Enter to skip)${C.reset}: `
  );

  iface.close();
  return { paths, prompt: prompt || null, instances: instanceCount, swarm, asimov, branches: useBranches };
}

// --- Launch ---

function launchTerminal(index, cwd, instancePrompt, branchCmd) {
  const platform = process.platform;
  const color = INSTANCE_COLORS[index % INSTANCE_COLORS.length];
  const label = `Q${index + 1}`;

  let claudeCmd = 'claude --dangerously-skip-permissions';
  if (instancePrompt) {
    // Use --append-system-prompt to inject the role while keeping Claude interactive
    if (platform === 'win32') {
      const escaped = instancePrompt.replace(/%/g, '%%').replace(/\^/g, '^^');
      claudeCmd += ` --append-system-prompt "${escaped}"`;
    } else {
      const escaped = instancePrompt.replace(/"/g, '\\"').replace(/`/g, '\\`');
      claudeCmd += ` --append-system-prompt "${escaped}"`;
    }
  }

  // preCmd: prepend branch creation command on macOS/Linux (Windows handles it via bat file)
  const preCmd = branchCmd ? `${branchCmd} && ` : '';

  if (platform === 'win32') {
    const winPath = cwd.replace(/\//g, '\\');
    // Write a temp .bat file — avoids all CMD quoting issues
    const batWinPath = join(tmpdir(), `qc-${label}-${Date.now()}.bat`).replace(/\//g, '\\');
    const lines = [`@echo off`, `cd /d "${winPath}"`, `title Quad Code - ${label}`];
    if (branchCmd) lines.push(branchCmd);
    lines.push(claudeCmd);
    writeFileSync(batWinPath, lines.join('\r\n') + '\r\n');

    // shell:true lets the host shell interpret the start command directly
    const fullCmd = `start "" cmd /k "${batWinPath}"`;
    const child = spawn(fullCmd, [], {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
    child.unref();
    child.on('error', (err) => {
      console.error(`${color}[${label}]${C.reset} ${C.red}Failed: ${err.message}${C.reset}`);
    });
    // Clean up the temp .bat file after cmd.exe has had time to read it
    setTimeout(() => { try { unlinkSync(batWinPath); } catch { /* already gone */ } }, 10000);
  } else if (platform === 'darwin') {
    const script = `tell application "Terminal" to do script "cd '${cwd}' && ${preCmd}${claudeCmd}"`;
    const child = spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' });
    child.unref();
  } else {
    const terminalCmd = detectLinuxTerminal();
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

async function launchAll(paths, prompt, instanceCount, swarmMode, useBranches, asimovMode) {
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
    // Stagger launches to avoid overwhelming the OS
    if (i > 0) await sleep(600);

    const cwd = resolve(paths[i]);
    const color = INSTANCE_COLORS[i % INSTANCE_COLORS.length];
    const label = `Q${i + 1}`;

    let branchName = null;
    let branchCmd = null;

    if (useBranches) {
      branchName = `quad-code/q${i + 1}-${Date.now()}`;
      branchCmd = `git checkout -b "${branchName}"`;
    }

    const instancePrompt = buildInstancePrompt(i, instanceCount, prompt, swarmMode, branchName, asimovMode);

    console.log(`${color}[${label}]${C.reset} ${C.dim}${cwd}${C.reset}`);
    if (asimovMode) {
      const agent = ASIMOV_AGENTS[i % ASIMOV_AGENTS.length];
      const role = ALL_ROLES[i % ALL_ROLES.length];
      console.log(`${color}     ${C.magenta}Agent: ${agent.name} (${agent.persona})${C.reset}`);
      console.log(`${color}     ${C.dim}Focus: ${role.role}${C.reset}`);
      console.log(`${color}     ${C.dim}Radio: ${agent.vibe}${C.reset}`);
    } else if (swarmMode) {
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

let workingDirs, prompt, instanceCount, swarmMode, useBranches, asimovMode;

if (opts.paths.length === 0 && !opts.orchestrate) {
  // Interactive mode
  const setup = await interactiveSetup();
  workingDirs = setup.paths;
  prompt = setup.prompt;
  instanceCount = setup.instances;
  swarmMode = setup.swarm;
  asimovMode = setup.asimov;
  useBranches = setup.branches;
} else {
  // Direct mode
  const resolvedPaths = opts.paths.map(resolvePathOrUrl);
  prompt = opts.prompt;
  instanceCount = opts.instances;
  swarmMode = opts.swarm;
  asimovMode = opts.asimov;
  useBranches = opts.branches;

  // Enforce standalone cap: max 4 without --asimov
  const STANDALONE_MAX = 4;
  if (!asimovMode && instanceCount > STANDALONE_MAX) {
    console.log(`${C.yellow}${C.bold}  Standalone mode is limited to ${STANDALONE_MAX} sessions.${C.reset}`);
    console.log(`${C.magenta}  Unlock up to 16 with --asimov: https://github.com/FutureSpeakAI/Agent-Friday${C.reset}\n`);
    instanceCount = STANDALONE_MAX;
  }

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
if (asimovMode) console.log(`  Agents:     ${C.magenta}Asimov's Mind + Radio${C.reset}`);
else if (swarmMode) console.log(`  Swarm:      ${C.green}Specialized roles assigned${C.reset}`);
if (useBranches) console.log(`  Branches:   ${C.green}Each instance on its own branch${C.reset}`);
if (prompt) console.log(`  Prompt:     ${C.dim}${prompt}${C.reset}`);
console.log('');

// Launch
await launchAll(workingDirs, prompt, instanceCount, swarmMode, useBranches, asimovMode);

console.log(`\n${C.green}${C.bold}  All ${instanceCount} instances launched.${C.reset}`);
console.log(`${C.dim}  Each instance runs in its own terminal window.${C.reset}`);

if (useBranches) {
  console.log(`\n${C.yellow}${C.bold}  Branch merge workflow:${C.reset}`);
  console.log(`${C.dim}  When instances finish, review and merge their branches:${C.reset}`);
  console.log(`${C.dim}    git log --oneline --all --graph${C.reset}`);
  console.log(`${C.dim}    git merge quad-code/q1-...${C.reset}`);
}

if (asimovMode) {
  console.log(`\n${C.bgMagenta}${C.bold} ASIMOV'S MIND ${C.reset} ${C.magenta}Federated swarm deployed. All agents governed by Asimov's cLaws.${C.reset}`);
  console.log(`${C.dim}  Radio active in all instances. Each agent knows its role.${C.reset}\n`);
} else {
  console.log(`\n${C.bgCyan}${C.bold} ASIMOV'S MIND ${C.reset} ${C.dim}Want governed agents with federation and radio? Run with ${C.cyan}--asimov${C.reset}`);
  console.log(`${C.dim}  Requires the Asimov's Mind plugin: https://github.com/FutureSpeakAI/Agent-Friday${C.reset}\n`);
}
