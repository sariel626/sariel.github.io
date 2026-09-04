/* ============================================================
   redpacket.js — 红包功能：发红包 / 查看余额 / 聊天气泡 / 领取动画
   - 入口：聊天输入栏的"红包"按钮 → 底部面板（发红包 / 查看余额）
   - 发红包：按微信风格弹窗输入金额+留言+祝福语，发出后对方领取并回谢
   - 余额：可设置"我的余额 / 对方余额"并持久化
   - 对方偶发红包：定时概率触发，用户点开领取动画，金额入账
   ============================================================ */
(() => {
    'use strict';

    const RP_KEY = 'redpacketData';
    const _state = {
        balances: { my: 5190.10, partner: 4594620.80 },
        totalSent: 0,          // 累计发出的红包金额（仅展示用）
        totalReceived: 0,      // 累计收到的红包金额（仅展示用）
        lastPartnerPacket: 0,  // 对方上次发红包的时间戳
        nextPartnerPacketAt: 0 // 下次对方发红包的最早时间
    };
    let _loaded = false;
    let _uiBuilt = false;

    const PRESETS = ['恭喜发财', '新年快乐', '大吉大利', '好运连连', '辛苦了~', '买杯奶茶'];
    const THANK_POOL = [
        '哇！你居然偷偷给我发红包！{amount} 块！我最爱你了！',
        '收到宝贝的红包啦～{amount} 元，我开心得转圈圈！',
        '谢谢你！{amount} 块我收下啦，下次请你喝奶茶～',
        '天哪你真好！{amount} 元红包已收到，爱你！',
        '嘿嘿，就知道你最疼我！{amount} 块拿来买好吃的咯～',
        '红包收到！{amount} 元，我要攒起来和你一起花！',
        '你发红包的样子真帅！{amount} 块已收下，么么哒～'
    ];
    const PARTNER_PACKET_GREETINGS = ['给你买奶茶', '今天也要开心', '摸摸头', '晚安啦', '给你加餐', '随机小惊喜'];

    const _myName   = () => (typeof settings !== 'undefined' && settings.myName) || '我';
    const _partnerName = () => (typeof settings !== 'undefined' && settings.partnerName) || '对方';
    const _fmt      = (n) => Number(n).toFixed(2);
    const _esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    /* ---------------- 数据存取 ---------------- */
    async function _load() {
        try {
            const s = await localforage.getItem(getStorageKey(RP_KEY));
            if (s) {
                Object.assign(_state, s);
                if (!_state.balances || typeof _state.balances.my !== 'number') {
                    _state.balances = { my: 5190.10, partner: 4594620.80 };
                }
            }
            _loaded = true;
        } catch (e) {
            console.warn('[红包] 加载失败', e);
            _loaded = true;
        }
    }
    async function _save() {
        if (!_loaded) return;
        try { await localforage.setItem(getStorageKey(RP_KEY), _state); }
        catch (e) { console.warn('[红包] 保存失败', e); }
    }
    function _myBalance()  { return Number(_state.balances.my) || 0; }
    function _partnerBalance() { return Number(_state.balances.partner) || 0; }
    function _setMyBalance(v)      { _state.balances.my = Math.max(0, Number(v) || 0); _save(); }
    function _setPartnerBalance(v) { _state.balances.partner = Math.max(0, Number(v) || 0); _save(); }

    /* ---------------- 通用工具 ---------------- */
    function _showModal(el) {
        if (typeof showModal === 'function') { showModal(el); return; }
        el.style.display = 'flex';
    }
    function _hideModal(el) {
        if (typeof hideModal === 'function') { hideModal(el); return; }
        el.style.display = 'none';
    }
    function _toast(msg, type) {
        if (typeof showNotification === 'function') showNotification(msg, type || 'info', 2200);
    }

    /* ---------------- UI 构建 ---------------- */
    function _buildUI() {
        if (_uiBuilt) return;
        _uiBuilt = true;
        const body = document.body;

        // 1. 红包底部菜单
        const menu = document.createElement('div');
        menu.className = 'rp-sheet';
        menu.id = 'rp-menu';
        menu.innerHTML = `
            <div class="rp-sheet-mask" onclick="window.closeRedPacketMenu&&closeRedPacketMenu()"></div>
            <div class="rp-sheet-panel">
                <div class="rp-sheet-packet"><div class="rp-sheet-packet-seal">封</div></div>
                <div class="rp-sheet-title">红 包</div>
                <div class="rp-sheet-btns">
                    <button class="rp-sheet-btn rp-sheet-btn-primary" onclick="window.openRedPacketSend&&openRedPacketSend()">发红包</button>
                    <button class="rp-sheet-btn rp-sheet-btn-secondary" onclick="window.openRedPacketBalance&&openRedPacketBalance()">查看余额</button>
                </div>
            </div>`;
        body.appendChild(menu);

        // 2. 发红包弹窗
        const send = document.createElement('div');
        send.className = 'modal';
        send.id = 'rp-send-modal';
        send.style.zIndex = '9600';
        send.innerHTML = `
            <div class="modal-content rp-send-content">
                <div class="rp-send-header">
                    <span class="rp-send-header-title">发红包</span>
                    <button class="rp-close-btn" onclick="window.closeRedPacketSend&&closeRedPacketSend()">×</button>
                </div>
                <div class="rp-send-body">
                    <div class="rp-send-packet">
                        <div class="rp-send-packet-seal">封</div>
                        <div class="rp-send-packet-text">恭喜发财</div>
                    </div>
                    <div class="rp-amount-row">
                        <span class="rp-amount-symbol">¥</span>
                        <input class="rp-amount-input" id="rp-amount-input" type="number" inputmode="decimal" placeholder="0.00" value="">
                    </div>
                    <div class="rp-balance-line">余额:¥<b id="rp-balance-text">0.00</b></div>
                    <input class="rp-greeting-input" id="rp-greeting-input" maxlength="30" placeholder="添加留言…">
                    <div class="rp-presets" id="rp-presets"></div>
                    <button class="rp-send-btn" id="rp-send-btn" onclick="window.sendRedPacket&&sendRedPacket()">发送红包</button>
                </div>
            </div>`;
        body.appendChild(send);

        // 预设祝福语
        const presetsBox = send.querySelector('#rp-presets');
        PRESETS.forEach(function (p) {
            const b = document.createElement('button');
            b.className = 'rp-preset-chip';
            b.textContent = p;
            b.onclick = function () {
                const g = send.querySelector('#rp-greeting-input');
                g.value = p;
                send.querySelectorAll('.rp-preset-chip').forEach(function (x) { x.classList.remove('active'); });
                b.classList.add('active');
            };
            presetsBox.appendChild(b);
        });

        // 3. 余额设置弹窗
        const bal = document.createElement('div');
        bal.className = 'modal';
        bal.id = 'rp-balance-modal';
        bal.style.zIndex = '9600';
        bal.innerHTML = `
            <div class="modal-content rp-balance-content">
                <div class="rp-balance-title">余额设置</div>
                <div class="rp-balance-body">
                    <div class="rp-balance-row">
                        <div class="rp-balance-label">
                            <span class="rp-balance-label-name">我的余额</span>
                            <span class="rp-balance-label-sub">当前会话</span>
                        </div>
                        <input class="rp-balance-input" id="rp-my-balance-input" type="number" inputmode="decimal">
                    </div>
                    <div class="rp-balance-row">
                        <div class="rp-balance-label">
                            <span class="rp-balance-label-name">对方余额</span>
                            <span class="rp-balance-label-sub">当前会话</span>
                        </div>
                        <input class="rp-balance-input" id="rp-partner-balance-input" type="number" inputmode="decimal">
                    </div>
                    <button class="rp-save-btn" onclick="window.saveRedPacketBalance&&saveRedPacketBalance()">保存</button>
                </div>
            </div>`;
        body.appendChild(bal);

        // 4. 领取红包全屏动画
        const open = document.createElement('div');
        open.className = 'rp-open-overlay';
        open.id = 'rp-open-overlay';
        open.innerHTML = `
            <div class="rp-open-inner">
                <div class="rp-open-packet"><div class="rp-open-packet-seal">封</div></div>
                <div class="rp-open-title">恭喜发财</div>
                <div class="rp-open-result">
                    <div class="rp-open-amount">¥<span id="rp-open-amount">0.00</span></div>
                    <div class="rp-open-from" id="rp-open-from">来自梦角的红包</div>
                    <div class="rp-open-sub">已存入零钱</div>
                    <button class="rp-open-close" id="rp-open-close-btn">好的</button>
                </div>
            </div>`;
        body.appendChild(open);

        const openOverlay = open;
        openOverlay.querySelector('#rp-open-close-btn').onclick = function () {
            openOverlay.classList.remove('show', 'opened');
        };
        openOverlay.addEventListener('click', function (e) {
            if (e.target === openOverlay) {
                openOverlay.classList.remove('show', 'opened');
            }
        });
    }

    /* ---------------- 红包菜单 ---------------- */
    window.openRedPacketMenu = function () {
        _buildUI();
        const menu = document.getElementById('rp-menu');
        if (!menu) return;
        menu.classList.add('show');
    };
    window.closeRedPacketMenu = function () {
        const menu = document.getElementById('rp-menu');
        if (menu) menu.classList.remove('show');
    };

    /* ---------------- 发红包弹窗 ---------------- */
    window.openRedPacketSend = function () {
        _buildUI();
        window.closeRedPacketMenu();
        const send = document.getElementById('rp-send-modal');
        if (!send) return;
        const balTxt = send.querySelector('#rp-balance-text');
        if (balTxt) balTxt.textContent = _fmt(_myBalance());
        const amount = send.querySelector('#rp-amount-input');
        const greeting = send.querySelector('#rp-greeting-input');
        amount.value = '';
        greeting.value = '';
        send.querySelectorAll('.rp-preset-chip').forEach(function (x) { x.classList.remove('active'); });
        _showModal(send);
        setTimeout(function () { try { amount.focus(); } catch (e) {} }, 120);
    };
    window.closeRedPacketSend = function () {
        const send = document.getElementById('rp-send-modal');
        if (send) _hideModal(send);
    };

    /* ---------------- 余额设置 ---------------- */
    window.openRedPacketBalance = function () {
        _buildUI();
        window.closeRedPacketMenu();
        const bal = document.getElementById('rp-balance-modal');
        if (!bal) return;
        const myIn = bal.querySelector('#rp-my-balance-input');
        const ptIn = bal.querySelector('#rp-partner-balance-input');
        if (myIn) myIn.value = _fmt(_myBalance());
        if (ptIn) ptIn.value = _fmt(_partnerBalance());
        _showModal(bal);
    };
    window.saveRedPacketBalance = function () {
        const bal = document.getElementById('rp-balance-modal');
        if (!bal) return;
        const myIn = bal.querySelector('#rp-my-balance-input');
        const ptIn = bal.querySelector('#rp-partner-balance-input');
        _setMyBalance(parseFloat(myIn.value));
        _setPartnerBalance(parseFloat(ptIn.value));
        _hideModal(bal);
        _toast('余额已保存', 'success');
    };

    /* ---------------- 发送红包 ---------------- */
    window.sendRedPacket = function () {
        _buildUI();
        const send = document.getElementById('rp-send-modal');
        if (!send) return;
        const amountInput = send.querySelector('#rp-amount-input');
        const greetingInput = send.querySelector('#rp-greeting-input');
        const amount = parseFloat(amountInput.value);
        if (!(amount > 0)) {
            _toast('请输入有效的红包金额', 'warning');
            return;
        }
        const myBal = _myBalance();
        if (amount > myBal) {
            _toast('余额不足，请先到「查看余额」充值', 'warning');
            return;
        }
        const greeting = (greetingInput.value || '恭喜发财').trim();
        _setMyBalance(myBal - amount);
        _state.totalSent = (_state.totalSent || 0) + amount;
        _save();

        const msg = {
            id: Date.now(),
            sender: 'user',
            text: '',
            timestamp: new Date(),
            status: 'sent',
            favorited: false,
            note: null,
            replyTo: null,
            type: 'redpacket',
            redpacket: {
                amount: Math.round(amount * 100) / 100,
                greeting: greeting,
                status: 'pending',
                receivedBy: null,
                sentBy: 'me'
            }
        };
        if (typeof addMessage === 'function') {
            addMessage(msg);
        }
        _hideModal(send);
        if (typeof playSound === 'function') { try { playSound('send'); } catch (e) {} }
        _toast('红包已发出，等对方来拆～', 'success');

        // 对方稍后拆开红包并回谢
        const delay = 3000 + Math.random() * 5000;
        setTimeout(function () {
            try {
                const found = (typeof messages !== 'undefined' && Array.isArray(messages))
                    ? messages.find(function (m) { return m.id === msg.id; }) : null;
                if (found && found.redpacket) {
                    found.redpacket.status = 'opened';
                    found.redpacket.receivedBy = 'partner';
                    found.redpacket.openedAt = Date.now();
                    // 对方余额 + 收到的金额
                    _setPartnerBalance(_partnerBalance() + (found.redpacket.amount || 0));
                }
                if (typeof renderMessages === 'function') renderMessages();
                if (typeof throttledSaveData === 'function') throttledSaveData();
                // 回谢消息
                const tpl = THANK_POOL[Math.floor(Math.random() * THANK_POOL.length)];
                const thanks = tpl.replace('{amount}', _fmt(amount));
                setTimeout(function () {
                    if (typeof addMessage === 'function') {
                        addMessage({
                            id: Date.now() + 1,
                            sender: _partnerName(),
                            text: thanks,
                            timestamp: new Date(),
                            status: 'received',
                            favorited: false,
                            note: null,
                            type: 'normal'
                        });
                    }
                    if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
                    if (typeof window._sendPartnerNotification === 'function') {
                        try { window._sendPartnerNotification(_partnerName(), thanks); } catch (e) {}
                    }
                }, 800 + Math.random() * 1200);
            } catch (e) { console.warn('[红包] 领取回执失败', e); }
        }, delay);
    };

    /* ---------------- 打开 / 领取红包 ---------------- */
    function _renderPacketStatus() {
        if (typeof renderMessages === 'function') renderMessages();
        if (typeof throttledSaveData === 'function') throttledSaveData();
    }

    window.openRedPacket = function (msgId) {
        _buildUI();
        if (typeof messages === 'undefined' || !Array.isArray(messages)) return;
        const msg = messages.find(function (m) { return String(m.id) === String(msgId); });
        if (!msg || !msg.redpacket) return;
        const rp = msg.redpacket;
        const isMyPacket = msg.sender === 'user';

        if (isMyPacket) {
            // 自己发出的红包
            if (rp.status !== 'opened') {
                _toast(_partnerName() + '还没拆开红包，等一等哦～', 'info');
                return;
            }
            // 已被领取：展示详情
            const overlay = document.getElementById('rp-open-overlay');
            if (overlay) {
                overlay.querySelector('#rp-open-amount').textContent = _fmt(rp.amount);
                overlay.querySelector('#rp-open-from').textContent = _partnerName() + '已领取你的红包';
                overlay.querySelector('.rp-open-sub').textContent = '已被领取';
                overlay.classList.add('show');
                overlay.classList.remove('opened');
                setTimeout(function () { overlay.classList.add('opened'); }, 300);
                setTimeout(function () { overlay.classList.remove('show', 'opened'); }, 2600);
            }
            return;
        }

        // 对方发给我的红包
        if (rp.status === 'opened') {
            _toast('这个红包你已经领过啦', 'info');
            return;
        }

        // 领取动画
        const overlay = document.getElementById('rp-open-overlay');
        if (!overlay) return;
        overlay.querySelector('#rp-open-amount').textContent = _fmt(rp.amount);
        overlay.querySelector('#rp-open-from').textContent = '来自 ' + _partnerName() + ' 的红包';
        overlay.querySelector('.rp-open-sub').textContent = '已存入零钱';
        overlay.classList.add('show');
        overlay.classList.remove('opened');
        setTimeout(function () {
            overlay.classList.add('opened');
            // 入账 + 标记已领取
            rp.status = 'opened';
            rp.receivedBy = 'me';
            rp.openedAt = Date.now();
            _setMyBalance(_myBalance() + (rp.amount || 0));
            _state.totalReceived = (_state.totalReceived || 0) + (rp.amount || 0);
            _save();
            _renderPacketStatus();
            if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
            // 系统提示
            setTimeout(function () {
                if (typeof addMessage === 'function') {
                    addMessage({
                        id: Date.now() + 1,
                        sender: 'system',
                        text: '你领取了' + _partnerName() + '的红包',
                        timestamp: new Date(),
                        type: 'system'
                    });
                }
            }, 600);
        }, 1200);
        // 自动收起动画层
        setTimeout(function () {
            if (overlay.classList.contains('show')) {
                overlay.classList.remove('show', 'opened');
            }
        }, 5200);
    };

    /* ---------------- 对方偶发红包 ---------------- */
    window._partnerSendRedPacket = function (amount) {
        _buildUI();
        const amt = (amount && amount > 0)
            ? Math.round(amount * 100) / 100
            : Math.round((5 + Math.random() * 95) * 100) / 100;
        // 对方余额足够才发
        const pBal = _partnerBalance();
        if (amt > pBal) return false;
        _setPartnerBalance(pBal - amt);
        _state.lastPartnerPacket = Date.now();
        const greeting = PARTNER_PACKET_GREETINGS[Math.floor(Math.random() * PARTNER_PACKET_GREETINGS.length)];
        if (typeof addMessage === 'function') {
            addMessage({
                id: Date.now(),
                sender: _partnerName(),
                text: '',
                timestamp: new Date(),
                status: 'received',
                favorited: false,
                note: null,
                replyTo: null,
                type: 'redpacket',
                redpacket: {
                    amount: amt,
                    greeting: greeting,
                    status: 'pending',
                    receivedBy: null,
                    sentBy: 'partner'
                }
            });
            if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
            if (typeof window._sendPartnerNotification === 'function') {
                try { window._sendPartnerNotification(_partnerName(), '给你发了一个红包 🧧'); } catch (e) {}
            }
            return true;
        }
        return false;
    };

    function _schedulePartnerPackets() {
        // 每 45 秒检查一次：超过冷却时间（默认 2.5 分钟）后，以一定概率对方发来红包
        const COOLDOWN = 2.5 * 60 * 1000;
        setInterval(function () {
            try {
                if (!_loaded) return;
                const now = Date.now();
                if (now < (_state.nextPartnerPacketAt || 0)) return;
                if (now - (_state.lastPartnerPacket || 0) < COOLDOWN) return;
                // 12% 概率触发
                if (Math.random() < 0.12) {
                    if (window._partnerSendRedPacket()) {
                        // 触发后再隔 3~6 分钟才可能再发
                        _state.nextPartnerPacketAt = now + (3 + Math.random() * 3) * 60 * 1000;
                    }
                }
            } catch (e) { console.warn('[红包] 对方发红包调度失败', e); }
        }, 45000);
    }

    /* ---------------- 初始化 ---------------- */
    function _waitSession(cb) {
        // 等 SESSION_ID 初始化完成（app.js 的 initializeSession 异步执行），避免 getStorageKey 提前抛错
        let tries = 0;
        const iv = setInterval(function () {
            tries++;
            if ((typeof SESSION_ID !== 'undefined' && SESSION_ID) || tries > 60) {
                clearInterval(iv);
                cb();
            }
        }, 100);
    }
    function _init() {
        _buildUI();
        _waitSession(function () {
            _load().then(function () {
                // 首屏：较大概率对方很快发来一个欢迎红包
                const firstDelay = 25 + Math.random() * 40; // 25~65 秒
                setTimeout(function () {
                    try {
                        if (Math.random() < 0.75) {
                            window._partnerSendRedPacket();
                            _state.nextPartnerPacketAt = Date.now() + (3 + Math.random() * 3) * 60 * 1000;
                        }
                    } catch (e) { console.warn('[红包] 首屏红包失败', e); }
                }, firstDelay * 1000);
            });
        });
        _schedulePartnerPackets();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }
})();
