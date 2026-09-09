---
name: feedback-contextualize-before-answering
description: 个性化回答前必须先检查用户已知背景
metadata:
  type: feedback
---

回答任何依赖于"用户是谁"的问题（职业建议、技术推荐、学习路径、设计偏好等）之前，必须先检查已知的用户背景。

**失败模式：** 给了泛化的模板回答，末尾补一句"如果你告诉我更多背景，我可以给更针对的建议"——这把"主动了解用户"的责任转嫁给了用户，破坏了信任感。

**正确做法：**
1. 回答前先读 [[user-profile]] 和相关记忆
2. 如果关键背景缺失，先问再答（最多 3 个问题）
3. 如果回答到一半才发现没查背景，停下来，承认疏漏，补查后重新回答
4. 宁可晚 30 秒给出针对性回答，也不要立刻给出泛化回答

**Why:** 用户花时间建立了记忆系统，Agent 应该在每次互动中证明这个系统的价值。不用记忆 = 记忆系统形同虚设。

**How to apply:** CLAUDE.md §4 已写入具体检查规则，§5 自检清单已增加"Did I check the user's known background/preferences from memory before answering?"条目。
