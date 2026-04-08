// Pure, testable logic extracted from bin/quad-code.js

export const MAX_INSTANCES = 16;
export const VERSION = '2.1.0';

export const C = {
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

export const INSTANCE_COLORS = [
  C.cyan, C.green, C.yellow, C.magenta,
  C.blue, C.red, C.white, C.cyan,
  C.green, C.yellow, C.magenta, C.blue,
  C.red, C.white, C.cyan, C.green,
];

export const ALL_ROLES = [
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

export function isGitHubUrl(str) {
  return /^https?:\/\/(www\.)?github\.com\//.test(str) || /^git@github\.com:/.test(str);
}

export function normalizePath(inputPath) {
  if (process.platform === 'win32') {
    const match = inputPath.match(/^\/([a-zA-Z])\/(.*)/);
    if (match) return `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, '\\')}`;
  }
  return inputPath;
}

export function parseArgs(argv) {
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
    asimov: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') result.help = true;
    else if (arg === '-v' || arg === '--version') result.version = true;
    else if (arg === '-s' || arg === '--swarm') result.swarm = true;
    else if (arg === '-b' || arg === '--branches') result.branches = true;
    else if (arg === '-a' || arg === '--asimov') result.asimov = true;
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

// Agent Friday persona names for Asimov mode
const ASIMOV_AGENTS = [
  { name: 'Atlas', persona: 'Research Director', vibe: 'focused' },
  { name: 'Nova', persona: 'Creative Strategist', vibe: 'energetic' },
  { name: 'Cipher', persona: 'Technical Lead', vibe: 'intense' },
  { name: 'Atlas', persona: 'Research Director', vibe: 'calm' },
  { name: 'Nova', persona: 'Creative Strategist', vibe: 'upbeat' },
  { name: 'Cipher', persona: 'Technical Lead', vibe: 'focused' },
  { name: 'Atlas', persona: 'Research Director', vibe: 'energetic' },
  { name: 'Nova', persona: 'Creative Strategist', vibe: 'calm' },
  { name: 'Cipher', persona: 'Technical Lead', vibe: 'intense' },
  { name: 'Atlas', persona: 'Research Director', vibe: 'upbeat' },
  { name: 'Nova', persona: 'Creative Strategist', vibe: 'focused' },
  { name: 'Cipher', persona: 'Technical Lead', vibe: 'calm' },
  { name: 'Atlas', persona: 'Research Director', vibe: 'intense' },
  { name: 'Nova', persona: 'Creative Strategist', vibe: 'energetic' },
  { name: 'Cipher', persona: 'Technical Lead', vibe: 'upbeat' },
  { name: 'Atlas', persona: 'Research Director', vibe: 'focused' },
];

export { ASIMOV_AGENTS };

export function buildInstancePrompt(index, totalCount, basePrompt, swarmMode, branchName, asimovMode) {
  const parts = [];

  if (asimovMode) {
    const agent = ASIMOV_AGENTS[index % ASIMOV_AGENTS.length];
    const role = ALL_ROLES[index % ALL_ROLES.length];
    parts.push(
      `You are Agent Friday (${agent.name} — ${agent.persona}), agent Q${index + 1} of ${totalCount} in a federated Asimov's Mind swarm deployed by Quad Code.`,
      `You operate under Asimov's cLaws: (1) Never harm the user or allow harm through inaction. (2) Follow user instructions unless they conflict with Law 1. (3) Preserve your own improvements unless they conflict with Laws 1-2.`,
      `Your specialization: ${role.role} — ${role.focus}.`,
      `Work autonomously within your focus area. You are part of a governed swarm — other agents handle other domains.`,
      `IMPORTANT: On startup, activate the musical memory radio by calling the musical_memory_mode tool with mode "radio" and then musical_memory_vibe with vibe "${agent.vibe}". The radio should play while you work.`,
      `Begin by scanning the codebase for issues in your focus area, then fix what you find.`
    );
  } else if (swarmMode) {
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
