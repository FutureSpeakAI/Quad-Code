# Quad Code Architecture

**Quad Code** is a parallel Claude Code deployment tool by [FutureSpeak.AI](https://github.com/FutureSpeakAI). It spawns multiple independent Claude Code terminal instances from a single command, enabling true OS-level parallelism for AI-powered software engineering.

## System Overview

```
                         +------------------+
                         |    Quad Code     |
                         |   Orchestrator   |
                         |  (Node.js CLI)   |
                         +--------+---------+
                                  |
                    Parses args / interactive setup
                    Resolves paths / clones repos
                    Generates role prompts
                    Writes temp .bat files (Windows)
                                  |
              +-------------------+-------------------+
              |         |         |         |         |
         +----v---+ +---v----+ +-v------+ +v-------+ ...up to 16
         | Term 1 | | Term 2 | | Term 3 | | Term 4 |
         | claude | | claude | | claude | | claude |
         |  Q1    | |  Q2    | |  Q3    | |  Q4    |
         +--------+ +--------+ +--------+ +--------+
              |         |         |         |
              v         v         v         v
         [ Branch ] [ Branch ] [ Branch ] [ Branch ]
         quad-code/ quad-code/ quad-code/ quad-code/
           q1-...    q2-...    q3-...    q4-...
```

## Standalone vs. Asimov's Mind

Quad Code operates in two tiers:

### Standalone (Free)

- **Max 4 simultaneous sessions**
- Each instance is plain Claude Code in permissionless mode
- Optional swarm roles (Architect, Security, Testing, Optimizer)
- Each instance can work on its own branch or separate repo
- **No federation** — instances are fully independent, no coordination
- **No radio** — standard Claude Code experience
- **No governance** — no Asimov's cLaws, no protected zones

### Asimov's Mind Integration (Full Power)

- **Up to 16 simultaneous sessions**
- Each instance deploys as a full **Agent Friday** persona (Atlas, Nova, Cipher)
- **Federation** — all instances share governance, trust, and identity under the same GitHub org
- **Radio** — musical memory active in every instance, matched to agent vibe
- **Asimov's cLaws** — governed recursive self-improvement across all agents
- **16 specialized roles** — full spectrum from architecture to accessibility
- **Branch isolation** — each agent works on its own branch, merge when done
- **Swarm coordination** — deployed via `/quad-deploy` from the swarm coordinator

## Component Architecture

### 1. CLI Entry Point (`bin/quad-code.js`)

The orchestrator. Handles:
- Argument parsing and validation
- Interactive setup flow (mode, count, paths, agent type, prompt)
- GitHub URL detection and automatic cloning
- Path normalization (Git Bash `/c/...` to Windows `C:\...`)
- Terminal spawning via platform-specific strategies
- Staggered launch (prevents OS overload)

### 2. Core Logic (`lib/core.js`)

Pure, testable functions extracted from the CLI:
- `parseArgs()` — CLI argument parsing
- `buildInstancePrompt()` — generates role/agent system prompts
- `ALL_ROLES` — 16 specialization definitions
- `ASIMOV_AGENTS` — Agent Friday persona mappings
- Color constants, path utilities

### 3. Platform Launch Strategies

| Platform | Strategy |
|----------|----------|
| **Windows** | Write temp `.bat` file, launch via `start "" cmd /k batPath` with `shell:true` |
| **macOS** | `osascript` to create Terminal.app windows |
| **Linux** | Detect gnome-terminal/konsole/xfce4-terminal/xterm, spawn with working directory |

### 4. Prompt Injection

Each instance receives context via `--append-system-prompt`:

**Swarm mode (`-s`):**
```
You are agent Q3 of 8 in a coordinated Quad Code swarm.
Your role: Test Engineer.
Your focus: Test coverage gaps, missing edge cases, flaky tests.
Work autonomously. Begin scanning.
```

**Asimov mode (`-a`):**
```
You are Agent Friday (Cipher — Technical Lead), agent Q3 of 8
in a federated Asimov's Mind swarm deployed by Quad Code.
You operate under Asimov's cLaws: [1] Never harm... [2] Follow instructions... [3] Preserve improvements...
Your specialization: Test Engineer — ...
IMPORTANT: Activate musical memory radio with mode "radio" and vibe "intense".
Begin scanning.
```

### 5. Branch Isolation (`-b`)

When enabled, each instance creates its own branch before Claude starts:

```
main ─────────────────────────────────────────>
  ├── quad-code/q1-1775676026042 (Architect)
  ├── quad-code/q2-1775676026066 (Security)
  ├── quad-code/q3-1775676026089 (Testing)
  └── quad-code/q4-1775676026118 (Optimizer)
```

After work completes, the user reviews and merges branches:
```bash
git log --oneline --all --graph
git merge quad-code/q1-...
```

### 6. Federation Detection

Quad Code auto-detects federation potential by checking if all repo paths belong to the same GitHub organization:

```javascript
// Extract org from remote URL
git remote get-url origin → github.com/FutureSpeakAI/repo
// If all repos share the org → FEDERATION READY
```

Federation is a feature of Asimov's Mind. Standalone users see the detection but cannot activate federated governance.

## Data Flow

```
User invokes quad-code
        |
        v
  [Parse args or run interactive setup]
        |
        v
  [Resolve paths: local dirs or git clone from GitHub URLs]
        |
        v
  [Generate per-instance prompts based on mode]
        |
        +--> Plain: no prompt
        +--> Swarm (-s): role + focus
        +--> Asimov (-a): persona + cLaws + radio + focus
        |
        v
  [For each instance (staggered 600ms-1500ms apart):]
        |
        +--> [Write temp .bat file (Windows)]
        +--> [Create git branch (if -b)]
        +--> [Spawn terminal process]
        |
        v
  [Each terminal runs: claude --dangerously-skip-permissions --append-system-prompt "..."]
        |
        v
  [Instances work independently — no shared state beyond the repo]
```

## Security Model

- All instances run with `--dangerously-skip-permissions` (fully autonomous)
- Each instance inherits the repo's `CLAUDE.md` governance rules
- Asimov mode adds cLaws as a system prompt constraint
- Branch isolation prevents instances from stepping on each other's changes
- Temp `.bat` files are cleaned up after launch (10s timeout)
- No secrets are passed through prompts — only role assignments

## Scaling Considerations

| Instances | API Cost | Best For |
|-----------|----------|----------|
| 1-4 | Low | Quick focused tasks, multi-repo work |
| 5-8 | Medium | Thorough audits, pre-PR reviews |
| 9-12 | High | Major refactors, comprehensive sweeps |
| 13-16 | Very High | Pre-release audits, full codebase analysis |

Each instance consumes its own Claude API quota. 16 instances = 16x API usage.
