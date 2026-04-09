import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://mmifbnecjietsiaoeyqq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VWxPtJtSTs8cHLstsNIMsA_z_0raT-Z';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const APP_KEY = 'hate-nav-prototype-v1';
const THEME_COLORS = ['#7c5cff', '#0ea5e9', '#10b981', '#ec4899', '#f97316', '#6366f1'];

const defaultData = {
  user: null,
  mode: 'light',
  layout: 'grid',
  theme: '#7c5cff',
  engine: 'google',
  activeCategoryId: 'cat-dev',
  categories: [
    { id: 'cat-dev', name: '开发', icon: '💻', order: 1, parentId: null, bg: '#eef1ff' },
    { id: 'cat-design', name: '设计', icon: '🎨', order: 2, parentId: null, bg: '#eef9ff' },
    { id: 'cat-life', name: '生活效率', icon: '⚡', order: 3, parentId: null, bg: '#fff7ef' },
    { id: 'cat-frontend', name: '前端', icon: '🧩', order: 1, parentId: 'cat-dev', bg: '#f4f2ff' },
    { id: 'cat-ai', name: 'AI', icon: '🤖', order: 2, parentId: 'cat-dev', bg: '#f5f8ff' },
    { id: 'cat-visual', name: '视觉灵感', icon: '✨', order: 1, parentId: 'cat-design', bg: '#f5fcff' },
  ],
  bookmarks: [
    { id: 'b1', categoryId: 'cat-frontend', name: 'GitHub', url: 'https://github.com', icon: 'GH', notes: '代码托管与协作' },
    { id: 'b2', categoryId: 'cat-frontend', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', icon: 'MD', notes: '前端标准文档' },
    { id: 'b3', categoryId: 'cat-ai', name: 'OpenAI', url: 'https://openai.com', icon: 'AI', notes: 'AI 产品与 API' },
    { id: 'b4', categoryId: 'cat-design', name: 'Figma', url: 'https://figma.com', icon: 'Fg', notes: '协同设计工具' },
    { id: 'b5', categoryId: 'cat-visual', name: 'Dribbble', url: 'https://dribbble.com', icon: 'Db', notes: '视觉灵感库' },
    { id: 'b6', categoryId: 'cat-life', name: 'Notion', url: 'https://notion.so', icon: 'No', notes: '知识管理' },
    { id: 'b7', categoryId: 'cat-life', name: '腾讯文档', url: 'https://docs.qq.com', icon: 'QQ', notes: '在线文档协作' },
  ],
};

const state = loadState();
let authType = 'email';
let readonlyShared = false;
const $ = (sel) => document.querySelector(sel);

initFromShareLink();
initUI();
await hydrateAuthState();
renderAll();

function loadState() {
  const raw = localStorage.getItem(APP_KEY);
  if (!raw) return structuredClone(defaultData);
  try {
    return { ...structuredClone(defaultData), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultData);
  }
}

function persistState() {
  localStorage.setItem(APP_KEY, JSON.stringify(state));
}

function initFromShareLink() {
  const hash = location.hash.replace('#', '');
  if (!hash.startsWith('share=')) return;
  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(hash.slice(6)))));
    Object.assign(state, payload);
    readonlyShared = true;
  } catch {
    console.warn('分享链接解析失败');
  }
}

function initUI() {
  $('#themeModeBtn').onclick = () => {
    state.mode = state.mode === 'dark' ? 'light' : 'dark';
    persistState();
    renderAll();
  };
  $('#settingsBtn').onclick = () => $('#settingsDialog').showModal();
  $('#layoutBtn').onclick = () => $('#layoutDialog').showModal();
  $('#shareBtn').onclick = () => $('#shareDialog').showModal();
  $('#loginBtn').onclick = () => openAuthDialogOrLogout();

  $('#addCategoryBtn').onclick = () => createCategory();
  $('#addBookmarkBtn').onclick = () => createBookmark();

  $('#searchBtn').onclick = runSearch;
  $('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
    renderBookmarks();
  });
  $('#searchInput').addEventListener('input', renderBookmarks);
  $('#engineSelect').onchange = (e) => {
    state.engine = e.target.value;
    persistState();
  };

  $('#generateShareBtn').onclick = generateShare;
  $('#copyShareBtn').onclick = async () => {
    const text = $('#shareResult').value;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert('已复制分享链接');
  };

  $$('.tab-btn').forEach((btn) => {
    btn.onclick = () => {
      authType = btn.dataset.auth;
      $$('.tab-btn').forEach((item) => item.classList.toggle('active', item === btn));
      $('#accountInput').placeholder = authType === 'email' ? '请输入邮箱' : '请输入手机号（+8613xxxxxx）';
    };
  });

  $('#sendCodeBtn').onclick = sendOtpCode;
  $('#doLoginBtn').onclick = verifyOtpCode;

  $$('[data-close]').forEach((btn) => {
    btn.onclick = () => document.getElementById(btn.dataset.close).close();
  });

  renderThemeOptions();
  renderLayoutOptions();
}

async function hydrateAuthState() {
  const { data } = await supabase.auth.getSession();
  bindSessionToState(data.session);

  supabase.auth.onAuthStateChange((_event, session) => {
    bindSessionToState(session);
    renderAll();
  });
}

function bindSessionToState(session) {
  const user = session?.user;
  state.user = user?.email || user?.phone || null;
  persistState();
}

function renderAll() {
  document.body.classList.toggle('dark', state.mode === 'dark');
  document.body.classList.toggle('layout-drawer', state.layout === 'drawer');
  document.body.classList.toggle('layout-list', state.layout === 'list');
  document.documentElement.style.setProperty('--accent', state.theme);

  $('#engineSelect').value = state.engine;
  $('#loginBtn').textContent = state.user ? `🚪 退出（${state.user}）` : '👤 登录 / 注册';

  renderCategories();
  renderBookmarks();
  toggleReadonly();
}

function renderThemeOptions() {
  const grid = $('#themeColorGrid');
  grid.innerHTML = '';
  THEME_COLORS.forEach((color) => {
    const chip = document.createElement('button');
    chip.className = 'color-chip';
    chip.style.background = color;
    chip.classList.toggle('active', color === state.theme);
    chip.onclick = () => {
      state.theme = color;
      persistState();
      renderAll();
    };
    grid.append(chip);
  });
}

function renderLayoutOptions() {
  const layouts = [
    { id: 'grid', name: '网格瀑布流', use: '高效查找 + 信息密度' },
    { id: 'drawer', name: '分类抽屉式', use: '视觉沉浸 + 专注分类' },
    { id: 'list', name: '极简单列式', use: '移动优先 + 快速点击' },
  ];
  const container = $('#layoutList');
  container.innerHTML = '';
  layouts.forEach((layout) => {
    const item = document.createElement('article');
    item.className = 'layout-option';
    if (layout.id === state.layout) item.classList.add('active');
    item.innerHTML = `<strong>${layout.name}</strong><p class="muted">${layout.use}</p>`;
    item.onclick = () => {
      state.layout = layout.id;
      persistState();
      renderAll();
      renderLayoutOptions();
    };
    container.append(item);
  });
}

function renderCategories() {
  const rail = $('#categoryRail');
  rail.innerHTML = '';
  const roots = getCategories(null);
  roots.forEach((root) => {
    const node = document.getElementById('categoryTemplate').content.firstElementChild.cloneNode(true);
    const rootBtn = node.querySelector('.cat-main');
    rootBtn.textContent = `${root.icon} ${root.name}`;
    rootBtn.style.background = root.bg;
    rootBtn.classList.toggle('active', state.activeCategoryId === root.id);
    rootBtn.onclick = () => {
      state.activeCategoryId = root.id;
      persistState();
      renderAll();
    };

    const subWrap = node.querySelector('.cat-sub');
    getCategories(root.id).forEach((child) => {
      const subBtn = document.createElement('button');
      subBtn.textContent = `${child.icon} ${child.name}`;
      subBtn.classList.toggle('active', state.activeCategoryId === child.id);
      subBtn.onclick = () => {
        state.activeCategoryId = child.id;
        persistState();
        renderAll();
      };
      subWrap.append(subBtn);
    });
    rail.append(node);
  });
}

function renderBookmarks() {
  const panel = $('#bookmarkPanel');
  panel.innerHTML = '';
  const term = $('#searchInput').value.trim().toLowerCase();
  const ids = collectCategoryIds(state.activeCategoryId);

  state.bookmarks
    .filter((bm) => ids.includes(bm.categoryId))
    .filter((bm) => !term || `${bm.name} ${bm.url} ${bm.notes}`.toLowerCase().includes(term))
    .forEach((bookmark) => {
      const card = document.getElementById('bookmarkTemplate').content.firstElementChild.cloneNode(true);
      card.querySelector('.bookmark-icon').textContent = bookmark.icon || bookmark.name.slice(0, 2);
      card.querySelector('h4').textContent = bookmark.name;
      card.querySelector('.bookmark-url').textContent = bookmark.url;
      card.querySelector('.bookmark-note').textContent = bookmark.notes || '无备注';

      card.querySelector('[data-op="open"]').onclick = () => window.open(bookmark.url, '_blank');
      card.querySelector('[data-op="edit"]').onclick = () => editBookmark(bookmark.id);
      card.querySelector('[data-op="delete"]').onclick = () => deleteBookmark(bookmark.id);
      panel.append(card);
    });

  if (!panel.children.length) {
    panel.innerHTML = '<div class="glass" style="padding:18px;border-radius:16px;color:var(--subtext)">暂无匹配网址，试试添加或更换分类。</div>';
  }
}

function getCategories(parentId) {
  return state.categories
    .filter((cat) => cat.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

function collectCategoryIds(baseId) {
  const stack = [baseId];
  const all = new Set([baseId]);
  while (stack.length) {
    const current = stack.pop();
    state.categories
      .filter((cat) => cat.parentId === current)
      .forEach((sub) => {
        all.add(sub.id);
        stack.push(sub.id);
      });
  }
  return [...all];
}

function createCategory() {
  if (readonlyShared) return alert('分享页为只读模式');
  const name = prompt('分类名称');
  if (!name) return;
  const parentIdInput = prompt('父级分类ID（留空为一级分类）', '');
  const icon = prompt('分类图标（emoji/文字）', '📁') || '📁';
  const bg = prompt('分类背景色（如 #f3f4ff）', '#f3f4ff') || '#f3f4ff';
  const id = `cat-${crypto.randomUUID().slice(0, 8)}`;
  const siblings = getCategories(parentIdInput || null);
  state.categories.push({ id, name, icon, bg, parentId: parentIdInput || null, order: siblings.length + 1 });
  state.activeCategoryId = id;
  persistState();
  renderAll();
}

function createBookmark() {
  if (readonlyShared) return alert('分享页为只读模式');
  const name = prompt('网站名称');
  const url = prompt('网站链接（含 https://）');
  if (!name || !url) return;
  const icon = prompt('图标文字（可留空自动取前两位）', name.slice(0, 2)) || name.slice(0, 2);
  const notes = prompt('备注信息', '');
  const categoryId = prompt('所属分类ID', state.activeCategoryId) || state.activeCategoryId;
  state.bookmarks.push({ id: `bm-${crypto.randomUUID().slice(0, 8)}`, name, url, icon, notes, categoryId });
  persistState();
  renderBookmarks();
}

function editBookmark(id) {
  if (readonlyShared) return alert('分享页为只读模式');
  const bm = state.bookmarks.find((item) => item.id === id);
  if (!bm) return;
  const name = prompt('编辑名称', bm.name);
  if (!name) return;
  bm.name = name;
  bm.url = prompt('编辑链接', bm.url) || bm.url;
  bm.icon = prompt('编辑图标', bm.icon) || bm.icon;
  bm.notes = prompt('编辑备注', bm.notes) || bm.notes;
  persistState();
  renderBookmarks();
}

function deleteBookmark(id) {
  if (readonlyShared) return alert('分享页为只读模式');
  if (!confirm('确认删除该网址？')) return;
  state.bookmarks = state.bookmarks.filter((item) => item.id !== id);
  persistState();
  renderBookmarks();
}

function runSearch() {
  const keyword = $('#searchInput').value.trim();
  if (!keyword) return;
  const matched = state.bookmarks.find((bm) => bm.name.toLowerCase().includes(keyword.toLowerCase()));
  if (matched) {
    $('#searchHint').textContent = `命中站内网址：${matched.name}`;
    window.open(matched.url, '_blank');
    return;
  }
  const map = {
    google: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
    bing: `https://www.bing.com/search?q=${encodeURIComponent(keyword)}`,
    baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`,
  };
  window.open(map[state.engine], '_blank');
}

function generateShare() {
  const slug = $('#slugInput').value.trim() || 'share';
  const payload = {
    mode: state.mode,
    layout: state.layout,
    theme: state.theme,
    activeCategoryId: state.activeCategoryId,
    categories: state.categories,
    bookmarks: state.bookmarks,
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  $('#shareResult').value = `${location.origin}${location.pathname}?slug=${encodeURIComponent(slug)}#share=${encoded}`;
}

async function openAuthDialogOrLogout() {
  if (!state.user) {
    setAuthHint('先发送验证码，再输入验证码完成登录/注册。');
    $('#loginDialog').showModal();
    return;
  }
  const ok = confirm(`确认退出当前账号 ${state.user} 吗？`);
  if (!ok) return;

  const { error } = await supabase.auth.signOut();
  if (error) {
    setAuthHint(`退出失败：${error.message}`);
    alert(`退出失败：${error.message}`);
    return;
  }
  state.user = null;
  persistState();
  renderAll();
}

async function sendOtpCode() {
  const account = $('#accountInput').value.trim();
  if (!account) return setAuthHint('请输入邮箱或手机号。');

  if (authType === 'email') {
    const { error } = await supabase.auth.signInWithOtp({
      email: account,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: location.href,
      },
    });
    if (error) return setAuthHint(`发送失败：${error.message}`);
    return setAuthHint('邮箱验证码已发送，请查收邮件。');
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: account,
    options: {
      shouldCreateUser: true,
    },
  });
  if (error) return setAuthHint(`发送失败：${error.message}`);
  setAuthHint('短信验证码已发送，请输入验证码完成登录。');
}

async function verifyOtpCode() {
  const account = $('#accountInput').value.trim();
  const code = $('#codeInput').value.trim();
  if (!account || !code) return setAuthHint('请输入账号和验证码。');

  if (authType === 'email') {
    const { data, error } = await supabase.auth.verifyOtp({
      email: account,
      token: code,
      type: 'email',
    });
    if (error) return setAuthHint(`验证失败：${error.message}`);
    bindSessionToState(data.session);
    setAuthHint('邮箱验证成功，已登录。');
  } else {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: account,
      token: code,
      type: 'sms',
    });
    if (error) return setAuthHint(`验证失败：${error.message}`);
    bindSessionToState(data.session);
    setAuthHint('手机号验证成功，已登录。');
  }

  persistState();
  renderAll();
  $('#loginDialog').close();
}

function setAuthHint(msg) {
  $('#authHint').textContent = msg;
}

function toggleReadonly() {
  const disabled = readonlyShared;
  ['#addCategoryBtn', '#addBookmarkBtn', '#loginBtn'].forEach((id) => {
    $(id).disabled = disabled;
  });
  if (readonlyShared) {
    $('#searchHint').textContent = '当前为分享只读视图，可浏览和搜索网址';
  }
}

function $$(selector) {
  return [...document.querySelectorAll(selector)];
}

window.supabaseIntegration = {
  client: supabase,
  auth: {
    sendOtpCode,
    verifyOtpCode,
  },
};
