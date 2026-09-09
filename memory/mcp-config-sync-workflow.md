---
name: mcp-config-sync-workflow
description: 用户用 ~/.claude/mcp.json 作为跨 agent 的 MCP 配置源，setupMCPs.sh(Claude) 与 setupMCPs.dsh.sh(dsh) 为安装脚本（enable 开关、平台包裹由各安装器判断、配置=唯一权威）
metadata:
  type: project
---

用户将 MCP 注册收敛为单一配置文件 **`~/.claude/mcp.json`**（跨 agent 通用规范，手改为准）。已知两个安装脚本：`~/.claude/setupMCPs.sh`（Claude Code，全量同步到 `~/.claude.json` 顶层 `mcpServers`）、`~/.claude/setupMCPs.dsh.sh`（DeepSeek harness）。

**架构（2026-09-08 确认）：** mcp.json 只存**跨平台裸命令**（`npx`/`uvx`，不带 `cmd /c`），**平台包裹与 env 形式归各 agent 安装器判断**，故 mcp.json 本身纯声明、跨平台。

**约定：**
1. 配置是**唯一权威**：`enable:true` → 写入；`enable:false` 或**不在配置里** → 移除（全量同步防残留）。项目作用域 `projects/*/mcpServers` 不受影响。
2. 每条通用字段 = type/command/args/cwd?/env? + 元数据 `enable`（enable 缺省视为 true；元数据不落盘，安装脚本剥离）。**`cmdWrap` 已从 mcp.json 移除，改为安装器判断。**
3. **平台包裹（安装器判定，不写进 mcp.json）**：Claude 安装器在 Windows 下用 `shutil.which` 判断——命令解析为 `.cmd`/`.bat` shim（如 npx→npx.CMD）才包 `cmd /c`；uvx/node/python 为 `.exe` 直接透传。dsh 安装器**不包裹**（dsh 的 Node 启动器可直接跑 shim，A800 实配即裸 npx）。
4. env 值形如 `"${VAR}"` 时**原样落盘为引用**，由运行时展开——配置零明文，key 存 OS 级用户环境变量。⚠ 细分为：Claude 侧直接写 `${VAR}`（Claude Code 连接时展开）；dsh 侧转成 YAML JS 表达式 `!!js process.env.VAR`（dsh 的 cordis 解析器才认）。
5. `settings.json` 里 MCP 的自动放行权限名必须是**实际注册名**（如 `mcp__A800__run-whitelisted-command`），否则权限静默失效。

**How to apply:** 增删改 MCP 改 `mcp.json` → 跑对应安装脚本：`bash ~/.claude/setupMCPs.sh`（Claude）或 `bash ~/.claude/setupMCPs.dsh.sh`（dsh）。两脚本都用 `python` 直接写文件、写前备份 `.bak.<时间戳>`、中文需 PYTHONIOENCODING=utf-8。

**dsh 侧重点：** 写入 `~/.dsh/cordis.patch.yml`（所有 profile 共享的用户补丁层，热加载），每个启用服务器一个 `@deepseek-ai/dsh-mcp-client` 插件实例，工具名 `mcp__<serverName>__<rawName>`，`serverName` 须 `^[A-Za-z0-9_-]{1,32}$`（如 `A800`）。完整接口见 `packages/mcp/mcp-client/src/index.ts`。

**当前实况：** A800=`npx @fenlyin/ssh-mcp-server`；image-vision=`uvx --from git+https://github.com/fenlyin0420/image-vision-server.git image-vision-server`，env `DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}`，无 cwd（server.py 无 cwd/__file__ 依赖，console 入口 `server:run`）。⚠ 本机官方 PyPI(`files.pythonhosted.org`)不通，uv 拉依赖需清华镜像 `pypi.tuna.tsinghua.edu.cn` 或依赖已在 uv 缓存；GitHub 通（走 git 全局 http.proxy 127.0.0.1:7897，但 Clash 偶发抖动）。相关偏好见 [[mcp-packaging-preference]]。
