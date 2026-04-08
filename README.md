# Quad Code

### By [FutureSpeak.AI](https://github.com/FutureSpeakAI) | Powered by [Asimov's Mind](https://github.com/FutureSpeakAI/Agent-Friday)

```
   ██████╗ ██╗   ██╗ █████╗ ██████╗      ██████╗ ██████╗ ██████╗ ███████╗
  ██╔═══██╗██║   ██║██╔══██╗██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ██║   ██║██║   ██║███████║██║  ██║    ██║     ██║   ██║██║  ██║█████╗
  ██║▄▄ ██║██║   ██║██╔══██║██║  ██║    ██║     ██║   ██║██║  ██║██╔══╝
  ╚██████╔╝╚██████╔╝██║  ██║██████╔╝    ╚██████╗╚██████╔╝██████╔╝███████╗
   ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝      ╚═════╝ ╚═════╝╚═════╝ ╚══════╝
```

**Launch up to 16 parallel Claude Code instances from a single command.** Each instance runs in its own terminal window with its own full context window. Assign specialized roles. Deploy governed AI agent swarms. Play radio while your agents work.

---

## Standalone vs. Asimov's Mind

Quad Code is powerful on its own. With [Asimov's Mind](https://github.com/FutureSpeakAI/Agent-Friday), it becomes exponential.

| Capability | Standalone | With Asimov's Mind |
|------------|:----------:|:------------------:|
| Simultaneous sessions | **4 max** | **Up to 16** |
| Swarm roles | Basic (4 roles) | 16 specializations |
| Agent personas | - | Atlas, Nova, Cipher |
| Federation | - | Auto-detected, governed |
| Radio | - | Musical memory per agent |
| Asimov's cLaws | - | Enforced in every instance |
| Branch isolation | Per-instance branches | Federated branch strategy |
| Multi-repo | 4 separate repos | 16 repos, federated by org |
| Deploy from swarm | - | `/quad-deploy` skill |
| Protected zones | - | Hook-enforced, structural |
| Trust scoring | - | Vault-aware agent trust |

**Standalone** gives you four simultaneous Claude Code sessions — great for working across a frontend, backend, API, and infra repo at the same time, or splitting a single repo into four parallel workstreams on separate branches.

**Asimov's Mind** unlocks the full swarm. Sixteen Agent Friday instances, each with a specialized role, governed by Asimov's cLaws, federated under your GitHub org, with radio playing while they work. This is not four terminals with Claude in them. This is a coordinated AI workforce.

---

## Install

```bash
npm install -g quad-code
```

**Prerequisite:** [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) must be installed and authenticated.

**For full power:** Install [Asimov's Mind](https://github.com/FutureSpeakAI/Agent-Friday) (Agent Friday) as a Claude Code plugin.

---

## Quick Start

### Standalone (4 sessions)

```bash
# Four Claude Code instances on your current repo
quad-code .

# Four instances on separate repos
quad-code ~/frontend ~/backend ~/api ~/infra

# Four instances with specialized roles
quad-code -s .

# Four instances, each on its own branch
quad-code -s -b .
```

### Asimov's Mind (up to 16 agents)

```bash
# Eight federated Agent Friday instances with radio
quad-code -n 8 -a -b .

# Sixteen agents for a full-spectrum pre-release audit
quad-code -n 16 -a -b . -p "Prepare for production release"

# From within Asimov's Mind:
/quad-deploy 8 release
```

### Interactive Mode

Just run `quad-code` with no arguments:

```
$ quad-code

  ██████╗ ██╗   ██╗ █████╗ ██████╗  ...
  ...

  [====================]  Ready.

  What would you like to work on?
    [1] A single project
    [2] Multiple projects
  Choose (1 or 2): 1

  Project path or GitHub URL: ~/projects/my-app

  How many simultaneous sessions? (1-4, default 4): 4

  Give each instance its own branch? (y/N): y

  Agent mode:
    [1] Plain Claude Code (no roles)
    [2] Swarm roles (specialized focus per instance)
    [3] Asimov's Mind agents with radio
  Choose (1, 2, or 3): 3

  Initial prompt for all instances: Fix all failing tests
```

---

## CLI Reference

```
quad-code [options] [paths...]
```

| Flag | Description |
|------|-------------|
| `-n, --instances <N>` | Number of instances: 1-4 standalone, 1-16 with Asimov's Mind |
| `-s, --swarm` | Assign specialized roles to each instance |
| `-a, --asimov` | Deploy as Asimov's Mind agents with radio |
| `-b, --branches` | Each instance works on its own git branch |
| `-p, --prompt <text>` | Send an initial prompt to all instances |
| `--orchestrate` | Programmatic mode (used by Asimov's Mind internally) |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

Paths can be local directories or GitHub URLs. GitHub URLs are automatically cloned.

---

## Swarm Roles

When `-s` (swarm) or `-a` (Asimov) mode is enabled, each instance gets a specialized focus area. Roles scale with instance count:

### 4 instances (Standalone)
| Q | Role |
|---|------|
| Q1 | Lead Architect |
| Q2 | Security Auditor |
| Q3 | Test Engineer |
| Q4 | Optimizer |

### 8 instances (Asimov's Mind)
Adds: Code Reviewer, Documentation, Type Safety, Dependency Auditor

### 16 instances (Asimov's Mind)
Full spectrum: Lead Architect, Security Auditor, Secrets Scanner, Unit Tester, Integration Tester, Performance Profiler, Memory Analyst, Bundle Optimizer, Code Quality, Dead Code Hunter, Documentation, API Documentation, Type Safety, Dependency Auditor, Error Handling, Accessibility

---

## Asimov's Mind: The Full Picture

When you run `quad-code -n 8 -a -b .`, here's what happens:

```
  FEDERATION  All repos belong to FutureSpeakAI — federation ready

  [Q1] C:\Users\you\Projects\my-app
       Agent: Atlas (Research Director)
       Focus: Lead Architect
       Radio: focused
  [Q2] C:\Users\you\Projects\my-app
       Agent: Nova (Creative Strategist)
       Focus: Security Auditor
       Radio: energetic
  [Q3] C:\Users\you\Projects\my-app
       Agent: Cipher (Technical Lead)
       Focus: Test Engineer
       Radio: intense
  ...

  ASIMOV'S MIND  Federated swarm deployed. All agents governed by Asimov's cLaws.
  Radio active in all instances. Each agent knows its role.
```

Each terminal window contains a fully interactive Claude Code session where the agent:

1. **Knows its identity** — Atlas, Nova, or Cipher persona with specific expertise
2. **Knows its role** — focused on architecture, security, testing, etc.
3. **Follows Asimov's cLaws** — governed recursive self-improvement
4. **Has radio playing** — musical memory matched to its vibe (focused, energetic, intense, calm, upbeat)
5. **Works on its own branch** — no merge conflicts between agents
6. **Is federated** — shares governance with all other agents under your GitHub org

### After the Swarm Finishes

```bash
# See what every agent did
git log --oneline --all --graph

# Review and merge each agent's branch
git merge quad-code/q1-...
git merge quad-code/q2-...
```

### Deploying from Asimov's Mind

If you have Asimov's Mind installed, you can deploy Quad Code directly from the swarm coordinator:

```
/quad-deploy 8 release
```

This is equivalent to `quad-code -n 8 -a -b . -p "Prepare for production release"` — but invoked from within an Asimov's Mind session, with full swarm coordinator orchestration.

---

## Architecture

```
                         +------------------+
                         |    Quad Code     |
                         |   Orchestrator   |
                         +--------+---------+
                                  |
              +-------------------+-------------------+
              |         |         |         |         |
         +----v---+ +---v----+ +-v------+ +v-------+ ...
         | Term 1 | | Term 2 | | Term 3 | | Term 4 |
         | Atlas  | | Nova   | | Cipher | | Atlas  |
         | Arch.  | | Secur. | | Test   | | Optim. |
         | branch | | branch | | branch | | branch |
         +--------+ +--------+ +--------+ +--------+
```

Each terminal is a fully independent Claude Code process with:
- Its own context window (no sharing, no overhead)
- Its own API connection
- Its own git branch (if `-b`)
- Its own role assignment (if `-s` or `-a`)

For detailed architecture documentation, see [docs/architecture/](docs/architecture/).

---

## Platform Support

| Platform | Terminal Used |
|----------|-------------|
| Windows | CMD via temp `.bat` files |
| macOS | Terminal.app via AppleScript |
| Linux | gnome-terminal, konsole, xfce4-terminal, or xterm |

---

## Why FutureSpeak.AI Built This

At [FutureSpeak.AI](https://github.com/FutureSpeakAI), we build [Agent Friday](https://github.com/FutureSpeakAI/Agent-Friday) — a governed AI agent system based on Asimov's Laws. Agent Friday already spawns subagents within a single Claude Code process, but we hit a ceiling: in-process agents share context, creating coordination overhead that limits true parallelism.

Quad Code breaks through that ceiling. Instead of subagents sharing one brain, Quad Code gives each agent its own brain — its own terminal, its own context window, its own full Claude Code instance. The result is linear scaling: 8 agents do 8x the work, not 3x with 5x overhead.

Combined with Asimov's Mind governance (cLaws, federation, protected zones, trust scoring) and Agent Friday's personality system (Atlas, Nova, Cipher with musical memory), Quad Code turns a single developer's machine into a coordinated AI workforce.

**Standalone Quad Code** is a fast, useful tool for anyone who wants four Claude Code sessions at once.

**Quad Code + Asimov's Mind** is a governed swarm intelligence platform.

The choice is yours. The ceiling is ours to remove.

---

## License

MIT - [FutureSpeak.AI](https://github.com/FutureSpeakAI)
