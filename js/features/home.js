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

    // 更新卡片时间
    function _tickClock() {
        const el = document.getElementById('home-clock');
        if (!el) return;
        const now = new Date();
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        el.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
        const dateEl = document.getElementById('home-date');
        if (dateEl) {
            const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
            dateEl.textContent = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + week;
        }
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
            <div class="home-couple-time">
                <span class="home-couple-clock" id="home-clock"></span>
                <span class="home-couple-date" id="home-date"></span>
            </div>`;
        phone.appendChild(card);

        // 8 宫格
        const grid = document.createElement('div');
        grid.className = 'home-grid';
        const items = [
            { icon: '🎯', label: '抉择', fn: () => _placeholder('抉择') },
            { icon: '📊', label: '消息统计', fn: () => window.openHomeStats && openHomeStats() },
            { icon: '💰', label: '同心记账', fn: () => _placeholder('同心记账') },
            { icon: '🗺️', label: 'Zmilk地图', fn: () => _placeholder('Zmilk地图') },
            { icon: '🛍️', label: '商城', fn: () => { window.openShop && openShop(); } },
            { icon: '🎁', label: '礼物柜', fn: () => { window.openGiftCabinet && openGiftCabinet(); } },
            { icon: '🐾', label: '萌宠屋', fn: () => _placeholder('萌宠屋') },
            { icon: '📱', label: 'TA的手机', fn: () => { window.openHisPhone && openHisPhone(); } }
        ];
        items.forEach((it) => {
            const b = document.createElement('button');
            b.className = 'home-grid-item';
            b.innerHTML = `<span class="home-grid-icon">${it.icon}</span><span class="home-grid-label">${it.label}</span>`;
            b.addEventListener('click', it.fn);
            grid.appendChild(b);
        });
        phone.appendChild(grid);

        // 底部 5 入口
        const footer = document.createElement('div');
        footer.className = 'home-footer';
        const footItems = [
            { icon: '🎨', label: '外观设置', fn: () => _openSettingsModal() },
            { icon: '🃏', label: '字卡库', fn: () => _placeholder('字卡库') },
            { icon: '⚙️', label: '聊天设置', fn: () => _openSettingsModal() },
            { icon: '📊', label: '消息统计', fn: () => window.openHomeStats && openHomeStats() },
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
        if (myAv) myAv.innerHTML = _avatarHTML('my-avatar');
        const pAv = document.getElementById('home-partner-avatar');
        if (pAv) pAv.innerHTML = _avatarHTML('partner-avatar');
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
