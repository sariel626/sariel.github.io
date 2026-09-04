/* ============================================================
   fun.js — 情侣小功能合集：抉择 / 消息统计 / 同心记账 / Zmilk地图 / 萌宠屋 / 字卡库
   说明：主页 8 宫格中原本"开发中"的入口，这里全部做成可玩的小功能
   - 抉择：情侣"选择困难症"救星，转盘随机决定
   - 消息统计：聊天 / 红包 / 礼物 / 朋友圈 数据大盘
   - 同心记账：情侣共同记账（收入 / 支出 / 余额），数据持久化
   - Zmilk地图：一张卡通小地图，两个人 的位置 + 距离 + 加速奔向TA
   - 萌宠屋：一只需要喂食 / 玩耍 / 摸摸 / 睡觉的小宠物，成长升级
   - 字卡库：甜话卡片库，点击即发送到聊天
   ============================================================ */
(() => {
    'use strict';

    let _uiBuilt = false;
    let _ledgerLoaded = false;
    let _petLoaded = false;
    let _ledger = { records: [] };
    let _pet = { food: 78, mood: 85, love: 20, exp: 0, lastVisit: Date.now(), awake: true, speech: '主人你来啦～' };

    const _myName = () => (typeof settings !== 'undefined' && settings.myName) || '我';
    const _partnerName = () => (typeof settings !== 'undefined' && settings.partnerName) || '对方';
    const _esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const _pad = (n) => (n < 10 ? '0' + n : '' + n);
    const _fmtFull = (ts) => {
        const d = new Date(ts);
        return d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate()) + ' ' + _pad(d.getHours()) + ':' + _pad(d.getMinutes());
    };
    const _fmtDay = (ts) => {
        const d = new Date(ts);
        return (d.getMonth() + 1) + '月' + d.getDate() + '日';
    };
    const _money = (n) => Number(n).toFixed(2);

    function _showModal(el) {
        if (typeof showModal === 'function') { showModal(el); return; }
        el.style.display = 'flex';
    }
    function _toast(msg, type) {
        if (typeof showNotification === 'function') showNotification(msg, type || 'info', 2200);
    }

    /* ---------------- 通用页面外壳 ---------------- */
    function _buildUI() {
        if (_uiBuilt) return;
        _uiBuilt = true;
        const page = document.createElement('div');
        page.className = 'fun-page';
        page.id = 'fun-page';
        page.innerHTML = `<div class="fun-phone" id="fun-phone"></div>`;
        document.body.appendChild(page);
    }
    function _setTopbar(title, sub) {
        _buildUI();
        const p = document.getElementById('fun-phone');
        if (!p) return null;
        p.innerHTML = `
            <div class="fun-topbar">
                <button class="fun-back-btn" onclick="window.closeFun&&closeFun()"><i class="fas fa-chevron-left"></i></button>
                <span class="fun-title">${_esc(title)}</span>
                ${sub ? '<span class="fun-sub">' + _esc(sub) + '</span>' : ''}
            </div>
            <div class="fun-scroll" id="fun-scroll"></div>`;
        return document.getElementById('fun-scroll');
    }
    function _openFun() {
        _buildUI();
        const pg = document.getElementById('fun-page');
        if (pg) pg.classList.add('show');
    }
    window.closeFun = function () {
        const pg = document.getElementById('fun-page');
        if (pg) pg.classList.remove('show');
    };

    /* ============================================================
       1) 抉择 —— 选择困难症救星
       ============================================================ */
    const CHOICE_POOL = {
        food: { q: '今天吃什么？', icon: '🍜', opts: ['火锅', '烤肉', '麻辣烫', '螺蛳粉', '寿司', '炸鸡', '水煮鱼', '兰州拉面', '烧烤', '小笼包', '黄焖鸡', '沙拉', '披萨', '煲仔饭'] },
        weekend: { q: '周末去哪儿？', icon: '🏞️', opts: ['去爬山', '逛商场', '看电影', '宅家打游戏', '去野餐', '逛街买衣服', '泡温泉', 'K歌', '游乐园', '泡书店'] },
        housework: { q: '今晚家务谁来做？', icon: '🧹', opts: ['我洗碗', 'TA洗碗', '我扫地', 'TA扫地', '一起大扫除', '我做饭', 'TA做饭', '点外卖解决'] },
        apology: { q: '吵架了，谁先服软？', icon: '🫂', opts: ['我先道歉', 'TA先道歉', '一起道歉', '抱一下就好', '买杯奶茶道歉', '亲亲举高高'] },
        evening: { q: '今晚一起做什么？', icon: '🌙', opts: ['一起追剧', '楼下散步', '双排打游戏', '早点睡觉', '视频通话', '给对方按摩', '看星星'] },
        surprise: { q: '惊喜盲盒，摇一摇！', icon: '🎁', opts: ['亲亲一个', '抱抱十分钟', '说十句情话', '给对方买奶茶', '一起看日落', '放一天假', '神秘大礼'] }
    };
    let _chKey = 'food';

    function _renderChoice() {
        const box = _setTopbar('抉 择', '选择困难症救星');
        if (!box) return;
        const pool = CHOICE_POOL[_chKey];
        box.innerHTML = `
            <div class="ch-panel">
                <div class="ch-question">${pool.icon} ${pool.q}</div>
                <div class="ch-sub">摇一摇，让命运替我们决定</div>
                <div class="ch-wheel" id="ch-wheel">
                    <div class="ch-wheel-core">🎲</div>
                </div>
                <div class="ch-result" id="ch-result">点下面按钮，交给你我</div>
                <button class="ch-trigger" id="ch-trigger">开始抉择</button>
                <div class="ch-options" id="ch-options"></div>
            </div>`;
        const optsBox = box.querySelector('#ch-options');
        Object.keys(CHOICE_POOL).forEach((k) => {
            const b = document.createElement('button');
            b.className = 'ch-opt' + (k === _chKey ? ' active' : '');
            b.textContent = CHOICE_POOL[k].q.replace(/[？?!！]/g, '');
            b.onclick = function () {
                _chKey = k;
                _renderChoice();
            };
            optsBox.appendChild(b);
        });
        const wheel = box.querySelector('#ch-wheel');
        const result = box.querySelector('#ch-result');
        box.querySelector('#ch-trigger').onclick = function () {
            const cur = CHOICE_POOL[_chKey];
            const pick = cur.opts[Math.floor(Math.random() * cur.opts.length)];
            wheel.classList.add('spinning');
            result.innerHTML = '<span class="ch-result-emoji">✨</span>正在纠结中…';
            setTimeout(function () {
                wheel.classList.remove('spinning');
                result.innerHTML = '<span class="ch-result-emoji">' + cur.icon + '</span>' + pick + '！';
                if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
            }, 700);
        };
    }
    window.openChoice = function () { _openFun(); _renderChoice(); };

    /* ============================================================
       2) 消息统计 —— 数据大盘
       ============================================================ */
    window.openStats = function () {
        _openFun();
        const box = _setTopbar('消息统计', '我们的数字日记');
        if (!box) return;

        // 在一起天数：从第一条消息算起（没有就按今天算 1 天）
        let days = 1;
        let total = 0, mine = 0, theirs = 0, today = 0;
        try {
            if (typeof messages !== 'undefined' && Array.isArray(messages) && messages.length) {
                total = messages.length;
                mine = messages.filter((m) => m.sender === 'user').length;
                theirs = total - mine;
                const d0 = new Date(messages[0].timestamp);
                const d1 = new Date();
                const df = Math.floor((d1 - d0) / 86400000);
                if (df >= 0) days = df + 1;
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                today = messages.filter((m) => new Date(m.timestamp) >= startOfDay).length;
            }
        } catch (e) {}

        let rpSent = 0, rpGot = 0;
        try { const s = window.__rpStats ? window.__rpStats() : null; if (s) { rpSent = s.sent || 0; rpGot = s.received || 0; } } catch (e) {}
        let pyq = 0;
        try { if (typeof window.__pyqStats === 'function') { const p = window.__pyqStats(); if (p) pyq = p.posts || 0; } } catch (e) {}
        let gifts = 0;
        try { if (typeof window.__giftStats === 'function') { const g = window.__giftStats(); if (g) gifts = g.gifts || 0; } } catch (e) {}

        const minePct = total ? Math.round(mine / total * 100) : 0;
        const theirsPct = total ? 100 - minePct : 0;

        box.innerHTML = `
            <div class="stats-hero">
                <div class="stats-hero-days">❤️ 我们在一起已经</div>
                <div class="stats-hero-num">${days} 天</div>
                <div class="stats-hero-label">从第一条消息起，每一条都算数</div>
            </div>
            <div class="stats-grid">
                <div class="stats-card"><div class="sc-emoji">💬</div><div class="sc-num">${total}</div><div class="sc-label">累计消息</div></div>
                <div class="stats-card"><div class="sc-emoji">📅</div><div class="sc-num">${today}</div><div class="sc-label">今天消息</div></div>
                <div class="stats-card"><div class="sc-emoji">🧧</div><div class="sc-num">${rpSent + rpGot}</div><div class="sc-label">红包往来</div></div>
                <div class="stats-card"><div class="sc-emoji">🎁</div><div class="sc-num">${gifts}</div><div class="sc-label">收到礼物</div></div>
            </div>
            <div class="stats-bar-wrap">
                <div class="stats-bar-title">消息占比</div>
                <div class="stats-bar-row">
                    <span class="stats-bar-name">我</span>
                    <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${minePct}%"></div></div>
                    <span class="stats-bar-num">${mine}条</span>
                </div>
                <div class="stats-bar-row">
                    <span class="stats-bar-name">${_partnerName()}</span>
                    <div class="stats-bar-track"><div class="stats-bar-fill b" style="width:${theirsPct}%"></div></div>
                    <span class="stats-bar-num">${theirs}条</span>
                </div>
            </div>`;
    };

    /* ============================================================
       3) 同心记账 —— 情侣共同记账
       ============================================================ */
    const LEDGER_KEY = 'ledgerData';
    const LEDGER_PRESET = [
        { id: 'l1', type: 'income', amount: 88.5, note: '一起存的零花钱', payer: _myName(), time: Date.now() - 3 * 86400000 },
        { id: 'l2', type: 'expense', amount: 35, note: '奶茶两杯', payer: _myName(), time: Date.now() - 2 * 86400000 },
        { id: 'l3', type: 'expense', amount: 169, note: '连帽卫衣（送给TA）', payer: _myName(), time: Date.now() - 86400000 }
    ];
    function _loadLedger() {
        if (_ledgerLoaded) return Promise.resolve();
        return new Promise(function (resolve) {
            const iv = setInterval(function () {
                if (typeof getStorageKey === 'function' && typeof SESSION_ID !== 'undefined' && SESSION_ID) {
                    clearInterval(iv);
                    localforage.getItem(getStorageKey(LEDGER_KEY)).then(function (s) {
                        if (s && Array.isArray(s.records)) _ledger = s;
                        else { _ledger.records = JSON.parse(JSON.stringify(LEDGER_PRESET)); _saveLedger(); }
                        _ledgerLoaded = true;
                        resolve();
                    }).catch(function () { _ledgerLoaded = true; resolve(); });
                } else if (typeof SESSION_ID !== 'undefined' && !SESSION_ID) { /* wait */ }
            }, 100);
            setTimeout(resolve, 5000);
        });
    }
    function _saveLedger() {
        if (!_ledgerLoaded) return;
        try { localforage.setItem(getStorageKey(LEDGER_KEY), _ledger); } catch (e) {}
    }
    function _renderLedger() {
        const box = _setTopbar('同心记账', '一起存下的每一笔');
        if (!box) return;
        let income = 0, expense = 0;
        _ledger.records.forEach((r) => { if (r.type === 'income') income += Number(r.amount) || 0; else expense += Number(r.amount) || 0; });
        const balance = income - expense;
        const list = _ledger.records.slice().sort((a, b) => b.time - a.time);

        box.innerHTML = `
            <div class="ledger-hero">
                <div class="ledger-balance-label">💰 一起的小金库</div>
                <div class="ledger-balance-num">¥ ${_money(balance)}</div>
                <div class="ledger-summary">
                    <div class="ledger-sum-item"><div class="ls-label">收入</div><div class="ls-num">+${_money(income)}</div></div>
                    <div class="ledger-sum-item"><div class="ls-label">支出</div><div class="ls-num">-${_money(expense)}</div></div>
                </div>
            </div>
            <div class="ledger-form">
                <div class="ledger-form-title">记一笔</div>
                <div class="ledger-row">
                    <input class="ledger-input" id="ld-amount" type="number" inputmode="decimal" placeholder="金额（元）">
                    <input class="ledger-input" id="ld-note" maxlength="20" placeholder="说点什么（如：奶茶两杯）">
                </div>
                <div class="ledger-type-row">
                    <button class="ledger-type income active" id="ld-type-income">📥 收入</button>
                    <button class="ledger-type expense" id="ld-type-expense">📤 支出</button>
                    <button class="ledger-type" id="ld-payer-my">👤 我付</button>
                    <button class="ledger-type" id="ld-payer-p">👤 ${_esc(_partnerName())}付</button>
                </div>
                <button class="ledger-add-btn" id="ld-add">保存这笔</button>
            </div>
            <div class="ledger-list-title">最近记录</div>
            <div id="ld-list"></div>`;

        let lType = 'expense';
        let payer = _myName();
        const incomeBtn = box.querySelector('#ld-type-income');
        const expenseBtn = box.querySelector('#ld-type-expense');
        const myBtn = box.querySelector('#ld-payer-my');
        const pBtn = box.querySelector('#ld-payer-p');
        incomeBtn.onclick = function () { lType = 'income'; incomeBtn.classList.add('active'); expenseBtn.classList.remove('active'); };
        expenseBtn.onclick = function () { lType = 'expense'; expenseBtn.classList.add('active'); incomeBtn.classList.remove('active'); };
        myBtn.onclick = function () { payer = _myName(); myBtn.classList.add('active'); pBtn.classList.remove('active'); };
        pBtn.onclick = function () { payer = _partnerName(); pBtn.classList.add('active'); myBtn.classList.remove('active'); };
        box.querySelector('#ld-add').onclick = function () {
            const amt = parseFloat(box.querySelector('#ld-amount').value);
            const note = (box.querySelector('#ld-note').value || '').trim();
            if (!(amt > 0)) { _toast('请输入有效金额', 'warning'); return; }
            _ledger.records.unshift({
                id: 'l' + Date.now(),
                type: lType,
                amount: Math.round(amt * 100) / 100,
                note: note || (lType === 'income' ? '进账一笔' : '花了一笔'),
                payer: payer,
                time: Date.now()
            });
            _saveLedger();
            _renderLedger();
            _toast('记账成功', 'success');
        };

        const listBox = box.querySelector('#ld-list');
        if (!list.length) {
            listBox.innerHTML = '<div class="ledger-empty">还没有记录，快来记第一笔吧～</div>';
        } else {
            listBox.innerHTML = list.map((r) => `
                <div class="ledger-item">
                    <span class="ledger-item-emoji">${r.type === 'income' ? '📥' : '📤'}</span>
                    <div class="ledger-item-info">
                        <div class="ledger-item-name">${_esc(r.note)}</div>
                        <div class="ledger-item-meta">${_esc(r.payer)} · ${_fmtDay(r.time)} ${_fmtFull(r.time).slice(11)}</div>
                    </div>
                    <span class="ledger-item-amount ${r.type === 'income' ? 'income' : 'expense'}">${r.type === 'income' ? '+' : '-'}${_money(r.amount)}</span>
                    <button class="ledger-item-del" data-id="${r.id}"><i class="fas fa-times"></i></button>
                </div>`).join('');
            listBox.querySelectorAll('.ledger-item-del').forEach((b) => {
                b.onclick = function () {
                    _ledger.records = _ledger.records.filter((r) => String(r.id) !== b.getAttribute('data-id'));
                    _saveLedger();
                    _renderLedger();
                };
            });
        }
    }
    window.openLedger = function () {
        _openFun();
        _loadLedger().then(_renderLedger);
    };

    /* ============================================================
       4) Zmilk地图 —— 卡通地图 + 两个小点
       ============================================================ */
    let _mapState = { myX: 78, myY: 250, pX: 330, pY: 120, dist: 3.2 };
    function _renderMap() {
        const box = _setTopbar('Zmilk地图', '你在哪里，我在想你');
        if (!box) return;
        box.innerHTML = `
            <div class="map-view" id="map-view">
                <div class="map-grid-lines"></div>
                <div class="map-road h"></div>
                <div class="map-road v"></div>
                <div class="map-river"></div>
                <div class="map-park" style="left:60px;top:60px;"></div>
                <div class="map-park" style="right:40px;top:300px;width:70px;height:46px;"></div>
                <div class="map-loc-card">
                    🏠 家 · 🌳 公园 · ☕ 咖啡店
                </div>
                <div class="map-pin" id="map-my" style="left:${_mapState.myX}px;top:${_mapState.myY}px;">
                    <span class="mp-icon">📍</span>
                    <span class="mp-label">${_esc(_myName())}</span>
                </div>
                <div class="map-pin" id="map-p" style="left:${_mapState.pX}px;top:${_mapState.pY}px;">
                    <span class="mp-icon">❤️</span>
                    <span class="mp-label">${_esc(_partnerName())}</span>
                </div>
            </div>
            <div class="map-dist">
                <div class="map-dist-num">${_mapState.dist.toFixed(1)}<small> km 距离</small></div>
                <button class="map-run-btn" id="map-run">🚀 加速奔向TA</button>
            </div>`;

        box.querySelector('#map-run').onclick = function () {
            const myEl = document.getElementById('map-my');
            const pEl = document.getElementById('map-p');
            if (!myEl || !pEl) return;
            // 我方朝对方方向靠近一大段
            _mapState.myX = Math.round(_mapState.myX + (_mapState.pX - _mapState.myX) * 0.7);
            _mapState.myY = Math.round(_mapState.myY + (_mapState.pY - _mapState.myY) * 0.7);
            _mapState.dist = Math.max(0.2, _mapState.dist * 0.3);
            myEl.style.left = _mapState.myX + 'px';
            myEl.style.top = _mapState.myY + 'px';
            const distEl = box.querySelector('.map-dist-num');
            distEl.innerHTML = _mapState.dist.toFixed(1) + '<small> km 距离</small>';
            if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
            if (_mapState.dist <= 0.4) {
                _toast('抱到啦！距离只有 ' + _mapState.dist.toFixed(1) + ' km，贴贴～', 'success');
                pEl.querySelector('.mp-icon').textContent = '💞';
            }
        };
    }
    window.openMap = function () { _openFun(); _renderMap(); };

    /* ============================================================
       5) 萌宠屋 —— 虚拟小宠物
       ============================================================ */
    const PET_KEY = 'petData';
    function _loadPet() {
        if (_petLoaded) return Promise.resolve();
        return new Promise(function (resolve) {
            const iv = setInterval(function () {
                if (typeof getStorageKey === 'function' && typeof SESSION_ID !== 'undefined' && SESSION_ID) {
                    clearInterval(iv);
                    localforage.getItem(getStorageKey(PET_KEY)).then(function (s) {
                        if (s && typeof s.food === 'number') _pet = Object.assign(_pet, s);
                        _petLoaded = true;
                        _applyPetDecay();
                        _savePet();
                        resolve();
                    }).catch(function () { _petLoaded = true; resolve(); });
                }
            }, 100);
            setTimeout(resolve, 5000);
        });
    }
    function _savePet() {
        if (!_petLoaded) return;
        try { localforage.setItem(getStorageKey(PET_KEY), _pet); } catch (e) {}
    }
    function _applyPetDecay() {
        const now = Date.now();
        const mins = Math.floor((now - (_pet.lastVisit || now)) / 60000);
        _pet.lastVisit = now;
        if (mins > 0 && _pet.awake !== false) {
            _pet.food = Math.max(0, Math.round((_pet.food - mins * 0.6) * 10) / 10);
            _pet.mood = Math.max(0, Math.round((_pet.mood - mins * 0.5) * 10) / 10);
        }
        _pet.food = Math.min(100, Math.max(0, _pet.food));
        _pet.mood = Math.min(100, Math.max(0, _pet.mood));
        _pet.love = Math.min(100, Math.max(0, _pet.love));
    }
    function _petLevel() { return 1 + Math.floor((_pet.exp || 0) / 60); }
    function _petEmoji() {
        if (!_pet.awake) return '💤';
        if (_pet.food < 20) return '😿';
        if (_pet.mood < 25) return '😢';
        if (_pet.love >= 80) return '😻';
        return '🐰';
    }
    function _renderPet() {
        const box = _setTopbar('萌宠屋', '养一只会撒娇的小可爱');
        if (!box) return;
        const food = Math.round(_pet.food), mood = Math.round(_pet.mood), love = Math.round(_pet.love);
        const level = _petLevel();
        const emoji = _petEmoji();
        box.innerHTML = `
            <div class="pet-stage">
                <div class="pet-emoji" id="pet-emoji">${emoji}</div>
                <div class="pet-name">小汤圆</div>
                <div class="pet-level">Lv.${level} ${level >= 5 ? '· 亲密挚友' : '· 正在变熟'}</div>
                <div class="pet-speech" id="pet-speech">${_esc(_pet.speech || '主人你来啦～')}</div>
            </div>
            <div class="pet-stats">
                <div class="pet-stat"><div class="ps-emoji">🥕</div><div class="ps-bar"><div class="ps-fill food" style="width:${food}%"></div></div><div class="ps-val">饱食度 ${food}</div></div>
                <div class="pet-stat"><div class="ps-emoji">🎈</div><div class="ps-bar"><div class="ps-fill mood" style="width:${mood}%"></div></div><div class="ps-val">心情 ${mood}</div></div>
                <div class="pet-stat"><div class="ps-emoji">💗</div><div class="ps-bar"><div class="ps-fill love" style="width:${love}%"></div></div><div class="ps-val">亲密度 ${love}</div></div>
            </div>
            <div class="pet-actions">
                <button class="pet-act feed" id="pet-feed">🥕 喂食</button>
                <button class="pet-act play" id="pet-play">🎾 玩耍</button>
                <button class="pet-act pat" id="pet-pat">💗 摸摸</button>
                <button class="pet-act sleep" id="pet-sleep">💤 睡觉</button>
            </div>
            <div class="pet-exp">经验 ${_pet.exp || 0} / 下一级 ${((level) * 60)} · 亲密度越高，升级越快哦</div>`;

        const emojiEl = box.querySelector('#pet-emoji');
        const speechEl = box.querySelector('#pet-speech');
        function act(opt) {
            const e = emojiEl;
            if (opt === 'feed') {
                _pet.food = Math.min(100, _pet.food + 18);
                _pet.mood = Math.min(100, _pet.mood + 4);
                _pet.exp = (_pet.exp || 0) + 12;
                _pet.speech = ['好吃好吃！主人对我最好啦～', '胡萝卜脆脆的，谢谢投喂！', '吧唧吧唧…再来一口！'][Math.floor(Math.random() * 3)];
                e.className = 'pet-emoji eat';
                e.textContent = '🐰';
            } else if (opt === 'play') {
                _pet.mood = Math.min(100, _pet.mood + 16);
                _pet.food = Math.max(0, _pet.food - 4);
                _pet.exp = (_pet.exp || 0) + 10;
                _pet.speech = ['小球球给我！接住啦！', '蹦蹦跳跳好开心呀！', '再来一局再来一局！'][Math.floor(Math.random() * 3)];
                e.className = 'pet-emoji happy';
                e.textContent = '🐇';
            } else if (opt === 'pat') {
                _pet.love = Math.min(100, _pet.love + 8);
                _pet.mood = Math.min(100, _pet.mood + 6);
                _pet.exp = (_pet.exp || 0) + 8;
                _pet.speech = ['呼噜呼噜…好舒服～', '被摸头啦，幸福到冒泡！', '最喜欢主人摸摸我了！'][Math.floor(Math.random() * 3)];
                e.className = 'pet-emoji happy';
                e.textContent = '😻';
            } else if (opt === 'sleep') {
                _pet.awake = false;
                _pet.speech = 'zzZ…（小汤圆睡着啦）';
                e.className = 'pet-emoji sleep';
                e.textContent = '💤';
            }
            if (_pet.exp >= 60 && level !== _petLevel()) _pet.speech = '🎉 升级啦！我现在是 Lv.' + _petLevel() + ' 啦！';
            _savePet();
            speechEl.textContent = _pet.speech;
            // 刷新数值
            const food2 = Math.round(_pet.food), mood2 = Math.round(_pet.mood), love2 = Math.round(_pet.love);
            const fills = box.querySelectorAll('.ps-fill');
            if (fills[0]) fills[0].style.width = food2 + '%';
            if (fills[1]) fills[1].style.width = mood2 + '%';
            if (fills[2]) fills[2].style.width = love2 + '%';
            const vals = box.querySelectorAll('.ps-val');
            if (vals[0]) vals[0].textContent = '饱食度 ' + food2;
            if (vals[1]) vals[1].textContent = '心情 ' + mood2;
            if (vals[2]) vals[2].textContent = '亲密度 ' + love2;
            const lvEl = box.querySelector('.pet-level');
            if (lvEl) lvEl.textContent = 'Lv.' + _petLevel() + (_petLevel() >= 5 ? ' · 亲密挚友' : ' · 正在变熟');
            setTimeout(function () {
                if (_pet.awake) e.className = 'pet-emoji';
            }, 900);
        }
        box.querySelector('#pet-feed').onclick = function () { _pet.awake = true; act('feed'); };
        box.querySelector('#pet-play').onclick = function () { _pet.awake = true; act('play'); };
        box.querySelector('#pet-pat').onclick = function () { _pet.awake = true; act('pat'); };
        box.querySelector('#pet-sleep').onclick = function () { act('sleep'); };
        // 睡醒按钮：点一下舞台可唤醒
        box.querySelector('.pet-stage').onclick = function () {
            if (!_pet.awake) {
                _pet.awake = true;
                _pet.speech = '嗯？睡醒啦，主人早上好～';
                _savePet();
                _renderPet();
            }
        };
    }
    window.openPet = function () {
        _openFun();
        _loadPet().then(_renderPet);
    };

    /* ============================================================
       6) 字卡库 —— 甜话卡片，一点即发
       ============================================================ */
    const WORD_CATS = [
        { key: 'sweet', name: '日常甜话', cards: [
            { e: '💕', t: '想你啦', r: '我也想你呀～', tip: '随时甜一下' },
            { e: '😘', t: '亲亲你', r: 'mua～回你一个亲亲', tip: 'mua' },
            { e: '🤗', t: '抱抱你', r: '抱紧啦，不撒手！', tip: '要贴贴' },
            { e: '💍', t: '我只喜欢你', r: '我也是，只喜欢你！', tip: '表白' },
            { e: '🌷', t: '你今天真好看', r: '被你夸得脸红了啦', tip: '夸夸' },
            { e: '🫶', t: '你是我的小确幸', r: '你才是我的大幸运！', tip: '心动' }
        ] },
        { key: 'goodnight', name: '晚安', cards: [
            { e: '🌙', t: '晚安宝贝', r: '晚安，梦里也要梦到我哦', tip: '睡前' },
            { e: '🛏️', t: '早点睡哦', r: '好～你也是，不许熬夜！', tip: '提醒' },
            { e: '💤', t: '盖好被子', r: '你也盖好，别着凉啦', tip: '贴心' },
            { e: '✨', t: '做个好梦', r: '梦见你的话，明天见', tip: '甜甜' }
        ] },
        { key: 'morning', name: '早安', cards: [
            { e: '🌅', t: '早安呀', r: '早！新的一天想你开始', tip: '醒来' },
            { e: '🍳', t: '记得吃早餐', r: '知道啦，你也要吃饱饱', tip: '关心' },
            { e: '☀️', t: '新的一天加油', r: '一起加油，晚上见！', tip: '打气' }
        ] },
        { key: 'encourage', name: '鼓励', cards: [
            { e: '💪', t: '你最棒了', r: '有你在，我什么都不怕', tip: '加油' },
            { e: '🌈', t: '一切都会好的', r: '嗯，我们在一起就是晴天', tip: '安慰' },
            { e: '🏆', t: '为你骄傲', r: '被你肯定，超有动力！', tip: '肯定' },
            { e: '🌱', t: '慢慢来不着急', r: '好，慢慢来，有你在身边', tip: '安心' }
        ] },
        { key: 'fun', name: '调皮', cards: [
            { e: '😜', t: '略略略', r: '哼，谁怕谁！', tip: '皮一下' },
            { e: '🐷', t: '小猪猪', r: '你才是猪！哼！', tip: '逗逗' },
            { e: '🧸', t: '陪我玩嘛', r: '好呀好呀，玩什么？', tip: '撒娇' },
            { e: '🍬', t: '要吃糖吗', r: '要！你喂我～', tip: '投喂' }
        ] }
    ];
    let _wcCat = 'sweet';

    function _sendWord(card) {
        window.closeFun();
        window.closeHome && closeHome();
        setTimeout(function () {
            if (typeof addMessage === 'function') {
                addMessage({
                    id: Date.now(),
                    sender: 'user',
                    text: card.e + ' ' + card.t,
                    timestamp: new Date(),
                    status: 'sent',
                    favorited: false,
                    note: null,
                    replyTo: null,
                    type: 'normal'
                });
                if (typeof playSound === 'function') { try { playSound('send'); } catch (e) {} }
            }
            // 对方甜甜回应
            setTimeout(function () {
                if (typeof addMessage === 'function') {
                    addMessage({
                        id: Date.now() + 1,
                        sender: _partnerName(),
                        text: card.r,
                        timestamp: new Date(),
                        status: 'received',
                        favorited: false,
                        note: null,
                        replyTo: null,
                        type: 'normal'
                    });
                    if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
                }
            }, 900 + Math.random() * 900);
        }, 120);
    }
    function _renderWordCards() {
        const box = _setTopbar('字卡库', '一点即发，甜到TA心里');
        if (!box) return;
        const cat = WORD_CATS.find((c) => c.key === _wcCat) || WORD_CATS[0];
        box.innerHTML = `
            <div class="wc-cats" id="wc-cats"></div>
            <div class="wc-grid" id="wc-grid"></div>
            <div class="wc-tip">💡 点击卡片会直接发给${_esc(_partnerName())}哦～</div>`;

        const catsBox = box.querySelector('#wc-cats');
        WORD_CATS.forEach((c) => {
            const b = document.createElement('button');
            b.className = 'wc-cat' + (c.key === _wcCat ? ' active' : '');
            b.textContent = c.name;
            b.onclick = function () { _wcCat = c.key; _renderWordCards(); };
            catsBox.appendChild(b);
        });

        const grid = box.querySelector('#wc-grid');
        grid.innerHTML = cat.cards.map((c) => `
            <div class="wc-card" data-t="${_esc(c.t)}" data-r="${_esc(c.r)}" data-e="${_esc(c.e)}">
                <div class="wc-card-emoji">${c.e}</div>
                <div class="wc-card-text">${_esc(c.t)}</div>
                <div class="wc-card-tip">${_esc(c.tip)}</div>
            </div>`).join('');
        grid.querySelectorAll('.wc-card').forEach((el) => {
            el.onclick = function () {
                _sendWord({ e: el.getAttribute('data-e'), t: el.getAttribute('data-t'), r: el.getAttribute('data-r') });
            };
        });
    }
    window.openWordCards = function () {
        _openFun();
        _renderWordCards();
    };

    /* ---------------- 初始化 ---------------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _buildUI);
    } else {
        _buildUI();
    }
})();
