#!/usr/bin/env node
// skill-statusline v2.5 — Node.js statusline renderer
// Generic context display: works with ANY model (Claude, DeepSeek, Gemini, etc.)
// Uses absolute context_window_size when available; falls back to raw token count.
'use strict';
const fs = require('fs');
const path = require('path');

setTimeout(() => process.exit(0), 1500);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  try { if (input) render(JSON.parse(input)); } catch (e) {}
  process.exit(0);
});
process.stdin.on('error', () => process.exit(0));
process.stdin.resume();

function getActivity(transcriptPath) {
  if (!transcriptPath) return 'Idle';
  try {
    const stat = fs.statSync(transcriptPath);
    const readSize = Math.min(16384, stat.size);
    const buf = Buffer.alloc(readSize);
    const fd = fs.openSync(transcriptPath, 'r');
    fs.readSync(fd, buf, 0, readSize, Math.max(0, stat.size - readSize));
    fs.closeSync(fd);
    const lines = buf.toString('utf8').split('\n').filter(l => l.trim());
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
          const toolUses = entry.message.content.filter(c => c.type === 'tool_use');
          if (toolUses.length) {
            const last = toolUses[toolUses.length - 1];
            const name = last.name;
            const inp = last.input || {};
            if (name === 'Task' && inp.subagent_type) {
              const desc = inp.description ? ': ' + inp.description.slice(0, 25) : '';
              return `Task(${inp.subagent_type}${desc})`;
            }
            if (name === 'Skill' && inp.skill) return `Skill(${inp.skill})`;
            return name;
          }
        }
      } catch (e) { continue; }
    }
  } catch (e) { /* ignore */ }
  return 'Idle';
}

function getGitInfo(projectDir) {
  let branch = '', remote = '';
  try {
    const gitHead = fs.readFileSync(path.join(projectDir, '.git', 'HEAD'), 'utf8').trim();
    branch = gitHead.startsWith('ref: refs/heads/') ? gitHead.slice(16) : gitHead.slice(0, 7);
  } catch (e) { return 'no-git'; }
  try {
    const config = fs.readFileSync(path.join(projectDir, '.git', 'config'), 'utf8');
    const urlMatch = config.match(/\[remote "origin"\][^[]*url\s*=\s*(.+)/);
    if (urlMatch) {
      const url = urlMatch[1].trim();
      const ghMatch = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (ghMatch) remote = ghMatch[1] + '/' + ghMatch[2];
    }
  } catch (e) { /* ignore */ }
  return remote ? `${remote}:${branch}` : branch;
}

// The harness resolves model.display_name only for built-in Claude models. For any
// third-party provider (e.g. a DeepSeek backend) it falls back to the raw model id,
// and the ANTHROPIC_DEFAULT_*_MODEL_NAME vars name the /model picker — never the
// statusline payload. So map the active model id back to the configured _NAME label
// here; this process inherits the same environment (settings.json env).
function resolveModelName(model) {
  const id = model?.id || '';
  const displayName = model?.display_name || '';
  const aliases = ['OPUS', 'SONNET', 'HAIKU', 'FABLE'];
  if (id) {
    for (const alias of aliases) {
      const modelEnv = process.env[`ANTHROPIC_DEFAULT_${alias}_MODEL`];
      const nameEnv = process.env[`ANTHROPIC_DEFAULT_${alias}_MODEL_NAME`];
      if (modelEnv && nameEnv && modelEnv === id) return nameEnv;
    }
  }
  // display_name can be null before a session's first API call — fall back to id.
  return displayName || id || 'unknown';
}

function render(data) {
  const RST = '\x1b[0m', BOLD = '\x1b[1m';
  const CYAN = '\x1b[38;2;6;182;212m', PURPLE = '\x1b[38;2;168;85;247m';
  const GREEN = '\x1b[38;2;34;197;94m', YELLOW = '\x1b[38;2;245;158;11m';
  const RED = '\x1b[38;2;239;68;68m', ORANGE = '\x1b[38;2;251;146;60m';
  const WHITE = '\x1b[38;2;228;228;231m';
  const SEP = '\x1b[38;2;55;55;62m', DIM = '\x1b[38;2;40;40;45m';
  const BLUE = '\x1b[38;2;59;130;246m';

  const model = resolveModelName(data.model);

  const cwd = (data.workspace?.current_dir || data.cwd || '').replace(/\\/g, '/').replace(/\/\/+/g, '/');
  const parts = cwd.split('/').filter(Boolean);
  const dir = parts.length > 3 ? parts.slice(-3).join('/') : parts.length > 0 ? parts.join('/') : '~';

  const projectDir = data.workspace?.project_dir || data.workspace?.current_dir || data.cwd || '';
  const gitInfo = getGitInfo(projectDir);

  const activity = getActivity(data.transcript_path);

  // ── Generic context: works for ANY model ──
  // Uses absolute context_window_size from harness (Claude models: 200K).
  // For unknown models (ctxSize=0), shows raw token count with "(?%)" indicator.
  const fmtTok = n => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : `${n}`;
  const totIn = data.context_window?.total_input_tokens || 0;
  const totOut = data.context_window?.total_output_tokens || 0;
  const ctxSize = data.context_window?.context_window_size || 0;

  let ctxDisplay;
  if (ctxSize > 0 && totIn > 0) {
    // Known context window → show percentage bar
    const pct = Math.min(100, Math.round((totIn / ctxSize) * 100));
    const ctxClr = pct > 90 ? RED : pct > 75 ? ORANGE : pct > 40 ? YELLOW : WHITE;
    const barW = 40;
    const filled = Math.min(Math.floor(pct * barW / 100), barW);
    const bar = ctxClr + '█'.repeat(filled) + RST + DIM + '░'.repeat(barW - filled) + RST;
    ctxDisplay = `${ctxClr}Context:${RST} ${bar} ${ctxClr}${pct}%${RST}`;
  } else if (totIn > 0) {
    // Unknown context window → fall back to raw token count
    ctxDisplay = `${YELLOW}Context:${RST} ${YELLOW}${fmtTok(totIn)} used${RST} ${DIM}(?%)${RST}`;
  } else {
    ctxDisplay = `${DIM}Context:${RST} ${DIM}--${RST}`;
  }

  const costRaw = data.cost?.total_cost_usd || 0;
  const cost = costRaw === 0 ? '$0.00' : costRaw < 0.01 ? `$${costRaw.toFixed(4)}` : `$${costRaw.toFixed(2)}`;

  const tokTotal = fmtTok(totIn + totOut);
  const tokIn = fmtTok(totIn);
  const tokOut = fmtTok(totOut);

  const durMs = data.cost?.total_duration_ms || 0;
  const durMin = Math.floor(durMs / 60000);
  const durSec = Math.floor((durMs % 60000) / 1000);
  const duration = durMin > 0 ? `${durMin}m ${durSec}s` : `${durSec}s`;

  const actClr = activity === 'Idle' ? WHITE : GREEN;

  const S = `  ${SEP}│${RST}  `;
  const rpad = (s, w) => {
    const plain = s.replace(/\x1b\[[0-9;]*m/g, '');
    return s + (plain.length < w ? ' '.repeat(w - plain.length) : '');
  };
  const C1 = 44;

  let out = '';
  out += ' ' + rpad(`${actClr}Action:${RST} ${actClr}${activity}${RST}`, C1) + S + `${WHITE}Git:${RST} ${WHITE}${gitInfo}${RST}\n`;
  out += ' ' + rpad(`${PURPLE}Model:${RST} ${PURPLE}${BOLD}${model}${RST}`, C1) + S + `${CYAN}Dir:${RST} ${CYAN}${dir}${RST}\n`;
  out += ' ' + rpad(`${YELLOW}Tokens:${RST} ${YELLOW}${tokIn} ${WHITE}in${RST} ${YELLOW}+ ${tokOut} ${WHITE}out${RST} ${YELLOW}= ${BOLD}${tokTotal}${RST}`, C1) + S + `${GREEN}Cost:${RST} ${GREEN}${cost}${RST}\n`;
  out += ' ' + rpad(`${BLUE}Session:${RST} ${BLUE}${duration}${RST}`, C1) + S + ctxDisplay;

  process.stdout.write(out);
}
