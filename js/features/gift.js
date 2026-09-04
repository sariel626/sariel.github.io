/* ============================================================
   gift.js — 礼物柜
   - 展示"送出的礼物"清单 + 对方收到后的留言回复
   - 与商城联动：给梦角买 → 礼物进礼物柜 → 对方 3~6 秒后留言
   - 也供"TA的手机-礼物柜"tab 复用同一份数据
   ============================================================ */
(() => {
    'use strict';

    const GIFT_KEY = 'giftData';
    let _data = { gifts: [] };
    let _loaded = false;
    let _uiBuilt = false;

    const _myName = () => (typeof settings !== 'undefined' && settings.myName) || '我';
    const _partnerName = () => (typeof settings !== 'undefined' && settings.partnerName) || '对方';
    const _esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const _uid = () => 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    // 对方收到礼物后的回复文案池
    const REPLY_POOL = [
        '收到啦！好喜欢，谢谢你～',
        '哇！这个也太用心了吧，爱你！',
        '我拆开看到的时候心跳漏了一拍，谢谢宝贝！',
        '呜呜呜你真的对我太好了，我要天天用！',
        '收到啦收到啦！已经摆在家里最显眼的地方了～',
        '就知道你最懂我，这份心意我收下啦！'
    ];

    // 预置礼物（参考截图）
    const PRESET_GIFTS = [
        {
            id: 'g_preset_1', name: '《■■三十六式》', emoji: '📖', price: 42, qty: 1,
            spec: '', time: 1787986260000,
            replies: [
                { text: '翻过了一座又一座山，才明白你最好看～', time: 1787986440000 },
                { text: '已经翻到最后一页了，舍不得看完～', time: 1787986500000 }
            ]
        },
        {
            id: 'g_preset_2', name: '情侣马克杯', emoji: '☕', price: 35, qty: 1,
            spec: '颜色:奶白', time: 1787986260000,
            replies: [{ text: '能量有一些干扰，但爱你是满格信号！', time: 1787986440000 }]
        },
        {
            id: 'g_preset_3', name: '情侣对戒', emoji: '💍', price: 199, qty: 1,
            spec: '颜色:银色', time: 1787986260000,
            replies: [{ text: '怎么，某人这个点不起，准备睡午觉了吗？戒指我先戴上了嘿嘿', time: 1787986440000 }]
        }
    ];

    function _fmtTime(ts) {
        const d = new Date(ts);
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    async function _load() {
        try {
            const s = await localforage.getItem(getStorageKey(GIFT_KEY));
            if (s && Array.isArray(s.gifts)) {
                _data = { gifts: s.gifts };
            }
        } catch (e) { console.warn('[礼物柜] 加载失败', e); }
        _loaded = true;
        if (!_data.gifts.length) {
            _data.gifts = JSON.parse(JSON.stringify(PRESET_GIFTS));
            _save();
        }
    }
    async function _save() {
        if (!_loaded) return;
        try { await localforage.setItem(getStorageKey(GIFT_KEY), { gifts: _data.gifts }); }
        catch (e) { console.warn('[礼物柜] 保存失败', e); }
    }

    /* ---------------- UI ---------------- */
    function _buildUI() {
        if (_uiBuilt) return;
        _uiBuilt = true;
        const body = document.body;
        const page = document.createElement('div');
        page.className = 'gift-page';
        page.id = 'gift-page';
        page.innerHTML = `
            <div class="gift-phone">
                <div class="hub-topbar">
                    <button class="hub-back-btn" onclick="window.closeGiftCabinet&&closeGiftCabinet()"><i class="fas fa-chevron-left"></i></button>
                    <span class="hub-title">礼物柜</span>
                    <span class="hub-sub" id="gift-count"></span>
                </div>
                <div class="hub-scroll" id="gift-list"></div>
            </div>`;
        body.appendChild(page);
    }

    function _giftItemHTML(g) {
        let replyHTML = '';
        const replies = g.replies || [];
        if (replies.length) {
            replyHTML = `<div class="gift-reply">💬 ${_esc(replies[0].text)}</div>`;
            if (replies.length > 1) {
                replyHTML += `<button class="gift-reply-more" data-gid="${g.id}">查看全部回复 (${replies.length}条)</button>`;
            }
        } else {
            replyHTML = `<div class="gift-reply" style="background:#fff3d6;border-color:#f3d998;color:#a56a00;">⏳ 对方还没回复，礼物在路上～</div>`;
        }
        const spec = g.spec ? `<div class="gift-spec" style="font-size:11px;color:#999;margin-bottom:4px;">${_esc(g.spec)}</div>` : '';
        return `
            <div class="gift-item">
                <div class="gift-item-head">
                    <span class="gift-name">${g.emoji ? g.emoji + ' ' : ''}${_esc(g.name)}</span>
                    <span class="gift-price">¥${g.price} × ${g.qty}</span>
                </div>
                ${spec}
                <div class="gift-time">${_fmtTime(g.time)} · 送给你最爱的${_esc(_partnerName())}</div>
                ${replyHTML}
            </div>`;
    }

    function _render() {
        const list = document.getElementById('gift-list');
        if (!list) return;
        const countEl = document.getElementById('gift-count');
        if (countEl) countEl.textContent = '共 ' + _data.gifts.length + ' 份';
        if (!_data.gifts.length) {
            list.innerHTML = `<div class="hub-empty"><i class="fas fa-gift"></i>礼物柜还空空的，去商城买一份送TA吧～</div>`;
            return;
        }
        list.innerHTML = _data.gifts.map(_giftItemHTML).join('');
        list.querySelectorAll('.gift-reply-more').forEach((btn) => {
            btn.addEventListener('click', function () {
                const g = _data.gifts.find((x) => x.id === btn.getAttribute('data-gid'));
                if (!g) return;
                const all = (g.replies || []).map((r) => '· ' + r.text).join('\n');
                if (typeof showModal === 'function') {
                    const m = document.createElement('div');
                    m.style.cssText = 'padding:20px 24px;min-width:260px;max-width:340px;';
                    m.innerHTML = '<div style="font-weight:800;font-size:15px;margin-bottom:12px;color:var(--text-primary);">🎁 ' + _esc(g.name) + '</div><div style="font-size:13px;line-height:2;color:var(--text-secondary);white-space:pre-line;">' + String(all).replace(/</g, '&lt;') + '</div>';
                    showModal(m);
                }
            });
        });
    }

    /* ---------------- 暴露接口 ---------------- */
    window.openGiftCabinet = function () {
        _buildUI();
        const page = document.getElementById('gift-page');
        if (!page) return;
        page.classList.add('show');
        _render();
    };
    window.closeGiftCabinet = function () {
        const page = document.getElementById('gift-page');
        if (!page) return;
        page.classList.remove('show');
    };

    // 商城"给梦角买"调用：新增一份礼物，对方稍后回复
    window.__addGift = function (opt) {
        opt = opt || {};
        const g = {
            id: _uid(),
            name: opt.name || '神秘礼物',
            emoji: opt.emoji || '🎁',
            price: Number(opt.price) || 0,
            qty: Number(opt.qty) || 1,
            spec: opt.spec || '',
            time: Date.now(),
            replies: [],
            unread: true
        };
        _data.gifts.unshift(g);
        _save();
        _render();
        // 对方延迟留言
        const delay = 3000 + Math.random() * 3000;
        setTimeout(() => {
            const cur = _data.gifts.find((x) => x.id === g.id);
            if (!cur) return;
            const txt = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
            cur.replies = cur.replies || [];
            cur.replies.push({ text: txt, time: Date.now() });
            cur.unread = false;
            _save();
            _render();
            // 给聊天发一条对方的感谢消息
            try {
                if (typeof addMessage === 'function') {
                    addMessage({ sender: 'partner', type: 'normal', text: '收到你送的' + cur.name + '啦！' + txt, timestamp: new Date() });
                }
                if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
            } catch (e) {}
        }, delay);
        return g.id;
    };

    // 供主页统计 / TA的手机 读取
    window.__giftData = function () { return _data.gifts; };
    window.__giftStats = function () { return { gifts: _data.gifts.length }; };

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
