---
name: claude-code-statusline-model-name
description: Claude Code 的 statusline 不认 ANTHROPIC_DEFAULT_*_MODEL_NAME（只影响 /model 选择器），第三方模型得在脚本里自己解析显示名
metadata:
  type: reference
---

用户用 Claude Code 跑在 Anthropic 兼容的第三方后端（`ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic`），当前模型 id 是 `deepseek-v4-flash-vision-exp[1M]`，alias 经 settings.json 的 `env` 映射（`ANTHROPIC_DEFAULT_*_MODEL` / `ANTHROPIC_DEFAULT_*_MODEL_NAME`）。

**Why:** Claude Code 只有对内置模型才把 statusline payload 的 `model.display_name` 解析成友好名；对非内置/第三方模型会直接回落成原始 model id。`_NAME` 变量官方只用于 `/model` 选择器显示名，不会流到 statusline（详见 code.claude.com/docs/en/env-vars、model-config、statusline）。

**How to apply:** statusline 的 Model 字段要在脚本里自行解析——匹配 `model.id` 到 `ANTHROPIC_DEFAULT_<ALIAS>_MODEL` 后取对应 `ANTHROPIC_DEFAULT_<ALIAS>_MODEL_NAME`。已实现于 `~/.claude/statusline-node.js` 的 `resolveModelName()`（Windows 实际路径，`.sh` 会 `exec node`）和 `~/.claude/statusline-command.sh` 的 v1 fallback。改 statusline 时保留下这段逻辑；`model.display_name` 在会话首次调用前可能为 null，需兜底到 id。相关：[[user-profile]]、[[feedback-experience-summary]]
