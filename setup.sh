#!/usr/bin/env bash
# ============================================================
#  Claude Code MCP 安装/同步脚本
#  适用: Windows(Git Bash) / WSL / Linux
#
#  用法: bash ~/.claude/setup.sh
#
#  ~/mcps.json 是唯一的、跨 agent 的 MCP 配置源(通用规范):

#
#  作用:
#     读取 ~/mcps.json,全量同步到 ~/.claude.json(Claude Code user 作用域)的顶层 mcpServers:
#       - enable:true       → 写入注册
#       - enable:false      → 移除
#       - 不在配置文件中     → 移除(防止残留旧配置)
#
#  mcp.json 每条支持的通用字段(非本脚本私有,供所有 agent 安装脚本使用):
#      enable      必选, true/false
#	   description mcp 简要描述
#      type        stdio | sse | http(缺省 stdio)
#      command     裸可执行程序,如 "npx" / "uvx"(跨平台,不带 cmd/shell 包裹)
#      args        参数数组
#      cwd         工作目录(可选)
#      env         环境变量对象(可选);值写成 "${VAR}" 引用时原样落盘,由运行时展开(配置零明文)
#
#  平台适配: 各 Agent 安装脚本自行判断是否进行 Command Wrap。本脚本(Claude Code)在 Windows 下
#            对解析为 .cmd/.bat shim 的命令用 cmd /c 包裹(如 npx);uvx/node 等 .exe 直接透传。
#
# ============================================================
set -euo pipefail
CONFIG="${MCP_CONFIG:-$HOME/mcps.json}"
CLAUDE_JSON="$HOME/.claude.json"

if [ ! -f "$CONFIG" ]; then
  echo "错误: 找不到配置文件 $CONFIG" >&2
  echo "请先创建该文件(参考文件头部注释里的字段说明)。" >&2
  exit 1
fi

# ---------- 检测平台 ----------
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*|*_NT-*) IS_WIN=1 ;;
  *) IS_WIN=0 ;;
esac

# ---------- 备份 ----------
if [ -f "$CLAUDE_JSON" ]; then
  BN="$CLAUDE_JSON.bak.$(date +%Y%m%d-%H%M%S)"
  cp "$CLAUDE_JSON" "$BN"
  echo "==> 已备份 $CLAUDE_JSON -> $BN"
else
  echo "==> 未找到 $CLAUDE_JSON,将新建"
fi

# ---------- 解析并全量同步 ----------
PYTHONIOENCODING=utf-8 CONFIG="$CONFIG" CLAUDE_JSON="$CLAUDE_JSON" IS_WIN="$IS_WIN" python - <<'PY'
import json, os, shutil

config_path = os.environ["CONFIG"]
claude_json_path = os.environ["CLAUDE_JSON"]
is_win = os.environ.get("IS_WIN") == "1"

with open(config_path, encoding="utf-8") as f:
    cfg = json.load(f)

# 兼容 {"mcpServers": {...}} 和裸 {name: {...}} 两种顶层结构
raw_servers = cfg.get("mcpServers", cfg)

def needs_cmd_wrap(command: str) -> bool:
    """安装脚本自行判断平台包裹(cmdWrap 不写进 mcp.json):
    Windows 下,命令若解析为 .cmd/.bat shim(如 npx)则需 cmd /c 包裹(Claude Code 的 Node 启动器);
    uvx/node/python 等为 .exe 则直接透传。"""
    if not is_win:
        return False
    resolved = shutil.which(command)
    return bool(resolved) and resolved.lower().endswith((".cmd", ".bat"))

# 元数据字段(供安装脚本用,不写入 claude.json)
META = ("enable",)

enabled = {}
for name, srv in raw_servers.items():
    if srv.get("enable", True) is False:
        continue
    entry = {k: v for k, v in srv.items() if k not in META}
    # env 中的 ${VAR} 引用原样保留,由运行时展开——配置零明文
    if needs_cmd_wrap(entry.get("command", "")):
        cmd = entry.get("command", "")
        entry["command"] = "cmd"
        entry["args"] = ["/c", cmd] + list(entry.get("args", []))
    enabled[name] = entry

# 读取现有 claude.json,仅替换顶层 mcpServers,其余键原样保留
if os.path.exists(claude_json_path):
    with open(claude_json_path, encoding="utf-8") as f:
        data = json.load(f)
else:
    data = {}

prev = data.get("mcpServers", {})
data["mcpServers"] = enabled

with open(claude_json_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

added = sorted(set(enabled) - set(prev))
removed = sorted(set(prev) - set(enabled))
print("==> 配置结果:")
print("    平台         : " + ("Windows" if is_win else "Unix/Linux"))
print("    已启用并写入: " + (", ".join(sorted(enabled)) or "(无)"))
if added:
    print("    本次新增: " + ", ".join(added))
if removed:
    print("    本次移除: " + ", ".join(removed))
PY

echo ""
echo "==> 完成。重启 Claude Code 后生效。当前注册状态:"
claude mcp list
