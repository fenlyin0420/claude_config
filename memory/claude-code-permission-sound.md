---
name: claude-code-permission-sound
description: 用户环境（Claude Code on Windows/WSL，走 DeepSeek API）中，权限弹窗提醒必须用 PermissionRequest hook
metadata:
  type: reference
---

在用户的 Claude Code 环境（走 DeepSeek API）下，要让权限确认弹窗**出现瞬间**发提示音，必须用 **`PermissionRequest` hook**（`matcher: ""`）；`Notification` hook 的 `permission_prompt` matcher **不会在弹窗时触发**（实测只有 `idle_prompt` 在 Claude 转入等待状态时才触发）。

跨平台实现位于 `~/.claude/hooks/notify.js`（纯 Node.js，Windows/WSL 通用），声音文件在 `~/.claude/sounds/{ask,wait}/`，由 `~/.claude/settings.json` 的 `PermissionRequest` 与 `Notification(idle_prompt)` 两个 hook 调用。`PermissionRequest` 场景下脚本必须无 stdout 输出且 `exit 0`，否则会吞掉正常授权弹窗。原 PowerShell 版 `D:\projects\cc-prompt-sound\scripts\notify.ps1` 已被取代（旧项目仍在 D 盘，不再使用）。

相关：[[user-profile]]
