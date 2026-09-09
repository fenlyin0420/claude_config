---
name: mcp-packaging-preference
description: 用户的 Python MCP server 打包与注册偏好——uvx 从 git 源启动，密钥经注册层 --env + ${VAR} 展开注入，配置文件零明文
metadata:
  type: feedback
---

用户希望自己的 Python MCP server 以可移植方式注册（2026-08-25 在 image-vision-server 项目确立）：

1. **启动**：uvx 从 `git+https://` 源拉取运行，不用本地 `.venv` 绝对路径。项目须有 `pyproject.toml` + `[project.scripts]` 入口；mcp 库的 `Server.run` 是异步的，console script 需要同步 `run()` 包装 async `main()`。
2. **密钥注入**：注册层用官方主流方式 `claude mcp add --env 'KEY=${KEY}'`（单引号防 shell 当场展开），落盘为 `${VAR}` 引用，Claude Code 连接建立时才展开——配置文件零明文。key 本体存 OS 用户级环境变量。
3. **注册命令**：`claude mcp add --scope user ... -- uvx --from git+... <pkg>`。

**Why:** 配置跨机器复用、密钥不泄露进 claude.json/dotfiles、消除路径耦合。用户明确拒绝服务端自解析 `--env` 参数的方案，选择注册层注入。

**How to apply:** 为用户新建/改造 Python MCP 项目时按上述三点默认执行。注意：① uvx 有构建缓存，git 更新后若跑旧版用 `uv cache clean <pkg>`；② 官方文档只承诺 `.mcp.json` 支持 `${VAR}` 展开，但已用临时 MCP 探针实测确认 **user 作用域（~/.claude.json）同样展开**，可放心使用此形态；③ 参考 commit：7f2f426（打包）、bc531be（README 注入文档）。
