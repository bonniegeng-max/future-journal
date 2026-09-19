/* 未来日记 · 页面回归测试
 * 跑法：NODE_PATH=<node workspace>/node_modules <node> scripts/test-journal.js
 *
 * 四组：
 *   A. 数据不丢（写作框自动落盘 / 刷新还原 / 防抖窗口内切 tab）
 *   B. 无障碍与键盘可达（WCAG 2.2 AA 相关结构）
 *   C. 降级路径（拿不到 2D 上下文时不崩、退回打字模式）
 *   D. 云同步 SDK 的加载约束（版本钉死 + SRI 完整性校验）
 *
 * 注意：jsdom 不实现 canvas 2D，getContext('2d') 恒返回 null —— 这正好用来
 * 覆盖 C 组的降级分支。A/B 组不受影响。
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_PATH = path.join(__dirname, '..', 'assets', 'index.html');
const HTML = fs.readFileSync(HTML_PATH, 'utf8');
const KEY = 'future-journal-v1';
const URL_ = 'https://fj.test/';

let pass = 0, fail = 0;
function check(name, ok, detail) {
  ok ? pass++ : fail++;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail !== undefined && detail !== '' ? '  — ' + detail : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function boot(saved) {
  const errs = [];
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously',
    url: URL_,
    pretendToBeVisual: true,
    beforeParse(window) {
      if (saved) for (const [k, v] of Object.entries(saved)) window.localStorage.setItem(k, v);
      window.addEventListener('error', (e) => errs.push(String(e.message || e.error)));
    },
  });
  return { dom, w: dom.window, d: dom.window.document, errs };
}

const T = (v) => `[data-v="${v}"]`;

(async () => {
  /* ================= A. 数据不丢 ================= */
  console.log('\n[A] 打字落盘 / 刷新还原');
  let { w, d, errs } = boot(null);

  const wishInput = d.querySelector('#wishList .wish-row input');
  wishInput.value = '把手上那篇写顺';
  d.getElementById('inpStart').value = '2026-09-19';
  d.getElementById('btnStart').onclick();

  let st = JSON.parse(w.localStorage.getItem(KEY) || 'null');
  check('点「开始」后写入 localStorage', !!(st && st.startDate === '2026-09-19'), st && st.startDate);

  const TEXT1 = '今天的活一件件推进了，我很安心。';
  const write = d.getElementById('inpWrite');
  write.value = TEXT1;
  write.dispatchEvent(new w.Event('input', { bubbles: true }));
  await sleep(800);
  st = JSON.parse(w.localStorage.getItem(KEY));
  check('打字后自动落盘（未点保存按钮）', !!(st.entries[1] && st.entries[1].text === TEXT1), JSON.stringify(st.entries[1] && st.entries[1].text));

  const chip = d.querySelector('#emoChips .chip');
  const chipText = chip.textContent;
  chip.onclick();
  await sleep(800);
  st = JSON.parse(w.localStorage.getItem(KEY));
  check('点心情词后自动落盘', st.entries[1].emotion === chipText, `存的是「${st.entries[1].emotion}」`);
  check('A 组无 JS 报错', errs.length === 0, errs.join(' | '));

  // 模拟刷新：同一份 localStorage 重新起一个窗口
  const savedState = { [KEY]: w.localStorage.getItem(KEY) };
  ({ w, d, errs } = boot(savedState));
  check('刷新后写作框内容被还原', d.getElementById('inpWrite').value === TEXT1, JSON.stringify(d.getElementById('inpWrite').value));
  const onChip = d.querySelector('#emoChips .chip.on');
  check('刷新后心情词仍选中', !!onChip && onChip.textContent === chipText, onChip ? onChip.textContent : '无');
  check('刷新后设置页显示「已写 1 页」', /已写 1 页/.test(d.getElementById('setupInfo').textContent));

  const TEXT2 = '换了一句，还没等防抖就切走了。';
  const w3 = d.getElementById('inpWrite');
  w3.value = TEXT2;
  w3.dispatchEvent(new w.Event('input', { bubbles: true }));
  d.querySelector('.tab' + T('track')).onclick();     // 防抖未到就切走
  await sleep(50);
  const st3 = JSON.parse(w.localStorage.getItem(KEY));
  check('切 tab 前强制落盘（防抖窗口内也不丢）', st3.entries[1].text === TEXT2, st3.entries[1].text);
  d.querySelector('.tab' + T('today')).onclick();
  check('切回今天页内容仍在', d.getElementById('inpWrite').value === TEXT2);
  check('A 组第二程无 JS 报错', errs.length === 0, errs.join(' | '));

  /* ================= B. 无障碍 / 键盘可达 ================= */
  console.log('\n[B] 无障碍与键盘可达');
  const seed = {
    [KEY]: JSON.stringify({
      version: 1, startDate: '2026-09-18', createdAt: '2026-09-18T00:00:00.000Z',
      intention: ['把手上那篇写顺'],
      entries: {
        1: { text: '今天的活一件件推进了，我很安心。', emotion: '安心', at: '2026-09-18T09:00:00.000Z' },
        2: { text: '有人回了我一句很暖的话，我很感激。', emotion: '感恩', at: '2026-09-19T09:00:00.000Z' },
      },
    }),
    'fj-cfg': JSON.stringify({ endpoint: 'https://x.test', publishableKey: 'wbpk_test_only' }),
  };
  ({ w, d, errs } = boot(seed));

  d.querySelector('.tab' + T('track')).onclick();
  const cells = [...d.querySelectorAll('.cell')];
  check('轨道格渲染出 49 格', cells.length === 49, cells.length + ' 格');
  check('轨道格标签全为 button（键盘够得到）', cells.length > 0 && cells.every((c) => c.tagName === 'BUTTON'));
  const noLabel = cells.filter((c) => !c.getAttribute('aria-label'));
  check('每格都有可读 aria-label', noLabel.length === 0, noLabel.length ? '缺 ' + noLabel.length : '49/49');
  const dis = cells.filter((c) => c.disabled).length;
  check('只有「有内容的过去 + 今天」可聚焦，其余 disabled', cells.length - dis === 2 && dis === 47, `可点 ${cells.length - dis} / 禁用 ${dis}`);
  const c1 = cells.find((c) => c.textContent === '1');
  check('已写格 aria-label 带上内容', /已写：/.test(c1.getAttribute('aria-label')), c1.getAttribute('aria-label'));
  const c8 = cells.find((c) => c.textContent === '8');
  check('未来格 aria-label 说明「还没到」且 disabled', /还没到/.test(c8.getAttribute('aria-label')) && c8.disabled === true);

  d.querySelector('.tab' + T('today')).onclick();
  const chips = [...d.querySelectorAll('#emoChips .chip')];
  check('心情词有 aria-pressed', chips.length > 0 && chips.every((c) => c.hasAttribute('aria-pressed')), chips.length + ' 个');
  const on = chips.find((c) => c.getAttribute('aria-pressed') === 'true');
  check('选中态同时落在 class 和 aria 上', !!on && on.classList.contains('on') && on.textContent === '感恩', on ? on.textContent : '无');

  const cur = [...d.querySelectorAll('.tab')].filter((c) => c.getAttribute('aria-current') === 'true');
  check('只有一个 tab 标 aria-current', cur.length === 1, cur.length ? cur[0].getAttribute('data-v') : '0 个');

  check('toast 是 live region', d.getElementById('toast').getAttribute('role') === 'status' && d.getElementById('toast').getAttribute('aria-live') === 'polite');
  const wl = d.getElementById('inpWrite').getAttribute('aria-labelledby');
  check('写作框有可访问名', !!(wl && d.getElementById(wl)), wl ? '→ #' + wl : '无');
  check('开始日期有 label[for]', !!d.querySelector('label[for="inpStart"]'));
  check('进度条 role=progressbar', d.getElementById('dhBarWrap').getAttribute('role') === 'progressbar');
  const btns = [...d.querySelectorAll('button')].filter((b) => !b.disabled);
  check('可交互按钮都能进 tab 顺序', btns.length > 0 && btns.every((b) => b.tabIndex >= 0), btns.length + ' 个');
  const ids = [...d.querySelectorAll('[id]')].map((e) => e.id);
  const dup = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  check('渲染后无重复 id', dup.length === 0, dup.length ? JSON.stringify(dup) : ids.length + ' 个唯一');

  d.querySelector('.tab' + T('settings')).onclick();
  check('设置页不再承诺「不会上传」', !/不会上传/.test(d.getElementById('setupInfo').innerHTML));
  check('粘了配置串就渲染出登录表单', !!d.getElementById('aEmail') && !!d.getElementById('aPass') && !!d.getElementById('aGo'));
  check('配置串没被写死进页面', !/wbpk_GB5S|wbapp_GB5S/.test(HTML));

  // 逐个切登录子分支：每个分支都要能渲染出必需控件（4 个分支各写一遍 authHTML 容易漏）
  const branches = [
    { tab: 'pw', must: ['aEmail', 'aPass', 'aGo'], label: '密码登录' },
    { tab: 'otp', must: ['aEmail', 'aSend', 'aCode', 'aVerify'], label: '验证码登录' },
    { tab: 'up', must: ['aEmail', 'aSend', 'aCode', 'aPass', 'aVerify'], label: '注册' },
    { tab: 'rs', must: ['aEmail', 'aSend', 'aCode', 'aPass', 'aGoPw'], label: '忘记密码' },
  ];
  let branchOk = true, missing = [];
  for (const b of branches) {
    const btn = d.querySelector(`#syncBody [data-tab="${b.tab}"]`);
    if (!btn) { branchOk = false; missing.push(b.label + ':无入口按钮'); continue; }
    btn.onclick();
    for (const id of b.must) if (!d.getElementById(id)) { branchOk = false; missing.push(b.label + ':' + id); }
  }
  check('4 个登录子分支都渲染出必需控件', branchOk, missing.length ? missing.join(', ') : '密码/验证码/注册/忘记密码');
  check('切分支后仍无 JS 报错', errs.length === 0, errs.join(' | '));

  /* ================= C. 降级路径 ================= */
  console.log('\n[C] 拿不到 2D 上下文时的降级');
  ({ w, d, errs } = boot(seed));
  d.querySelector('.tab' + T('today')).onclick();
  let threw = null;
  try { d.getElementById('btnTraceOn').onclick(); } catch (e) { threw = e; }
  check('点「描摹」不抛错', threw === null, threw ? String(threw.message) : '无异常');
  check('自动退回打字模式', d.getElementById('typeWrap').hidden === false && d.getElementById('traceWrap').hidden === true);
  check('给出可读提示', /照着打一遍/.test(d.getElementById('toast').textContent), JSON.stringify(d.getElementById('toast').textContent));
  check('C 组无 JS 报错', errs.length === 0, errs.join(' | '));

  /* ================= D. 远端 SDK 的加载约束 ================= */
  /* 为什么单立一组：这段远端代码和页面同源跑，能读到 localStorage 里的日记正文
     和导出的加密密钥。ClawHub 安全扫描曾据此判 suspicious（unpinned dev tag +
     no integrity check）。钉版本和 SRI 一旦被谁顺手改回去，发布包会重新被标，
     所以这里锁死 —— 改 SDK 版本必须同步改这一组的期望值。 */
  console.log('\n[D] 云同步 SDK：钉版本 + 完整性校验');
  check('源码里没有会漂移的 @dev 标签', !/workbuddy-cloud-sdk@dev/.test(HTML));
  check('没有 @latest / 无版本号的引用', !/workbuddy-cloud-sdk@(latest|\/)/.test(HTML));
  const pinned = HTML.match(/workbuddy-cloud-sdk@([0-9][^/'"]*)\//);
  check('SDK 版本号被钉死到具体版本', !!pinned, pinned ? pinned[1] : '没匹配到版本号');
  const sri = HTML.match(/SDK_SRI\s*=\s*'([^']+)'/);
  check('声明了 SRI 哈希', !!sri && /^sha384-[A-Za-z0-9+/=]{64}$/.test(sri[1]), sri ? sri[1].slice(0, 22) + '…' : '缺');

  ({ w, d, errs } = boot(seed));
  let sdkErr = null;
  try { w.loadSDK(function () {}); } catch (e) { sdkErr = e; }
  check('loadSDK 不抛错', sdkErr === null, sdkErr ? String(sdkErr.message) : '无异常');
  const tag = d.head.querySelector('script[src*="workbuddy-cloud-sdk"]');
  check('真的插入了 SDK script 标签', !!tag);
  check('插入的标签带 integrity', !!tag && /^sha384-/.test(tag.getAttribute('integrity') || ''), tag ? tag.getAttribute('integrity') : '无');
  check('插入的标签带 crossOrigin（SRI 走 CORS 取文件）', !!tag && tag.getAttribute('crossorigin') === 'anonymous', tag ? tag.getAttribute('crossorigin') : '无');
  check('插入的标签 src 是钉死版本、非 @dev', !!tag && /workbuddy-cloud-sdk@[0-9]/.test(tag.getAttribute('src') || '') && !/@dev/.test(tag.getAttribute('src') || ''), tag ? tag.getAttribute('src') : '无');
  check('D 组无 JS 报错', errs.length === 0, errs.join(' | '));

  console.log(`\n===== ${pass}/${pass + fail} 通过 =====`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('测试脚本崩了：', e); process.exit(2); });
