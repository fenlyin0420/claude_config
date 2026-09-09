# Claude Code 配置(跨平台可移植版)

本目录即**可移植配置层** —— 把它整个复制到新机器的 `~/.claude/` 即可用,Windows 原生 / WSL / Linux 通吃。

## 目录结构

| 内容 | 说明 |
|---|---|
| `settings.json` | 主配置(hooks / env / permissions / statusLine) |
| `CLAUDE.md` `克劳德.md` | 全局指令 |
| `hooks/notify.js` | 提示音 hook,纯 Node.js,跨平台 |
| `sounds/{ask,wait}/` | 提示音(爱莉希雅语音) |
| `memory/` | 全局记忆,**跨机器唯一来源** |
| `skills/` `commands/` | 技能与自定义命令 |
| `statusline-command.sh` `statusline-node.js` | 状态栏(已跨平台) |
| `setupMCPs.sh` | 新机器安装 MCP 依赖 |
| `README.md` | 本说明 |

## 换机器步骤

1. **复制整个目录**到新机器:
   ```bash
   rsync -av ~/.claude/ new-machine:~/.claude/
   # 或 scp / 移动硬盘直接拷贝
   ```
2. **新机器装好依赖**:`node`(状态栏与 hook 都要)、`git`; Windows 需 `Git Bash`。
3. **跑安装脚本**注册 MCP(需网络与 GitHub/npm 访问):
   
   ```bash
   bash ~/.claude/setup.sh
   ```
4. 按需设置环境变量(见下)。
5. 启动 Claude Code 验证:`claude mcp list` 应显示两个 server 已连接。

## 不要复制(机器本地)

- `~/.claude.json` —— 含会话历史、信任状态等;**MCP 由 `setup.sh` 重新注册**,不用复制。
- `~/.claude/projects/`、`sessions/`、`telemetry/`、`statsig/`、`cache/` 等运行数据。

## WSL 注意事项

- **音频**:提示音依赖 pulseaudio/pipewire。WSL2 的 WSLg 默认已带;老版本需 `sudo apt install pulseaudio`。
- **代理**:Clash TUN(`127.0.0.1:7897`)在 WSL 内**不代表** Windows 宿主。两种处理:
  - 在 Windows 的 `%UserProfile%\.wslconfig` 里开 `networkingMode=mirrored`,让 `127.0.0.1` 与宿主共享;
  - 或在 WSL 内 `export https_proxy=http://<Windows宿主IP>:7897`。
  - fetch 域名校验已通过 `skipWebFetchPreflight: true` 关闭,与代理解耦。
- **SSH key**:确认 `~/.ssh/id_rsa` 在 WSL 内存在且权限 `600`(ssh MCP 依赖)。
- **node**:WSL 需安装 node(状态栏 + `notify.js` 都依赖)。

## 安全提示

`settings.json` 内含明文 `ANTHROPIC_AUTH_TOKEN`。**仅把本目录复制到你自己的机器**;若准备把 `settings.json` 分享或提交到仓库,请先移除该行,改用系统环境变量 `ANTHROPIC_AUTH_TOKEN`(Claude Code 会自动读取同名环境变量,无需写在文件里)。

## 故障排查

- **hook 不响**:手动跑一次 `node ~/.claude/hooks/notify.js < /dev/null`,确认能出声、`exit 0`。
- **MCP 连不上**:`claude mcp list` 看健康状态;`setup.sh` 里可重跑。
- **状态栏空白**:确认 `node` 在 PATH(WSL 里 `which node`)。
