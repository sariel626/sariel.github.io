/* ============================================================
   pyq.js — 朋友圈（微信式动态流）功能
   - 全屏朋友圈页：封面 + 头像昵称 + 动态流
   - 发动态（文字 + 可选照片）、点赞、评论、删除
   - 对方（梦角）偶发动态、对你动态点赞/评论、有新动态时入口小红点
   ============================================================ */
(() => {
    'use strict';

    const PYQ_KEY = 'pyqData';
    let _data = { posts: [] };
    let _loaded = false;
    let _uiBuilt = false;
    let _bgImage = null;       // 聊天背景（作为封面/动态配图的备选）
    let _commentTargetId = null; // 正在评论的动态 id
    let _pendingPartnerAt = 0;   // 下次对方发动态的最早时间
    let _lastPartnerPost = 0;

    const FALLBACK_POOL = [
        '今天的天空很好看，让我想起你。',
        '刚刚路过一家小店，想给你也带一份。',
        '收到你的消息总是很开心。',
        '想和你一起看日落。',
        '今天也很喜欢你。',
        '晚饭吃得很饱，就差一个你了。',
        '风很轻，心里很暖。',
        '愿你今天也被温柔以待。',
        '偷偷想你一下，就当是打卡了。',
        '一切安好，勿念，爱你。'
    ];

    const _myName   = () => (typeof settings !== 'undefined' && settings.myName) || '我';
    const _partnerName = () => (typeof settings !== 'undefined' && settings.partnerName) || '对方';
    const _esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const _uid = () => 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    /* ---------------- 数据存取 ---------------- */
    async function _load() {
        try {
            const s = await localforage.getItem(getStorageKey(PYQ_KEY));
            if (s && Array.isArray(s.posts)) {
                _data = { posts: s.posts };
            }
            _loaded = true;
        } catch (e) {
            console.warn('[朋友圈] 加载失败', e);
            _loaded = true;
        }
        // 读取聊天背景作为备选封面/配图
        try {
            const bg = await localforage.getItem(getStorageKey('chatBackground'));
            if (bg) _bgImage = bg;
        } catch (e) {}
    }
    async function _save() {
        if (!_loaded) return;
        try { await localforage.setItem(getStorageKey(PYQ_KEY), { posts: _data.posts }); }
        catch (e) { console.warn('[朋友圈] 保存失败', e); }
    }

    /* ---------------- 头像 ---------------- */
    function _avatarHTML(author) {
        const id = author === 'me' ? 'my-avatar' : 'partner-avatar';
        const el = document.getElementById(id);
        if (!el) return '<i class="fas fa-user"></i>';
        const img = el.querySelector('img');
        if (img && img.src) return '<img src="' + img.src + '" alt="">';
        return el.innerHTML || '<i class="fas fa-user"></i>';
    }
    function _nameOf(author) {
        return author === 'me' ? _myName() : _partnerName();
    }

    /* ---------------- 时间格式化 ---------------- */
    function _timeAgo(ts) {
        const diff = Date.now() - ts;
        if (diff < 60 * 1000) return '刚刚';
        if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + '小时前';
        const d = new Date(ts);
        const now = new Date();
        const sameYear = d.getFullYear() === now.getFullYear();
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        if (sameYear) return (d.getMonth() + 1) + '月' + d.getDate() + '日';
        return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }

    /* ---------------- UI 构建 ---------------- */
    function _buildUI() {
        if (_uiBuilt) return;
        _uiBuilt = true;
        const body = document.body;

        // 全屏朋友圈页
        const page = document.createElement('div');
        page.className = 'pyq-page';
        page.id = 'pyq-page';
        page.innerHTML = `
            <div class="pyq-cover" id="pyq-cover">
                <div class="pyq-cover-bg" id="pyq-cover-bg"></div>
                <div class="pyq-cover-mask"></div>
                <div class="pyq-cover-actions">
                    <button class="pyq-cover-btn" title="关闭" onclick="window.closePyq&&closePyq()"><i class="fas fa-chevron-left"></i></button>
                    <button class="pyq-cover-btn" title="发表动态" onclick="window.openPyqCompose&&openPyqCompose()"><i class="fas fa-camera"></i></button>
                </div>
                <div class="pyq-cover-user">
                    <span class="pyq-cover-username" id="pyq-cover-username">我</span>
                    <div class="pyq-cover-avatar" id="pyq-cover-avatar"><i class="fas fa-user"></i></div>
                </div>
            </div>
            <div class="pyq-feed" id="pyq-feed"></div>`;
        body.appendChild(page);

        // 发表动态底部面板
        const compose = document.createElement('div');
        compose.className = 'pyq-compose';
        compose.id = 'pyq-compose';
        compose.innerHTML = `
            <div class="pyq-compose-head">
                <span class="pyq-compose-title">发 朋 友 圈</span>
                <div class="pyq-compose-actions">
                    <button class="pyq-compose-cancel" onclick="window.closePyqCompose&&closePyqCompose()">取消</button>
                    <button class="pyq-compose-post" id="pyq-compose-post" onclick="window.submitPyqPost&&submitPyqPost()">发表</button>
                </div>
            </div>
            <textarea class="pyq-compose-text" id="pyq-compose-text" placeholder="这一刻的想法…" maxlength="500"></textarea>
            <div class="pyq-compose-media">
                <button class="pyq-media-pick" id="pyq-media-pick" title="添加照片"><i class="fas fa-image"></i></button>
                <div id="pyq-media-preview"></div>
            </div>
            <input type="file" id="pyq-media-input" accept="image/*" style="display:none;">`;
        body.appendChild(compose);

        // 评论输入条
        const cbar = document.createElement('div');
        cbar.className = 'pyq-comment-bar';
        cbar.id = 'pyq-comment-bar';
        cbar.innerHTML = `
            <input class="pyq-comment-input" id="pyq-comment-input" placeholder="评论…" maxlength="100">
            <button class="pyq-comment-send" onclick="window.submitPyqComment&&submitPyqComment()">发送</button>`;
        body.appendChild(cbar);

        // 图片查看器
        const viewer = document.createElement('div');
        viewer.className = 'pyq-viewer';
        viewer.id = 'pyq-viewer';
        viewer.innerHTML = `<img id="pyq-viewer-img" alt=""><button class="pyq-viewer-close" onclick="document.getElementById('pyq-viewer').classList.remove('show')">×</button>`;
        body.appendChild(viewer);
        viewer.addEventListener('click', function (e) {
            if (e.target === viewer) viewer.classList.remove('show');
        });

        // 发表图片选择
        const mediaInput = compose.querySelector('#pyq-media-input');
        compose.querySelector('#pyq-media-pick').addEventListener('click', function () {
            mediaInput.click();
        });
        mediaInput.addEventListener('change', function () {
            const file = mediaInput.files[0];
            if (!file) return;
            const maxSize = (typeof MAX_IMAGE_SIZE !== 'undefined') ? MAX_IMAGE_SIZE : 5 * 1024 * 1024;
            if (file.size > maxSize) {
                if (typeof showNotification === 'function') showNotification('图片不能超过5MB', 'warning');
                mediaInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function () {
                const preview = compose.querySelector('#pyq-media-preview');
                preview.innerHTML = '';
                const wrap = document.createElement('div');
                wrap.className = 'pyq-media-preview';
                wrap.innerHTML = '<img src="' + reader.result + '" alt=""><button class="pyq-media-remove" onclick="this.parentNode.remove();document.getElementById(\'pyq-compose\').dataset.hasImage=\'\'">×</button>';
                preview.appendChild(wrap);
                compose.dataset.hasImage = reader.result;
            };
            reader.readAsDataURL(file);
            mediaInput.value = '';
        });
    }

    /* ---------------- 打开 / 关闭 ---------------- */
    window.openPyq = function () {
        _buildUI();
        _render();
        // 清空未读红点
        _data.posts.forEach(function (p) {
            if (p.author === 'partner') p.unread = false;
        });
        _save();
        _updateBadge();
        const page = document.getElementById('pyq-page');
        if (page) {
            page.classList.add('show');
            // 封面背景
            const bg = document.getElementById('pyq-cover-bg');
            if (bg) {
                if (_bgImage) bg.style.backgroundImage = 'url("' + _bgImage + '")';
                else bg.style.backgroundImage = '';
            }
            const un = document.getElementById('pyq-cover-username');
            if (un) un.textContent = _myName();
            const av = document.getElementById('pyq-cover-avatar');
            if (av) av.innerHTML = _avatarHTML('me');
        }
    };
    window.closePyq = function () {
        const page = document.getElementById('pyq-page');
        if (page) page.classList.remove('show');
        window.closePyqCompose && window.closePyqCompose();
        window.closePyqComment && window.closePyqComment();
    };

    /* ---------------- 渲染动态流 ---------------- */
    function _render() {
        _buildUI();
        const feed = document.getElementById('pyq-feed');
        if (!feed) return;
        const posts = _data.posts.slice().sort(function (a, b) { return b.time - a.time; });
        if (!posts.length) {
            feed.innerHTML = '<div class="pyq-empty"><div class="pyq-empty-icon">📷</div>还没有动态<br>点击右上角相机，记录这一刻吧</div>';
            return;
        }
        feed.innerHTML = posts.map(function (p) {
            const author = p.author === 'me' ? 'me' : 'partner';
            const name = _nameOf(author);
            const likeMe = (p.likes || []).indexOf('me') > -1;
            // 图片九宫格
            let imgHTML = '';
            const imgs = (p.images || []).filter(Boolean);
            if (imgs.length > 0) {
                const cls = imgs.length === 1 ? 'one' : (imgs.length === 2 ? 'two' : imgs.length === 3 ? 'three' : imgs.length === 4 ? 'four' : imgs.length === 5 ? 'five' : imgs.length === 6 ? 'six' : 'nine');
                imgHTML = '<div class="pyq-images ' + cls + '">' + imgs.map(function (u) {
                    return '<div class="pyq-img-item"><img src="' + u + '" alt="" onclick="window.viewPyqImage(\'' + u.replace(/'/g, '') + '\')"></div>';
                }).join('') + '</div>';
            }
            // 赞
            let likesHTML = '';
            if ((p.likes || []).length > 0) {
                const names = p.likes.map(function (a) { return '<b>' + _esc(_nameOf(a)) + '</b>'; });
                likesHTML = '<div class="pyq-likes"><i>♥</i>' + names.join('，') + '</div>';
            }
            // 评论
            let cmtHTML = '';
            if ((p.comments || []).length > 0) {
                cmtHTML = '<div class="pyq-comments">' + p.comments.map(function (c) {
                    return '<div class="pyq-comment"><b>' + _esc(_nameOf(c.author)) + '</b>：' + _esc(c.text) + '</div>';
                }).join('') + '</div>';
            }
            const socialHTML = (likesHTML || cmtHTML)
                ? '<div class="pyq-social">' + likesHTML + cmtHTML + '</div>' : '';
            const deleteBtn = author === 'me'
                ? '<button class="pyq-card-delete" title="删除" onclick="window.deletePyqPost(\'' + p.id + '\')">×</button>' : '';
            return '<div class="pyq-card">'
                + '<div class="pyq-card-head">'
                + '<div class="pyq-avatar">' + _avatarHTML(author) + '</div>'
                + '<div class="pyq-card-head-main">'
                + '<div class="pyq-author">' + _esc(name) + '</div>'
                + '<div class="pyq-time"><span>' + _timeAgo(p.time) + '</span></div>'
                + '</div>'
                + deleteBtn
                + '</div>'
                + (p.text ? '<div class="pyq-text">' + _esc(p.text) + '</div>' : '')
                + imgHTML
                + '<div class="pyq-actions">'
                + '<button class="pyq-action-btn' + (likeMe ? ' liked' : '') + '" onclick="window.togglePyqLike(\'' + p.id + '\')"><span class="pyq-heart">' + (likeMe ? '♥' : '♡') + '</span>' + (likeMe ? '已赞' : '赞') + '</button>'
                + '<button class="pyq-action-btn" onclick="window.openPyqComment(\'' + p.id + '\')"><i class="fas fa-comment-dots" style="font-size:12px;"></i> 评论</button>'
                + '</div>'
                + socialHTML
                + '</div>';
        }).join('');
        _updateBadge();
    }

    /* ---------------- 发动态 ---------------- */
    window.openPyqCompose = function () {
        _buildUI();
        const compose = document.getElementById('pyq-compose');
        if (!compose) return;
        const text = compose.querySelector('#pyq-compose-text');
        const preview = compose.querySelector('#pyq-media-preview');
        text.value = '';
        preview.innerHTML = '';
        delete compose.dataset.hasImage;
        compose.classList.add('show');
        setTimeout(function () { try { text.focus(); } catch (e) {} }, 150);
    };
    window.closePyqCompose = function () {
        const compose = document.getElementById('pyq-compose');
        if (compose) compose.classList.remove('show');
    };
    window.submitPyqPost = function () {
        const compose = document.getElementById('pyq-compose');
        if (!compose) return;
        const text = compose.querySelector('#pyq-compose-text').value.trim();
        const img = compose.dataset.hasImage || null;
        if (!text && !img) {
            if (typeof showNotification === 'function') showNotification('写点什么再发表吧', 'warning', 2000);
            return;
        }
        _data.posts.unshift({
            id: _uid(),
            author: 'me',
            text: text,
            images: img ? [img] : [],
            time: Date.now(),
            likes: [],
            comments: [],
            unread: false
        });
        _save();
        _render();
        window.closePyqCompose();
        if (typeof showNotification === 'function') showNotification('已发表', 'success', 1800);
        // 对方可能点赞/评论
        setTimeout(function () { _partnerReactToLatest(); }, 3000 + Math.random() * 5000);
    };

    /* ---------------- 点赞 ---------------- */
    window.togglePyqLike = function (postId) {
        const p = _data.posts.find(function (x) { return String(x.id) === String(postId); });
        if (!p) return;
        if (!p.likes) p.likes = [];
        const idx = p.likes.indexOf('me');
        if (idx > -1) p.likes.splice(idx, 1);
        else p.likes.push('me');
        _save();
        _render();
    };

    /* ---------------- 评论 ---------------- */
    window.openPyqComment = function (postId) {
        _buildUI();
        _commentTargetId = postId;
        const bar = document.getElementById('pyq-comment-bar');
        const input = document.getElementById('pyq-comment-input');
        if (bar) bar.classList.add('show');
        if (input) { input.value = ''; setTimeout(function () { try { input.focus(); } catch (e) {} }, 120); }
    };
    window.closePyqComment = function () {
        const bar = document.getElementById('pyq-comment-bar');
        if (bar) bar.classList.remove('show');
        _commentTargetId = null;
    };
    window.submitPyqComment = function () {
        const input = document.getElementById('pyq-comment-input');
        const text = input ? input.value.trim() : '';
        if (!text || !_commentTargetId) return;
        const p = _data.posts.find(function (x) { return String(x.id) === String(_commentTargetId); });
        if (!p) return;
        if (!p.comments) p.comments = [];
        p.comments.push({ id: _uid(), author: 'me', text: text, time: Date.now() });
        _save();
        _render();
        window.closePyqComment();
    };

    /* ---------------- 删除 ---------------- */
    window.deletePyqPost = function (postId) {
        const idx = _data.posts.findIndex(function (x) { return String(x.id) === String(postId); });
        if (idx === -1) return;
        _data.posts.splice(idx, 1);
        _save();
        _render();
    };

    /* ---------------- 图片查看 ---------------- */
    window.viewPyqImage = function (url) {
        _buildUI();
        const viewer = document.getElementById('pyq-viewer');
        const img = document.getElementById('pyq-viewer-img');
        if (!viewer || !img) return;
        img.src = url;
        viewer.classList.add('show');
    };

    /* ---------------- 红点 ---------------- */
    function _updateBadge() {
        const badge = document.getElementById('pyq-header-badge');
        if (!badge) return;
        const unread = _data.posts.some(function (p) { return p.author === 'partner' && p.unread; });
        badge.style.display = unread ? 'block' : 'none';
    }

    /* ---------------- 对方活动 ---------------- */
    function _partnerText() {
        const pool = [];
        if (typeof customReplies !== 'undefined' && Array.isArray(customReplies)) {
            customReplies.filter(function (r) { return typeof r === 'string' && r.trim(); })
                .forEach(function (r) { pool.push(r.trim()); });
        }
        const source = pool.length ? pool : FALLBACK_POOL;
        return source[Math.floor(Math.random() * source.length)];
    }

    window._partnerPostMoment = function () {
        const text = _partnerText();
        let images = [];
        if (_bgImage && Math.random() < 0.45) images = [_bgImage];
        _data.posts.unshift({
            id: _uid(),
            author: 'partner',
            text: text,
            images: images,
            time: Date.now(),
            likes: [],
            comments: [],
            unread: true
        });
        _lastPartnerPost = Date.now();
        _save();
        _render();
        _updateBadge();
        // 对方发动态时，若页面未打开则通知
        const page = document.getElementById('pyq-page');
        if (!page || !page.classList.contains('show')) {
            if (typeof showNotification === 'function') {
                try { showNotification(_partnerName() + '发了一条朋友圈', 'info', 2600); } catch (e) {}
            }
        }
        if (typeof playSound === 'function') { try { playSound('message'); } catch (e) {} }
    };

    function _partnerReactToLatest() {
        // 只对最近一条"我"的动态互动
        const mine = _data.posts.find(function (p) { return p.author === 'me'; });
        if (!mine) return;
        const r = Math.random();
        if (r < 0.6) {
            if (!mine.likes) mine.likes = [];
            if (mine.likes.indexOf('partner') === -1) mine.likes.push('partner');
        }
        if (r < 0.35 || Math.random() < 0.3) {
            if (!mine.comments) mine.comments = [];
            const cmts = ['好喜欢你这条！', '拍得真好看～', '想你啦', '哈哈哈哈哈', '太可爱了吧'];
            mine.comments.push({
                id: _uid(), author: 'partner',
                text: cmts[Math.floor(Math.random() * cmts.length)], time: Date.now()
            });
        }
        _save();
        _render();
    }

    function _schedulePartnerActivity() {
        setInterval(function () {
            try {
                if (!_loaded) return;
                const now = Date.now();
                if (now < _pendingPartnerAt) return;
                if (now - _lastPartnerPost < 3 * 60 * 1000) return;
                if (Math.random() < 0.09) {
                    window._partnerPostMoment();
                    _pendingPartnerAt = now + (2 + Math.random() * 4) * 60 * 1000;
                }
            } catch (e) { console.warn('[朋友圈] 对方动态调度失败', e); }
        }, 60000);
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
                _updateBadge();
                // 首屏：较大概率对方很快就有一条新动态
                const firstDelay = 18 + Math.random() * 30;
                setTimeout(function () {
                    try {
                        if (Math.random() < 0.7) {
                            window._partnerPostMoment();
                            _pendingPartnerAt = Date.now() + (2 + Math.random() * 4) * 60 * 1000;
                        }
                    } catch (e) {}
                }, firstDelay * 1000);
            });
        });
        _schedulePartnerActivity();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }
})();
