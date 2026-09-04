/* ============================================================
   home.js — 主页（情侣空间聚合主页）
   - 深蓝星空 + 双头像卡片 + 时间日期
   - 8 宫格功能入口（商城 / 礼物柜 / TA的手机 等）
   - 底部 5 入口（外观设置 / 字卡库 / 聊天设置 / 消息统计 / 朋友圈）
   ============================================================ */
(() => {
    'use strict';

    let _uiBuilt = false;

    const _myName = () => (typeof settings !== 'undefined' && settings.myName) || '我';
    const _partnerName = () => (typeof settings !== 'undefined' && settings.partnerName) || '对方';

    // 主页内轻提示
    function _toast(msg) {
        let t = document.querySelector('.home-toast');
        if (!t) {
            t = document.createElement('div');
            t.className = 'home-toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.display = 'block';
        clearTimeout(t._tm);
        t._tm = setTimeout(() => { t.style.display = 'none'; }, 2200);
    }

    // 读取现有头像（复用聊天页头像）
    function _avatarHTML(which) {
        const el = document.getElementById(which);
        if (!el) return '<i class="fas fa-user"></i>';
        const img = el.querySelector('img');
        if (img && img.src) return '<img src="' + img.src + '" alt="">';
        return el.innerHTML || '<i class="fas fa-user"></i>';
    }

    // 生成星空星星
    function _spawnStars(container) {
        const count = 52;
        for (let i = 0; i < count; i++) {
            const s = document.createElement('span');
            s.className = 'home-star';
            const size = 1 + Math.random() * 2.2;
            s.style.cssText = 'left:' + (Math.random() * 100) + '%;top:' + (Math.random() * 100) + '%;width:' + size + 'px;height:' + size + 'px;animation-delay:' + (Math.random() * 3) + 's;animation-duration:' + (2 + Math.random() * 3) + 's;';
            container.appendChild(s);
        }
    }

    // 更新卡片时间（状态栏 + 大号时钟 + 日期）
    function _tickClock() {
        const now = new Date();
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        const hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());
        const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
        const dateTxt = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + week;

        const st = document.getElementById('home-status-time');
        if (st) st.textContent = hhmm;
        const big = document.getElementById('home-clock-big');
        if (big) big.textContent = hhmm;
        const db = document.getElementById('home-date-big');
        if (db) db.textContent = dateTxt;

        // 兼容旧卡片内时间
        const el = document.getElementById('home-clock');
        if (el) el.textContent = hhmm;
        const dateEl = document.getElementById('home-date');
        if (dateEl) dateEl.textContent = dateTxt;
    }

    // 8 宫格：占位功能提示
    function _placeholder(name) {
        _toast('「' + name + '」正在努力开发中，敬请期待～');
    }

    // 打开项目自带设置弹窗
    function _openSettingsModal() {
        window.closeHome && closeHome();
        setTimeout(() => {
            try {
                const modal = document.getElementById('settings-modal');
                if (modal && typeof showModal === 'function') { showModal(modal); return; }
                if (window.DOMElements && DOMElements.settingsModal && DOMElements.settingsModal.modal && typeof showModal === 'function') {
                    showModal(DOMElements.settingsModal.modal);
                    return;
                }
                _toast('设置功能打开失败，请从顶部设置按钮进入');
            } catch (e) { _toast('设置功能打开失败'); }
        }, 80);
    }

    function _buildUI() {
        if (_uiBuilt) return;
        _uiBuilt = true;
        const body = document.body;

        const page = document.createElement('div');
        page.className = 'home-page';
        page.id = 'home-page';
        page.innerHTML = `
            <div class="home-phone" id="home-phone"></div>`;
        body.appendChild(page);
        _spawnStars(page);

        const phone = page.querySelector('#home-phone');

        // 手机顶部状态栏（仿手机：时间 + 信号/电量）
        const statusbar = document.createElement('div');
        statusbar.className = 'home-statusbar';
        statusbar.innerHTML = `
            <span class="home-status-time" id="home-status-time">--:--</span>
            <span class="home-status-icons">
                <i class="fas fa-signal"></i>
                <i class="fas fa-wifi"></i>
                <i class="fas fa-battery-full"></i>
            </span>`;
        phone.appendChild(statusbar);

        // 顶部
        const top = document.createElement('div');
        top.className = 'home-topbar';
        top.innerHTML = `
            <button class="home-back-btn" onclick="window.closeHome&&closeHome()"><i class="fas fa-chevron-left"></i></button>
            <span class="home-topbar-title">主 页</span>
            <span class="home-topbar-right"></span>`;
        phone.appendChild(top);

        // 双头像卡片
        const card = document.createElement('div');
        card.className = 'home-couple-card';
        card.innerHTML = `
            <div class="home-couple-avatars">
                <div class="home-couple-avatar" id="home-my-avatar">${_avatarHTML('my-avatar')}</div>
                <div class="home-couple-heart"><i class="fas fa-heart"></i></div>
                <div class="home-couple-avatar" id="home-partner-avatar">${_avatarHTML('partner-avatar')}</div>
            </div>
            <div class="home-couple-name" id="home-couple-name"></div>
            <div class="home-couple-slogan">两颗缠绕的心 会走同一条路</div>
            <div class="home-couple-badges" id="home-couple-badges"></div>`;
        phone.appendChild(card);

        // 大号时钟区块（仿手机：卡片下方居中大号时间 + 日期）
        const clockBlock = document.createElement('div');
        clockBlock.className = 'home-clock-block';
        clockBlock.innerHTML = `
            <div class="home-clock-big" id="home-clock-big">--:--</div>
            <div class="home-date-big" id="home-date-big"></div>`;
        phone.appendChild(clockBlock);

        // 全功能网格：按分区展示所有功能
        const scroll = document.createElement('div');
        scroll.className = 'home-scroll';

        const SECTIONS = [
            { e: '✨', name: '浪漫 · 仪式感', items: [
                { icon: '🖼️', label: '情侣头像框', fn: () => { if (window.openAvatarFrame) openAvatarFrame(); } },
                { icon: '🤝', label: '牵手特效', fn: () => { if (window.openHandHold) openHandHold(); } },
                { icon: '💝', label: '爱情信物', fn: () => { if (window.openLoveToken) openLoveToken(); } },
                { icon: '🐷', label: '恋爱钱包', fn: () => { if (window.openLoveWallet) openLoveWallet(); } },
                { icon: '🔥', label: '连续火焰', fn: () => { if (window.openFlame) openFlame(); } },
                { icon: '📅', label: '数字纪念日', fn: () => { if (window.openMilestone) openMilestone(); } }
            ]},
            { e: '🎮', name: '互动 · 游戏', items: [
                { icon: '🎮', label: '小游戏合集', fn: () => { if (window.openGames) openGames(); } },
                { icon: '🧠', label: '默契测验', fn: () => { if (window.openQuiz) openQuiz(); } },
                { icon: '✊', label: '猜拳骰子', fn: () => { if (window.openRpsDice) openRpsDice(); } },
                { icon: '🎨', label: '你画我猜', fn: () => { if (window.openDrawGuess) openDrawGuess(); } },
                { icon: '🎴', label: '真心话大冒险', fn: () => { if (window.openTruthDare) openTruthDare(); } },
                { icon: '🫂', label: '谁先道歉', fn: () => { if (window.openWhoApology) openWhoApology(); } },
                { icon: '🎲', label: '传情骰子', fn: () => { if (window.openLoveDice) openLoveDice(); } },
                { icon: '😝', label: '斗图模式', fn: () => { if (window.openStickerBattle) openStickerBattle(); } },
                { icon: '🔥', label: '悄悄话', fn: () => { if (window.openSecretNote) openSecretNote(); } },
                { icon: '🤫', label: '专属暗号', fn: () => { if (window.openSecretCode) openSecretCode(); } }
            ]},
            { e: '📷', name: '回忆 · 记录', items: [
                { icon: '📌', label: '语音留言墙', fn: () => { if (window.openVoiceWall) openVoiceWall(); } },
                { icon: '🌤️', label: '心情天气', fn: () => { if (window.openMoodWeather) openMoodWeather(); } },
                { icon: '💌', label: '聊天金句卡', fn: () => { if (window.openQuoteCard) openQuoteCard(); } },
                { icon: '🎬', label: '影音小屋', fn: () => { if (window.openMediaHouse) openMediaHouse(); } },
                { icon: '🧳', label: '旅行足迹', fn: () => { if (window.openTravelMap) openTravelMap(); } }
            ]},
            { e: '💡', name: '实用 · 生活', items: [
                { icon: '🏠', label: '回家报平安', fn: () => { if (window.openSafeHome) openSafeHome(); } },
                { icon: '📋', label: '共享待办', fn: () => { if (window.openTodoList) openTodoList(); } },
                { icon: '🌸', label: '生理期提醒', fn: () => { if (window.openPeriodCare) openPeriodCare(); } },
                { icon: '💊', label: '喝水吃药', fn: () => { if (window.openCareReminder) openCareReminder(); } },
                { icon: '📞', label: '一键呼叫', fn: () => { if (window.openCallNow) openCallNow(); } },
                { icon: '🕐', label: '异地时差', fn: () => { if (window.openTimeDiff) openTimeDiff(); } },
                { icon: '💰', label: '共同账单', fn: () => { if (window.openBillBoard) openBillBoard(); } },
                { icon: '💘', label: '约会计划', fn: () => { if (window.openDatePlan) openDatePlan(); } },
                { icon: '🧊', label: '吵架冷静期', fn: () => { if (window.openCoolDown) openCoolDown(); } },
                { icon: '🎁', label: '随机小惊喜', fn: () => { if (window.openSurprise) openSurprise(); } }
            ]},
            { e: '🌟', name: '经典功能', items: [
                { icon: '🎯', label: '抉择', fn: () => { if (window.openChoice) openChoice(); } },
                { icon: '📊', label: '消息统计', fn: () => { if (window.openStats) openStats(); } },
                { icon: '💰', label: '同心记账', fn: () => { if (window.openLedger) openLedger(); } },
                { icon: '🗺️', label: 'Zmilk地图', fn: () => { if (window.openMap) openMap(); } },
                { icon: '🛍️', label: '商城', fn: () => { if (window.openShop) openShop(); } },
                { icon: '🎁', label: '礼物柜', fn: () => { if (window.openGiftCabinet) openGiftCabinet(); } },
                { icon: '🐾', label: '萌宠屋', fn: () => { if (window.openPet) openPet(); } },
                { icon: '📱', label: 'TA的手机', fn: () => { if (window.openHisPhone) openHisPhone(); } },
                { icon: '🃏', label: '字卡库', fn: () => { if (window.openWordCards) openWordCards(); } },
                { icon: '📷', label: '朋友圈', fn: () => { window.closeHome && closeHome(); setTimeout(() => { if (window.openPyq) openPyq(); }, 60); } }
            ]}
        ];

        SECTIONS.forEach((sec) => {
            const st = document.createElement('div');
            st.className = 'home-section-title';
            st.innerHTML = `<span class="sec-emoji">${sec.e}</span><span>${sec.name}</span>`;
            scroll.appendChild(st);

            const grid = document.createElement('div');
            grid.className = 'home-grid';
            sec.items.forEach((it) => {
                const b = document.createElement('button');
                b.className = 'home-grid-item';
                b.innerHTML = `<span class="home-grid-icon">${it.icon}</span><span class="home-grid-label">${it.label}</span>`;
                b.addEventListener('click', it.fn);
                grid.appendChild(b);
            });
            scroll.appendChild(grid);
        });
        phone.appendChild(scroll);

        // 底部 5 入口
        const footer = document.createElement('div');
        footer.className = 'home-footer';
        const footItems = [
            { icon: '🎨', label: '外观设置', fn: () => { if (window.openAppearance) openAppearance(); else _openSettingsModal(); } },
            { icon: '🃏', label: '字卡库', fn: () => { window.openWordCards && openWordCards(); } },
            { icon: '⚙️', label: '聊天设置', fn: () => _openSettingsModal() },
            { icon: '📊', label: '消息统计', fn: () => { window.openStats && openStats(); } },
            { icon: '📷', label: '朋友圈', fn: () => { window.closeHome && closeHome(); setTimeout(() => { if (window.openPyq) openPyq(); }, 60); } }
        ];
        footItems.forEach((it) => {
            const b = document.createElement('button');
            b.className = 'home-footer-item';
            b.innerHTML = `<i>${it.icon}</i><span>${it.label}</span>`;
            b.addEventListener('click', it.fn);
            footer.appendChild(b);
        });
        phone.appendChild(footer);
    }

    function _refresh() {
        const nameEl = document.getElementById('home-couple-name');
        if (nameEl) nameEl.textContent = _myName() + ' & ' + _partnerName();
        const myAv = document.getElementById('home-my-avatar');
        if (myAv) {
            myAv.innerHTML = _avatarHTML('my-avatar');
            try {
                const f = (window.__addonsFrame && window.__addonsFrame()) || null;
                if (f && f.ring) { myAv.style.border = '3px solid ' + f.ring; }
                else { myAv.style.border = ''; }
            } catch (e) {}
        }
        const pAv = document.getElementById('home-partner-avatar');
        if (pAv) {
            pAv.innerHTML = _avatarHTML('partner-avatar');
            try {
                const f = (window.__addonsFrame && window.__addonsFrame()) || null;
                if (f && f.ring) { pAv.style.border = '3px solid ' + f.ring; }
                else { pAv.style.border = ''; }
            } catch (e) {}
        }
        // 徽章行：连续火焰 / 牵手特效 / 恋爱钱包
        const badges = document.getElementById('home-couple-badges');
        if (badges) {
            const chips = [];
            try {
                const flame = (window.__addonsFlame && window.__addonsFlame()) || 0;
                if (flame > 0) chips.push('🔥 连聊 ' + flame + ' 天');
            } catch (e) {}
            try { if (window.__addonsHandHold && window.__addonsHandHold()) chips.push('🤝 牵手特效'); } catch (e) {}
            try {
                const w = (window.__addonsLoveWallet && window.__addonsLoveWallet()) || { saved: 0 };
                if (Number(w.saved) > 0) chips.push('🐷 存了 ¥' + (Number(w.saved).toFixed ? Number(w.saved).toFixed(2) : w.saved));
            } catch (e) {}
            badges.innerHTML = chips.length ? chips.map((c) => `<span class="home-badge-chip">${c}</span>`).join('') : '';
        }
        _tickClock();
    }

    /* ---------------- 暴露接口 ---------------- */
    window.openHome = function () {
        _buildUI();
        const page = document.getElementById('home-page');
        if (!page) return;
        page.classList.add('show');
        _refresh();
        if (window._tickHomeTm) clearInterval(window._tickHomeTm);
        window._tickHomeTm = setInterval(_tickClock, 30000);
    };
    window.closeHome = function () {
        const page = document.getElementById('home-page');
        if (!page) return;
        page.classList.remove('show');
        if (window._tickHomeTm) { clearInterval(window._tickHomeTm); window._tickHomeTm = null; }
    };

    // 消息统计（主页入口的简单统计弹窗）
    window.openHomeStats = function () {
        const count = (arr) => (arr && Array.isArray(arr)) ? arr.length : 0;
        const lines = [];
        try {
            if (typeof messages !== 'undefined' && Array.isArray(messages)) {
                const mine = messages.filter((m) => m.sender === 'user').length;
                const theirs = messages.length - mine;
                lines.push('聊天消息：共 ' + messages.length + ' 条（我 ' + mine + ' / 对方 ' + theirs + '）');
            }
        } catch (e) {}
        try {
            const rp = window.__rpStats ? window.__rpStats() : null;
            if (rp) lines.push('红包：发出 ' + rp.sent + ' 个 · 收到 ' + rp.received + ' 个');
        } catch (e) {}
        try {
            if (typeof window.__pyqStats === 'function') {
                const p = window.__pyqStats();
                if (p) lines.push('朋友圈：共 ' + p.posts + ' 条动态');
            }
        } catch (e) {}
        try {
            if (typeof window.__giftStats === 'function') {
                const g = window.__giftStats();
                if (g) lines.push('礼物柜：收到 ' + g.gifts + ' 份礼物');
            }
        } catch (e) {}
        if (!lines.length) lines.push('暂无统计数据');
        let msg = lines.join('\n');
        if (typeof showModal === 'function') {
            const m = document.createElement('div');
            m.style.cssText = 'padding:22px 26px;min-width:260px;max-width:340px;';
            m.innerHTML = '<div style="font-weight:800;font-size:16px;margin-bottom:14px;color:var(--text-primary);">📊 消息统计</div><div style="font-size:13px;line-height:2;color:var(--text-secondary);white-space:pre-line;">' + String(msg).replace(/</g, '&lt;') + '</div>';
            showModal(m);
        } else {
            _toast(msg);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _buildUI);
    } else {
        _buildUI();
    }
})();
