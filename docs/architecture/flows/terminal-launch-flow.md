# Terminal Launch Flow

How Quad Code spawns each Claude Code instance across platforms.

## Windows Launch Flow

Windows is the most complex due to CMD quoting limitations. Quad Code uses a temp `.bat` file strategy.

```
launchTerminal(index, cwd, prompt, branchCmd)
    |
    v
[Build Claude command]
    |  claude --dangerously-skip-permissions
    |  + --append-system-prompt "..." (if swarm/asimov)
    |
    v
[Write temp .bat file]
    |  Path: %TEMP%\qc-Q{n}-{timestamp}.bat
    |  Contents:
    |    @echo off
    |    cd /d "C:\path\to\repo"
    |    title Quad Code - Q{n}
    |    git checkout -b "quad-code/q{n}-..." (if branches)
    |    claude --dangerously-skip-permissions --append-system-prompt "..."
    |
    v
[Spawn via shell]
    |  Command: start "" cmd /k "{batPath}"
    |  Options: { detached: true, stdio: 'ignore', shell: true }
    |
    v
[New CMD window opens]
    |  .bat file executes
    |  Claude Code starts interactively
    |  Agent knows its role via system prompt
    |
    v
[Cleanup]
    |  setTimeout 10s → delete .bat file
```

## macOS Launch Flow

```
launchTerminal(index, cwd, prompt, branchCmd)
    |
    v
[Build Claude command]
    |
    v
[Compose AppleScript]
    |  tell application "Terminal" to do script
    |    "cd '/path/to/repo' && [branchCmd &&] claude ..."
    |
    v
[Spawn osascript]
    |  spawn('osascript', ['-e', script])
    |  { detached: true, stdio: 'ignore' }
    |
    v
[New Terminal.app window opens]
```

## Linux Launch Flow

```
launchTerminal(index, cwd, prompt, branchCmd)
    |
    v
[Detect terminal emulator] (cached after first call)
    |  Try in order: gnome-terminal, konsole, xfce4-terminal, xterm
    |  Use `which` to find first available
    |
    v
[Build terminal-specific args]
    |  gnome-terminal: --title, --working-directory, --, bash, -c
    |  konsole: --workdir, -e
    |  xterm/other: -e "cd ... && ..."
    |
    v
[Spawn terminal]
    |  { detached: true, stdio: 'ignore' }
```

## Stagger Strategy

Instances are launched sequentially with delays to prevent:
- OS process spawn limits
- Claude API rate limits on concurrent auth
- Terminal window manager overwhelm

```
Q1: launch immediately
    [wait 600ms-1500ms]
Q2: launch
    [wait 600ms-1500ms]
Q3: launch
    ...
Q{n}: launch
```

The delay is currently 600ms between launches (reduced from initial 1500ms after testing).
