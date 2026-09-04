/* ============================================================
   addons.js — 情侣空间扩展功能合集
   包含：情侣头像框 / 牵手特效 / 爱情信物 / 恋爱钱包 / 连续火焰 /
        默契测验 / 小游戏合集 / 猜拳骰子 / 你画我猜 / 真心话大冒险 /
        谁先道歉 / 传情骰子 / 斗图模式 / 悄悄话·阅后即焚 / 专属暗号 /
        语音留言墙 / 心情天气 / 聊天金句卡 / 影音小屋 / 旅行足迹 /
        数字纪念日 / 回家报平安 / 共享待办 / 生理期提醒 / 吃药喝水提醒 /
        一键呼叫 / 异地时差 / 共同账单 / 约会计划 / 吵架冷静期 / 随机小惊喜
   ============================================================ */
(() => {
    'use strict';

    const _NS = 'CX_addons_';
    const _load = (k, d) => { try { const v = localStorage.getItem(_NS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
    const _save = (k, v) => { try { localStorage.setItem(_NS + k, JSON.stringify(v)); } catch (e) {} };

    const _myName = () => (typeof settings !== 'undefined' && settings.myName) || '我';
    const _partnerName = () => (typeof settings !== 'undefined' && settings.partnerName) || '对方';
    const _esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const _pad = (n) => (n < 10 ? '0' + n : '' + n);
    const _fmtTime = (ts) => { const d = new Date(ts); return _pad(d.getHours()) + ':' + _pad(d.getMinutes()); };
    const _fmtDay = (ts) => { const d = new Date(ts); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; };
    const _money = (n) => Number(n).toFixed(2);

    function _toast(msg, type) {
        if (typeof showNotification === 'function') showNotification(msg, type || 'info', 2200);
    }
    function _sendMsg(text, sender, status) {
        if (typeof addMessage === 'function') {
            try {
                addMessage({
                    id: Date.now() + Math.floor(Math.random() * 999),
                    sender: sender || (status === 'received' ? _partnerName() : 'user'),
                    text: text,
                    timestamp: new Date(),
                    status: status || (sender === 'user' ? 'sent' : 'received'),
                    favorited: false,
                    note: null,
                    replyTo: null,
                    type: 'normal'
                });
                return true;
            } catch (e) {}
        }
        return false;
    }
    function _sendSound(which) {
        if (typeof playSound === 'function') { try { playSound(which || 'send'); } catch (e) {} }
    }
    function _partnerReplySoon(txt, delay) {
        setTimeout(function () {
            _sendMsg(txt, _partnerName(), 'received');
            _sendSound('message');
        }, delay || (900 + Math.random() * 900));
    }
    function _closeAllPages() {
        if (typeof closeFun === 'function') { try { closeFun(); } catch (e) {} }
        if (typeof closeHome === 'function') { try { closeHome(); } catch (e) {} }
    }

    /* ---------------- 通用页面外壳（独立于 fun.js） ---------------- */
    let _built = false;
    function _buildUI() {
        if (_built) return;
        _built = true;
        const page = document.createElement('div');
        page.className = 'add-page';
        page.id = 'add-page';
        page.innerHTML = `<div class="add-phone" id="add-phone"></div>`;
        document.body.appendChild(page);
    }
    function _topbar(title, sub) {
        _buildUI();
        const p = document.getElementById('add-phone');
        if (!p) return null;
        p.innerHTML = `
            <div class="add-topbar">
                <button class="add-back-btn" onclick="window.closeAdd&&closeAdd()"><i class="fas fa-chevron-left"></i></button>
                <span class="add-title">${_esc(title)}</span>
                ${sub ? '<span class="add-sub">' + _esc(sub) + '</span>' : ''}
            </div>
            <div class="add-scroll" id="add-scroll"></div>`;
        return document.getElementById('add-scroll');
    }
    function _openAdd() {
        _buildUI();
        _closeAllPages();
        const pg = document.getElementById('add-page');
        if (pg) pg.classList.add('show');
    }
    window.closeAdd = function () {
        const pg = document.getElementById('add-page');
        if (pg) pg.classList.remove('show');
    };

    /* ============================================================
       7) 情侣头像框 —— 给两个人换上同款相框
       ============================================================ */
    const FRAMES = [
        { id: 'pink', name: '心动粉', emoji: '💗', ring: '#ff7aa2' },
        { id: 'gold', name: '鎏金', emoji: '👑', ring: '#f0c860' },
        { id: 'blue', name: '星河', emoji: '💙', ring: '#6ea8ff' },
        { id: 'green', name: '青柠', emoji: '🍀', ring: '#6fdb9c' },
        { id: 'purple', name: '星空', emoji: '✨', ring: '#b78cff' },
        { id: 'none', name: '无相框', emoji: '💭', ring: '' }
    ];
    function _frame() { return _load('avatarFrame', null); }
    window.openAvatarFrame = function () {
        _openAdd();
        const box = _topbar('情侣头像框', '同款相框，甜在一起');
        if (!box) return;
        const cur = _frame();
        box.innerHTML = `
            <div class="af-preview">
                <div class="af-avatar-pair">
                    <div class="af-avatar" id="af-av1">🙂</div>
                    <div class="af-heart">❤️</div>
                    <div class="af-avatar" id="af-av2">🙂</div>
                </div>
                <div class="af-preview-name">${_esc(_myName())} & ${_esc(_partnerName())}</div>
            </div>
            <div class="add-h2">选择相框</div>
            <div class="af-grid" id="af-grid"></div>
            <div class="add-note">💡 选好后，主页和聊天页的双头像都会带上同款相框～</div>`;
        const grid = box.querySelector('#af-grid');
        FRAMES.forEach((f) => {
            const b = document.createElement('button');
            b.className = 'af-item' + (cur && cur.id === f.id ? ' active' : '');
            b.style.setProperty('--ring', f.ring);
            b.innerHTML = `<span class="af-emoji">${f.emoji}</span><span class="af-name">${f.name}</span>`;
            b.onclick = function () {
                const val = f.id === 'none' ? null : { id: f.id, emoji: f.emoji, ring: f.ring, name: f.name };
                _save('avatarFrame', val);
                _toast(f.id === 'none' ? '已取消相框' : '已换上「' + f.name + '」相框', 'success');
                window.openAvatarFrame();
            };
            grid.appendChild(b);
        });
        const av1 = box.querySelector('#af-av1');
        const av2 = box.querySelector('#af-av2');
        if (cur && cur.ring) {
            av1.style.border = '3px solid ' + cur.ring;
            av1.innerHTML = '<span class="af-badge">' + cur.emoji + '</span>🙂';
            av2.style.border = '3px solid ' + cur.ring;
            av2.innerHTML = '<span class="af-badge">' + cur.emoji + '</span>🙂';
        }
    };

    /* ============================================================
       8) 牵手特效 —— 打开后聊天页有甜甜的牵手爱心飘过
       ============================================================ */
    function _applyHandHold() {
        const on = !!_load('handHold', false);
        document.body.classList.toggle('cx-handhold', on);
    }
    window.openHandHold = function () {
        _openAdd();
        const box = _topbar('牵手特效', '每天都要手牵手');
        if (!box) return;
        const on = !!_load('handHold', false);
        box.innerHTML = `
            <div class="hh-hero ${on ? 'on' : ''}" id="hh-hero">🤝</div>
            <div class="add-h2">牵手爱心特效</div>
            <div class="hh-desc">开启后，聊天页会时不时飘过牵手的爱心，超甜～</div>
            <div class="hh-switch-row">
                <span class="hh-switch-label">当前：${on ? '已开启' : '已关闭'}</span>
                <button class="hh-btn ${on ? 'off' : 'on'}" id="hh-btn">${on ? '关闭特效' : '开启特效'}</button>
            </div>
            <div class="add-note">💡 开关实时生效，随时可以回来切换。</div>`;
        box.querySelector('#hh-btn').onclick = function () {
            const next = !on;
            _save('handHold', next);
            _applyHandHold();
            _toast(next ? '牵手特效已开启 💗' : '牵手特效已关闭', 'success');
            window.openHandHold();
        };
    };

    /* ============================================================
       10) 爱情信物 —— 把信物送给TA，永久收藏
       ============================================================ */
    const TOKENS = [
        { id: 'ring', e: '💍', n: '情侣对戒', t: '戴上它，套住我的心' },
        { id: 'bracelet', e: '📿', n: '串珠手链', t: '每一颗珠子都是想你的一天' },
        { id: 'star', e: '⭐', n: '星星一颗', t: '摘一颗星，只想给你' },
        { id: 'flower', e: '💐', n: '一束花', t: '花会谢，我的心不会' },
        { id: 'bear', e: '🧸', n: '小熊玩偶', t: '抱着它就像抱着你' },
        { id: 'watch', e: '⌚', n: '时光怀表', t: '想把时间都留给你' },
        { id: 'key', e: '🗝️', n: '一把钥匙', t: '我心里的门，只为你开' },
        { id: 'crystal', e: '💎', n: '水晶心', t: '晶莹剔透，是我的真心' }
    ];
    window.openLoveToken = function () {
        _openAdd();
        const box = _topbar('爱情信物', '把心意送给TA');
        if (!box) return;
        const gifts = _load('tokens', []);
        box.innerHTML = `
            <div class="add-h2">💝 已收藏的信物</div>
            <div class="lt-owned" id="lt-owned"></div>
            <div class="add-h2">🎁 选择信物送给${_esc(_partnerName())}</div>
            <div class="lt-grid" id="lt-grid"></div>`;
        const owned = box.querySelector('#lt-owned');
        if (!gifts.length) {
            owned.innerHTML = '<div class="lt-empty">还没有收到信物哦，快去送TA一个吧～</div>';
        } else {
            owned.innerHTML = gifts.map((g) => `<div class="lt-owned-item"><span>${g.e}</span><span class="lt-owned-name">${_esc(g.n)}</span><span class="lt-owned-by">来自 ${_esc(g.by)}</span></div>`).join('');
        }
        const grid = box.querySelector('#lt-grid');
        TOKENS.forEach((tk) => {
            const b = document.createElement('button');
            b.className = 'lt-item';
            b.innerHTML = `<span class="lt-emoji">${tk.e}</span><span class="lt-name">${_esc(tk.n)}</span><span class="lt-tip">${_esc(tk.t)}</span>`;
            b.onclick = function () {
                const arr = _load('tokens', []);
                arr.push({ e: tk.e, n: tk.n, by: _myName(), at: Date.now() });
                _save('tokens', arr);
                _closeAllPages();
                setTimeout(function () {
                    _sendMsg(tk.e + ' 送给你一件爱情信物：「' + tk.n + '」——' + tk.t, 'user', 'sent');
                    _sendSound('send');
                    _partnerReplySoon('哇！' + tk.e + ' 收到啦，我超喜欢的！', 1200);
                }, 150);
                _toast('信物已送出 💝', 'success');
            };
            grid.appendChild(b);
        });
    };

    /* ============================================================
       16) 恋爱钱包 —— 一起为梦想存钱
       ============================================================ */
    window.openLoveWallet = function () {
        _openAdd();
        const box = _topbar('恋爱钱包', '一起存下的每一分');
        if (!box) return;
        const w = _load('wallet', { goal: 9999, saved: 0 });
        const pct = Math.min(100, Math.round((w.saved / (w.goal || 1)) * 100));
        box.innerHTML = `
            <div class="lw-card">
                <div class="lw-goal-label">共同梦想基金 · 目标 ¥${_money(w.goal)}</div>
                <div class="lw-balance">¥${_money(w.saved)}</div>
                <div class="lw-bar"><div class="lw-bar-in" style="width:${pct}%"></div></div>
                <div class="lw-pct">已完成 ${pct}% · 还差 ¥${_money(Math.max(0, w.goal - w.saved))}</div>
            </div>
            <div class="add-h2">存一笔进去</div>
            <div class="lw-quick" id="lw-quick"></div>
            <div class="lw-custom">
                <input class="add-input" id="lw-amount" type="number" placeholder="自定义金额（元）">
                <button class="add-btn primary" id="lw-add">存进我们的钱包</button>
            </div>
            <div class="add-h2">修改目标</div>
            <div class="lw-custom">
                <input class="add-input" id="lw-goal" type="number" placeholder="目标金额（元）">
                <button class="add-btn" id="lw-setgoal">设定目标</button>
            </div>
            <div class="add-note">💡 这里的钱是我们俩的共同梦想基金，好好攒起来哦。</div>`;
        const quick = box.querySelector('#lw-quick');
        [10, 50, 100, 520].forEach((n) => {
            const b = document.createElement('button');
            b.className = 'lw-quick-btn';
            b.textContent = '+' + n;
            b.onclick = function () {
                const cur = _load('wallet', { goal: 9999, saved: 0 });
                cur.saved = Number(cur.saved) + n;
                _save('wallet', cur);
                _toast('已存入 ¥' + n + ' 💰', 'success');
                window.openLoveWallet();
            };
            quick.appendChild(b);
        });
        box.querySelector('#lw-add').onclick = function () {
            const v = parseFloat(box.querySelector('#lw-amount').value);
            if (!v || v <= 0) { _toast('请输入有效金额', 'warning'); return; }
            const cur = _load('wallet', { goal: 9999, saved: 0 });
            cur.saved = Number(cur.saved) + v;
            _save('wallet', cur);
            _toast('已存入 ¥' + _money(v) + ' 💰', 'success');
            window.openLoveWallet();
        };
        box.querySelector('#lw-setgoal').onclick = function () {
            const v = parseFloat(box.querySelector('#lw-goal').value);
            if (!v || v <= 0) { _toast('请输入有效金额', 'warning'); return; }
            const cur = _load('wallet', { goal: 9999, saved: 0 });
            cur.goal = v;
            _save('wallet', cur);
            _toast('目标已设定为 ¥' + _money(v), 'success');
            window.openLoveWallet();
        };
    };

    /* ============================================================
       20) 连续火焰 —— 连续聊天的天数
       ============================================================ */
    function _streakDays() {
        try {
            if (typeof messages === 'undefined' || !Array.isArray(messages)) return 0;
            const days = new Set();
            messages.forEach((m) => {
                if (!m || !m.timestamp) return;
                const d = new Date(m.timestamp);
                if (isNaN(d.getTime())) return;
                days.add(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate());
            });
            const arr = Array.from(days).map((s) => new Date(s.replace(/-/g, '/'))).sort((a, b) => b - a);
            if (!arr.length) return 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let streak = 0;
            let cursor = today;
            // 若今天没聊，从昨天开始算（今天没聊不打断）
            const first = new Date(arr[0]);
            first.setHours(0, 0, 0, 0);
            if (first.getTime() !== cursor.getTime()) {
                cursor = new Date(cursor.getTime() - 86400000);
            }
            const set = new Set(arr.map((d) => d.getTime()));
            while (set.has(cursor.getTime())) {
                streak++;
                cursor = new Date(cursor.getTime() - 86400000);
            }
            return streak;
        } catch (e) { return 0; }
    }
    window.openFlame = function () {
        _openAdd();
        const box = _topbar('连续火焰', '一天不落，天天想你');
        if (!box) return;
        const streak = _streakDays();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = [];
        for (let i = 13; i >= 0; i--) {
            days.push(new Date(today.getTime() - i * 86400000));
        }
        let lit = 0;
        try {
            if (typeof messages !== 'undefined' && Array.isArray(messages)) {
                const set = new Set();
                messages.forEach((m) => {
                    if (!m || !m.timestamp) return;
                    const d = new Date(m.timestamp);
                    if (isNaN(d.getTime())) return;
                    set.add(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate());
                });
                days.forEach((d) => { if (set.has(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate())) lit++; });
            }
        } catch (e) {}
        box.innerHTML = `
            <div class="fl-hero">
                <div class="fl-flame">${streak > 0 ? '🔥' : '🧊'}</div>
                <div class="fl-count">${streak} 天</div>
                <div class="fl-sub">${streak > 0 ? '连续' + streak + '天都在聊天，好甜！' : '今天还没聊天，快去找TA说说话～'}</div>
            </div>
            <div class="add-h2">最近 14 天</div>
            <div class="fl-cal" id="fl-cal"></div>
            <div class="add-note">💡 每天和${_esc(_partnerName())}说一句话，火焰就不会灭哦。</div>`;
        const cal = box.querySelector('#fl-cal');
        cal.innerHTML = days.map((d) => {
            const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
            const isToday = d.getTime() === today.getTime();
            let on = false;
            try {
                if (typeof messages !== 'undefined' && Array.isArray(messages)) {
                    on = messages.some((m) => m && m.timestamp && new Date(m.timestamp).getFullYear() + '-' + (new Date(m.timestamp).getMonth() + 1) + '-' + new Date(m.timestamp).getDate() === key);
                }
            } catch (e) {}
            return `<div class="fl-day ${on ? 'on' : ''} ${isToday ? 'today' : ''}">
                <span class="fl-dot">${on ? '🔥' : '·'}</span><span class="fl-day-label">${d.getMonth() + 1}/${d.getDate()}</span>
            </div>`;
        }).join('');
    };

    /* ============================================================
       40) 数字纪念日 —— 在一起的各种里程碑
       ============================================================ */
    window.openMilestone = function () {
        _openAdd();
        const box = _topbar('数字纪念日', '每一个数字都算数');
        if (!box) return;
        let dayCount = 0;
        let msgCount = 0;
        let rpCount = 0;
        let giftCount = 0;
        try {
            if (typeof messages !== 'undefined' && Array.isArray(messages)) {
                msgCount = messages.length;
                rpCount = messages.filter((m) => m && m.redpacket).length;
                const first = messages.find((m) => m && m.timestamp && !isNaN(new Date(m.timestamp).getTime()));
                if (first) {
                    const start = new Date(first.timestamp);
                    start.setHours(0, 0, 0, 0);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    dayCount = Math.max(1, Math.round((now - start) / 86400000) + 1);
                }
            }
        } catch (e) {}
        try { giftCount = (window.__giftStats && window.__giftStats().gifts) || 0; } catch (e) {}
        const ms = [
            { e: '💞', n: '在一起', v: dayCount + ' 天', tip: '从第一条消息开始' },
            { e: '💬', n: '聊过', v: msgCount + ' 条', tip: '字字都是想念' },
            { e: '🧧', n: '红包', v: rpCount + ' 个', tip: '都是爱你的方式' },
            { e: '🎁', n: '礼物', v: giftCount + ' 件', tip: '都好好收着啦' }
        ];
        const next = [];
        if (dayCount > 0 && dayCount < 100) next.push({ e: '💯', n: '距离第100天', v: (100 - dayCount) + ' 天', t: '一起庆祝吧！' });
        if (msgCount > 0 && msgCount < 1000) next.push({ e: '✉️', n: '距离1000条消息', v: (1000 - msgCount) + ' 条', t: '聊天记录要爆啦' });
        if (msgCount >= 1000) next.push({ e: '🏆', n: '已突破', v: '1000+ 条', t: '聊天王者！' });
        box.innerHTML = `
            <div class="ms-hero">📅 我们的小小数字</div>
            <div class="ms-grid">
                ${ms.map((m) => `<div class="ms-item"><span class="ms-emoji">${m.e}</span><span class="ms-num">${_esc(m.v)}</span><span class="ms-name">${_esc(m.n)}</span><span class="ms-tip">${_esc(m.tip)}</span></div>`).join('')}
            </div>
            <div class="add-h2">🎯 下一个目标</div>
            <div class="ms-next">
                ${next.length ? next.map((m) => `<div class="ms-next-item"><span>${m.e}</span><b>${_esc(m.v)}</b><span>${_esc(m.n)} · ${_esc(m.t)}</span></div>`).join('') : '<div class="lt-empty">目标都已达成，你们太棒了！</div>'}
            </div>`;
    };

    /* ============================================================
       21~28 互动游戏（22 为合集入口）
       ============================================================ */
    window.openGames = function () {
        _openAdd();
        const box = _topbar('小游戏合集', '一起玩才开心');
        if (!box) return;
        const games = [
            { i: '🧠', n: '默契测验', d: '比谁更懂对方', f: 'openQuiz' },
            { i: '✊', n: '猜拳·掷骰子', d: '快速决胜负', f: 'openRpsDice' },
            { i: '🎨', n: '你画我猜', d: '画个画给TA猜', f: 'openDrawGuess' },
            { i: '🎲', n: '真心话大冒险', d: '敢不敢来一把', f: 'openTruthDare' },
            { i: '🫂', n: '谁先道歉', d: '吵架和好神器', f: 'openWhoApology' },
            { i: '🎯', n: '传情骰子', d: '摇出甜蜜指令', f: 'openLoveDice' },
            { i: '😝', n: '斗图模式', d: '表情包大作战', f: 'openStickerBattle' },
            { i: '🔥', n: '悄悄话', d: '阅后即焚的小秘密', f: 'openSecretNote' },
            { i: '🤫', n: '专属暗号', d: '只有我们懂的密语', f: 'openSecretCode' }
        ];
        box.innerHTML = `<div class="gm-grid" id="gm-grid"></div>
            <div class="add-note">💡 选一个，和${_esc(_partnerName())}马上玩起来！</div>`;
        const grid = box.querySelector('#gm-grid');
        games.forEach((g) => {
            const b = document.createElement('button');
            b.className = 'gm-item';
            b.innerHTML = `<span class="gm-emoji">${g.i}</span><span class="gm-name">${_esc(g.n)}</span><span class="gm-desc">${_esc(g.d)}</span>`;
            b.onclick = function () { try { if (window[g.f]) window[g.f](); } catch (e) {} };
            grid.appendChild(b);
        });
    };

    /* ---- 21 默契测验 ---- */
    const QUIZ = [
        { q: 'TA 最喜欢什么颜色？', o: ['粉色', '蓝色', '黑色', '白色'], a: 0 },
        { q: 'TA 最爱的食物是？', o: ['火锅', '奶茶', '烧烤', '甜点'], a: 1 },
        { q: 'TA 生气时最想要？', o: ['安静一下', '抱抱', '认错', '奶茶'], a: 1 },
        { q: 'TA 最怕什么？', o: ['蟑螂', '鬼片', '打雷', '孤独'], a: 0 },
        { q: 'TA 周末最喜欢？', o: ['宅家', '逛街', '看电影', '运动'], a: 2 },
        { q: 'TA 理想的约会是？', o: ['游乐园', '看海', '逛吃', '窝在一起'], a: 3 }
    ];
    let _quizIdx = 0;
    let _quizScore = 0;
    window.openQuiz = function () {
        _openAdd();
        _quizIdx = 0;
        _quizScore = 0;
        _renderQuiz();
    };
    function _renderQuiz() {
        const box = _topbar('默契测验', '答对了才算懂TA');
        if (!box) return;
        if (_quizIdx >= QUIZ.length) {
            const score = _quizScore;
            const txt = score >= 5 ? '你们简直是同一个人！' : score >= 3 ? '还挺默契的嘛～' : '再多聊聊天，越来越懂彼此！';
            box.innerHTML = `
                <div class="qz-result-hero">🧡</div>
                <div class="qz-score">${score} / ${QUIZ.length}</div>
                <div class="qz-result-txt">${txt}</div>
                <button class="add-btn primary" id="qz-again">再来一局</button>
                <button class="add-btn" id="qz-back">返回小游戏</button>`;
            box.querySelector('#qz-again').onclick = function () { _quizIdx = 0; _quizScore = 0; _renderQuiz(); };
            box.querySelector('#qz-back').onclick = function () { window.openGames(); };
            return;
        }
        const item = QUIZ[_quizIdx];
        box.innerHTML = `
            <div class="qz-progress">第 ${_quizIdx + 1} / ${QUIZ.length} 题 · 猜猜${_esc(_partnerName())}会怎么选</div>
            <div class="qz-question">${_esc(item.q)}</div>
            <div class="qz-opts" id="qz-opts"></div>
            <div class="add-note">💡 选一个你觉得TA最可能选的答案，全部答完看默契分！</div>`;
        const opts = box.querySelector('#qz-opts');
        item.o.forEach((o, i) => {
            const b = document.createElement('button');
            b.className = 'qz-opt';
            b.textContent = o;
            b.onclick = function () {
                if (i === item.a) _quizScore++;
                _quizIdx++;
                _renderQuiz();
            };
            opts.appendChild(b);
        });
    }

    /* ---- 23 猜拳·掷骰子 ---- */
    window.openRpsDice = function () {
        _openAdd();
        const box = _topbar('猜拳·掷骰子', '一局定胜负');
        if (!box) return;
        const RPS = [
            { e: '✊', n: '石头' }, { e: '✌️', n: '剪刀' }, { e: '🖐️', n: '布' }
        ];
        function rpsResult(me, ta) {
            if (me === ta) return '平局';
            if ((me === 0 && ta === 1) || (me === 1 && ta === 2) || (me === 2 && ta === 0)) return '你赢了！';
            return 'TA 赢了！';
        }
        box.innerHTML = `
            <div class="add-h2">✊ 猜拳</div>
            <div class="rps-area">
                <div class="rps-vs">
                    <div class="rps-side"><div class="rps-emoji" id="rps-me">❓</div><div class="rps-name">${_esc(_myName())}</div></div>
                    <div class="rps-mid">VS</div>
                    <div class="rps-side"><div class="rps-emoji" id="rps-ta">❓</div><div class="rps-name">${_esc(_partnerName())}</div></div>
                </div>
                <div class="rps-btns" id="rps-btns"></div>
                <div class="rps-result" id="rps-result">出拳吧！</div>
            </div>
            <div class="add-h2">🎲 掷骰子</div>
            <div class="dice-area">
                <div class="dice-row">
                    <div class="dice-box" id="dice-me">🎲</div>
                    <div class="dice-box" id="dice-ta">🎲</div>
                </div>
                <div class="dice-btns">
                    <button class="add-btn primary" id="dice-roll">掷骰子</button>
                    <button class="add-btn" id="dice-again">重掷</button>
                </div>
                <div class="dice-result" id="dice-result">比大小，点数大赢～</div>
            </div>`;
        const rbtns = box.querySelector('#rps-btns');
        RPS.forEach((r, i) => {
            const b = document.createElement('button');
            b.className = 'rps-btn';
            b.textContent = r.e;
            b.onclick = function () {
                const ta = Math.floor(Math.random() * 3);
                box.querySelector('#rps-me').textContent = r.e;
                box.querySelector('#rps-ta').textContent = RPS[ta].e;
                const res = rpsResult(i, ta);
                box.querySelector('#rps-result').textContent = res + (res === '你赢了！' ? ' 🎉' : res === 'TA 赢了！' ? ' 😝' : ' 🤝');
                _sendSound('pop');
            };
            rbtns.appendChild(b);
        });
        box.querySelector('#dice-roll').onclick = function () {
            const a = 1 + Math.floor(Math.random() * 6);
            const b = 1 + Math.floor(Math.random() * 6);
            box.querySelector('#dice-me').textContent = '⚀⚁⚂⚃⚄⚅'[a - 1] || a;
            box.querySelector('#dice-ta').textContent = '⚀⚁⚂⚃⚄⚅'[b - 1] || b;
            box.querySelector('#dice-result').textContent = a === b ? '平局！再来一次～' : (a > b ? '你赢了！🎉' : 'TA 赢了！😝');
            _sendSound('pop');
        };
        box.querySelector('#dice-again').onclick = function () {
            box.querySelector('#dice-me').textContent = '🎲';
            box.querySelector('#dice-ta').textContent = '🎲';
            box.querySelector('#dice-result').textContent = '比大小，点数大赢～';
        };
    }

    /* ---- 24 你画我猜 ---- */
    const DRAW_WORDS = ['小猫', '爱心', '奶茶', '太阳', '冰淇淋', '小房子', '星星', '汉堡', '小熊', '彩虹'];
    let _drawCur = null;
    let _drawing = null;
    window.openDrawGuess = function () {
        _openAdd();
        const box = _topbar('你画我猜', '画个画给TA猜');
        if (!box) return;
        box.innerHTML = `
            <div class="add-h2">🎨 你画我猜</div>
            <div class="dg-canvas-wrap">
                <canvas id="dg-canvas" width="320" height="220"></canvas>
                <div class="dg-hint" id="dg-hint">画点啥好呢～</div>
            </div>
            <div class="dg-tools">
                <button class="add-btn" id="dg-clear">清空</button>
                <button class="add-btn primary" id="dg-save">保存这幅画</button>
            </div>
            <div class="add-h2">🖼️ 我的画作</div>
            <div class="dg-list" id="dg-list"></div>`;
        const cv = box.querySelector('#dg-canvas');
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.fillStyle = '#333';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✏️ 在这里画（选好答案后用鼠标/手指画）', cv.width / 2, cv.height / 2);
        let drawing = false;
        const pos = (e) => {
            const r = cv.getBoundingClientRect();
            return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
        };
        cv.onmousedown = (e) => { drawing = true; ctx.beginPath(); ctx.moveTo(pos(e).x, pos(e).y); };
        cv.onmousemove = (e) => { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.strokeStyle = '#e04b4b'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(); };
        cv.onmouseup = () => { drawing = false; };
        cv.ontouchstart = (e) => { e.preventDefault(); drawing = true; const t = e.touches[0]; const r = cv.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo((t.clientX - r.left) * (cv.width / r.width), (t.clientY - r.top) * (cv.height / r.height)); };
        cv.ontouchmove = (e) => { e.preventDefault(); if (!drawing) return; const t = e.touches[0]; const r = cv.getBoundingClientRect(); ctx.lineTo((t.clientX - r.left) * (cv.width / r.width), (t.clientY - r.top) * (cv.height / r.height)); ctx.strokeStyle = '#e04b4b'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(); };
        cv.ontouchend = () => { drawing = false; };
        // 选答案
        _drawing = null;
        box.querySelector('#dg-clear').onclick = function () {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, cv.width, cv.height);
        };
        const drawings = _load('drawings', []);
        const dgList = box.querySelector('#dg-list');
        function renderList() {
            if (!drawings.length) { dgList.innerHTML = '<div class="lt-empty">还没有画作，画一张给TA猜吧～</div>'; return; }
            dgList.innerHTML = drawings.slice().reverse().map((d, i) => `
                <div class="dg-item">
                    <img src="${d.data}" alt="">
                    <div class="dg-item-info">
                        <div class="dg-item-word">答案：${_esc(d.word)}</div>
                        <div class="dg-item-time">${_fmtDay(d.at)} ${_fmtTime(d.at)}</div>
                    </div>
                    <button class="dg-del" data-i="${drawings.length - 1 - i}">✕</button>
                </div>`).join('');
            dgList.querySelectorAll('.dg-del').forEach((btn) => {
                btn.onclick = function () {
                    const idx = parseInt(btn.getAttribute('data-i'), 10);
                    drawings.splice(idx, 1);
                    _save('drawings', drawings);
                    renderList();
                };
            });
        }
        renderList();
        box.querySelector('#dg-save').onclick = function () {
            const word = DRAW_WORDS[Math.floor(Math.random() * DRAW_WORDS.length)];
            const data = cv.toDataURL('image/png');
            drawings.push({ word, data, at: Date.now() });
            _save('drawings', drawings);
            _toast('画已保存，让TA来猜「' + word + '」吧！', 'success');
            renderList();
        };
    }

    /* ---- 25 真心话大冒险 ---- */
    const TRUTH = [
        '你第一次心动是什么时候？', '做过最傻的浪漫事是什么？', '最想和TA一起去哪？',
        '有没有偷偷想TA想到睡不着？', '你眼中的TA最迷人的瞬间？', '如果有一天要异地，你会怎么办？',
        '你最想对TA说却还没说的话？'
    ];
    const DARE = [
        '立刻给TA发一句情话', '原地转三圈然后说想TA', '模仿小动物跟TA撒娇',
        '连续发 10 个亲亲表情', '把手机壁纸换成TA的照片', '给TA唱一句最拿手的歌',
        '今晚要早睡，不许熬夜'
    ];
    window.openTruthDare = function () {
        _openAdd();
        const box = _topbar('真心话大冒险', '敢不敢来一把');
        if (!box) return;
        box.innerHTML = `
            <div class="td-card" id="td-card">
                <div class="td-emoji">🎴</div>
                <div class="td-text">点下面的按钮抽一张牌吧！</div>
                <div class="td-type">真心话 & 大冒险</div>
            </div>
            <div class="td-btns">
                <button class="add-btn primary" id="td-truth">真心话</button>
                <button class="add-btn" id="td-dare">大冒险</button>
            </div>
            <button class="add-btn" id="td-send" style="display:none">把这张牌发给TA</button>
            <div class="add-note">💡 抽到的牌可以发给${_esc(_partnerName())}，一起玩！</div>`;
        let cur = null;
        function draw(type) {
            const arr = type === 'truth' ? TRUTH : DARE;
            cur = { type, text: arr[Math.floor(Math.random() * arr.length)] };
            box.querySelector('#td-card').innerHTML = `
                <div class="td-emoji">${type === 'truth' ? '💬' : '😈'}</div>
                <div class="td-text">${_esc(cur.text)}</div>
                <div class="td-type">${type === 'truth' ? '真心话' : '大冒险'}</div>`;
            box.querySelector('#td-send').style.display = 'block';
            _sendSound('pop');
        }
        box.querySelector('#td-truth').onclick = function () { draw('truth'); };
        box.querySelector('#td-dare').onclick = function () { draw('dare'); };
        box.querySelector('#td-send').onclick = function () {
            if (!cur) return;
            _closeAllPages();
            setTimeout(function () {
                _sendMsg((cur.type === 'truth' ? '💬 真心话：' : '😈 大冒险：') + cur.text, 'user', 'sent');
                _sendSound('send');
                _partnerReplySoon(cur.type === 'truth' ? '那我认真回答你～' : '哼，我才不怕！来就来！', 1200);
            }, 150);
        };
    }

    /* ---- 26 谁先道歉 ---- */
    window.openWhoApology = function () {
        _openAdd();
        const box = _topbar('谁先道歉', '吵架和好神器');
        if (!box) return;
        box.innerHTML = `
            <div class="wa-hero">🫂</div>
            <div class="wa-title">吵架了？谁先服个软～</div>
            <div class="wa-sub">先按下"我错了"的人，能收获一个抱抱哦</div>
            <div class="wa-btns">
                <button class="wa-btn me" id="wa-me">😣 我错了</button>
                <button class="wa-btn ta" id="wa-ta">🥺 你也抱一下</button>
            </div>
            <div class="wa-result" id="wa-result"></div>`;
        box.querySelector('#wa-me').onclick = function () {
            box.querySelector('#wa-result').innerHTML = '<div class="wa-ok">❤️ 先服软的人最勇敢，我们和好啦！</div>';
            _closeAllPages();
            setTimeout(function () {
                _sendMsg('我错啦，别生气了好不好～抱抱', 'user', 'sent');
                _sendSound('send');
                _partnerReplySoon('好啦好啦，我也有不对，抱一个～🫂', 1200);
            }, 300);
        };
        box.querySelector('#wa-ta').onclick = function () {
            box.querySelector('#wa-result').innerHTML = '<div class="wa-ok">🥰 两个人都愿意低头，这是最好的爱情～</div>';
            _closeAllPages();
            setTimeout(function () {
                _sendMsg('我们一起服个软，谁都不许再生气啦～', 'user', 'sent');
                _sendSound('send');
                _partnerReplySoon('嗯！拉钩，和好啦 ❤️', 1200);
            }, 300);
        };
    }

    /* ---- 27 传情骰子 ---- */
    const LOVE_DICE = [
        { e: '💋', t: '亲亲一个' }, { e: '🤗', t: '抱抱十分钟' }, { e: '💬', t: '说三句情话' },
        { e: '🧋', t: '给对方买杯奶茶' }, { e: '🎤', t: '唱一首歌给TA听' }, { e: '🌙', t: '今晚早睡陪TA' }
    ];
    window.openLoveDice = function () {
        _openAdd();
        const box = _topbar('传情骰子', '摇出今天的甜蜜');
        if (!box) return;
        box.innerHTML = `
            <div class="ld-dice" id="ld-dice">🎲</div>
            <button class="add-btn primary" id="ld-roll">摇一摇</button>
            <div class="ld-result" id="ld-result">摇一下，看看今天做什么～</div>
            <button class="add-btn" id="ld-send" style="display:none">发给TA一起做</button>`;
        let cur = null;
        box.querySelector('#ld-roll').onclick = function () {
            cur = LOVE_DICE[Math.floor(Math.random() * LOVE_DICE.length)];
            box.querySelector('#ld-dice').textContent = cur.e;
            box.querySelector('#ld-result').textContent = '今天的甜蜜指令：' + cur.t;
            box.querySelector('#ld-send').style.display = 'block';
            _sendSound('pop');
        };
        box.querySelector('#ld-send').onclick = function () {
            if (!cur) return;
            _closeAllPages();
            setTimeout(function () {
                _sendMsg('🎲 传情骰子摇到了：' + cur.e + ' ' + cur.t + '！', 'user', 'sent');
                _sendSound('send');
                _partnerReplySoon('好呀好呀，一起完成！', 1100);
            }, 150);
        };
    }

    /* ---- 28 斗图模式 ---- */
    const STICKERS = ['😝', '🤣', '🥰', '😡', '🐶', '🐱', '🍑', '💢', '🫣', '😎', '🤡', '💗', '👀', '🙄'];
    let _sbCooldown = 0;
    window.openStickerBattle = function () {
        _openAdd();
        const box = _topbar('斗图模式', '表情包大作战');
        if (!box) return;
        box.innerHTML = `
            <div class="sb-score">
                <span>你：<b id="sb-me">0</b></span>
                <span class="sb-vs">VS</span>
                <span><b id="sb-ta">0</b> ：${_esc(_partnerName())}</span>
            </div>
            <div class="sb-arena" id="sb-arena"><div class="sb-hint">疯狂戳表情轰炸TA吧！</div></div>
            <div class="sb-pad" id="sb-pad"></div>`;
        const pad = box.querySelector('#sb-pad');
        STICKERS.forEach((s) => {
            const b = document.createElement('button');
            b.className = 'sb-emoji';
            b.textContent = s;
            b.onclick = function () {
                const now = Date.now();
                if (now - _sbCooldown < 180) { _toast('别太猛，喘口气～', 'info'); return; }
                _sbCooldown = now;
                _closeAllPages();
                setTimeout(function () {
                    _sendMsg(s, 'user', 'sent');
                    _sendSound('send');
                    const meScore = parseInt(box.querySelector ? document.getElementById('sb-me') ? document.getElementById('sb-me').textContent : '0' : '0', 10) || 0;
                    // 对方回击
                    setTimeout(function () {
                        _sendMsg(STICKERS[Math.floor(Math.random() * STICKERS.length)], _partnerName(), 'received');
                        _sendSound('message');
                    }, 700 + Math.random() * 700);
                }, 100);
                _toast('已发起斗图攻势！', 'success');
            };
            pad.appendChild(b);
        });
    };

    /* ---- 29 悄悄话·阅后即焚 ---- */
    window.openSecretNote = function () {
        _openAdd();
        const box = _topbar('悄悄话', '看完就会消失的小秘密');
        if (!box) return;
        box.innerHTML = `
            <div class="add-h2">✍️ 写一句悄悄话</div>
            <textarea class="add-textarea" id="sn-text" placeholder="写点只有我们的小秘密…"></textarea>
            <div class="add-h2">⏳ 多久后消失</div>
            <div class="sn-times" id="sn-times"></div>
            <button class="add-btn primary" id="sn-send">💌 发送悄悄话</button>
            <div class="add-note">💡 悄悄话发到聊天后，过了设定时间就会自动"焚毁"，只能看一次哦。</div>`;
        let dur = 15;
        const times = [{ n: 15, l: '15秒' }, { n: 60, l: '1分钟' }, { n: 300, l: '5分钟' }, { n: 3600, l: '1小时' }];
        const tb = box.querySelector('#sn-times');
        times.forEach((t) => {
            const b = document.createElement('button');
            b.className = 'sn-time' + (t.n === dur ? ' active' : '');
            b.textContent = t.l;
            b.onclick = function () {
                dur = t.n;
                tb.querySelectorAll('.sn-time').forEach((x) => x.classList.remove('active'));
                b.classList.add('active');
            };
            tb.appendChild(b);
        });
        box.querySelector('#sn-send').onclick = function () {
            const text = box.querySelector('#sn-text').value.trim();
            if (!text) { _toast('先写一句悄悄话吧', 'warning'); return; }
            _closeAllPages();
            setTimeout(function () {
                if (typeof addMessage === 'function') {
                    try {
                        addMessage({
                            id: Date.now(),
                            sender: 'user',
                            text: '🔒 悄悄话：' + text + '\n（' + (dur >= 60 ? (dur / 60) + '分钟后' : dur + '秒后') + '自动焚毁）',
                            timestamp: new Date(),
                            status: 'sent',
                            favorited: false,
                            note: null,
                            replyTo: null,
                            type: 'normal'
                        });
                        _sendSound('send');
                    } catch (e) {}
                }
                _partnerReplySoon('收到你的悄悄话啦～🤫 我会好好珍惜！', 1300);
            }, 150);
            _toast('悄悄话已发送 🔒', 'success');
        };
    };

    /* ---- 30 专属暗号 ---- */
    window.openSecretCode = function () {
        _openAdd();
        const box = _topbar('专属暗号', '只有我们懂的密语');
        if (!box) return;
        const code = _load('secretCode', '');
        box.innerHTML = `
            <div class="sc-hero">🤫</div>
            <div class="add-h2">设置我们的暗号</div>
            <input class="add-input" id="sc-input" type="text" placeholder="例如：小熊软糖" value="${_esc(code)}">
            <button class="add-btn primary" id="sc-save">保存暗号</button>
            <div class="add-h2">📮 暗号效果</div>
            <div class="sc-effect" id="sc-effect"></div>
            <div class="add-note">💡 保存后，点下方按钮把暗号"说"出去，TA会收到一份神秘惊喜！</div>`;
        const effect = box.querySelector('#sc-effect');
        function renderEffect() {
            if (!code) { effect.innerHTML = '<div class="lt-empty">先设置一个暗号吧～</div>'; return; }
            effect.innerHTML = `<div class="sc-code-chip">🔑 当前暗号：${_esc(code)}</div>
                <button class="add-btn" id="sc-say">把暗号说给TA听</button>`;
            effect.querySelector('#sc-say').onclick = function () {
                _closeAllPages();
                setTimeout(function () {
                    _sendMsg('🤫 ' + code, 'user', 'sent');
                    _sendSound('send');
                    _partnerReplySoon('哇！是我们的小暗号！我懂啦～🎉', 1200);
                }, 150);
            };
        }
        renderEffect();
        box.querySelector('#sc-save').onclick = function () {
            const v = box.querySelector('#sc-input').value.trim();
            if (!v) { _toast('暗号不能为空', 'warning'); return; }
            _save('secretCode', v);
            _toast('暗号已保存 🔑', 'success');
            window.openSecretCode();
        };
    };

    /* ============================================================
       34) 语音留言墙 —— 留言贴纸墙
       ============================================================ */
    window.openVoiceWall = function () {
        _openAdd();
        const box = _topbar('语音留言墙', '把想说的话贴在这里');
        if (!box) return;
        const notes = _load('wallNotes', []);
        box.innerHTML = `
            <div class="add-h2">✍️ 贴一张留言</div>
            <div class="vw-write">
                <textarea class="add-textarea" id="vw-text" placeholder="写点想对TA说的话…（可以是一句话/一个心愿/一句晚安）"></textarea>
                <button class="add-btn primary" id="vw-add">贴上留言墙</button>
            </div>
            <div class="add-h2">📌 留言墙（${notes.length} 条）</div>
            <div class="vw-wall" id="vw-wall"></div>`;
        box.querySelector('#vw-add').onclick = function () {
            const t = box.querySelector('#vw-text').value.trim();
            if (!t) { _toast('先写点什么吧', 'warning'); return; }
            notes.push({ text: t, by: _myName(), at: Date.now() });
            _save('wallNotes', notes);
            box.querySelector('#vw-text').value = '';
            _toast('已贴上留言墙 📌', 'success');
            window.openVoiceWall();
        };
        const wall = box.querySelector('#vw-wall');
        if (!notes.length) {
            wall.innerHTML = '<div class="lt-empty">墙上还空着，贴第一张留言吧～</div>';
        } else {
            wall.innerHTML = notes.slice().reverse().map((n, i) => `
                <div class="vw-note" style="--rot:${((i * 37) % 5) - 2}deg">
                    <div class="vw-note-text">${_esc(n.text)}</div>
                    <div class="vw-note-meta">${_esc(n.by)} · ${_fmtDay(n.at)} ${_fmtTime(n.at)}</div>
                    <button class="vw-del" data-i="${notes.length - 1 - i}">✕</button>
                </div>`).join('');
            wall.querySelectorAll('.vw-del').forEach((btn) => {
                btn.onclick = function () {
                    const idx = parseInt(btn.getAttribute('data-i'), 10);
                    notes.splice(idx, 1);
                    _save('wallNotes', notes);
                    window.openVoiceWall();
                };
            });
        }
    };

    /* ============================================================
       35) 心情天气 —— 每天的心情天气
       ============================================================ */
    const MOODS = [
        { k: 'sun', e: '☀️', n: '超开心' },
        { k: 'cloud', e: '⛅', n: '还不错' },
        { k: 'rain', e: '🌧️', n: '有点难过' },
        { k: 'storm', e: '⛈️', n: '生气' },
        { k: 'heart', e: '💗', n: '超想你' }
    ];
    function _todayKey() {
        const d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }
    window.openMoodWeather = function () {
        _openAdd();
        const box = _topbar('心情天气', '今天的心情是什么天气');
        if (!box) return;
        const data = _load('moodWeather', {});
        const today = _todayKey();
        const cur = data[today];
        box.innerHTML = `
            <div class="mw-today">
                <div class="mw-now" id="mw-now">${cur ? MOODS.find((m) => m.k === cur.m)?.e || '🌤️' : '🌤️'}</div>
                <div class="mw-today-txt">${cur ? '今天：' + (MOODS.find((m) => m.k === cur.m)?.n || '') : '还没打卡今天的心情'}</div>
            </div>
            <div class="add-h2">选择今天的心情</div>
            <div class="mw-moods" id="mw-moods"></div>
            <div class="add-h2">最近 7 天</div>
            <div class="mw-week" id="mw-week"></div>`;
        const moodsBox = box.querySelector('#mw-moods');
        MOODS.forEach((m) => {
            const b = document.createElement('button');
            b.className = 'mw-mood' + (cur && cur.m === m.k ? ' active' : '');
            b.innerHTML = `<span class="mw-mood-e">${m.e}</span><span class="mw-mood-n">${m.n}</span>`;
            b.onclick = function () {
                data[today] = { m: m.k, at: Date.now() };
                _save('moodWeather', data);
                _toast('已记录今天的心情：' + m.n, 'success');
                window.openMoodWeather();
            };
            moodsBox.appendChild(b);
        });
        const week = box.querySelector('#mw-week');
        const d = new Date();
        let html = '';
        for (let i = 6; i >= 0; i--) {
            const dd = new Date(d.getTime() - i * 86400000);
            const key = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' + dd.getDate();
            const rec = data[key];
            const mood = rec ? MOODS.find((m) => m.k === rec.m) : null;
            const wd = ['日', '一', '二', '三', '四', '五', '六'][dd.getDay()];
            html += `<div class="mw-day ${key === today ? 'today' : ''}">
                <span class="mw-day-e">${mood ? mood.e : '·'}</span>
                <span class="mw-day-w">${wd}</span>
            </div>`;
        }
        week.innerHTML = html;
    };

    /* ============================================================
       36) 聊天金句卡 —— 把甜话做成卡片
       ============================================================ */
    window.openQuoteCard = function () {
        _openAdd();
        const box = _topbar('聊天金句卡', '把甜话说成一张卡');
        if (!box) return;
        function pick() {
            let pool = [];
            try {
                if (typeof messages !== 'undefined' && Array.isArray(messages)) {
                    pool = messages.filter((m) => m && m.text && m.sender && m.sender !== 'system' && m.text.length < 40);
                }
            } catch (e) {}
            return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
        }
        function render() {
            const m = pick();
            const from = m ? (m.sender === 'user' ? _myName() : m.sender) : '你 & ' + _partnerName();
            const txt = m ? m.text : '想把每一天的想你，都讲给你听。';
            box.innerHTML = `
                <div class="qc-card" id="qc-card">
                    <div class="qc-top">♥ 传讯 · 甜话卡 ♥</div>
                    <div class="qc-text">${_esc(txt)}</div>
                    <div class="qc-meta">—— ${_esc(from)} · ${m ? _fmtDay(m.timestamp) : _fmtDay(Date.now())}</div>
                    <div class="qc-stars">✦ ✦ ✦</div>
                </div>
                <div class="qc-btns">
                    <button class="add-btn primary" id="qc-again">换一张</button>
                    <button class="add-btn" id="qc-copy">复制文案</button>
                    <button class="add-btn" id="qc-send">发给TA</button>
                </div>`;
            box.querySelector('#qc-again').onclick = render;
            box.querySelector('#qc-copy').onclick = function () {
                const s = txt + ' —— ' + from;
                try { navigator.clipboard.writeText(s); _toast('文案已复制 ✨', 'success'); }
                catch (e) { _toast('复制失败，请长按手动复制', 'warning'); }
            };
            box.querySelector('#qc-send').onclick = function () {
                _closeAllPages();
                setTimeout(function () {
                    _sendMsg('💌 ' + txt, 'user', 'sent');
                    _sendSound('send');
                    _partnerReplySoon('收到你的甜话卡啦，超甜！💘', 1100);
                }, 150);
            };
        }
        render();
    };

    /* ============================================================
       38) 影音小屋 —— 一起看过的片、听过的歌
       ============================================================ */
    window.openMediaHouse = function () {
        _openAdd();
        const box = _topbar('影音小屋', '一起看过的·听过的');
        if (!box) return;
        const list = _load('media', []);
        box.innerHTML = `
            <div class="mh-stats">一起看过 <b>${list.filter((m) => m.type === 'movie').length}</b> 部片 · 一起听过 <b>${list.filter((m) => m.type === 'song').length}</b> 首歌</div>
            <div class="add-h2">➕ 添加一条</div>
            <div class="mh-form">
                <input class="add-input" id="mh-name" placeholder="片名 / 歌名">
                <div class="mh-types" id="mh-types"></div>
                <button class="add-btn primary" id="mh-add">记录进小屋</button>
            </div>
            <div class="add-h2">📼 收藏夹（${list.length}）</div>
            <div class="mh-list" id="mh-list"></div>`;
        let type = 'movie';
        const tb = box.querySelector('#mh-types');
        [{ k: 'movie', l: '🎬 电影' }, { k: 'song', l: '🎵 音乐' }].forEach((t) => {
            const b = document.createElement('button');
            b.className = 'mh-type' + (t.k === type ? ' active' : '');
            b.textContent = t.l;
            b.onclick = function () { type = t.k; tb.querySelectorAll('.mh-type').forEach((x) => x.classList.remove('active')); b.classList.add('active'); };
            tb.appendChild(b);
        });
        box.querySelector('#mh-add').onclick = function () {
            const n = box.querySelector('#mh-name').value.trim();
            if (!n) { _toast('写个片名/歌名吧', 'warning'); return; }
            list.push({ name: n, type, at: Date.now() });
            _save('media', list);
            _toast('已记录进影音小屋 🎬', 'success');
            window.openMediaHouse();
        };
        const l = box.querySelector('#mh-list');
        if (!list.length) {
            l.innerHTML = '<div class="lt-empty">小屋还空空的，快去一起看一部片、听一首歌吧～</div>';
        } else {
            l.innerHTML = list.slice().reverse().map((m, i) => `
                <div class="mh-item"><span>${m.type === 'movie' ? '🎬' : '🎵'}</span><span class="mh-name">${_esc(m.name)}</span><span class="mh-time">${_fmtDay(m.at)}</span><button class="mh-del" data-i="${list.length - 1 - i}">✕</button></div>`).join('');
            l.querySelectorAll('.mh-del').forEach((btn) => {
                btn.onclick = function () {
                    const idx = parseInt(btn.getAttribute('data-i'), 10);
                    list.splice(idx, 1);
                    _save('media', list);
                    window.openMediaHouse();
                };
            });
        }
    };

    /* ============================================================
       39) 旅行足迹 —— 一起去过的地方
       ============================================================ */
    window.openTravelMap = function () {
        _openAdd();
        const box = _topbar('旅行足迹', '一起去看世界');
        if (!box) return;
        const places = _load('travel', []);
        box.innerHTML = `
            <div class="tm-hero">🧳 一起去过 <b>${places.length}</b> 个地方</div>
            <div class="add-h2">➕ 记录一个地方</div>
            <div class="tm-form">
                <input class="add-input" id="tm-name" placeholder="地名，如：杭州西湖">
                <input class="add-input" id="tm-emoji" placeholder="图标，如：🌊" maxlength="2">
                <button class="add-btn primary" id="tm-add">记录足迹</button>
            </div>
            <div class="add-h2">🗺️ 足迹地图</div>
            <div class="tm-map" id="tm-map"></div>
            <div class="tm-list" id="tm-list"></div>`;
        box.querySelector('#tm-add').onclick = function () {
            const n = box.querySelector('#tm-name').value.trim();
            if (!n) { _toast('写个地名吧', 'warning'); return; }
            const e = box.querySelector('#tm-emoji').value.trim() || '📍';
            places.push({ name: n, e, at: Date.now() });
            _save('travel', places);
            _toast('已记下「' + n + '」🏕️', 'success');
            window.openTravelMap();
        };
        const map = box.querySelector('#tm-map');
        if (!places.length) {
            map.innerHTML = '<div class="lt-empty">还没有足迹，约TA去旅行吧～</div>';
        } else {
            map.innerHTML = places.slice(-8).map((p, i) => `<span class="tm-pin" style="left:${12 + ((i * 53) % 76)}%;top:${18 + ((i * 37) % 62)}%">${p.e}</span>`).join('');
        }
        const l = box.querySelector('#tm-list');
        l.innerHTML = places.slice().reverse().map((p, i) => `
            <div class="tm-item"><span>${p.e}</span><span class="tm-name">${_esc(p.name)}</span><span class="tm-time">${_fmtDay(p.at)}</span><button class="tm-del" data-i="${places.length - 1 - i}">✕</button></div>`).join('');
        l.querySelectorAll('.tm-del').forEach((btn) => {
            btn.onclick = function () {
                const idx = parseInt(btn.getAttribute('data-i'), 10);
                places.splice(idx, 1);
                _save('travel', places);
                window.openTravelMap();
            };
        });
    };

    /* ============================================================
       41) 回家报平安
       ============================================================ */
    window.openSafeHome = function () {
        _openAdd();
        const box = _topbar('回家报平安', '别让TA担心');
        if (!box) return;
        const records = _load('safeHome', []);
        box.innerHTML = `
            <div class="sh-hero">
                <div class="sh-icon">🏠</div>
                <div class="sh-txt">给${_esc(_partnerName())}报个平安</div>
                <button class="add-btn primary sh-btn" id="sh-arrive">我到家啦 🏠</button>
                <button class="add-btn sh-btn" id="sh-leave">我出门啦 🚶</button>
            </div>
            <div class="add-h2">最近报平安（${records.length} 次）</div>
            <div class="sh-list" id="sh-list"></div>`;
        function doReport(kind) {
            const type = kind === 'arrive' ? '到家' : '出门';
            records.push({ kind, at: Date.now() });
            _save('safeHome', records);
            _closeAllPages();
            setTimeout(function () {
                _sendMsg(kind === 'arrive' ? '🏠 我到家啦，别担心～' : '🚶 我出门啦，一会见！', 'user', 'sent');
                _sendSound('send');
                _partnerReplySoon(kind === 'arrive' ? '到家就好，路上辛苦啦～' : '路上小心，等你回来！', 1100);
            }, 150);
            _toast('已通知' + _partnerName() + '：' + type, 'success');
        }
        box.querySelector('#sh-arrive').onclick = function () { doReport('arrive'); };
        box.querySelector('#sh-leave').onclick = function () { doReport('leave'); };
        const l = box.querySelector('#sh-list');
        l.innerHTML = records.slice().reverse().map((r) => `
            <div class="sh-item"><span>${r.kind === 'arrive' ? '🏠 到家' : '🚶 出门'}</span><span class="sh-time">${_fmtDay(r.at)} ${_fmtTime(r.at)}</span></div>`).join('') || '<div class="lt-empty">还没有记录哦～</div>';
    };

    /* ============================================================
       42) 共享待办
       ============================================================ */
    window.openTodoList = function () {
        _openAdd();
        const box = _topbar('共享待办', '一起把事做完');
        if (!box) return;
        const todos = _load('todos', []);
        box.innerHTML = `
            <div class="add-h2">➕ 加一条待办</div>
            <div class="tdl-form">
                <input class="add-input" id="tdl-text" placeholder="要一起做的事…">
                <div class="tdl-who" id="tdl-who"></div>
                <button class="add-btn primary" id="tdl-add">添加</button>
            </div>
            <div class="add-h2">📋 待办清单（${todos.length}）</div>
            <div class="tdl-list" id="tdl-list"></div>`;
        let who = 'me';
        const wb = box.querySelector('#tdl-who');
        [{ k: 'me', l: _myName() }, { k: 'ta', l: _partnerName() }, { k: 'both', l: '一起' }].forEach((w) => {
            const b = document.createElement('button');
            b.className = 'tdl-who-btn' + (w.k === who ? ' active' : '');
            b.textContent = w.l;
            b.onclick = function () { who = w.k; wb.querySelectorAll('.tdl-who-btn').forEach((x) => x.classList.remove('active')); b.classList.add('active'); };
            wb.appendChild(b);
        });
        box.querySelector('#tdl-add').onclick = function () {
            const t = box.querySelector('#tdl-text').value.trim();
            if (!t) { _toast('写点要一起做的事吧', 'warning'); return; }
            todos.push({ text: t, who, done: false, at: Date.now() });
            _save('todos', todos);
            box.querySelector('#tdl-text').value = '';
            _toast('已加入待办 📋', 'success');
            window.openTodoList();
        };
        const l = box.querySelector('#tdl-list');
        function renderList() {
            if (!todos.length) { l.innerHTML = '<div class="lt-empty">清单空空的，一起列个计划吧～</div>'; return; }
            l.innerHTML = todos.slice().reverse().map((t, i) => `
                <div class="tdl-item ${t.done ? 'done' : ''}">
                    <button class="tdl-check" data-i="${todos.length - 1 - i}">${t.done ? '✅' : '⬜'}</button>
                    <span class="tdl-text">${_esc(t.text)}</span>
                    <span class="tdl-who-tag">${t.who === 'me' ? '我' : t.who === 'ta' ? _partnerName() : '一起'}</span>
                    <button class="tdl-del" data-i="${todos.length - 1 - i}">✕</button>
                </div>`).join('');
            l.querySelectorAll('.tdl-check').forEach((b2) => {
                b2.onclick = function () {
                    const idx = parseInt(b2.getAttribute('data-i'), 10);
                    todos[idx].done = !todos[idx].done;
                    _save('todos', todos);
                    renderList();
                };
            });
            l.querySelectorAll('.tdl-del').forEach((b2) => {
                b2.onclick = function () {
                    const idx = parseInt(b2.getAttribute('data-i'), 10);
                    todos.splice(idx, 1);
                    _save('todos', todos);
                    renderList();
                };
            });
        }
        renderList();
    };

    /* ============================================================
       43) 生理期提醒（贴心小助手）
       ============================================================ */
    window.openPeriodCare = function () {
        _openAdd();
        const box = _topbar('生理期提醒', '贴心小助手');
        if (!box) return;
        const cfg = _load('periodCare', { last: '', cycle: 28 });
        function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
        function nextDate() {
            if (!cfg.last) return null;
            const last = new Date(cfg.last);
            while (daysBetween(cfg.last, new Date()) >= cfg.cycle) {
                last.setDate(last.getDate() + cfg.cycle);
                cfg._cached = last.getTime();
            }
            // 计算下一个经期开始日
            const base = new Date(cfg.last);
            let nxt = new Date(base);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            while (nxt < today) { nxt = new Date(nxt.getTime() + cfg.cycle * 86400000); }
            return nxt;
        }
        box.innerHTML = `
            <div class="pc-hero">
                <div class="pc-icon">🌸</div>
                <div class="pc-txt" id="pc-txt"></div>
            </div>
            <div class="add-h2">记录上次生理期</div>
            <input class="add-input" id="pc-last" type="date" value="${cfg.last}">
            <div class="add-h2">周期天数</div>
            <div class="pc-cycle" id="pc-cycle"></div>
            <button class="add-btn primary" id="pc-save">保存</button>
            <button class="add-btn" id="pc-sendcare">给TA送句关心 💌</button>`;
        let cycle = cfg.cycle || 28;
        const cb = box.querySelector('#pc-cycle');
        [26, 28, 30, 32].forEach((c) => {
            const b = document.createElement('button');
            b.className = 'pc-cycle-btn' + (c === cycle ? ' active' : '');
            b.textContent = c + ' 天';
            b.onclick = function () { cycle = c; cb.querySelectorAll('.pc-cycle-btn').forEach((x) => x.classList.remove('active')); b.classList.add('active'); };
            cb.appendChild(b);
        });
        box.querySelector('#pc-save').onclick = function () {
            const v = box.querySelector('#pc-last').value;
            if (!v) { _toast('请选择日期', 'warning'); return; }
            _save('periodCare', { last: v, cycle });
            _toast('已保存，会贴心地提醒你 🌸', 'success');
            window.openPeriodCare();
        };
        const nxt = nextDate();
        const txt = box.querySelector('#pc-txt');
        if (!cfg.last) {
            txt.innerHTML = '记录一下日期，我会贴心提醒你和TA～';
        } else {
            const days = nxt ? daysBetween(new Date(), nxt) : 0;
            txt.innerHTML = (days <= 0 ? '🌸 生理期可能就在这两天，注意保暖多喝热水～' : '预计下次在 <b>' + _fmtDay(nxt) + '</b>，还有 <b>' + days + '</b> 天，提前准备好小关怀哦～');
        }
        box.querySelector('#pc-sendcare').onclick = function () {
            _closeAllPages();
            setTimeout(function () {
                _sendMsg('🌸 多喝热水，注意保暖，今天也要好好照顾自己哦', 'user', 'sent');
                _sendSound('send');
                _partnerReplySoon('有你这句话，心里暖暖的～❤️', 1100);
            }, 150);
        };
    };

    /* ============================================================
       44) 吃药 / 喝水提醒
       ============================================================ */
    let _remTimer = null;
    window.openCareReminder = function () {
        _openAdd();
        const box = _topbar('喝水·吃药提醒', '按时照顾自己');
        if (!box) return;
        const cfg = _load('careReminder', { water: '10:00', med: '', enabled: true });
        box.innerHTML = `
            <div class="cm-hero">💧💊</div>
            <div class="add-h2">喝水提醒</div>
            <input class="add-input" id="cm-water" type="time" value="${cfg.water}">
            <div class="add-h2">吃药提醒（可留空）</div>
            <input class="add-input" id="cm-med" type="time" value="${cfg.med}">
            <div class="cm-switch">
                <label class="cm-switch-label">开启提醒</label>
                <button class="cm-toggle ${cfg.enabled ? 'on' : ''}" id="cm-toggle">${cfg.enabled ? 'ON' : 'OFF'}</button>
            </div>
            <button class="add-btn primary" id="cm-save">保存提醒</button>
            <div class="cm-next" id="cm-next"></div>
            <div class="add-note">💡 到点后应用会弹出一条温柔的提醒（应用打开期间生效）。</div>`;
        box.querySelector('#cm-save').onclick = function () {
            const w = box.querySelector('#cm-water').value;
            const m = box.querySelector('#cm-med').value;
            const en = !!_load('careReminder', { water: '10:00', med: '', enabled: true }).enabled;
            _save('careReminder', { water: w || '10:00', med: m || '', enabled: en });
            _toast('提醒已保存 ⏰', 'success');
            _startReminder();
            window.openCareReminder();
        };
        box.querySelector('#cm-toggle').onclick = function () {
            const c = _load('careReminder', { water: '10:00', med: '', enabled: true });
            c.enabled = !c.enabled;
            _save('careReminder', c);
            box.querySelector('#cm-toggle').classList.toggle('on', c.enabled);
            box.querySelector('#cm-toggle').textContent = c.enabled ? 'ON' : 'OFF';
            _toast(c.enabled ? '提醒已开启' : '提醒已关闭', 'success');
            _startReminder();
        };
        const next = box.querySelector('#cm-next');
        next.innerHTML = _nextReminderTxt();
    };
    function _nextReminderTxt() {
        const c = _load('careReminder', { water: '10:00', med: '', enabled: true });
        if (!c.enabled) return '<div class="lt-empty">提醒已关闭</div>';
        const now = new Date();
        const hm = (s) => { const p = s.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); };
        const curMin = now.getHours() * 60 + now.getMinutes();
        const items = [];
        if (c.water) items.push({ l: '💧 喝水', t: hm(c.water) });
        if (c.med) items.push({ l: '💊 吃药', t: hm(c.med) });
        if (!items.length) return '<div class="lt-empty">还没设置提醒时间</div>';
        const next = items.map((it) => ({ ...it, d: (it.t - curMin + 1440) % 1440 })).sort((a, b) => a.d - b.d)[0];
        const m = next.d % 60;
        const h = Math.floor(next.d / 60);
        return '<div class="cm-next-txt">⏰ 下一次：' + next.l + '，还有 ' + (h > 0 ? h + ' 小时 ' : '') + m + ' 分钟</div>';
    }
    function _startReminder() {
        if (_remTimer) clearInterval(_remTimer);
        let lastFired = '';
        _remTimer = setInterval(function () {
            const c = _load('careReminder', { water: '10:00', med: '', enabled: true });
            if (!c.enabled) return;
            const now = new Date();
            const hh = _pad(now.getHours()) + ':' + _pad(now.getMinutes());
            if (c.water === hh && lastFired !== 'water' + hh) {
                lastFired = 'water' + hh;
                _toast('💧 该喝水啦，亲爱的～', 'success');
                if (typeof addMessage === 'function' && Math.random() < 0.5) {
                    try { addMessage({ id: Date.now(), sender: _partnerName(), text: '💧 提醒你喝水啦，我记着呢～', timestamp: new Date(), status: 'received', favorited: false, note: null, replyTo: null, type: 'normal' }); } catch (e) {}
                }
            }
            if (c.med && c.med === hh && lastFired !== 'med' + hh) {
                lastFired = 'med' + hh;
                _toast('💊 该吃药啦，别忘了～', 'success');
                if (typeof addMessage === 'function' && Math.random() < 0.5) {
                    try { addMessage({ id: Date.now() + 1, sender: _partnerName(), text: '💊 到点吃药啦，我在盯着你哦～', timestamp: new Date(), status: 'received', favorited: false, note: null, replyTo: null, type: 'normal' }); } catch (e) {}
                }
            }
        }, 20000);
    }

    /* ============================================================
       45) 一键呼叫
       ============================================================ */
    window.openCallNow = function () {
        _openAdd();
        const box = _topbar('一键呼叫', '马上找到TA');
        if (!box) return;
        box.innerHTML = `
            <div class="call-hero">
                <div class="call-ring"></div>
                <div class="call-avatar">📱</div>
                <div class="call-name">${_esc(_partnerName())}</div>
                <div class="call-status" id="call-status">正在呼叫…</div>
            </div>
            <div class="call-btns">
                <button class="add-btn danger" id="call-hangup">挂断</button>
            </div>`;
        let answered = false;
        box.querySelector('#call-hangup').onclick = function () {
            _toast('已挂断呼叫 📵', 'info');
            window.closeAdd();
        };
        setTimeout(function () {
            if (answered) return;
            answered = true;
            const st = box.querySelector('#call-status');
            if (st) st.textContent = '已接通 · 好想听你的声音 ❤️';
            _closeAllPages();
            setTimeout(function () {
                _sendMsg('📞 呼叫你啦，想你了～', 'user', 'sent');
                _sendSound('send');
                _partnerReplySoon('在呢在呢！听到你的声音就好开心～', 1000);
            }, 300);
        }, 2800);
    };

    /* ============================================================
       46) 异地时差
       ============================================================ */
    const CITIES = [
        { n: '北京', tz: 8 }, { n: '上海', tz: 8 }, { n: '深圳', tz: 8 }, { n: '香港', tz: 8 },
        { n: '东京', tz: 9 }, { n: '首尔', tz: 9 }, { n: '新加坡', tz: 8 }, { n: '伦敦', tz: 0 },
        { n: '巴黎', tz: 1 }, { n: '纽约', tz: -5 }, { n: '洛杉矶', tz: -8 }, { n: '悉尼', tz: 11 }
    ];
    const WEATHER = ['☀️', '⛅', '🌤️', '🌧️', '🌈', '🌙'];
    window.openTimeDiff = function () {
        _openAdd();
        const box = _topbar('异地时差', '无论多远都在想你');
        if (!box) return;
        const cfg = _load('timeDiff', { city: '上海' });
        box.innerHTML = `
            <div class="td-hero" id="td-hero"></div>
            <div class="add-h2">TA 所在城市</div>
            <div class="td-cities" id="td-cities"></div>
            <div class="add-note">💡 设定${_esc(_partnerName())}所在城市，随时知道TA那边几点。</div>`;
        const citiesBox = box.querySelector('#td-cities');
        CITIES.forEach((c) => {
            const b = document.createElement('button');
            b.className = 'td-city' + (c.n === cfg.city ? ' active' : '');
            b.textContent = c.n;
            b.onclick = function () {
                _save('timeDiff', { city: c.n });
                _toast('已设定TA在' + c.n, 'success');
                window.openTimeDiff();
            };
            citiesBox.appendChild(b);
        });
        const city = CITIES.find((c) => c.n === cfg.city) || CITIES[0];
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const local = new Date(utc + city.tz * 3600000);
        const diff = city.tz - (-(now.getTimezoneOffset() / 60));
        box.querySelector('#td-hero').innerHTML = `
            <div class="td-city-name">${_esc(city.n)} · 当地时间</div>
            <div class="td-time">${_pad(local.getHours())} : ${_pad(local.getMinutes())}</div>
            <div class="td-weather">${WEATHER[local.getHours() % 6]} ${local.getHours() >= 18 || local.getHours() < 6 ? '夜里' : '白天'}</div>
            <div class="td-diff">和你的时间差：${diff >= 0 ? '+' : ''}${diff} 小时</div>`;
        const iv = setInterval(function () {
            const box2 = document.getElementById('add-page');
            if (!box2 || !box2.classList.contains('show')) { clearInterval(iv); return; }
            const hero = box2.querySelector('#td-hero');
            if (hero) {
                const n2 = new Date();
                const utc2 = n2.getTime() + n2.getTimezoneOffset() * 60000;
                const l2 = new Date(utc2 + city.tz * 3600000);
                const t = hero.querySelector('.td-time');
                if (t) t.textContent = _pad(l2.getHours()) + ' : ' + _pad(l2.getMinutes());
            }
        }, 30000);
    };

    /* ============================================================
       47) 共同账单 —— 一起管钱的总览
       ============================================================ */
    window.openBillBoard = function () {
        _openAdd();
        const box = _topbar('共同账单', '一起管钱心里有数');
        if (!box) return;
        let income = 0, expense = 0, rpIn = 0, wallet = 0;
        try {
            if (typeof window.__ledgerData === 'function') {
                const ld = window.__ledgerData();
                (ld.records || []).forEach((r) => { if (r.type === 'in') income += Number(r.amount) || 0; else expense += Number(r.amount) || 0; });
            }
        } catch (e) {}
        const w = _load('wallet', { goal: 9999, saved: 0 });
        wallet = Number(w.saved) || 0;
        try {
            if (typeof window.__rpStats === 'function') { const s = window.__rpStats(); rpIn = Number(s.totalReceived) || 0; }
        } catch (e) {}
        box.innerHTML = `
            <div class="bb-hero">
                <div class="bb-total">¥${_money(income + rpIn + wallet - expense)}</div>
                <div class="bb-sub">我们的小金库总览</div>
            </div>
            <div class="bb-grid">
                <div class="bb-item"><span class="bb-e">💰</span><span class="bb-v">¥${_money(income)}</span><span class="bb-l">记账收入</span></div>
                <div class="bb-item"><span class="bb-e">🛒</span><span class="bb-v">¥${_money(expense)}</span><span class="bb-l">记账支出</span></div>
                <div class="bb-item"><span class="bb-e">🧧</span><span class="bb-v">¥${_money(rpIn)}</span><span class="bb-l">收到的红包</span></div>
                <div class="bb-item"><span class="bb-e">🐷</span><span class="bb-v">¥${_money(wallet)}</span><span class="bb-l">梦想基金</span></div>
            </div>
            <div class="add-note">💡 汇总了记账、红包和梦想基金，方便你俩一起规划～</div>`;
    };

    /* ============================================================
       48) 约会计划
       ============================================================ */
    window.openDatePlan = function () {
        _openAdd();
        const box = _topbar('约会计划', '安排每一次见面');
        if (!box) return;
        const plans = _load('datePlans', []);
        box.innerHTML = `
            <div class="add-h2">➕ 定一个约会</div>
            <div class="dp-form">
                <input class="add-input" id="dp-title" placeholder="做什么？如：去看海">
                <input class="add-input" id="dp-place" placeholder="地点？如：海边">
                <input class="add-input" id="dp-date" type="date">
                <button class="add-btn primary" id="dp-add">定下来！</button>
            </div>
            <div class="add-h2">🗓️ 计划列表（${plans.length}）</div>
            <div class="dp-list" id="dp-list"></div>`;
        box.querySelector('#dp-add').onclick = function () {
            const t = box.querySelector('#dp-title').value.trim();
            const p = box.querySelector('#dp-place').value.trim();
            const d = box.querySelector('#dp-date').value;
            if (!t) { _toast('写写做什么吧', 'warning'); return; }
            plans.push({ title: t, place: p, date: d, at: Date.now() });
            _save('datePlans', plans);
            _toast('约会已安排 🗓️', 'success');
            window.openDatePlan();
        };
        const l = box.querySelector('#dp-list');
        if (!plans.length) {
            l.innerHTML = '<div class="lt-empty">还没有约会计划，快约起来吧～</div>';
        } else {
            l.innerHTML = plans.slice().reverse().map((p, i) => {
                let countdown = '';
                if (p.date) {
                    const d1 = new Date(); d1.setHours(0, 0, 0, 0);
                    const d2 = new Date(p.date.replace(/-/g, '/'));
                    const dd = Math.round((d2 - d1) / 86400000);
                    countdown = dd >= 0 ? '还有 ' + dd + ' 天' : '已过 ' + Math.abs(dd) + ' 天';
                }
                return `<div class="dp-item">
                    <span class="dp-e">💘</span>
                    <div class="dp-info">
                        <div class="dp-title">${_esc(p.title)}${p.place ? ' · ' + _esc(p.place) : ''}</div>
                        <div class="dp-time">${p.date ? _fmtDay(new Date(p.date.replace(/-/g, '/'))) + ' · ' + countdown : '待定日期'}</div>
                    </div>
                    <button class="dp-del" data-i="${plans.length - 1 - i}">✕</button>
                </div>`;
            }).join('');
            l.querySelectorAll('.dp-del').forEach((btn) => {
                btn.onclick = function () {
                    const idx = parseInt(btn.getAttribute('data-i'), 10);
                    plans.splice(idx, 1);
                    _save('datePlans', plans);
                    window.openDatePlan();
                };
            });
        }
    };

    /* ============================================================
       49) 吵架冷静期
       ============================================================ */
    window.openCoolDown = function () {
        _openAdd();
        const box = _topbar('吵架冷静期', '给彼此一点缓冲');
        if (!box) return;
        const cd = _load('cooldown', null);
        function render() {
            if (cd && Date.now() < cd.end) {
                const left = Math.max(0, cd.end - Date.now());
                const m = Math.floor(left / 60000);
                const s = Math.floor((left % 60000) / 1000);
                box.innerHTML = `
                    <div class="cd-hero cooling">
                        <div class="cd-icon">🧊</div>
                        <div class="cd-txt">冷静中… 还有 <b>${m}:${_pad(s)}</b></div>
                        <div class="cd-msg">先各自缓一缓，等冷静期结束我们自动和好哦</div>
                    </div>
                    <button class="add-btn" id="cd-cancel">提前结束冷静</button>`;
                box.querySelector('#cd-cancel').onclick = function () {
                    _save('cooldown', null);
                    _toast('已提前结束冷静期 💞', 'success');
                    render();
                };
                const iv = setInterval(function () {
                    const p = document.getElementById('add-page');
                    if (!p || !p.classList.contains('show')) { clearInterval(iv); return; }
                    if (!_load('cooldown', null)) { clearInterval(iv); render(); return; }
                    const l = _load('cooldown', null);
                    if (Date.now() >= l.end) {
                        clearInterval(iv);
                        _save('cooldown', null);
                        _toast('冷静期结束，自动和好啦 💞', 'success');
                        render();
                    } else {
                        const el = p.querySelector('.cd-txt b');
                        if (el) {
                            const ll = Math.max(0, l.end - Date.now());
                            el.textContent = Math.floor(ll / 60000) + ':' + _pad(Math.floor((ll % 60000) / 1000));
                        }
                    }
                }, 1000);
            } else {
                box.innerHTML = `
                    <div class="cd-hero">
                        <div class="cd-icon">💞</div>
                        <div class="cd-txt">现在很平静，不需要冷静期</div>
                    </div>
                    <div class="add-h2">开始一段冷静期（结束后自动和好）</div>
                    <div class="cd-btns" id="cd-btns"></div>`;
                [[3, '3 分钟'], [10, '10 分钟'], [30, '30 分钟']].forEach(([min, label]) => {
                    const b = document.createElement('button');
                    b.className = 'cd-btn';
                    b.textContent = label;
                    b.onclick = function () {
                        _save('cooldown', { end: Date.now() + min * 60000 });
                        _toast('冷静期已开始，' + label + '后自动和好 🧊', 'success');
                        render();
                    };
                    box.querySelector('#cd-btns').appendChild(b);
                });
            }
        }
        render();
    };

    /* ============================================================
       50) 随机小惊喜
       ============================================================ */
    const SURPRISES = [
        { e: '🎁', t: '随机掉落一颗星星，今天的你也被星星偏爱着' },
        { e: '💌', t: '打开了一张小纸条：' + '\u201C' + '你笑起来最好看' + '\u201D' },
        { e: '🧋', t: '收到一杯虚拟奶茶，备注：三分糖，全是你' },
        { e: '🎵', t: '点开了一首歌，好像是你们一起听过的旋律' },
        { e: '🌈', t: '窗外的云突然变成了爱心形状' },
        { e: '🍰', t: '凭空出现一块小蛋糕，切好一半留给你' },
        { e: '🪁', t: '一只风筝飞过，上面写着：想你' },
        { e: '🌷', t: '桌上冒出一朵小花，花语：今天的开心分你一半' }
    ];
    window.openSurprise = function () {
        _openAdd();
        const box = _topbar('随机小惊喜', '每天一个甜甜彩蛋');
        if (!box) return;
        let cur = null;
        box.innerHTML = `
            <div class="su-hero">
                <div class="su-icon" id="su-icon">🎁</div>
                <div class="su-txt" id="su-txt">点一下，看看今天有什么惊喜～</div>
            </div>
            <button class="add-btn primary" id="su-go">给我一个小惊喜</button>
            <button class="add-btn" id="su-send" style="display:none">把这个惊喜送给TA</button>`;
        box.querySelector('#su-go').onclick = function () {
            cur = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
            box.querySelector('#su-icon').textContent = cur.e;
            box.querySelector('#su-txt').textContent = cur.t;
            box.querySelector('#su-send').style.display = 'block';
            _sendSound('pop');
        };
        box.querySelector('#su-send').onclick = function () {
            if (!cur) return;
            _closeAllPages();
            setTimeout(function () {
                _sendMsg(cur.e + ' ' + cur.t, 'user', 'sent');
                _sendSound('send');
                _partnerReplySoon('哇！这个惊喜我好喜欢！' + cur.e, 1100);
            }, 150);
        };
    };

    /* ============================================================
       主页 / 界面效果辅助
       ============================================================ */
    window.__addonsFlame = function () { return _streakDays(); };
    window.__addonsFrame = function () { return _frame(); };
    window.__addonsHandHold = function () { return !!_load('handHold', false); };
    window.__addonsLoveWallet = function () { return _load('wallet', { goal: 9999, saved: 0 }); };

    /* 初始化：牵手特效、喝水提醒 */
    function _init() {
        if (typeof getStorageKey !== 'function') { setTimeout(_init, 500); return; }
        _applyHandHold();
        _startReminder();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(_init, 800); });
    } else {
        setTimeout(_init, 800);
    }
})();
