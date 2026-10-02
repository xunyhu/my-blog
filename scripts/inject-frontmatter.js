import fs from 'fs';
import path from 'path';

/**
 * 批量注入 frontmatter（前端知识体系 + AI Engineer 双板块共用）
 *
 * 注入字段：title / description / updatedAt / module / order / status
 * - title      ：取正文首行 h1
 * - description：取 h1 后首个实质段落，去除 Markdown 内联语法并截断（SEO 摘要基线）
 * - updatedAt  ：文件 mtime（YYYY-MM-DD）
 * - module     ：所属分类目录名（去「编号-」前缀）
 * - order      ：文件名编号（数字）
 * - status     ：按正文行数映射 outline(≤50) / draft(51-149) / done(≥150)
 *                —— 与两份 roadmap 的 A/B1/B2 判定阈值一致
 *
 * 安全：已存在 frontmatter 的文件一律跳过，绝不覆盖既有正文（幂等）。
 * 用法：node scripts/inject-frontmatter.js [--dry-run]
 */

const DRY_RUN = process.argv.includes('--dry-run');

const targets = [
  path.join(process.cwd(), 'content/frontend-knowledge'),
  path.join(process.cwd(), 'content/ai-engineer'),
];

/** 首行为 --- 且存在闭合 --- 才视为已有 frontmatter（正文中间的 --- 分隔线不算） */
function hasFrontmatter(raw) {
  return /^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(raw);
}

/** 取首个 h1 作为标题 */
function extractTitle(raw, fallback) {
  const m = raw.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : fallback;
}

/** 去除 Markdown 内联语法与装饰性 emoji（保留 → 等语义箭头） */
function stripInline(s) {
  return s
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/[\uFE0F\u200D]|\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 截断到 max 字符，尽量落在句读处 */
function truncate(s, max) {
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  const cut = Math.max(
    slice.lastIndexOf('。'),
    slice.lastIndexOf('！'),
    slice.lastIndexOf('？'),
    slice.lastIndexOf('；'),
  );
  if (cut >= Math.floor(max * 0.5)) return slice.slice(0, cut + 1);
  return slice.replace(/[，、,：:\s]+$/, '') + '…';
}

/** 取 h1 之后首个实质段落作为摘要：优先散文，列表项仅兜底，跳过标题/分隔线/表格 */
function extractDescription(raw) {
  const lines = raw.split(/\r?\n/);
  let inFence = false;
  let passedH1 = false;
  let listFallback = '';

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (!passedH1) {
      if (/^#\s+/.test(line)) passedH1 = true;
      continue;
    }

    const t = line.trim();
    if (!t) continue;
    if (/^#{1,6}\s/.test(t)) continue; // 跳过各级标题
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) continue; // 跳过分隔线
    if (/^\|/.test(t)) continue; // 跳过表格行

    const isList = /^([-*+]|\d+\.)\s+/.test(t);
    const s = stripInline(
      t.replace(/^>\s?/, '').replace(/^([-*+]|\d+\.)\s+/, ''),
    );
    if (s.length < 8) continue;

    if (isList) {
      if (!listFallback) listFallback = s; // 列表项留作兜底，继续找散文
      continue;
    }
    return truncate(s, 80); // 首个散文段落即返回
  }
  return listFallback ? truncate(listFallback, 80) : '';
}

/** 行数 → 完成度（与 roadmap A/B1/B2 阈值一致） */
function statusOf(raw) {
  const n = (raw.match(/\n/g) || []).length; // 等价 wc -l
  if (n >= 150) return 'done';
  if (n > 50) return 'draft';
  return 'outline';
}

/** YAML 单引号安全包裹 */
function q(str) {
  return "'" + String(str).replace(/'/g, "''") + "'";
}

let injected = 0;
let skipped = 0;
const stat = { done: 0, draft: 0, outline: 0 };

for (const baseDir of targets) {
  if (!fs.existsSync(baseDir)) {
    console.log('⚠️  目录不存在，跳过:', baseDir);
    continue;
  }

  for (const category of fs.readdirSync(baseDir).sort()) {
    const categoryPath = path.join(baseDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const moduleName = category.replace(/^\d+-/, '');

    for (const file of fs.readdirSync(categoryPath).sort()) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(categoryPath, file);
      const raw = fs.readFileSync(filePath, 'utf-8');

      // 守卫：已有 frontmatter 则跳过，绝不覆盖
      if (hasFrontmatter(raw)) {
        console.log('⏭️  跳过（已有 frontmatter）', filePath);
        skipped++;
        continue;
      }

      const baseName = path.basename(file, '.md');
      const orderMatch = baseName.match(/^(\d+)-/);
      const order = orderMatch ? parseInt(orderMatch[1], 10) : 0;
      const title = extractTitle(raw, baseName.replace(/^\d+-/, ''));
      const description =
        extractDescription(raw) || `${title} —— ${moduleName} 知识要点`;
      const status = statusOf(raw);
      const updatedAt = fs.statSync(filePath).mtime.toISOString().slice(0, 10);

      const frontmatter =
        '---\n' +
        `title: ${q(title)}\n` +
        `description: ${q(description)}\n` +
        `updatedAt: ${q(updatedAt)}\n` +
        `module: ${q(moduleName)}\n` +
        `order: ${order}\n` +
        `status: ${q(status)}\n` +
        '---\n\n';

      if (DRY_RUN) {
        console.log(
          `[dry-run] ${status.padEnd(7)} | ${title} | ${description.slice(0, 30)}…`,
        );
      } else {
        fs.writeFileSync(filePath, frontmatter + raw, 'utf-8');
        console.log('✅', status.padEnd(7), filePath);
      }

      stat[status]++;
      injected++;
    }
  }
}

console.log(
  `\n🎉 ${DRY_RUN ? '[dry-run] 预计' : ''}注入 ${injected} 篇，跳过 ${skipped} 篇`,
);
console.log(`   done=${stat.done}  draft=${stat.draft}  outline=${stat.outline}`);
