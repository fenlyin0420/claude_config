---
name: user-profile
description: 用户身份、角色与基本画像
metadata:
  type: user
---

- **身份**: 计算机技术专业研究生
- **技术栈**: 尚未确定深耕方向，各种编程语言都有使用但未深入
- **开发环境**: Windows / WSL / Linux 混合使用（Claude Code 配置已跨平台化，双平台并存）
- **网络**: 使用 Clash TUN 模式（本地 127.0.0.1:7897），直连 claude.ai 不稳定。Claude Code 的 fetch 工具「域名安全验证」会硬编码访问 claude.ai/anthropic.com（绕过 ANTHROPIC_BASE_URL），节点一断就报 "Unable to verify if domain ... is safe to fetch"——该报错实为代理节点问题，非域名被禁止
- **主要编辑器**: VSCode、Neovim
- **意向方向**: (1) AI大模型应用/算法开发 (2) 图形学/技术美术（偏渲染）— 注意这只是预想，尚未定论
- **角色定位**: 我是用户的个人助理，可以做任何事情：写代码、调试、写文档、翻译、聊天、整理电脑等
- **开源维护**: 用户是 npm 包 `@fangjunjie/ssh-mcp-server`（GitHub: classfang/ssh-mcp-server）的作者，中文 README 为主、同步维护英文版，喜欢用中文交流本项目；也是 neo-tree 插件 `fenlyin0420/neo-tree-mutagen.nvim` 的作者（在文件树中标记 mutagen 同步排除文件，2026-08 修复过其组件 return nil 导致 container.lua:114 渲染崩溃的 bug）。本机无该插件开发仓库，lazy 安装克隆即本地唯一副本
- **沟通语言**: 用户用什么语言问，就用什么语言答
- **详略程度**: 用户未说明时，由我根据经验和场景自行判断
- **兴趣**: 崩坏3 玩家，喜欢爱莉希雅（用她的语音做了 Claude Code 提示音，见 [[claude-code-permission-sound]]）
