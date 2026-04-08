# Quad Code

Launch up to 16 simultaneous instances of Claude Code — on a single repo or across multiple repos. Each instance runs in permissionless mode. Optional swarm mode assigns specialized roles (security, testing, architecture, etc.) to each instance.

```
  ____                  _    ____          _
 / __ \                | |  / ___|___   __| | ___
| |  | |_   _  __ _  __| | | |   / _ \ / _` |/ _ \
| |__| | | | |/ _` |/ _` | | |__| (_) | (_| |  __/
 \___\_\ |_| | (_| | (_| |  \____\___/ \__,_|\___|
        \__,_|\__,_|\__,_|
```

## Why?

Sometimes one Claude isn't enough. Quad Code opens up to 16 terminal windows, each running its own Claude Code instance in permissionless mode, so you can:

- **Parallelize work** on a single codebase with specialized roles
- **Scale from 4 to 16** instances depending on the task
- **Swarm mode** — each instance gets a specialized role (architect, auditor, tester, optimizer, etc.)
- **Work across repos** simultaneously (frontend, backend, API, infra)
- **Clone from GitHub** — just paste a URL instead of a local path
- **Integrate with Asimov's Mind** — deploy as hardware-level parallelism for agent swarms

## Install

```bash
npm install -g quad-code
```

**Prerequisite:** [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) must be installed and authenticated.

## Usage

### Interactive mode (recommended)

```
$ quad-code

  How many instances? (4, 8, 12, or 16 — default 4): 8

  [1] Single project (8 instances, one repo)
  [2] Multiple projects (one instance per repo)

  Choose mode (1 or 2): 1

  Enter the project path or GitHub URL: ~/projects/my-app

  Assign specialized roles to each instance? (y/N): y

  Initial prompt for all instances (optional): Fix all failing tests
```

### Direct mode

```bash
# 4 instances (default)
quad-code .

# Scale up
quad-code -n 8 .
quad-code -n 12 .
quad-code -n 16 .

# Swarm mode — specialized roles per instance
quad-code -n 8 -s .
quad-code -n 16 -s /path/to/repo

# With a prompt
quad-code -n 8 -s . -p "Prepare this codebase for production"

# Multi-repo
quad-code -n 4 ~/fe ~/be ~/api ~/infra

# GitHub URLs
quad-code https://github.com/user/repo
```

### Options

| Flag | Description |
|------|-------------|
| `-n, --instances <N>` | Number of instances: 1–16 (default: 4) |
| `-s, --swarm` | Assign specialized roles to each instance |
| `-b, --branches` | Each instance works on its own git branch |
| `-p, --prompt <text>` | Send an initial prompt to all instances |
| `--orchestrate` | Programmatic mode (used by Asimov's Mind) |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

## Swarm Roles

When `-s` (swarm mode) is enabled, each instance gets a specialized focus area:

### 4 instances
| Instance | Role |
|----------|------|
| Q1 | Lead Architect |
| Q2 | Security Auditor |
| Q3 | Test Engineer |
| Q4 | Optimizer |

### 8 instances
Adds: Code Reviewer, Documentation, Type Safety, Dependency Auditor

### 12 instances
Adds: Integration Tester, Memory Analyst, Error Handling, Accessibility & UX

### 16 instances
Full specialization: separate agents for secrets scanning, dead code hunting, bundle optimization, API documentation, and more.

## Asimov's Mind Integration

Quad Code can serve as the hardware-level parallelism layer for [Asimov's Mind](https://github.com/FutureSpeakAI/Agent-Friday) agent swarms. Instead of spawning subagents within a single Claude Code context, the swarm coordinator can deploy Quad Code to launch true OS-level parallel instances — each with its own full context window.

```bash
# Asimov's Mind can invoke Quad Code as a swarm deployment tool
quad-code -n 16 -s --orchestrate /path/to/repo
```

## How It Works

Quad Code spawns separate terminal windows (CMD on Windows, Terminal on macOS, gnome-terminal/konsole/xterm on Linux), each running `claude --dangerously-skip-permissions`. In swarm mode, each instance receives a role-specific system prompt directing its focus area.

When you provide a GitHub URL instead of a local path, Quad Code clones the repo into your current directory before launching.

## Platform Support

| Platform | Terminal Used |
|----------|-------------|
| Windows | `cmd.exe` (new window via `start`) |
| macOS | Terminal.app (via `osascript`) |
| Linux | gnome-terminal, konsole, xfce4-terminal, or xterm |

## License

MIT - [FutureSpeak.AI](https://github.com/FutureSpeakAI)
