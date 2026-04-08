# Startup Flow

The complete sequence from invocation to running instances.

## Interactive Mode (`quad-code` with no args)

```
quad-code
    |
    v
[Print Logo]
    |  ASCII art banner
    |  "Powered by Asimov's Mind" badge
    |
    v
[Boot Animation]
    |  Loading bar with status messages
    |  6 steps, 250ms each
    |
    v
[Step 1: What to work on?]
    |  [1] Single project
    |  [2] Multiple projects
    |
    +---> Single: ask for path or GitHub URL (Enter = cwd)
    +---> Multi: collect up to 16 paths/URLs, empty line to stop
    |
    v
[Step 2: How many sessions?]
    |  Standalone: 1-4
    |  Asimov's Mind: 1-16
    |  Default: 4 (single) or path count (multi)
    |
    v
[Step 3: Branch isolation?] (single repo only)
    |  y → each instance gets its own git branch
    |  N → all instances share the same branch
    |
    v
[Step 4: Agent mode?]
    |  [1] Plain Claude Code (no roles)
    |  [2] Swarm roles (specialized focus per instance)
    |  [3] Asimov's Mind agents with radio (requires plugin)
    |
    v
[Step 5: Initial prompt?]
    |  Optional text sent to all instances
    |  Enter to skip
    |
    v
[Configuration Summary]
    |  Instances, mode, agents, branches, prompt
    |
    v
[Federation Detection]
    |  Check if all repos share a GitHub org
    |  If yes: "FEDERATION — All repos belong to {org}"
    |
    v
[Staggered Launch]
    |  For each instance (600ms-1500ms apart):
    |    1. Display instance info (role, agent, branch, radio vibe)
    |    2. Write temp .bat file (Windows)
    |    3. Create git branch (if -b)
    |    4. Spawn terminal via platform strategy
    |
    v
[Launch Complete]
    |  "All N instances launched"
    |  Branch merge instructions (if -b)
    |  Asimov's Mind promotion (if not -a)
```

## Direct Mode (`quad-code -n 8 -a -b .`)

```
quad-code -n 8 -a -b .
    |
    v
[Parse Args]
    |  instances=8, asimov=true, branches=true, path="."
    |
    v
[Print Logo + Boot Animation]
    |
    v
[Resolve Paths]
    |  "." → current working directory
    |  Fill 8 slots with same path
    |
    v
[Configuration Summary + Federation Detection]
    |
    v
[Staggered Launch] → 8 terminals
    |
    v
[Launch Complete]
```

## GitHub URL Flow

```
quad-code https://github.com/FutureSpeakAI/Agent-Friday
    |
    v
[Detect GitHub URL]
    |  isGitHubUrl() matches https://github.com/...
    |
    v
[Clone Repo]
    |  git clone "url" "./Agent-Friday"
    |  If directory already exists: skip clone, use existing
    |
    v
[Continue with resolved local path]
```
