/* ============================================================
   appearance.js — 外观装扮（自定义主题）
   - 预设主题色板：淡粉 / 淡蓝 / 淡绿 / 淡紫 / 奶油 / 日落 / 暗夜
   - 分项颜色自定义：标题 / 副标题 / 名字 / 时间 / 图标底色 / 图标边框 / 6 组图标渐变
   - 背景壁纸：主页背景 / 情侣卡片背景 / 聊天背景（上传照片）
   - 恢复全部默认
   实现：CSS 变量驱动（addons.css 中 :root 已定义默认值），保存到 localStorage
   ============================================================ */
(() => {
    'use strict';

    const KEY = 'CX_appearance';
    const DEFAULTS = {
        theme: 'pink',
        colors: {},
        images: { home: null, card: null, chat: null }
    };

    /* ---------------- 预设主题 ---------------- */
    const THEMES = {
        pink: {
            name: '淡粉',
            dot: 'linear-gradient(135deg,#ff9a9e,#fecfef)',
            vars: {
                '--app-bg-a': '#ffe4ef', '--app-bg-b': '#fde0f3', '--app-bg-c': '#ffe9f2',
                '--app-glow-a': 'rgba(255,214,232,0.9)', '--app-glow-b': 'rgba(240,205,255,0.9)', '--app-glow-c': 'rgba(255,225,240,0.9)',
                '--home-card-bg-a': '#ffd6e2', '--home-card-bg-b': '#ffdce8', '--home-card-bg-c': '#ffd3e4',
                '--home-title-color': '#c96a92', '--home-name-color': '#b0537a', '--home-sub-color': '#d08aa8',
                '--home-clock-color': '#cf6b95', '--home-date-color': '#c58aa8', '--home-label-color': '#b35a7f',
                '--home-icon-base': 'rgba(255,255,255,0.92)', '--home-icon-border': 'rgba(255,255,255,0.95)',
                '--home-icon-1': 'linear-gradient(135deg,#ff9a9e,#fecfef)',
                '--home-icon-2': 'linear-gradient(135deg,#ff8fb2,#ffb6cd)',
                '--home-icon-3': 'linear-gradient(135deg,#fca1c0,#ffc9de)',
                '--home-icon-4': 'linear-gradient(135deg,#ffb199,#ffd6c9)',
                '--home-icon-5': 'linear-gradient(135deg,#f78fb3,#e0c3fc)',
                '--home-icon-6': 'linear-gradient(135deg,#ff7eb3,#ffc3a0)',
                '--home-footer-bg': 'rgba(255,240,247,0.96)', '--home-footer-line': 'rgba(255,180,210,0.4)',
                '--chat-bg-a': '#fff0f6', '--chat-bg-b': '#fdf0fa', '--chat-bg-c': '#fdf4ff'
            }
        },
        blue: {
            name: '淡蓝',
            dot: 'linear-gradient(135deg,#7fd0f0,#c9ecff)',
            vars: {
                '--app-bg-a': '#e3f1fc', '--app-bg-b': '#e6f3fb', '--app-bg-c': '#eef7ff',
                '--app-glow-a': 'rgba(205,231,252,0.9)', '--app-glow-b': 'rgba(200,225,255,0.9)', '--app-glow-c': 'rgba(225,242,255,0.9)',
                '--home-card-bg-a': '#cfe8f8', '--home-card-bg-b': '#d6edf9', '--home-card-bg-c': '#cfe6f5',
                '--home-title-color': '#3f6f9e', '--home-name-color': '#2f5a85', '--home-sub-color': '#6b9bc6',
                '--home-clock-color': '#3d6f9e', '--home-date-color': '#7f9fc0', '--home-label-color': '#3a6690',
                '--home-icon-base': 'rgba(255,255,255,0.92)', '--home-icon-border': 'rgba(255,255,255,0.95)',
                '--home-icon-1': 'linear-gradient(135deg,#7fd0f0,#c9ecff)',
                '--home-icon-2': 'linear-gradient(135deg,#8ec5fc,#c2e0ff)',
                '--home-icon-3': 'linear-gradient(135deg,#76d7f5,#b3ecff)',
                '--home-icon-4': 'linear-gradient(135deg,#8fd3f4,#d0ecff)',
                '--home-icon-5': 'linear-gradient(135deg,#7ec8e3,#b0d8ff)',
                '--home-icon-6': 'linear-gradient(135deg,#5fb8f0,#8fd0ff)',
                '--home-footer-bg': 'rgba(240,248,255,0.96)', '--home-footer-line': 'rgba(150,200,240,0.4)',
                '--chat-bg-a': '#eef6ff', '--chat-bg-b': '#eef8ff', '--chat-bg-c': '#f2faff'
            }
        },
        green: {
            name: '淡绿',
            dot: 'linear-gradient(135deg,#84fab0,#b8f0c8)',
            vars: {
                '--app-bg-a': '#e7f6e8', '--app-bg-b': '#e9f6e6', '--app-bg-c': '#eff9ea',
                '--app-glow-a': 'rgba(214,240,219,0.9)', '--app-glow-b': 'rgba(220,240,210,0.9)', '--app-glow-c': 'rgba(235,247,228,0.9)',
                '--home-card-bg-a': '#d3eed7', '--home-card-bg-b': '#dcf0db', '--home-card-bg-c': '#d5ead6',
                '--home-title-color': '#2e4a2e', '--home-name-color': '#274227', '--home-sub-color': '#6b9b6b',
                '--home-clock-color': '#2e4a2e', '--home-date-color': '#7fa87f', '--home-label-color': '#3a5a3a',
                '--home-icon-base': '#f0fff4', '--home-icon-border': '#e0f5e8',
                '--home-icon-1': 'linear-gradient(135deg,#7ad48a,#c8f0d0)',
                '--home-icon-2': 'linear-gradient(135deg,#9ed8a0,#d8f0d8)',
                '--home-icon-3': 'linear-gradient(135deg,#84fab0,#b8f0c8)',
                '--home-icon-4': 'linear-gradient(135deg,#b2e3a0,#e0f5d8)',
                '--home-icon-5': 'linear-gradient(135deg,#8fd8a8,#c8f0d8)',
                '--home-icon-6': 'linear-gradient(135deg,#6bc98a,#a8e8bc)',
                '--home-footer-bg': 'rgba(240,250,242,0.96)', '--home-footer-line': 'rgba(160,210,170,0.4)',
                '--chat-bg-a': '#f0f9f1', '--chat-bg-b': '#f0f9ee', '--chat-bg-c': '#f2faf0'
            }
        },
        purple: {
            name: '淡紫',
            dot: 'linear-gradient(135deg,#b19cf5,#d8ccff)',
            vars: {
                '--app-bg-a': '#f0eaff', '--app-bg-b': '#efe8ff', '--app-bg-c': '#f4eeff',
                '--app-glow-a': 'rgba(232,222,255,0.9)', '--app-glow-b': 'rgba(224,214,255,0.9)', '--app-glow-c': 'rgba(240,234,255,0.9)',
                '--home-card-bg-a': '#e0d5ff', '--home-card-bg-b': '#e6dcff', '--home-card-bg-c': '#ddd2fb',
                '--home-title-color': '#5d4a9e', '--home-name-color': '#4a3a85', '--home-sub-color': '#8a7ab8',
                '--home-clock-color': '#5d4a9e', '--home-date-color': '#9a8ac0', '--home-label-color': '#54438f',
                '--home-icon-base': 'rgba(255,255,255,0.92)', '--home-icon-border': 'rgba(240,234,255,0.95)',
                '--home-icon-1': 'linear-gradient(135deg,#b19cf5,#d8ccff)',
                '--home-icon-2': 'linear-gradient(135deg,#c9b6ff,#e2dcff)',
                '--home-icon-3': 'linear-gradient(135deg,#a99ce8,#cfc8ff)',
                '--home-icon-4': 'linear-gradient(135deg,#b8a8f0,#e0d8ff)',
                '--home-icon-5': 'linear-gradient(135deg,#c3b0f5,#e6dcff)',
                '--home-icon-6': 'linear-gradient(135deg,#9e86e8,#c8b8ff)',
                '--home-footer-bg': 'rgba(244,239,255,0.96)', '--home-footer-line': 'rgba(190,170,240,0.4)',
                '--chat-bg-a': '#f4efff', '--chat-bg-b': '#f4efff', '--chat-bg-c': '#f6f2ff'
            }
        },
        cream: {
            name: '奶油',
            dot: 'linear-gradient(135deg,#f2cf9a,#fae8c8)',
            vars: {
                '--app-bg-a': '#fbf3e6', '--app-bg-b': '#faf1e2', '--app-bg-c': '#fdf6ea',
                '--app-glow-a': 'rgba(250,232,200,0.9)', '--app-glow-b': 'rgba(248,238,215,0.9)', '--app-glow-c': 'rgba(253,244,225,0.9)',
                '--home-card-bg-a': '#f6e8d0', '--home-card-bg-b': '#f7ecd8', '--home-card-bg-c': '#f3e4ca',
                '--home-title-color': '#8a6a48', '--home-name-color': '#7a5c3c', '--home-sub-color': '#b89a76',
                '--home-clock-color': '#8a6a48', '--home-date-color': '#c0a486', '--home-label-color': '#805f40',
                '--home-icon-base': 'rgba(255,255,255,0.92)', '--home-icon-border': 'rgba(250,240,224,0.95)',
                '--home-icon-1': 'linear-gradient(135deg,#f2cf9a,#fae8c8)',
                '--home-icon-2': 'linear-gradient(135deg,#e8c39a,#f5e0c8)',
                '--home-icon-3': 'linear-gradient(135deg,#f0d5a8,#fae8c8)',
                '--home-icon-4': 'linear-gradient(135deg,#ecc89a,#f8e0c0)',
                '--home-icon-5': 'linear-gradient(135deg,#f5dcb0,#faedcc)',
                '--home-icon-6': 'linear-gradient(135deg,#e6b78a,#f2d8b8)',
                '--home-footer-bg': 'rgba(253,248,240,0.96)', '--home-footer-line': 'rgba(224,198,160,0.4)',
                '--chat-bg-a': '#fdf7ec', '--chat-bg-b': '#fdf7ec', '--chat-bg-c': '#fdf8ef'
            }
        },
        sunset: {
            name: '日落',
            dot: 'linear-gradient(135deg,#ff9a6e,#ffd0b8)',
            vars: {
                '--app-bg-a': '#ffece3', '--app-bg-b': '#ffe7de', '--app-bg-c': '#fff0e6',
                '--app-glow-a': 'rgba(255,224,206,0.9)', '--app-glow-b': 'rgba(255,214,196,0.9)', '--app-glow-c': 'rgba(255,232,216,0.9)',
                '--home-card-bg-a': '#ffdccb', '--home-card-bg-b': '#ffe0d0', '--home-card-bg-c': '#ffd8c6',
                '--home-title-color': '#a05a3a', '--home-name-color': '#8f4e30', '--home-sub-color': '#c98a6a',
                '--home-clock-color': '#a05a3a', '--home-date-color': '#cf9a80', '--home-label-color': '#955538',
                '--home-icon-base': 'rgba(255,255,255,0.92)', '--home-icon-border': 'rgba(255,224,210,0.95)',
                '--home-icon-1': 'linear-gradient(135deg,#ff9a6e,#ffd0b8)',
                '--home-icon-2': 'linear-gradient(135deg,#ffb08a,#ffdcc8)',
                '--home-icon-3': 'linear-gradient(135deg,#ffa28a,#ffd4c0)',
                '--home-icon-4': 'linear-gradient(135deg,#ff8f6e,#ffc8b0)',
                '--home-icon-5': 'linear-gradient(135deg,#f98a5a,#ffc8a8)',
                '--home-icon-6': 'linear-gradient(135deg,#ff7a50,#ffb898)',
                '--home-footer-bg': 'rgba(255,242,234,0.96)', '--home-footer-line': 'rgba(240,190,160,0.4)',
                '--chat-bg-a': '#fff2ec', '--chat-bg-b': '#fff0e8', '--chat-bg-c': '#fff4ee'
            }
        },
        night: {
            name: '暗夜',
            dot: 'linear-gradient(135deg,#7a6fd0,#3a3a6a)',
            vars: {
                '--app-bg-a': '#2a3560', '--app-bg-b': '#1f2850', '--app-bg-c': '#0f1630',
                '--app-glow-a': 'rgba(74,84,150,0.9)', '--app-glow-b': 'rgba(60,70,140,0.9)', '--app-glow-c': 'rgba(40,50,110,0.9)',
                '--home-card-bg-a': '#35406e', '--home-card-bg-b': '#2e3a66', '--home-card-bg-c': '#26305a',
                '--home-title-color': '#e8e8f5', '--home-name-color': '#ffffff', '--home-sub-color': '#b0b8d0',
                '--home-clock-color': '#ffffff', '--home-date-color': '#9aa4c0', '--home-label-color': '#d8dcf0',
                '--home-icon-base': 'rgba(255,255,255,0.08)', '--home-icon-border': 'rgba(255,255,255,0.16)',
                '--home-icon-1': 'linear-gradient(135deg,#a06fe8,#6a4fc0)',
                '--home-icon-2': 'linear-gradient(135deg,#8f7af0,#6a52c8)',
                '--home-icon-3': 'linear-gradient(135deg,#7ab8f0,#5a86c8)',
                '--home-icon-4': 'linear-gradient(135deg,#f08aa8,#c85a7a)',
                '--home-icon-5': 'linear-gradient(135deg,#8fe0d0,#5ac0ac)',
                '--home-icon-6': 'linear-gradient(135deg,#f0a05a,#c8783a)',
                '--home-footer-bg': 'rgba(20,26,56,0.92)', '--home-footer-line': 'rgba(255,255,255,0.12)',
                '--chat-bg-a': '#2a3050', '--chat-bg-b': '#262c48', '--chat-bg-c': '#202540'
            }
        }
    };

    /* 自定义分项颜色（对应图：标题/副标题/名字/时间/图标底色/图标边框 + 6 组图标渐变端点） */
    const COLOR_FIELDS = [
        { label: '标题颜色', var: '--home-title-color', key: 'title' },
        { label: '副标题颜色', var: '--home-sub-color', key: 'sub' },
        { label: '名字颜色', var: '--home-name-color', key: 'name' },
        { label: '时间颜色', var: '--home-clock-color', key: 'clock' },
        { label: '图标底色', var: '--home-icon-base', key: 'iconBase' },
        { label: '图标边框', var: '--home-icon-border', key: 'iconBorder' }
    ];
    const ICON_FIELDS = [];
    for (let i = 1; i <= 6; i++) {
        ICON_FIELDS.push(
            { label: '图标' + i + '·起始色', var: '--home-icon-' + i, key: 'ic' + i + 'a', slot: 0 },
            { label: '图标' + i + '·结束色', var: '--home-icon-' + i, key: 'ic' + i + 'b', slot: 1 }
        );
    }

    let _uiBuilt = false;
    let _page = null;

    const _esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    /* ---------------- 持久化 ---------------- */
    function _load() {
        try {
            const s = localStorage.getItem(KEY);
            if (s) { const d = JSON.parse(s); return Object.assign({}, DEFAULTS, d); }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULTS));
    }
    function _save(d) {
        try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { console.warn('[外观] 保存失败', e); }
    }

    /* ---------------- 应用变量 ---------------- */
    function _applyAll(d) {
        const root = document.documentElement;
        // 主题变量
        const t = THEMES[d.theme] ? THEMES[d.theme].vars : THEMES.pink.vars;
        Object.keys(t).forEach((k) => root.style.setProperty(k, t[k]));
        // 用户自定义颜色覆盖
        Object.keys(d.colors || {}).forEach((k) => {
            const v = d.colors[k];
            if (!v) return;
            if (k === 'iconBase') { root.style.setProperty('--home-icon-base', v); }
            else if (k === 'iconBorder') { root.style.setProperty('--home-icon-border', v); }
            else if (k.indexOf('ic') === 0) {
                // 图标渐变端点：ic1a/ic1b → --home-icon-1
                const n = parseInt(k.slice(2), 10);
                const slot = k.slice(-1) === 'a' ? 0 : 1;
                const cur = root.style.getPropertyValue('--home-icon-' + n) || (THEMES[d.theme] ? THEMES[d.theme].vars['--home-icon-' + n] : '');
                const colors = cur.match(/linear-gradient\(135deg,\s*([^,]+),\s*([^)]+)\)/);
                const c1 = slot === 0 ? v : (colors ? colors[1].trim() : v);
                const c2 = slot === 1 ? v : (colors ? colors[2].trim() : v);
                root.style.setProperty('--home-icon-' + n, 'linear-gradient(135deg, ' + c1 + ', ' + c2 + ')');
            } else {
                const m = { title: '--home-title-color', sub: '--home-sub-color', name: '--home-name-color', clock: '--home-clock-color' };
                if (m[k]) root.style.setProperty(m[k], v);
            }
        });
        // 背景图
        const imgs = d.images || {};
        if (imgs.home) { root.style.setProperty('--home-bg-img', 'url(' + imgs.home + ')'); }
        else { root.style.setProperty('--home-bg-img', 'none'); }
        if (imgs.card) { root.style.setProperty('--home-card-img', 'url(' + imgs.card + ')'); }
        else { root.style.setProperty('--home-card-img', 'none'); }
        if (imgs.chat) { root.style.setProperty('--chat-bg-img', 'url(' + imgs.chat + ')'); }
        else { root.style.setProperty('--chat-bg-img', 'none'); }

        // 开关背景图 class
        const homePage = document.querySelector('.home-page');
        if (homePage) homePage.classList.toggle('has-bg-img', !!imgs.home);
        const cardEl = document.querySelector('.home-couple-card');
        if (cardEl) cardEl.classList.toggle('has-card-img', !!imgs.card);
        document.body.classList.toggle('has-chat-img', !!imgs.chat);
    }

    /* ---------------- 图片上传（压缩） ---------------- */
    function _readImage(file, cb) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                try {
                    const max = 1280;
                    let w = img.width, h = img.height;
                    const scale = Math.min(1, max / Math.max(w, h));
                    w = Math.round(w * scale); h = Math.round(h * scale);
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    cb(dataUrl);
                } catch (err) { cb(e.target.result); }
            };
            img.onerror = function () { cb(e.target.result); };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /* ---------------- UI 构建 ---------------- */
    function _buildUI(d) {
        if (_uiBuilt) return;
        _uiBuilt = true;
        const page = document.createElement('div');
        page.className = 'ap-page';
        page.id = 'ap-page';
        page.innerHTML = `
            <div class="ap-phone">
                <div class="ap-topbar">
                    <button class="ap-back-btn" onclick="window.closeAppearance&&closeAppearance()"><i class="fas fa-chevron-left"></i></button>
                    <span class="ap-title">外观装扮</span>
                    <span class="ap-top-right"></span>
                </div>
                <div class="ap-scroll">
                    <!-- 主题预设 -->
                    <div class="ap-sec">
                        <div class="ap-sec-title">🎨 主题配色</div>
                        <div class="ap-themes" id="ap-themes"></div>
                    </div>
                    <!-- 自定义颜色 -->
                    <div class="ap-sec">
                        <div class="ap-sec-title">🖌️ 自定义颜色</div>
                        <div class="ap-color-list" id="ap-colors"></div>
                    </div>
                    <div class="ap-sec">
                        <div class="ap-sec-title">🌈 图标渐变颜色</div>
                        <div class="ap-color-list" id="ap-icongrads"></div>
                    </div>
                    <!-- 背景壁纸 -->
                    <div class="ap-sec">
                        <div class="ap-sec-title">🖼️ 背景壁纸（上传照片）</div>
                        <div class="ap-bg-item">
                            <span class="ap-bg-label">主页背景</span>
                            <div class="ap-bg-actions">
                                <label class="ap-upload-btn" id="ap-upload-home">上传<i class="fas fa-image"></i><input type="file" accept="image/*" hidden></label>
                                <button class="ap-clear-btn" data-img="home">清除</button>
                            </div>
                        </div>
                        <div class="ap-bg-item">
                            <span class="ap-bg-label">情侣卡片背景</span>
                            <div class="ap-bg-actions">
                                <label class="ap-upload-btn" id="ap-upload-card">上传<i class="fas fa-image"></i><input type="file" accept="image/*" hidden></label>
                                <button class="ap-clear-btn" data-img="card">清除</button>
                            </div>
                        </div>
                        <div class="ap-bg-item">
                            <span class="ap-bg-label">聊天背景</span>
                            <div class="ap-bg-actions">
                                <label class="ap-upload-btn" id="ap-upload-chat">上传<i class="fas fa-image"></i><input type="file" accept="image/*" hidden></label>
                                <button class="ap-clear-btn" data-img="chat">清除</button>
                            </div>
                        </div>
                        <div class="ap-bg-tip">上传后立即生效，照片会保存在本机浏览器中。</div>
                    </div>
                    <!-- 恢复默认 -->
                    <div class="ap-reset-row">
                        <button class="ap-reset-btn" id="ap-reset">↺ 恢复全部默认</button>
                    </div>
                    <div class="ap-foot-space"></div>
                </div>
            </div>`;
        document.body.appendChild(page);
        _page = page;

        // 主题按钮
        const themesBox = page.querySelector('#ap-themes');
        Object.keys(THEMES).forEach((key) => {
            const t = THEMES[key];
            const b = document.createElement('button');
            b.className = 'ap-theme-item' + (d.theme === key ? ' active' : '');
            b.dataset.theme = key;
            b.innerHTML = `<span class="ap-theme-dot" style="background:${t.dot}"></span><span>${t.name}</span>`;
            b.addEventListener('click', function () {
                d.theme = key;
                _applyAll(d);
                _save(d);
                themesBox.querySelectorAll('.ap-theme-item').forEach((x) => x.classList.remove('active'));
                b.classList.add('active');
                _syncColorInputs();
                _toast('已切换「' + t.name + '」主题');
            });
            themesBox.appendChild(b);
        });

        // 分项颜色
        const colorsBox = page.querySelector('#ap-colors');
        COLOR_FIELDS.forEach((f) => {
            const row = document.createElement('label');
            row.className = 'ap-color-row';
            const cur = _curColor(f, d);
            row.innerHTML = `
                <span class="ap-color-name">${f.label}</span>
                <span class="ap-color-pick"><input type="color" data-field="${f.key}" value="${cur}"></span>
                <span class="ap-color-hex" id="hex-${f.key}">${cur}</span>`;
            row.querySelector('input').addEventListener('input', function () {
                d.colors[f.key] = this.value;
                _applyAll(d);
                _save(d);
                row.querySelector('.ap-color-hex').textContent = this.value;
            });
            colorsBox.appendChild(row);
        });

        // 图标渐变颜色
        const gradBox = page.querySelector('#ap-icongrads');
        ICON_FIELDS.forEach((f) => {
            const row = document.createElement('label');
            row.className = 'ap-color-row';
            const cur = _curGradColor(f, d);
            row.innerHTML = `
                <span class="ap-color-name">${f.label}</span>
                <span class="ap-color-pick"><input type="color" data-grad="${f.key}" value="${cur}"></span>
                <span class="ap-color-hex" id="ghex-${f.key}">${cur}</span>`;
            row.querySelector('input').addEventListener('input', function () {
                d.colors[f.key] = this.value;
                _applyAll(d);
                _save(d);
                row.querySelector('.ap-color-hex').textContent = this.value;
            });
            gradBox.appendChild(row);
        });

        // 上传背景
        ['home', 'card', 'chat'].forEach((which) => {
            const input = page.querySelector('#ap-upload-' + which + ' input');
            if (!input) return;
            input.addEventListener('change', function () {
                const file = this.files && this.files[0];
                if (!file) return;
                _readImage(file, function (dataUrl) {
                    d.images[which] = dataUrl;
                    _applyAll(d);
                    _save(d);
                    _toast(which === 'home' ? '主页背景已更新' : which === 'card' ? '卡片背景已更新' : '聊天背景已更新');
                });
                this.value = '';
            });
        });
        page.querySelectorAll('.ap-clear-btn').forEach((btn) => {
            btn.addEventListener('click', function () {
                const which = this.dataset.img;
                d.images[which] = null;
                _applyAll(d);
                _save(d);
                _toast('已清除该背景');
            });
        });

        // 恢复默认
        page.querySelector('#ap-reset').addEventListener('click', function () {
            try { localStorage.removeItem(KEY); } catch (e) {}
            location.reload();
        });

        _syncColorInputs();
    }

    function _curColor(f, d) {
        const root = document.documentElement;
        const v = root.style.getPropertyValue(f.var) || '';
        if (v) { const m = v.match(/#[0-9a-fA-F]{6}/); if (m) return m[0]; }
        // 从主题预设取
        const t = THEMES[d.theme];
        if (t && t.vars[f.var]) { const m2 = t.vars[f.var].match(/#[0-9a-fA-F]{6}/); if (m2) return m2[0]; }
        return '#888888';
    }
    function _curGradColor(f, d) {
        const root = document.documentElement;
        let grad = root.style.getPropertyValue(f.var) || '';
        if (!grad) { const t = THEMES[d.theme]; if (t && t.vars[f.var]) grad = t.vars[f.var]; }
        const colors = grad.match(/linear-gradient\(135deg,\s*([^,]+),\s*([^)]+)\)/);
        if (colors) {
            const m = (f.slot === 0 ? colors[1] : colors[2]).match(/#[0-9a-fA-F]{6}/);
            if (m) return m[0];
        }
        return '#888888';
    }
    function _syncColorInputs() {
        if (!_page) return;
        // 同步颜色输入框（切主题后刷新色块与色值）
        COLOR_FIELDS.forEach((f) => {
            const input = _page.querySelector('input[data-field="' + f.key + '"]');
            if (input) { const c = _curColor(f, _load()); input.value = c; const hx = _page.querySelector('#hex-' + f.key); if (hx) hx.textContent = c; }
        });
        ICON_FIELDS.forEach((f) => {
            const input = _page.querySelector('input[data-grad="' + f.key + '"]');
            if (input) { const c = _curGradColor(f, _load()); input.value = c; const hx = _page.querySelector('#ghex-' + f.key); if (hx) hx.textContent = c; }
        });
    }

    function _toast(msg) {
        if (typeof showNotification === 'function') { showNotification(msg, 'info', 2000); return; }
        let t = document.querySelector('.ap-toast');
        if (!t) { t = document.createElement('div'); t.className = 'ap-toast'; document.body.appendChild(t); }
        t.textContent = msg; t.style.display = 'block';
        clearTimeout(t._tm); t._tm = setTimeout(() => { t.style.display = 'none'; }, 2000);
    }

    /* ---------------- 入口 ---------------- */
    window.openAppearance = function () {
        const d = _load();
        _buildUI(d);
        const page = document.getElementById('ap-page');
        if (!page) return;
        page.classList.add('show');
        _applyAll(d);
        _syncColorInputs();
    };
    window.closeAppearance = function () {
        const page = document.getElementById('ap-page');
        if (page) page.classList.remove('show');
    };

    // 启动时应用已保存的外观
    function _init() {
        const d = _load();
        if (d.theme !== DEFAULTS.theme || Object.keys(d.colors).length || d.images.home || d.images.card || d.images.chat) {
            _applyAll(d);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }
})();
