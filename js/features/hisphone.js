/* ============================================================
   hisphone.js — TA的手机
   - 弹窗式页面：聊天 / 朋友圈 / 礼物柜 三个 tab
   - 聊天：TA收藏的聊天消息（排序 + 删除）
   - 朋友圈：TA收藏的动态（参考：TA还没有收藏任何内容）
   - 礼物柜：复用 gift.js 的礼物数据
   ============================================================ */
(() => {
    'use strict';

    const FAV_KEY = 'favoritesData';
    let _data = { favs: [] };
    let _loaded = false;
    let _uiBuilt = false;
    let _currentTab = 'chat';
    let _sortMode = 'fav'; // fav / speak_desc / speak_asc

    const _partnerName = () => (typeof settings !== 'undefined' && settings.partnerName) || '对方';
    const _esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    function _pad(n) { return (n < 10 ? '0' + n : '' + n); }
    function _fmtFull(ts) {
        const d = new Date(ts);
        return d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate()) + ' ' + _pad(d.getHours()) + ':' + _pad(d.getMinutes());
    }
    function _fmtDateOnly(ts) {
        const d = new Date(ts);
        return d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate()) + ' ' + _pad(d.getHours()) + ':' + _pad(d.getMinutes());
    }

    // 预置收藏（参考截图）
    const PRESET_FAVS = [
        { id: 'f1', text: '看你未读就没有再发消息了', speakAt: new Date(2026, 8, 4, 0, 55).getTime(), favAt: new Date(2026, 8, 4, 19, 33).getTime() },
        { id: 'f2', text: '老公', speakAt: new Date(2026, 8, 2, 4, 11).getTime(), favAt: new Date(2026, 8, 4, 19, 33).getTime() },
        { id: 'f3', text: '乖宝宝', speakAt: new Date(2026, 8, 2, 2, 50).getTime(), favAt: new Date(2026, 8, 4, 19, 33).getTime() },
        { id: 'f4', text: '吃到了美味蛋糕🍰', speakAt: new Date(2026, 8, 2, 2, 34).getTime(), favAt: new Date(2026, 8, 4, 19, 33).getTime() },
        { id: 'f5', text: '想你了，明天见', speakAt: new Date(2026, 8, 2, 1, 45).getTime(), favAt: new Date(2026, 8, 4, 19, 33).getTime() }
    ];

    async function _load() {
        try {
            const s = await localforage.getItem(getStorageKey(FAV_KEY));
            if (s && Array.isArray(s.favs)) {
                _data = { favs: s.favs };
            }
        } catch (e) { console.warn('[TA的手机] 加载失败', e); }
        _loaded = true;
        if (!_data.favs.length) {
            _data.favs = JSON.parse(JSON.stringify(PRESET_FAVS));
            _save();
        }
    }
    async function _save() {
        if (!_loaded) return;
        try { await localforage.setItem(getStorageKey(FAV_KEY), { favs: _data.favs }); }
        catch (e) { console.warn('[TA的手机] 保存失败', e); }
    }

    function _buildUI() {
        if (_uiBuilt) return;
        _uiBuilt = true;
        const body = document.body;
        const page = document.createElement('div');
        page.className = 'hisphone-page';
        page.id = 'hisphone-page';
        page.innerHTML = `
            <div class="hisphone-phone">
                <div class="hub-topbar">
                    <button class="hub-back-btn" onclick="window.closeHisPhone&&closeHisPhone()"><i class="fas fa-chevron-left"></i></button>
                    <span class="hub-title">TA的手机</span>
                    <span class="hub-sub">${_esc(_partnerName())} 的秘密基地</span>
                </div>
                <div class="hub-tabs">
                    <button class="hub-tab active" data-t="chat" onclick="window.__hpSwitchTab&&__hpSwitchTab('chat')">聊天</button>
                    <button class="hub-tab" data-t="pyq" onclick="window.__hpSwitchTab&&__hpSwitchTab('pyq')">朋友圈</button>
                    <button class="hub-tab" data-t="gift" onclick="window.__hpSwitchTab&&__hpSwitchTab('gift')">礼物柜</button>
                </div>
                <!-- 聊天收藏：排序条 -->
                <div class="hub-sort-row" id="hp-sort-row">
                    <button class="hub-sort-btn active" data-s="fav" onclick="window.__hpSort&&__hpSort('fav')">按收藏时间</button>
                    <button class="hub-sort-btn" data-s="speak_desc" onclick="window.__hpSort&&__hpSort('speak_desc')">按发言时间 ↓</button>
                    <button class="hub-sort-btn" data-s="speak_asc" onclick="window.__hpSort&&__hpSort('speak_asc')">按发言时间 ↑</button>
                </div>
                <div class="hub-scroll" id="hp-content"></div>
            </div>`;
        body.appendChild(page);
    }

    /* ---------------- 各 tab 渲染 ---------------- */
    function _renderFavs() {
        let favs = _data.favs.slice();
        if (_sortMode === 'fav') favs.sort((a, b) => b.favAt - a.favAt);
        else if (_sortMode === 'speak_desc') favs.sort((a, b) => b.speakAt - a.speakAt);
        else favs.sort((a, b) => a.speakAt - b.speakAt);
        const box = document.getElementById('hp-content');
        if (!favs.length) {
            box.innerHTML = `<div class="hub-empty"><i class="fas fa-star"></i>TA还没有收藏任何聊天...</div>`;
            return;
        }
        box.innerHTML = favs.map((f) => `
            <div class="fav-item">
                <button class="fav-del" data-fid="${f.id}"><i class="fas fa-times"></i></button>
                <div class="fav-date">${_fmtDateOnly(f.speakAt)}</div>
                <div class="fav-text">${_esc(f.text)}</div>
                <div class="fav-meta">发送于:${_fmtFull(f.speakAt)} | 收藏于:${_fmtFull(f.favAt)}</div>
            </div>`).join('');
        box.querySelectorAll('.fav-del').forEach((b) => {
            b.addEventListener('click', () => {
                _data.favs = _data.favs.filter((f) => f.id !== b.getAttribute('data-fid'));
                _save();
                _renderFavs();
            });
        });
    }

    function _renderPyqFav() {
        const box = document.getElementById('hp-content');
        box.innerHTML = `<div class="hub-empty"><i class="fas fa-images"></i>TA还没有收藏任何内容...</div>`;
    }

    function _renderGiftTab() {
        const box = document.getElementById('hp-content');
        let gifts = [];
        try {
            if (window.__giftData) gifts = window.__giftData() || [];
        } catch (e) {}
        if (!gifts.length) {
            box.innerHTML = `<div class="hub-empty"><i class="fas fa-gift"></i>礼物柜还空空的</div>`;
            return;
        }
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        const fmt = (ts) => {
            const d = new Date(ts);
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        };
        box.innerHTML = gifts.map((g) => {
            const reply = (g.replies && g.replies.length) ? `<div class="gift-reply">💬 ${_esc(g.replies[0].text)}</div>` : `<div class="gift-reply" style="background:#fff3d6;border-color:#f3d998;color:#a56a00;">⏳ 等待回复中...</div>`;
            return `
                <div class="gift-item">
                    <div class="gift-item-head">
                        <span class="gift-name">${g.emoji ? g.emoji + ' ' : ''}${_esc(g.name)}</span>
                        <span class="gift-price">¥${g.price} × ${g.qty}</span>
                    </div>
                    <div class="gift-time">${fmt(g.time)}</div>
                    ${reply}
                </div>`;
        }).join('');
    }

    function _switchTab(t) {
        _currentTab = t;
        document.querySelectorAll('#hisphone-page .hub-tab').forEach((b) => b.classList.toggle('active', b.getAttribute('data-t') === t));
        const sortRow = document.getElementById('hp-sort-row');
        if (sortRow) sortRow.style.display = t === 'chat' ? 'flex' : 'none';
        if (t === 'chat') _renderFavs();
        else if (t === 'pyq') _renderPyqFav();
        else _renderGiftTab();
    }

    /* ---------------- 暴露接口 ---------------- */
    window.__hpSwitchTab = _switchTab;
    window.__hpSort = function (s) {
        _sortMode = s;
        document.querySelectorAll('#hp-sort-row .hub-sort-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-s') === s));
        _renderFavs();
    };

    window.openHisPhone = function () {
        _buildUI();
        const page = document.getElementById('hisphone-page');
        if (!page) return;
        page.classList.add('show');
        _switchTab('chat');
    };
    window.closeHisPhone = function () {
        const page = document.getElementById('hisphone-page');
        if (!page) return;
        page.classList.remove('show');
    };

    /* ---------------- 初始化 ---------------- */
    function _waitSession(cb) {
        let tries = 0;
        const iv = setInterval(function () {
            tries++;
            if ((typeof SESSION_ID !== 'undefined' && SESSION_ID) || tries > 60) {
                clearInterval(iv);
                cb();
            }
        }, 100);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            _buildUI();
            _waitSession(function () { _load(); });
        });
    } else {
        _buildUI();
        _waitSession(function () { _load(); });
    }
})();
