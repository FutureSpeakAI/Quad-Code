# Quad Code

Launch four simultaneous instances of Claude Code — on a single repo or across multiple repos. All instances run in permissionless mode for maximum autonomy.

```
  ____                  _    ____          _
 / __ \                | |  / ___|___   __| | ___
| |  | |_   _  __ _  __| | | |   / _ \ / _` |/ _ \
| |__| | | | |/ _` |/ _` | | |__| (_) | (_| |  __/
 \___\_\ |_| | (_| | (_| |  \____\___/ \__,_|\___|
        \__,_|\__,_|\__,_|
```

## Why?

Sometimes one Claude isn't enough. Quad Code opens four terminal windows, each running its own Claude Code instance in permissionless mode, so you can:

- **Parallelize work** on a single codebase (one reviews, one tests, one refactors, one documents)
- **Work across repos** simultaneously (frontend, backend, API, infra)
- **Send the same prompt** to all four instances at once
- **Clone from GitHub** — just paste a URL instead of a local path

## Install

```bash
npm install -g quad-code
```

**Prerequisite:** [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) must be installed and authenticated.

## Usage

### Interactive mode (recommended)

Just run `quad-code` with no arguments and follow the prompts:

```
$ quad-code

  Let's set up your four Claude Code instances.

  [1] Single project (4 instances, one repo)
  [2] Multiple projects (one instance per repo)

  Choose mode (1 or 2): 1

  Enter the project path or GitHub URL
  (or press Enter for current directory): ~/projects/my-app

  Initial prompt for all instances (optional, press Enter to skip):
```

### Direct mode (skip prompts)

```bash
# Single repo — 4 instances in one directory
quad-code .
quad-code /path/to/my-project

# Multi-repo — one instance per repo
quad-code ~/frontend ~/backend ~/api ~/infra

# GitHub URLs — clones automatically
quad-code https://github.com/user/repo
quad-code https://github.com/user/fe https://github.com/user/be

# With an initial prompt
quad-code . -p "Review this codebase for security issues"
```

If you provide 2-3 paths, the remaining slots reuse the last path.

### Options

| Flag | Description |
|------|-------------|
| `-p, --prompt <text>` | Send an initial prompt to all instances |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

## How It Works

Quad Code spawns four separate terminal windows (CMD on Windows, Terminal on macOS, gnome-terminal/konsole/xterm on Linux), each running `claude --dangerously-skip-permissions` in the specified working directory. Each instance is fully independent — you interact with them individually.

When you provide a GitHub URL instead of a local path, Quad Code clones the repo into your current directory before launching.

The instances are color-coded in the launcher output:

- **Q1** - Cyan
- **Q2** - Green
- **Q3** - Yellow
- **Q4** - Magenta

## Platform Support

| Platform | Terminal Used |
|----------|-------------|
| Windows | `cmd.exe` (new window via `start`) |
| macOS | Terminal.app (via `osascript`) |
| Linux | gnome-terminal, konsole, xfce4-terminal, or xterm |

## License

MIT - [FutureSpeak.AI](https://github.com/FutureSpeakAI)
