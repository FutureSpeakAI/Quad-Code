# Quad Code

Launch four simultaneous instances of Claude Code — on a single repo or across multiple repos.

```
  ____                  _    ____          _
 / __ \                | |  / ___|___   __| | ___
| |  | |_   _  __ _  __| | | |   / _ \ / _` |/ _ \
| |__| | | | |/ _` |/ _` | | |__| (_) | (_| |  __/
 \___\_\ |_| | (_| | (_| |  \____\___/ \__,_|\___|
        \__,_|\__,_|\__,_|
```

## Why?

Sometimes one Claude isn't enough. Quad Code opens four terminal windows, each running its own Claude Code instance, so you can:

- **Parallelize work** on a single codebase (one reviews, one tests, one refactors, one documents)
- **Work across repos** simultaneously (frontend, backend, API, infra)
- **Send the same prompt** to all four instances at once

## Install

```bash
npm install -g quad-code
```

**Prerequisite:** [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) must be installed and authenticated.

## Usage

### Single repo (4 instances, same directory)

```bash
quad-code .
quad-code /path/to/my-project
```

### Multi-repo (one instance per repo)

```bash
quad-code ~/frontend ~/backend ~/api ~/infra
```

If you provide 2-3 paths, the remaining slots reuse the last path.

### With an initial prompt

```bash
quad-code . -p "Review this codebase for security issues"
quad-code ~/proj/fe ~/proj/be -p "Find all TODO comments"
```

### Options

| Flag | Description |
|------|-------------|
| `-p, --prompt <text>` | Send an initial prompt to all instances |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

## How It Works

Quad Code spawns four separate terminal windows (CMD on Windows, Terminal on macOS, gnome-terminal/konsole/xterm on Linux), each running `claude` in the specified working directory. Each instance is fully independent — you interact with them individually.

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
