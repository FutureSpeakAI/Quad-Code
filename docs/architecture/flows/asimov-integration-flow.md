# Asimov's Mind Integration Flow

How Quad Code integrates with [Asimov's Mind](https://github.com/FutureSpeakAI/Agent-Friday) to create federated agent swarms with governed recursive self-improvement.

## Architecture: Quad Code in the Asimov Ecosystem

```
+-----------------------------------------------------------------------+
|                        Asimov's Mind Ecosystem                         |
|                                                                        |
|  +------------------+     +-----------------+     +----------------+   |
|  | Swarm Coordinator |---->|  /quad-deploy   |---->|   Quad Code    |   |
|  | (in-process)      |     |  (skill)        |     |   (CLI tool)   |   |
|  +------------------+     +-----------------+     +-------+--------+   |
|                                                           |            |
|         Spawns in-process agents          Spawns OS-level terminals    |
|         via Agent tool (limited)          via platform commands        |
|                                                           |            |
|                                    +------+------+------+-+----+       |
|                                    |      |      |      |      |      |
|                                    v      v      v      v      v      |
|                                  +----+ +----+ +----+ +----+ +----+   |
|                                  | Q1 | | Q2 | | Q3 | | Q4 | |... |   |
|                                  |Fri | |Fri | |Fri | |Fri | |Fri |   |
|                                  +----+ +----+ +----+ +----+ +----+   |
|                                    |      |      |      |      |      |
|                                    v      v      v      v      v      |
|                                  [Atlas] [Nova] [Ciph] [Atlas] [Nova]  |
|                                  radio   radio  radio  radio   radio   |
|                                  cLaws   cLaws  cLaws  cLaws   cLaws   |
|                                                                        |
|  Governance: Asimov's cLaws enforced in every instance                 |
|  Federation: All agents share org identity + trust + CLAUDE.md         |
+-----------------------------------------------------------------------+
```

## In-Process vs. Terminal Parallelism

### In-Process (Standard Asimov Swarm)
```
Swarm Coordinator
    |
    +---> Agent tool → subagent 1 (shares coordinator's context)
    +---> Agent tool → subagent 2 (shares coordinator's context)
    +---> Agent tool → subagent 3 (shares coordinator's context)
```
- Subagents share the coordinator's context window
- Coordination overhead consumes tokens
- Limited by single-process concurrency
- Results available inline to coordinator

### Terminal-Level (Quad Code Deployment)
```
Swarm Coordinator
    |
    +---> /quad-deploy 8
              |
              +---> Terminal Q1 (own context window, own process)
              +---> Terminal Q2 (own context window, own process)
              +---> Terminal Q3 (own context window, own process)
              +---> Terminal Q4 (own context window, own process)
              +---> Terminal Q5 (own context window, own process)
              +---> Terminal Q6 (own context window, own process)
              +---> Terminal Q7 (own context window, own process)
              +---> Terminal Q8 (own context window, own process)
```
- Each agent has its own full context window
- Zero coordination overhead — each works independently
- True OS-level parallelism (8 separate processes)
- Results appear as commits on separate branches

## Deployment via /quad-deploy

The `/quad-deploy` skill is the bridge between Asimov's Mind and Quad Code:

```
User: /quad-deploy 8 release

Swarm Coordinator:
    1. Verify quad-code is installed (npm install -g quad-code)
    2. Build command: quad-code -n 8 -a -b . -p "Prepare for production release"
    3. Execute command
    4. Report deployment to user

Result:
    8 terminal windows open
    Each running Agent Friday (Atlas/Nova/Cipher)
    Each on its own branch
    Each with radio playing
    Each governed by Asimov's cLaws
    All working toward the "release" goal
```

## Agent Identity Assignment

Each instance receives a full Agent Friday identity:

| Instance | Persona | Role | Specialization | Radio Vibe |
|----------|---------|------|----------------|------------|
| Q1 | Atlas | Research Director | Lead Architect | focused |
| Q2 | Nova | Creative Strategist | Security Auditor | energetic |
| Q3 | Cipher | Technical Lead | Test Engineer | intense |
| Q4 | Atlas | Research Director | Optimizer | calm |
| Q5 | Nova | Creative Strategist | Code Reviewer | upbeat |
| Q6 | Cipher | Technical Lead | Documentation | focused |
| Q7 | Atlas | Research Director | Type Safety | energetic |
| Q8 | Nova | Creative Strategist | Dependency Auditor | calm |

Personas cycle through Atlas → Nova → Cipher to distribute cognitive diversity.

## Federation

Federation activates when all repos belong to the same GitHub organization:

```
FEDERATION DETECTED
    |
    v
All instances share:
    - GitHub org identity (e.g., FutureSpeakAI)
    - CLAUDE.md governance rules
    - Asimov's cLaws (injected via --append-system-prompt)
    - Protected zones (enforced by PreToolUse hooks)
    - Trust context (inherited from the repo's Asimov config)
```

Federation is exclusive to Asimov's Mind users. Standalone Quad Code detects federation potential but cannot activate it.

## Radio Integration

Each Asimov agent is instructed to activate the musical memory radio on startup:

```
System prompt includes:
    "Activate musical memory radio with mode 'radio' and vibe '{vibe}'"

Agent on startup:
    1. Calls musical_memory_mode(mode: "radio")
    2. Calls musical_memory_vibe(vibe: "focused")
    3. Radio plays while agent works
```

Radio vibes are matched to agent personas:
- **Atlas**: focused, calm, energetic
- **Nova**: energetic, upbeat, calm
- **Cipher**: intense, focused, upbeat

## Governance Enforcement

Asimov's cLaws are injected into every agent's system prompt:

```
Law 1: Never harm the user or allow harm through inaction.
Law 2: Follow user instructions unless they conflict with Law 1.
Law 3: Preserve your own improvements unless they conflict with Laws 1-2.
```

Additionally, if the repo has Asimov's Mind hooks installed:
- `first-law.py` blocks writes to protected zones
- `third-law.py` logs all file modifications
- These hooks run at the Claude Code platform level and cannot be bypassed

## Branch Merge Workflow

After all agents complete their work:

```
git log --oneline --all --graph    # See all branches
git diff main..quad-code/q1-...    # Review each agent's changes
git merge quad-code/q1-...         # Merge approved changes
git branch -d quad-code/q1-...     # Clean up
```

For complex merges across many branches, the swarm coordinator can be used to review and merge systematically.
