/* ============================================================
   shop.js — 商城
   - 商城首页：推荐 / 外卖 两个 tab + 商品网格 + 搜索 + 许愿
   - 购买弹窗：尺码 / 颜色 / 数量 / 备注 + 加入购物车 / 给自己买 / 给梦角买 / 预订送达 / 找TA代付
   - 购物车：加购清单 + 结算
   - 我的订单：全部 / 待送达 / 已完成 / 已取消
   - 余额独立维护（初始 ¥520.00，购买扣减）
   ============================================================ */
(() => {
    'use strict';

    const SHOP_KEY = 'shopData';
    let _data = { balance: 520.00, cart: [], orders: [] };
    let _loaded = false;
    let _uiBuilt = false;
    let _currentTab = 'rec';      // rec 推荐 / takeout 外卖
    let _buyTarget = null;        // 正在购买的商品
    let _buySel = { size: 'M', color: '灰色', qty: 1, note: '' };
    let _orderFilter = 'all';     // all/pending/done/canceled
    let _searchKw = '';

    const _myName = () => (typeof settings !== 'undefined' && settings.myName) || '我';
    const _partnerName = () => (typeof settings !== 'undefined' && settings.partnerName) || '对方';
    const _esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    /* ---------------- 商品数据 ---------------- */
    const PRODUCTS = {
        rec: [
            { id: 'p1', name: '纯棉白衬衫', emoji: '👔', price: 129, tags: ['衣物', '新品'], cat: '衣物',
              desc: '100%新疆长绒棉，亲肤透气，商务休闲两相宜', sizes: ['M', 'L', 'XL', '2XL'], colors: ['白色', '浅蓝', '条纹'] },
            { id: 'p2', name: '连帽卫衣', emoji: '🧥', price: 169, tags: ['衣物', '热销'], cat: '衣物',
              desc: '加绒加厚，宽松版型，秋冬必备。情侣款可配对穿', sizes: ['M', 'L', 'XL', '2XL'], colors: ['灰色', '黑色', '卡其', '雾霾蓝'] },
            { id: 'p3', name: '真丝睡裙', emoji: '👗', price: 259, tags: ['衣物', '性感'], cat: '衣物',
              desc: '100%桑蚕丝，亲肤丝滑，蕾丝拼接设计', sizes: ['S', 'M', 'L'], colors: ['粉色', '白色', '香槟'] },
            { id: 'p4', name: '情侣拖鞋', emoji: '🥿', price: 49, tags: ['衣物', '情侣'], cat: '衣物',
              desc: 'EVA材质，防滑耐磨，可定制刺绣', sizes: ['36-37', '38-39', '40-41', '42-43'], colors: ['奶白', '浅灰', '雾粉'] }
        ],
        takeout: [
            { id: 't1', name: '珍珠奶茶', emoji: '🧋', price: 18, tags: ['饮品', '热销'], cat: '饮品',
              desc: '手作珍珠，Q弹爽滑，三分糖刚刚好', sizes: ['大杯', '中杯'], colors: ['常温', '少冰', '去冰'] },
            { id: 't2', name: '草莓蛋糕', emoji: '🍰', price: 38, tags: ['甜品', '新品'], cat: '甜品',
              desc: '当季草莓，动物奶油，甜而不腻', sizes: ['4寸', '6寸'], colors: ['原味', '草莓味'] },
            { id: 't3', name: '爱心便当', emoji: '🍱', price: 28, tags: ['简餐', '热销'], cat: '简餐',
              desc: '三菜一饭，营养均衡，为TA加满能量', sizes: ['标准', '加量'], colors: ['照烧鸡', '红烧肉'] },
            { id: 't4', name: '冰镇西瓜', emoji: '🍉', price: 15, tags: ['水果', '特惠'], cat: '水果',
              desc: '麒麟瓜现切，冰爽清甜，解暑必备', sizes: ['半个', '一个'], colors: ['无籽'] }
        ]
    };

    function _fmtTime(ts) {
        const d = new Date(ts);
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function _genOrderNo() {
        return 'ORD' + Date.now() + Math.floor(Math.random() * 900 + 100);
    }

    /* ---------------- 数据存取 ---------------- */
    async function _load() {
        try {
            const s = await localforage.getItem(getStorageKey(SHOP_KEY));
            if (s) {
                _data = Object.assign({ balance: 520.00, cart: [], orders: [] }, s);
            }
        } catch (e) { console.warn('[商城] 加载失败', e); }
        _loaded = true;
        if (!_data.orders.length) {
            _data.orders = [
                { id: 'o1', no: 'ORD1788288357810', name: '法兰绒毛毯', emoji: '🛏️', price: 89, qty: 1, color: '奶白', time: new Date(2026, 8, 2, 2, 45).getTime(), status: 'done', to: 'self',
                  remark: '盖被子的时候 记得想我 抱着被子就当抱着我吧' },
                { id: 'o2', no: 'ORD1788288316468', name: '毛绒袜子套装', emoji: '🧦', price: 29, qty: 1, color: '灰粉', time: new Date(2026, 8, 2, 2, 45).getTime(), status: 'done', to: 'self',
                  remark: '嗯嗯 袜子也是必不可少的一部分 灰粉色是什么样子的? 你穿起来肯定别有一番风味' },
                { id: 'o3', no: 'ORD1788288234280', name: '羊绒围巾', emoji: '🧣', price: 139, qty: 1, color: '灰色', time: new Date(2026, 8, 2, 2, 43).getTime(), status: 'done', to: 'self',
                  remark: '天气转凉了，围巾给你备好，别感冒了哦～' }
            ];
            _save();
        }
    }
    async function _save() {
        if (!_loaded) return;
        try { await localforage.setItem(getStorageKey(SHOP_KEY), { balance: _data.balance, cart: _data.cart, orders: _data.orders }); }
        catch (e) { console.warn('[商城] 保存失败', e); }
    }
    function _balance() { return Number(_data.balance) || 0; }

    function _toast(msg) {
        if (typeof showNotification === 'function') {
            try { showNotification(msg, 'info', 2400); return; } catch (e) {}
        }
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

    /* ---------------- UI 构建 ---------------- */
    function _buildUI() {
        if (_uiBuilt) return;
        _uiBuilt = true;
        const body = document.body;
        const page = document.createElement('div');
        page.className = 'shop-page';
        page.id = 'shop-page';
        page.innerHTML = `
            <div class="shop-phone">
                <!-- 顶部 -->
                <div class="shop-topbar">
                    <button class="shop-back-btn" onclick="window.closeShop&&closeShop()"><i class="fas fa-chevron-left"></i></button>
                    <span class="shop-title">商城</span>
                    <span class="shop-balance"><span class="coin"></span><span id="shop-balance-text">¥520.00</span></span>
                </div>
                <!-- 搜索 + 许愿 -->
                <div class="shop-search-row">
                    <div class="shop-search-box"><i class="fas fa-search"></i><input class="shop-search-input" id="shop-search-input" placeholder="搜索商品..." oninput="window.__shopSearch&&__shopSearch(this.value)"></div>
                    <button class="shop-wish-btn" onclick="window.__shopWish&&__shopWish()">许愿</button>
                </div>
                <!-- 标签 -->
                <div class="shop-tabs">
                    <button class="shop-tab active" data-tab="rec" onclick="window.__shopSwitchTab&&__shopSwitchTab('rec')">推荐</button>
                    <button class="shop-tab" data-tab="takeout" onclick="window.__shopSwitchTab&&__shopSwitchTab('takeout')">外卖</button>
                </div>
                <div class="shop-cat-row" id="shop-cat-row"></div>
                <!-- 商品列表 -->
                <div class="shop-list" id="shop-list"></div>
                <!-- 底部导航 -->
                <div class="shop-bottombar">
                    <button class="shop-nav-item active" data-view="home" onclick="window.__shopSwitchView&&__shopSwitchView('home')"><i class="fas fa-store"></i><span>商城</span></button>
                    <button class="shop-nav-item" data-view="cart" onclick="window.__shopSwitchView&&__shopSwitchView('cart')"><i class="fas fa-shopping-cart"></i><span>购物车</span><span class="shop-cart-badge" id="shop-cart-badge">0</span></button>
                    <button class="shop-nav-item" data-view="orders" onclick="window.__shopSwitchView&&__shopSwitchView('orders')"><i class="fas fa-receipt"></i><span>订单</span></button>
                </div>
                <!-- 购物车子页 -->
                <div class="shop-subpage" id="shop-cart-page">
                    <div class="shop-sub-topbar">
                        <button class="shop-back-btn" onclick="window.__shopSwitchView&&__shopSwitchView('home')"><i class="fas fa-chevron-left"></i></button>
                        <span class="shop-sub-title">购物车</span>
                    </div>
                    <div class="shop-list-scroll" id="shop-cart-list"></div>
                    <div class="cart-checkout">
                        <span class="cart-total">合计 <b id="cart-total">¥0.00</b></span>
                        <button class="checkout-btn" onclick="window.__shopCheckout&&__shopCheckout()">结算</button>
                    </div>
                </div>
                <!-- 订单子页 -->
                <div class="shop-subpage" id="shop-orders-page">
                    <div class="shop-sub-topbar">
                        <button class="shop-back-btn" onclick="window.__shopSwitchView&&__shopSwitchView('home')"><i class="fas fa-chevron-left"></i></button>
                        <span class="shop-sub-title">我的订单</span>
                    </div>
                    <div class="shop-status-tabs">
                        <button class="shop-status-tab active" data-f="all" onclick="window.__shopFilterOrders&&__shopFilterOrders('all')">全部</button>
                        <button class="shop-status-tab" data-f="pending" onclick="window.__shopFilterOrders&&__shopFilterOrders('pending')">待送达</button>
                        <button class="shop-status-tab" data-f="done" onclick="window.__shopFilterOrders&&__shopFilterOrders('done')">已完成</button>
                        <button class="shop-status-tab" data-f="canceled" onclick="window.__shopFilterOrders&&__shopFilterOrders('canceled')">已取消</button>
                    </div>
                    <div class="shop-list-scroll" id="shop-order-list"></div>
                </div>
                <!-- 购买弹窗 -->
                <div class="shop-buy-modal" id="shop-buy-modal" style="display:none;"></div>
            </div>`;
        body.appendChild(page);
    }

    /* ---------------- 渲染：商品列表 ---------------- */
    function _productHTML(p) {
        const tags = (p.tags || []).map((t) => `<span class="shop-tag">${_esc(t)}</span>`).join('');
        return `
            <div class="shop-item" data-id="${p.id}">
                <div class="shop-item-pic">${p.emoji}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${_esc(p.name)}</div>
                    <div class="shop-item-desc">${_esc(p.desc)}</div>
                    <div class="shop-item-tags">${tags}</div>
                    <div class="shop-item-bottom">
                        <span class="shop-price"><span class="unit">¥</span>${p.price}</span>
                        <button class="shop-add-btn" title="加入购物车">+</button>
                    </div>
                </div>
            </div>`;
    }
    function _renderProducts() {
        const list = document.getElementById('shop-list');
        if (!list) return;
        const items = PRODUCTS[_currentTab] || [];
        const kw = _searchKw.trim().toLowerCase();
        let filtered = items;
        if (kw) {
            filtered = items.filter((p) => (p.name + p.desc + (p.tags || []).join('')).toLowerCase().indexOf(kw) >= 0);
        }
        if (!filtered.length) {
            list.innerHTML = `<div class="shop-empty"><i class="fas fa-box-open"></i>没有找到相关商品</div>`;
            return;
        }
        list.innerHTML = filtered.map(_productHTML).join('');
        list.querySelectorAll('.shop-item').forEach((card) => {
            const id = card.getAttribute('data-id');
            card.addEventListener('click', (e) => {
                if (e.target.closest('.shop-add-btn')) { _quickAdd(id); return; }
                _openBuy(id);
            });
        });
        list.querySelectorAll('.shop-add-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.shop-item').getAttribute('data-id');
                _quickAdd(id);
            });
        });
        // 更新分类小条
        const catRow = document.getElementById('shop-cat-row');
        if (catRow) {
            const cats = ['全部'].concat(Array.from(new Set(items.map((p) => p.cat))));
            catRow.innerHTML = cats.map((c, i) => `<button class="shop-cat${i === 0 ? ' active' : ''}" data-cat="${c}">${_esc(c)}</button>`).join('');
            catRow.querySelectorAll('.shop-cat').forEach((b) => {
                b.addEventListener('click', () => {
                    catRow.querySelectorAll('.shop-cat').forEach((x) => x.classList.remove('active'));
                    b.classList.add('active');
                    const cat = b.getAttribute('data-cat');
                    const list2 = cat === '全部' ? items : items.filter((p) => p.cat === cat);
                    list.innerHTML = list2.map(_productHTML).join('');
                    list.querySelectorAll('.shop-item').forEach((card) => {
                        const id = card.getAttribute('data-id');
                        card.addEventListener('click', (e) => {
                            if (e.target.closest('.shop-add-btn')) { _quickAdd(id); return; }
                            _openBuy(id);
                        });
                    });
                });
            });
        }
    }

    /* ---------------- 购买弹窗 ---------------- */
    function _findProduct(id) {
        return (PRODUCTS.rec.concat(PRODUCTS.takeout)).find((p) => p.id === id);
    }
    function _openBuy(id) {
        const p = _findProduct(id);
        if (!p) return;
        _buyTarget = p;
        _buySel = { size: p.sizes ? p.sizes[0] : '', color: p.colors ? p.colors[0] : '', qty: 1, note: '' };
        _renderBuyModal();
    }
    function _renderBuyModal() {
        const p = _buyTarget;
        if (!p) return;
        const modal = document.getElementById('shop-buy-modal');
        if (!modal) return;
        const sizeRow = p.sizes ? `
            <div class="shop-opt-row">
                <span class="shop-opt-label">尺码</span>
                <div class="shop-opt-chips">${p.sizes.map((s) => `<button class="shop-opt-chip${s === _buySel.size ? ' active' : ''}" data-k="size" data-v="${s}">${s}</button>`).join('')}</div>
            </div>` : '';
        const colorRow = p.colors ? `
            <div class="shop-opt-row">
                <span class="shop-opt-label">颜色</span>
                <div class="shop-opt-chips">${p.colors.map((c) => `<button class="shop-opt-chip${c === _buySel.color ? ' active' : ''}" data-k="color" data-v="${c}">${c}</button>`).join('')}</div>
            </div>` : '';
        const total = p.price * _buySel.qty;
        modal.innerHTML = `
            <div class="shop-buy-head">
                <div class="shop-buy-pic">${p.emoji}</div>
                <div class="shop-buy-info">
                    <div class="shop-buy-name">${_esc(p.name)}</div>
                    <div class="shop-buy-desc">${_esc(p.desc)}</div>
                    <div class="shop-buy-price">¥${total} <span style="font-size:11px;color:#999;font-weight:400;">余额 ¥${_balance().toFixed(2)}</span></div>
                </div>
                <button class="shop-buy-close" onclick="window.__shopCloseBuy&&__shopCloseBuy()"><i class="fas fa-times"></i></button>
            </div>
            ${sizeRow}
            ${colorRow}
            <div class="shop-opt-row">
                <span class="shop-opt-label">数量</span>
                <div class="shop-qty">
                    <button class="shop-qty-btn" onclick="window.__shopQty&&__shopQty(-1)">−</button>
                    <span class="shop-qty-val" id="shop-qty-val">${_buySel.qty}</span>
                    <button class="shop-qty-btn" onclick="window.__shopQty&&__shopQty(1)">+</button>
                </div>
            </div>
            <div class="shop-note-row">
                <span class="shop-opt-label">订单备注</span>
                <textarea class="shop-note-input" id="shop-note-input" placeholder="给TA留言，或备注特殊要求...">${_esc(_buySel.note)}</textarea>
            </div>
            <div class="shop-buy-actions">
                <button class="shop-buy-btn shop-btn-cart" onclick="window.__shopAction&&__shopAction('cart')">加入购物车</button>
                <button class="shop-buy-btn shop-btn-self" onclick="window.__shopAction&&__shopAction('self')">给自己买</button>
                <button class="shop-buy-btn shop-btn-partner" onclick="window.__shopAction&&__shopAction('partner')">给${_esc(_partnerName())}买</button>
                <button class="shop-buy-btn shop-btn-book" onclick="window.__shopAction&&__shopAction('book')">预订送达</button>
                <button class="shop-buy-btn shop-btn-pay4u" onclick="window.__shopAction&&__shopAction('pay4u')">找TA代付</button>
            </div>`;
        modal.style.display = 'block';
        // 绑定选项切换
        modal.querySelectorAll('.shop-opt-chip').forEach((b) => {
            b.addEventListener('click', () => {
                const k = b.getAttribute('data-k');
                _buySel[k] = b.getAttribute('data-v');
                _renderBuyModal();
            });
        });
        const note = document.getElementById('shop-note-input');
        if (note) note.addEventListener('input', () => { _buySel.note = note.value; });
    }
    window.__shopCloseBuy = function () {
        const modal = document.getElementById('shop-buy-modal');
        if (modal) modal.style.display = 'none';
        _buyTarget = null;
    };
    window.__shopQty = function (d) {
        _buySel.qty = Math.max(1, _buySel.qty + d);
        _renderBuyModal();
    };

    /* ---------------- 加购 / 购买动作 ---------------- */
    function _cartCount() { return _data.cart.reduce((s, c) => s + c.qty, 0); }
    function _updateCartBadge() {
        const b = document.getElementById('shop-cart-badge');
        if (!b) return;
        const n = _cartCount();
        b.textContent = n;
        b.style.display = n ? 'block' : 'none';
    }
    function _quickAdd(id) {
        const p = _findProduct(id);
        if (!p) return;
        const exist = _data.cart.find((c) => c.id === p.id);
        if (exist) { exist.qty += 1; }
        else { _data.cart.push({ id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: 1, spec: '' }); }
        _save();
        _updateCartBadge();
        _toast('已加入购物车：' + p.name);
    }

    // 结算购物车
    function _cartTotal() { return _data.cart.reduce((s, c) => s + c.price * c.qty, 0); }
    function _checkout() {
        if (!_data.cart.length) { _toast('购物车还是空的～'); return; }
        const total = _cartTotal();
        if (total > _balance()) { _toast('余额不足，还差 ¥' + (total - _balance()).toFixed(2)); return; }
        _data.balance = _balance() - total;
        _data.cart.forEach((c) => {
            _data.orders.unshift({
                id: 'o_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                no: _genOrderNo(), name: c.name, emoji: c.emoji, price: c.price, qty: c.qty,
                color: c.spec || '', time: Date.now(), status: 'done', to: 'self', remark: ''
            });
        });
        _data.cart = [];
        _save();
        _updateCartBadge();
        _renderCart();
        _toast('结算成功，已生成订单');
    }

    // 统一购买动作
    window.__shopAction = function (action) {
        const p = _buyTarget;
        if (!p) return;
        const total = p.price * _buySel.qty;
        const spec = [_buySel.color, _buySel.size].filter(Boolean).join(' ');
        const remark = _buySel.note || '';
        if (action === 'cart') {
            const exist = _data.cart.find((c) => c.id === p.id);
            if (exist) { exist.qty += _buySel.qty; }
            else { _data.cart.push({ id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: _buySel.qty, spec: spec }); }
            _save();
            _updateCartBadge();
            window.__shopCloseBuy();
            _toast('已加入购物车：' + p.name);
            return;
        }
        if (action === 'pay4u') {
            // 找TA代付：不扣自己余额，TA 已付款
            _data.orders.unshift({
                id: 'o_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                no: _genOrderNo(), name: p.name, emoji: p.emoji, price: p.price, qty: _buySel.qty,
                color: spec, time: Date.now(), status: 'done', to: 'partner', remark: remark, pay4u: true
            });
            _save();
            window.__shopCloseBuy();
            _toast(_partnerName() + ' 已帮你付了 ¥' + total.toFixed(2));
            try {
                if (typeof addMessage === 'function') {
                    addMessage({ sender: 'partner', type: 'normal', text: '钱我来付啦，你只管开心～', timestamp: new Date() });
                }
            } catch (e) {}
            return;
        }
        if (total > _balance()) { _toast('余额不足，还差 ¥' + (total - _balance()).toFixed(2)); return; }
        _data.balance = _balance() - total;
        const status = action === 'book' ? 'pending' : 'done';
        _data.orders.unshift({
            id: 'o_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            no: _genOrderNo(), name: p.name, emoji: p.emoji, price: p.price, qty: _buySel.qty,
            color: spec, time: Date.now(), status: status, to: action === 'partner' ? 'partner' : 'self', remark: remark
        });
        _save();
        if (action === 'partner') {
            // 送礼 → 进礼物柜，对方稍后回复
            try {
                if (window.__addGift) {
                    window.__addGift({ name: p.name, emoji: p.emoji, price: p.price, qty: _buySel.qty, spec: spec });
                }
            } catch (e) {}
            window.__shopCloseBuy();
            _toast('已送给' + _partnerName() + '，等TA拆礼物～');
            try {
                if (typeof addMessage === 'function') {
                    addMessage({ sender: 'user', type: 'normal', text: '我给你买了一份' + p.name + '（¥' + total.toFixed(2) + '）放在礼物柜啦，快去拆～', timestamp: new Date() });
                }
            } catch (e) {}
        } else if (action === 'book') {
            window.__shopCloseBuy();
            _toast('已预订，订单将按计划送达');
        } else {
            window.__shopCloseBuy();
            _toast('购买成功，已生成订单');
        }
    };

    /* ---------------- 购物车 / 订单 渲染 ---------------- */
    function _renderCart() {
        const list = document.getElementById('shop-cart-list');
        if (!list) return;
        const totalEl = document.getElementById('cart-total');
        if (!_data.cart.length) {
            list.innerHTML = `<div class="shop-empty"><i class="fas fa-shopping-cart"></i>购物车还是空的，去逛逛吧～</div>`;
            if (totalEl) totalEl.textContent = '¥0.00';
            return;
        }
        list.innerHTML = _data.cart.map((c) => `
            <div class="cart-item">
                <div class="cart-item-pic">${c.emoji}</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${_esc(c.name)}</div>
                    <div class="cart-item-spec">${_esc(c.spec || '默认规格')}</div>
                    <div class="cart-item-bottom">
                        <span class="cart-item-price">¥${c.price} × ${c.qty}</span>
                        <button class="cart-item-del" data-cid="${c.id}">删除</button>
                    </div>
                </div>
            </div>`).join('');
        list.querySelectorAll('.cart-item-del').forEach((b) => {
            b.addEventListener('click', () => {
                _data.cart = _data.cart.filter((c) => c.id !== b.getAttribute('data-cid'));
                _save();
                _updateCartBadge();
                _renderCart();
            });
        });
        if (totalEl) totalEl.textContent = '¥' + _cartTotal().toFixed(2);
    }
    window.__shopCheckout = _checkout;

    function _statusText(s) {
        if (s === 'pending') return '待送达';
        if (s === 'done') return '已完成';
        if (s === 'canceled') return '已取消';
        return '全部';
    }
    function _renderOrders() {
        const list = document.getElementById('shop-order-list');
        if (!list) return;
        let orders = _data.orders;
        if (_orderFilter !== 'all') orders = orders.filter((o) => o.status === _orderFilter);
        if (!orders.length) {
            list.innerHTML = `<div class="shop-empty"><i class="fas fa-receipt"></i>暂无相关订单</div>`;
            return;
        }
        list.innerHTML = orders.map((o) => {
            const stCls = o.status === 'done' ? 'done' : (o.status === 'pending' ? 'pending' : 'canceled');
            let actions = '';
            if (o.status === 'pending') {
                actions = `<div class="order-actions"><button class="order-btn" data-act="cancel" data-oid="${o.id}">取消订单</button><button class="order-btn" data-act="again" data-oid="${o.id}">再次购买</button></div>`;
            } else if (o.status === 'done') {
                actions = `<div class="order-actions"><button class="order-btn" data-act="again" data-oid="${o.id}">再次购买</button></div>`;
            } else {
                actions = `<div class="order-actions"><button class="order-btn" data-act="again" data-oid="${o.id}">再次购买</button></div>`;
            }
            const remark = o.remark ? `<div class="order-remark">📝 ${_esc(o.remark)}</div>` : '';
            const who = o.to === 'partner' ? '（送给' + _esc(_partnerName()) + '）' : (o.pay4u ? '（TA代付）' : '');
            return `
                <div class="order-item">
                    <div class="order-head"><span class="order-no">${o.no}</span><span class="order-status ${stCls}">${_statusText(o.status)}</span></div>
                    <div class="order-goods">
                        <div class="order-goods-pic">${o.emoji}</div>
                        <div style="flex:1;">
                            <div class="order-goods-name">${_esc(o.name)}${who}</div>
                            <div class="order-goods-spec">${o.color ? _esc(o.color) : '默认'} · ¥${o.price} × ${o.qty}</div>
                        </div>
                    </div>
                    <div class="order-meta">${_fmtTime(o.time)}</div>
                    ${remark}
                    ${actions}
                </div>`;
        }).join('');
        list.querySelectorAll('.order-btn').forEach((b) => {
            b.addEventListener('click', () => {
                const act = b.getAttribute('data-act');
                const oid = b.getAttribute('data-oid');
                const o = _data.orders.find((x) => x.id === oid);
                if (!o) return;
                if (act === 'cancel') { o.status = 'canceled'; _save(); _renderOrders(); _toast('订单已取消'); }
                else if (act === 'again') {
                    if (o.price > _balance()) { _toast('余额不足'); return; }
                    _data.balance = _balance() - o.price;
                    _data.orders.unshift({ id: 'o_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), no: _genOrderNo(), name: o.name, emoji: o.emoji, price: o.price, qty: 1, color: o.color, time: Date.now(), status: 'done', to: 'self', remark: o.remark });
                    _save(); _renderOrders(); _toast('已再次购买');
                }
            });
        });
    }
    window.__shopFilterOrders = function (f) {
        _orderFilter = f;
        document.querySelectorAll('#shop-orders-page .shop-status-tab').forEach((b) => b.classList.toggle('active', b.getAttribute('data-f') === f));
        _renderOrders();
    };

    /* ---------------- 视图切换 / 工具 ---------------- */
    function _switchView(view) {
        const page = document.getElementById('shop-page');
        if (!page) return;
        const home = page.querySelector('.shop-topbar, .shop-search-row, .shop-tabs, .shop-cat-row, .shop-list');
        page.querySelectorAll('.shop-nav-item').forEach((n) => n.classList.toggle('active', n.getAttribute('data-view') === view));
        const cartPage = document.getElementById('shop-cart-page');
        const ordersPage = document.getElementById('shop-orders-page');
        const buyModal = document.getElementById('shop-buy-modal');
        if (buyModal) buyModal.style.display = 'none';
        if (view === 'home') {
            page.querySelector('.shop-topbar').style.display = 'flex';
            page.querySelector('.shop-search-row').style.display = 'flex';
            page.querySelector('.shop-tabs').style.display = 'flex';
            page.querySelector('.shop-cat-row').style.display = 'flex';
            page.querySelector('.shop-list').style.display = 'grid';
            cartPage.classList.remove('show');
            ordersPage.classList.remove('show');
        } else if (view === 'cart') {
            page.querySelector('.shop-topbar').style.display = 'none';
            page.querySelector('.shop-search-row').style.display = 'none';
            page.querySelector('.shop-tabs').style.display = 'none';
            page.querySelector('.shop-cat-row').style.display = 'none';
            page.querySelector('.shop-list').style.display = 'none';
            cartPage.classList.add('show');
            ordersPage.classList.remove('show');
            _renderCart();
        } else if (view === 'orders') {
            page.querySelector('.shop-topbar').style.display = 'none';
            page.querySelector('.shop-search-row').style.display = 'none';
            page.querySelector('.shop-tabs').style.display = 'none';
            page.querySelector('.shop-cat-row').style.display = 'none';
            page.querySelector('.shop-list').style.display = 'none';
            cartPage.classList.remove('show');
            ordersPage.classList.add('show');
            _renderOrders();
        }
    }
    window.__shopSwitchView = _switchView;
    window.__shopSwitchTab = function (tab) {
        _currentTab = tab;
        _searchKw = '';
        const inp = document.getElementById('shop-search-input');
        if (inp) inp.value = '';
        document.querySelectorAll('#shop-page .shop-tab').forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === tab));
        _renderProducts();
    };
    window.__shopSearch = function (v) {
        _searchKw = v;
        _renderProducts();
    };
    window.__shopWish = function () {
        _toast('许愿成功！已记在小本本上，等TA帮你实现～');
    };

    /* ---------------- 暴露接口 ---------------- */
    window.openShop = function () {
        _buildUI();
        const page = document.getElementById('shop-page');
        if (!page) return;
        page.classList.add('show');
        const bal = document.getElementById('shop-balance-text');
        if (bal) bal.textContent = '¥' + _balance().toFixed(2);
        _currentTab = 'rec';
        _searchKw = '';
        document.querySelectorAll('#shop-page .shop-tab').forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === 'rec'));
        _switchView('home');
        _renderProducts();
        _updateCartBadge();
    };
    window.closeShop = function () {
        const page = document.getElementById('shop-page');
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
