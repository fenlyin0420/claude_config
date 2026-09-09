#!/usr/bin/env node
// ============================================================
//  notify.js — 跨平台 Claude Code 提示音 hook
//
//
//  由两类 hook 调用（见 ~/.claude/settings.json）：
//    - PermissionRequest (matcher:"")        权限确认弹窗出现时
//    - Notification (matcher:idle_prompt)    Claude 等待你输入时
//
//  按类别播放 ~/.claude/sounds/ 下的音频，多个文件按名称轮播：
//    - 询问/确认类（PermissionRequest）  ->  sounds/ask/
//    - 等待输入类（Notification/idle_prompt）->  sounds/wait/
//  目录为空或播放失败时回退到系统蜂鸣，保证任何情况下都有提示。
//
//  重要：PermissionRequest 场景下，脚本必须「无 stdout 输出 + exit 0」，
//  这样 Claude Code 才会回退到正常授权弹窗。任何异常都静默退出，绝不阻断。
// ============================================================

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SOUNDS_ROOT = path.join(os.homedir(), '.claude', 'sounds');
const STATE_FILE = path.join(SOUNDS_ROOT, '.sound-state.json');
const AUDIO_RE = /\.(wav|mp3|ogg|flac)$/i;

// ---------- 读取 hook 载荷（仅在 stdin 为重定向管道时读取，避免阻塞） ----------
function readStdin() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    try { process.stdin.setEncoding('utf8'); } catch (e) {}
    process.stdin.on('data', c => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
    // 保险：500ms 内无数据则放弃，绝不挂起
    setTimeout(() => resolve(data), 500);
  });
}

// ---------- 判定类别：PermissionRequest -> ask；其余（idle_prompt 等）-> wait ----------
function classify(payload) {
  if (!payload) return 'wait';
  try {
    const data = JSON.parse(payload);
    const eventName = String(data.hook_event_name || '');
    const notifType = String(data.notification_type || '');
    if (eventName === 'PermissionRequest' || notifType === 'permission_prompt') return 'ask';
  } catch (e) { /* 解析失败按 wait 处理 */ }
  return 'wait';
}

// ---------- 按类别选音频：多个文件轮播 ----------
function pickAudio(cat) {
  let files;
  try {
    files = fs.readdirSync(path.join(SOUNDS_ROOT, cat))
      .filter(f => AUDIO_RE.test(f))
      .sort();
  } catch (e) { return null; }
  if (files.length === 0) return null;
  if (files.length === 1) return path.join(SOUNDS_ROOT, cat, files[0]);

  // 读取轮播进度（多进程并发时最坏重复播一次，可接受）
  let state = {};
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {}
  let prev = 0;
  try { prev = Number(state[cat]) || 0; } catch (e) {}
  const idx = (prev + 1) % files.length;
  state[cat] = idx;
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state)); } catch (e) {}
  return path.join(SOUNDS_ROOT, cat, files[idx]);
}

// ---------- 播放音频 ----------
function play(file) {
  if (!file) { beep(); return; }

  if (process.platform === 'win32') {
    // Windows：用 PowerShell Media.SoundPlayer（路径经 env 传递，规避引号转义）
    try {
      const r = spawnSync('powershell',
        ['-NoProfile', '-c', "$p=$env:NOTIFY_WAV; (New-Object Media.SoundPlayer $p).PlaySync()"],
        { stdio: 'ignore', timeout: 8000, env: { ...process.env, NOTIFY_WAV: file } });
      if (r.error || r.status !== 0) throw r.error;
      return;
    } catch (e) { beep(); return; }
  }

  // Linux / WSL：依次尝试 paplay -> aplay -> ffplay
  const attempts = [
    ['paplay', [file]],
    ['aplay', ['-q', file]],
    ['ffplay', ['-nodisp', '-autoexit', '-loglevel', 'quiet', file]],
  ];
  for (const [cmd, args] of attempts) {
    try {
      const r = spawnSync(cmd, args, { stdio: 'ignore', timeout: 8000 });
      if (!r.error && r.status === 0) return;
    } catch (e) { /* 尝试下一个 */ }
  }
  beep();
}

// ---------- 蜂鸣回退（无音频文件或播放失败时） ----------
function beep() {
  if (process.platform === 'win32') {
    try {
      spawnSync('powershell',
        ['-NoProfile', '-c', '[console]::beep(880,180); Start-Sleep -m 100; [console]::beep(1318,320)'],
        { stdio: 'ignore', timeout: 3000 });
      return;
    } catch (e) { /* 忽略 */ }
  }
  // Linux 终端响铃
  try { process.stderr.write('\x07'); } catch (e) {}
}

// ---------- 主流程 ----------
(async () => {
  try {
    const payload = await readStdin();
    const category = classify(payload);
    const audio = pickAudio(category);
    if (audio) play(audio);
    else beep();
  } catch (e) { /* 任何异常都静默退出 */ }
  process.exit(0);
})();
