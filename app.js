(async function () {
  'use strict';
  // Data source: the full dataset on this machine (local mode), or the guarded API (public site)
  var E = window.EatsEngine, CFG = window.EATS_CONFIG || {};
  var LIX = window.PLACES && E ? E.prepare({ meta: window.META, places: window.PLACES }) : null;
  var G = !LIX && CFG.api && window.WebgrsGuard ? WebgrsGuard.create({ api: CFG.api, sitekey: CFG.sitekey, site: 'eats' }) : null;
  if (!LIX && !G) { document.body.innerHTML = '<p style="padding:24px">No data: run the pipeline, or point data/config.js at the API.</p>'; return; }
  // Optional local-only extensions (defined in local.js, never published)
  var X = window.MEX || {};
  var DETAILS = null, detailsP = null;
  function loadDetails() {
    if (DETAILS) return Promise.resolve(DETAILS);
    if (!detailsP) detailsP = fetch('data/details.json').then(function (r) { return r.json(); }).then(function (d) { DETAILS = d; E.setDetails(LIX, d); return d; });
    return detailsP;
  }
  function ext() { return { tags: (X.tagOptions || []).map(function (o) { return o[0]; }), match: X.match }; }
  var DS = {
    remote: !LIX,
    meta: function () { return LIX ? Promise.resolve(E.metaOf(LIX)) : fetch(CFG.api.replace(/\/$/, '') + '/api/meta').then(function (r) { if (!r.ok) throw new Error('meta'); return r.json(); }); },
    search: function (q) { return LIX ? Promise.resolve(E.search(LIX, q, { ext: ext() })) : G.call('/api/search', { method: 'POST', body: q }); },
    place: function (id, q) { return LIX ? loadDetails().then(function () { return E.place(LIX, id, q); }) : G.call('/api/place', { method: 'POST', body: { id: id, q: q } }); },
    peek: function (ids) { return LIX ? Promise.resolve({ rows: E.peek(LIX, ids) }) : G.call('/api/peek', { method: 'POST', body: { ids: ids } }); },
    plat: function (q) { return LIX ? loadDetails().then(function () { return E.plat(LIX, q); }) : G.call('/api/plat', { method: 'POST', body: q }); }
  };
  if (G) G.session().catch(function () { /* retried on the first call */ });
  var M;
  try { M = await DS.meta(); } catch (e) {
    document.body.innerHTML = '<p style="padding:24px">The map could not load its data. Try again in a minute.</p>';
    return;
  }
  var META = M.meta || {}, COUNTS = M.counts || { kinds: {}, cuis: {}, tags: {} }, LOCAL = window.LOCAL || {};
  var CU = META.cuisines || {}, KI = META.kinds || {}, PLAT = META.plat || {}, TG = META.tags || {};
  // Local mode: the full record behind a row, for the local extensions
  function full(p) { return LIX ? LIX.byId.get(p.i) || p : p; }
  var PCODES = ['d', 'u', 'g', 'e', 't'];
  var SRC = { google: 'Google', dd: 'DoorDash', ue: 'Uber Eats', gh: 'Grubhub', es: 'EatStreet', toast: 'Toast' };
  var SRC_CODE = { dd: 'd', ue: 'u', gh: 'g', es: 'e', toast: 't' };
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('me:' + k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('me:' + k, v); } catch (e) { /* storage blocked */ } }
  };
  var lang = LS.get('lang', /^zh/i.test(navigator.language || '') ? 'zh' : 'en');

  var T = {
    zh: {
      tab_grid: '全部餐馆', tab_grid_s: '全部', tab_map: '地图', tab_map_s: '地图', tab_plat: '外卖平台', tab_plat_s: '外卖',
      back: '← 全部餐馆', map_of: '{n} 的位置', search_ph: '搜店名、菜系或菜名', search_ph2: '搜店名',
      open_now: '营业中', more_filters: '更多筛选', dist_from: '距离从', theme: '切换黑白',
      pick_title: '选菜系，可以多选', pick_clear: '清空', pick_done: '完成', cuis_n: '{a}等 {n} 种',
      open_short: '营业至 {t}', open_short24: '24 小时营业',
      all_kinds: '所有类型', all_cuis: '所有菜系', any_plat: '不限外卖平台', no_plat: '不在任何外卖平台', on: '能在 {p} 下单',
      any_tag: '任何场合', all_rated: '有没有评分都显示', rated: '只看有评分的', confident: '只看评分人数多的',
      sort_overall: '综合排序', sort_taste: '口味最好', sort_pop: '最有人气', sort_value: '最划算', sort_hyg: '卫生最好',
      sort_dist: '离我最近', sort_count: '评分人数最多',
      from_home: '家', from_gps: '我的位置', from_campus: '校园 Library Mall', from_capitol: '州议会',
      count: '{n} 家', more: '再显示 {n} 家', empty: '没有符合条件的店，换个关键词或者放宽筛选试试。', show_map: '地图', show_list: '列表',
      open_until: '营业中，{t} 关门', open_24: '24 小时营业', opens_at: '{d}{t} 开门', today: '今天 ', tomorrow: '明天 ',
      closed_today: '今天休息', perm_closed: '可能已永久关闭', temp_closed: '暂停营业', maybe_closed: '可能已关门或换店',
      taste: '口味', pop: '人气', value: '性价比', hyg: '卫生', conv: '方便', not_rated: '暂无评分',
      dishes: '推荐菜', dishes_note: '外卖平台上的热销菜和点过的人的好评率', hero_dish: '热销菜', liked: '{p}% 好评（{n} 人）', liked_s: '{p}% 好评',
      ratings: '各平台评分', hours: '营业时间',
      full: '完整分析', reviews: '顾客评价', reddit: 'Reddit 上的讨论', insp: '卫生检查', about: '数据来源和评分标准',
      call: '打电话', site: '官网', map_link: 'Google 地图', paused: '暂停', order_on: '在 {p} 下单',
      days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], no_hours: '没有营业时间数据，出门前先看 Google 地图。',
      dd_hours: 'DoorDash 今天的菜单时间：', reinsp: '需复检', ok_insp: '通过', insp_none: '没有找到这家店的卫生检查记录。',
      insp_link: '去县卫生局网站看完整报告', reddit_n: '{s} 赞', n_ratings: '{n} 条',
      src_osm: 'OpenStreetMap', src_phmdc: '县卫生局营业执照', src_uw: '威大餐饮', lic: '执照名称：', built: '数据更新于 {d}',
      host: '实际出餐：', age_r: '21 岁以上才能进', age_y: '晚上可能查 ID',
      how: '评分标准', how_body: [
        '口味（占综合分 50%）：Google、DoorDash、Uber Eats、Toast、EatStreet、Grubhub 的星级先换算成「在该平台麦迪逊所有店里的百分位」（各平台打分松紧不同），评分人数越少越往 50 拉，只有一个平台有分的再多拉一点；按平台之间的一致程度加权平均；再用外卖评论里夸或骂口味的比例（±6）、Reddit 上的评价倾向（±4）和获奖（最多 +10）微调。',
        '人气 15%：各平台评分人数、Reddit 提及次数、获奖。',
        '性价比 15%：口味 55% + 便宜程度 45%，便宜程度用热销主菜价格和同菜系的店比较。',
        '卫生 10%：县卫生局近 3 年的检查，每次常规检查「需复检」扣 18 分，复检又没过扣 12，投诉检查扣 6。',
        '方便 10%：能下单的外卖平台数、是否开到晚上 10 点、是否每天营业。',
        '缺项按剩下的权重重新分配。分数是和麦迪逊其他店比的相对分，50 大约是中位数。'
      ],
      p_count: '家能在这里下单', p_avg: '平均 ★{r}', p_excl: '{n} 家只在这里', p_title_sort: '排序',
      ps_overall: '按综合分', ps_count: '按能下单的平台数', ps_rating: '按 {p} 评分',
      plat_note: '格子里是该平台上的评分和评分人数，点一下直接去下单页。饭团、熊猫外卖只有 App，网页查不到；数据更新于 {d}。',
      px_head_same: '同一道菜，DoorDash 和 Uber Eats 大多同价', px_head_diff: '同一道菜，DoorDash 和 Uber Eats 常常不同价',
      px_body: '比了 {n} 家两边都能点的店：{s} 家菜价完全一样，{u} 家 Uber Eats 更贵，{d} 家 DoorDash 更贵，差价多在 {p}% 以内。真正拉开差距的是配送费、服务费和会员优惠，只在 App 结算时显示。下表「菜价低」标的是便宜的一边。',
      cheaper: '菜价低 {x}%',
      col_place: '店', col_score: '综合', none: '—', listed: '已下架', loading: '加载中…',
      err_quota: '今天能查看的数量用完了。为防止数据被批量复制，每个访客每天有上限，明天会恢复。',
      err_slow: '操作太快了，等几秒再试。', err_blocked: '这个浏览器的访问已被停止。如果你只是正常使用，请联系网站作者。',
      err_other: '数据暂时取不到，稍后再试。', err_gone: '没有这家店。',
      served: '为防止数据被批量复制，页面不会把全部数据一次发给浏览器，而是按需向服务器要：列表一次一页，店的详情点开才取，每个访客每天能看的数量有上限。每次请求会匿名记录（看了哪家店、用了哪些筛选和搜索词），用来改进页面和发现批量抓取。不记录姓名，IP 只存不可逆的哈希，不用 cookie；算距离用的位置会四舍五入到约 100 米，且不记录。'
    },
    en: {
      tab_grid: 'All places', tab_grid_s: 'All', tab_map: 'Map', tab_map_s: 'Map', tab_plat: 'Delivery apps', tab_plat_s: 'Delivery',
      back: '← All places', map_of: 'Where {n} is', search_ph: 'Name, cuisine or dish', search_ph2: 'Search by name',
      open_now: 'Open now', more_filters: 'More filters', dist_from: 'Distance from', theme: 'Switch black and white',
      pick_title: 'Cuisines: pick any', pick_clear: 'Clear', pick_done: 'Done', cuis_n: '{a} +{m}',
      open_short: 'open till {t}', open_short24: 'open 24h',
      all_kinds: 'All types', all_cuis: 'All cuisines', any_plat: 'Any delivery app', no_plat: 'Not on any app', on: 'Order on {p}',
      any_tag: 'Any occasion', all_rated: 'Rated or not', rated: 'Rated only', confident: 'Well-rated only',
      sort_overall: 'Best overall', sort_taste: 'Best taste', sort_pop: 'Most popular', sort_value: 'Best value', sort_hyg: 'Cleanest',
      sort_dist: 'Closest', sort_count: 'Most ratings',
      from_home: 'Home', from_gps: 'My location', from_campus: 'Campus (Library Mall)', from_capitol: 'Capitol',
      count: '{n} places', more: 'Show {n} more', empty: 'Nothing matches. Try another word or loosen the filters.', show_map: 'Map', show_list: 'List',
      open_until: 'Open until {t}', open_24: 'Open 24 hours', opens_at: 'Opens {d}{t}', today: '', tomorrow: 'tomorrow ',
      closed_today: 'Closed today', perm_closed: 'May be permanently closed', temp_closed: 'Temporarily closed', maybe_closed: 'May have closed or changed',
      taste: 'Taste', pop: 'Popularity', value: 'Value', hyg: 'Hygiene', conv: 'Convenience', not_rated: 'No ratings yet',
      dishes: 'Popular dishes', dishes_note: 'Best sellers on the delivery apps and how many buyers liked them', hero_dish: 'Best seller',
      liked: '{p}% liked ({n})', liked_s: '{p}% liked', ratings: 'Ratings by source',
      hours: 'Hours', full: 'Full analysis', reviews: 'Customer reviews', reddit: 'On r/madisonwi', insp: 'Health inspections',
      about: 'Sources and scoring', call: 'Call', site: 'Website', map_link: 'Google Maps', paused: 'paused', order_on: 'Order on {p}',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], no_hours: 'No hours on file; check Google Maps before you go.',
      dd_hours: 'DoorDash menu today: ', reinsp: 'Re-inspection required', ok_insp: 'Passed', insp_none: 'No inspection record found for this place.',
      insp_link: 'Full reports on the county site', reddit_n: '{s} upvotes', n_ratings: '{n}',
      src_osm: 'OpenStreetMap', src_phmdc: 'county food licence', src_uw: 'UW dining', lic: 'Licence name: ', built: 'Data from {d}',
      host: 'Cooked by: ', age_r: '21+ only', age_y: 'May check ID at night',
      how: 'How scores work', how_body: [
        'Taste (50% of overall): star ratings from Google, DoorDash, Uber Eats, Toast, EatStreet and Grubhub become percentiles among Madison places on the same app, since the apps grade differently. Few ratings pull toward 50, a single source pulls further, and sources are weighted by how well they agree. Taste words in delivery reviews (±6), the tone of r/madisonwi (±4) and awards (up to +10) adjust it.',
        'Popularity 15%: number of ratings, Reddit mentions, awards.',
        'Value 15%: 55% taste plus 45% cheapness, comparing the typical main dish with places of the same cuisine.',
        'Hygiene 10%: county inspections in the last 3 years: -18 for each routine visit that required a re-inspection, -12 for a failed re-inspection, -6 per complaint visit.',
        'Convenience 10%: delivery apps, open past 10 pm, open 7 days.',
        'Missing parts are left out and the rest rescaled. Scores are relative to other Madison places; 50 is about the median.'
      ],
      p_count: 'places you can order from', p_avg: 'avg ★{r}', p_excl: '{n} only here', p_title_sort: 'Sort',
      ps_overall: 'Best overall', ps_count: 'Most apps', ps_rating: '{p} rating',
      plat_note: 'Each cell shows that app’s rating and number of ratings; tap to order. Fantuan and HungryPanda are app-only and are not covered. Data from {d}.',
      px_head_same: 'Most places charge the same menu prices on DoorDash and Uber Eats', px_head_diff: 'Menu prices often differ between DoorDash and Uber Eats',
      px_body: 'Of {n} places on both apps, {s} charge exactly the same for the same items, {u} charge more on Uber Eats and {d} more on DoorDash, mostly within {p}%. Delivery and service fees and memberships make the real difference, and they only show at checkout. In the table, "Menu x% cheaper" marks the cheaper side.',
      cheaper: 'Menu {x}% cheaper',
      col_place: 'Place', col_score: 'Score', none: '—', listed: 'delisted', loading: 'Loading…',
      err_quota: "You have reached today's limit. To stop bulk copying, each visitor can look at a limited number per day; it resets tomorrow.",
      err_slow: 'Too many requests at once. Wait a few seconds and try again.', err_blocked: 'Access from this browser has been stopped. If that is a mistake, contact the site author.',
      err_other: 'The data could not be loaded. Try again shortly.', err_gone: 'No such place.',
      served: 'To stop bulk copying, this page never sends the whole dataset to the browser. It asks the server for what you look at: one page of the list at a time and a place only when you open it, with a daily limit per visitor. Each request is logged anonymously (which place, which filters and search words) to improve the page and spot scraping. No names are stored, IP addresses only as a one-way hash, and no cookies are set; the location used for distances is rounded to about 100 m and never logged.'
    }
  };
  function t(k, vars) {
    var s = (T[lang] && k in T[lang]) ? T[lang][k] : (k in T.en ? T.en[k] : k);
    if (vars && typeof s === 'string') Object.keys(vars).forEach(function (v) { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function fmtN(n) { return n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n); }

  // Message for a refused request (daily quota, too fast, blocked)
  function apiErrText(e) {
    var k = e && e.data && e.data.error;
    return t(k === 'quota' ? 'err_quota' : k === 'slow' ? 'err_slow' : k === 'blocked' ? 'err_blocked' : e && e.status === 404 ? 'err_gone' : 'err_other');
  }

  // ---------- time ----------
  var DOW = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  function chicagoNow() {
    var o = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false })
      .formatToParts(new Date()).forEach(function (x) { o[x.type] = x.value; });
    return { d: DOW[o.weekday], m: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }
  var NOW = chicagoNow();
  setInterval(function () { NOW = chicagoNow(); }, 60000);
  function hm(min) { min = ((min % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  function openState(p) {
    var w = p.h;
    if (!w) return null;
    var d = NOW.d, m = NOW.m, today = w[d] || [], yest = w[(d + 6) % 7] || [], i;
    for (i = 0; i < today.length; i++) if (m >= today[i][0] && m < today[i][1]) return { open: true, until: today[i][1], all: today[i][0] === 0 && today[i][1] >= 1440 };
    for (i = 0; i < yest.length; i++) if (yest[i][1] > 1440 && m + 1440 < yest[i][1]) return { open: true, until: yest[i][1] - 1440 };
    for (i = 0; i < today.length; i++) if (today[i][0] > m) return { open: false, next: today[i][0], day: 0 };
    for (var k = 1; k <= 7; k++) { var dd = w[(d + k) % 7] || []; if (dd.length) return { open: false, next: dd[0][0], day: k }; }
    return { open: false };
  }
  function statusText(p) {
    if (p.cl === 1) return t('perm_closed');
    if (p.cl === 2) return t('temp_closed');
    if (p.cl === 3) return t('maybe_closed');
    // Rows carry the server's open state; a full record has its weekly hours
    var s = p.h ? openState(p) : p.st;
    if (!s) return '';
    if (s.open) return s.all ? t('open_24') : t('open_until', { t: hm(s.until) });
    if (s.next == null) return t('closed_today');
    var day = s.day === 0 ? t('today') : s.day === 1 ? t('tomorrow') : (t('days')[(NOW.d + s.day) % 7] + ' ');
    return t('opens_at', { d: day, t: hm(s.next) });
  }

  // ---------- distance ----------
  var FROM = { campus: [43.0753, -89.3990], capitol: [43.0747, -89.3843] }, gps = null;
  function refPoint() {
    var f = $('f-from').value;
    if (f === 'home' && LOCAL.home) return [LOCAL.home.lat, LOCAL.home.lon];
    if (f === 'gps' && gps) return gps;
    return FROM[f] || FROM.campus;
  }
  function distLabel(k) {
    if (k == null) return '';
    var mins = Math.round(k * 1000 * 1.25 / 80);
    if (mins <= 25) return lang === 'zh' ? '步行 ' + mins + ' 分钟' : mins + ' min walk';
    return (k / 1.609).toFixed(1) + ' mi';
  }

  // ---------- labels ----------
  function cuisLabel(c) { return CU[c] ? CU[c][lang === 'zh' ? 0 : 1] : c; }
  function kindLabel(k) { return KI[k] ? KI[k][lang === 'zh' ? 0 : 1] : k; }
  function tier(v) { return v == null ? 'na' : v >= 80 ? 's1' : v >= 65 ? 's2' : 's3'; }
  function scoreHtml(v, big) { return '<span class="score ' + tier(v) + (big ? ' big' : '') + '">' + (v == null ? '—' : v) + '</span>'; }
  function initial(p) { var s = (p.z || p.n || '?').trim(); return esc(s.charAt(0).toUpperCase()); }
  function thumbHtml(p, cls) {
    return p.im ? '<img class="thumb ' + (cls || '') + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="" data-ini="' + initial(p) + '" src="' + esc(p.im) + '">'
      : '<span class="thumb ph ' + (cls || '') + '" aria-hidden="true">' + initial(p) + '</span>';
  }
  // A photo that fails to load becomes a letter tile (thumbnails) or disappears (hero, dishes)
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (!el || el.tagName !== 'IMG') return;
    if (el.classList.contains('thumb')) {
      var s = document.createElement('span');
      s.className = el.className + ' ph';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = el.getAttribute('data-ini') || '';
      el.replaceWith(s);
    } else if (el.closest('.hero')) {
      el.closest('.hero').remove();
    } else if (el.closest('.dish')) {
      el.replaceWith(Object.assign(document.createElement('div'), { className: 'noimg' }));
    } else if (el.closest('.cimg')) {
      el.replaceWith(Object.assign(document.createElement('span'), { className: 'ph', textContent: el.getAttribute('data-ini') || '' }));
    }
  }, true);
  // Cards show the same photo larger: ask each image host for 480 x 360 instead of the 240 x 240 thumbnail
  function bigImg(u) {
    return u.replace('width=240,height=240', 'width=480,height=360').replace('w=240&h=240', 'w=480&h=360')
      .replace('w_240,h_240', 'w_480,h_360').replace('=w240-h240-', '=w480-h360-');
  }
  function cardImg(p) {
    return '<div class="cimg">' + (p.im ? '<img loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="" data-ini="' + initial(p) + '" src="' + esc(bigImg(p.im)) + '">'
      : '<span class="ph" aria-hidden="true">' + initial(p) + '</span>') + scoreHtml(p.o) + '</div>';
  }
  // Up to three short points for a list row: cautions as solid tags, strengths in bold
  function hlHtml(p, pre) {
    var out = pre || '', prev = '';
    (p.hl || []).forEach(function (h) {
      var cls = h[2] < 0 ? 'warn' : h[2] > 0 ? 'good' : 'plain';
      if (prev && prev !== 'warn' && cls !== 'warn') out += '<i>·</i>';
      out += '<span class="' + cls + '">' + esc(lang === 'zh' ? h[0] : h[1]) + '</span>';
      prev = cls;
    });
    return out ? '<div class="hl">' + out + '</div>' : '';
  }
  // Bold the facts inside the generated sentences: the rank, and what reviewers praise or complain about
  function emph(x) {
    return esc(x).replace(/排第 (\d+)/, '排<b>第 $1</b>').replace(/^#(\d+)/, '<b>#$1</b>')
      .replace(/(常夸|吐槽)([^；。]+)/g, '$1<b>$2</b>').replace(/(Reviewers praise |[Cc]omplaints: )([^;.]+)/g, '$1<b>$2</b>');
  }
  // Cuisine · price · open until · distance (the distance is what gets cut on narrow screens)
  function metaHtml(p, op) {
    var parts = [(p.c || []).slice(0, 2).map(cuisLabel).join(' / ') || kindLabel(p.k), p.pr ? '$'.repeat(p.pr) : ''].filter(Boolean).map(esc);
    if (op) parts.push('<span class="op">' + esc(op) + '</span>');
    if (p.dk != null) parts.push(esc(distLabel(p.dk)));
    return parts.join(' · ');
  }

  // ---------- filters ----------
  function fillSelect(sel, opts, val) {
    sel.innerHTML = opts.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('');
    if (val != null && opts.some(function (o) { return o[0] === val; })) sel.value = val;
  }
  // Cuisine picker: tick any number; none ticked means all cuisines
  function cuisPicker(id, opts) {
    var btn = $(id), pop = $(id + '-pop'), picked = (opts.init || []).filter(function (c) { return CU[c]; }), timer = null;
    function label() {
      if (!picked.length) return t('all_cuis');
      var names = picked.map(cuisLabel);
      return names.length <= 2 ? names.join(lang === 'zh' ? '、' : ', ') : t('cuis_n', { a: names[0], n: names.length, m: names.length - 1 });
    }
    function sync() {
      btn.textContent = label();
      btn.classList.toggle('on', picked.length > 0);
      var clear = pop.querySelector('[data-act="clear"]');
      if (clear) clear.disabled = !picked.length;
    }
    function changed() {
      sync();
      clearTimeout(timer);
      // Several ticks in a row send one request
      timer = setTimeout(opts.onChange, DS.remote ? 350 : 60);
    }
    function grid() {
      var n = COUNTS.cuis;
      var list = Object.keys(CU).filter(function (c) { return n[c]; }).sort(function (a, b) { return n[b] - n[a]; });
      pop.innerHTML = '<div class="pick-head"><b>' + t('pick_title') + '</b><button type="button" class="linkish" data-act="clear">' + t('pick_clear') + '</button></div>' +
        '<div class="pick-grid">' + list.map(function (c) {
          return '<label class="ck"><input type="checkbox" value="' + esc(c) + '"' + (picked.indexOf(c) >= 0 ? ' checked' : '') + '><span>' + esc(cuisLabel(c)) + '</span>' +
            (opts.counts ? '<small>' + n[c] + '</small>' : '') + '</label>';
        }).join('') + '</div><div class="pick-foot"><button type="button" class="pick-done" data-act="done">' + t('pick_done') + '</button></div>';
      sync();
    }
    function show(on) {
      pop.hidden = !on;
      btn.setAttribute('aria-expanded', String(on));
      if (on) { grid(); var f = pop.querySelector('input'); if (f) f.focus({ preventScroll: true }); }
    }
    btn.addEventListener('click', function () { show(pop.hidden); });
    pop.addEventListener('change', function (e) {
      if (e.target.type !== 'checkbox') return;
      var c = e.target.value, k = picked.indexOf(c);
      if (e.target.checked && k < 0) picked.push(c);
      if (!e.target.checked && k >= 0) picked.splice(k, 1);
      changed();
    });
    pop.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.getAttribute('data-act') === 'clear') {
        picked = [];
        pop.querySelectorAll('input').forEach(function (x) { x.checked = false; });
        changed();
      } else { show(false); btn.focus(); }
    });
    return {
      get: function () { return picked.slice(); },
      open: function () { return !pop.hidden; },
      hide: function (focus) { if (!pop.hidden) { show(false); if (focus) btn.focus(); } },
      owns: function (el) { return btn.parentNode.contains(el); },
      redraw: function () { if (pop.hidden) sync(); else grid(); }
    };
  }
  var cuisPick = cuisPicker('f-cuis', { counts: true, init: LS.get('cuis', '').split(','), onChange: function () { apply(); } });
  var platPick = cuisPicker('p-cuis', { onChange: function () { loadPlat(); } });
  function buildFilters() {
    var kinds = COUNTS.kinds, tcount = COUNTS.tags;
    cuisPick.redraw();
    platPick.redraw();
    fillSelect($('f-sort'), [['overall', t('sort_overall')], ['taste', t('sort_taste')], ['pop', t('sort_pop')], ['value', t('sort_value')],
      ['hyg', t('sort_hyg')], ['dist', t('sort_dist')], ['count', t('sort_count')]], LS.get('sort', 'overall'));
    fillSelect($('f-kind'), [['', t('all_kinds')]].concat(['restaurant', 'fast_food', 'cafe', 'dessert', 'bar', 'cart', 'market', 'virtual']
      .filter(function (k) { return kinds[k]; }).map(function (k) { return [k, kindLabel(k)]; })), LS.get('kind', ''));
    var tagOpts = [['', t('any_tag')]].concat(Object.keys(TG).filter(function (g) { return tcount[g]; }).map(function (g) { return [g, TG[g][lang === 'zh' ? 0 : 1]]; }));
    (X.tagOptions || []).forEach(function (o) { tagOpts.push([o[0], lang === 'zh' ? o[1] : o[2]]); });
    fillSelect($('f-tag'), tagOpts, LS.get('tag', ''));
    fillSelect($('f-plat'), [['', t('any_plat')]].concat(PCODES.map(function (c) { return [c, t('on', { p: PLAT[c] })]; })).concat([['none', t('no_plat')]]), LS.get('plat', ''));
    fillSelect($('f-rated'), [['', t('all_rated')], ['rated', t('rated')], ['conf', t('confident')]], LS.get('rated', ''));
    var fopts = [];
    if (LOCAL.home) fopts.push(['home', LOCAL.home.name || t('from_home')]);
    fopts.push(['campus', t('from_campus')], ['capitol', t('from_capitol')], ['gps', t('from_gps')]);
    fillSelect($('f-from'), fopts, LS.get('from', LOCAL.home ? 'home' : 'campus'));
    var ps = [['overall', t('ps_overall')], ['napps', t('ps_count')]].concat(PCODES.map(function (c) { return ['r' + c, t('ps_rating', { p: PLAT[c] })]; }));
    fillSelect($('p-sort'), ps, $('p-sort').value || 'overall');
  }
  // ---------- list (one page at a time from the data source) ----------
  var view = [], total = 0, marks = [], markById = {}, names = {}, sel = null, cur = null, seq = 0;
  function seed(r) { names[r.i] = { n: r.n, o: r.o }; }
  function queryParams(offset) {
    return {
      text: $('q').value.trim(), kind: $('f-kind').value, cuis: cuisPick.get(), plat: $('f-plat').value, tag: $('f-tag').value,
      open: $('f-open').getAttribute('aria-pressed') === 'true', rated: $('f-rated').value, sort: $('f-sort').value,
      ref: refPoint(), from: $('f-from').value, offset: offset || 0
    };
  }
  function moreLabel() {
    var moreN = ['f-kind', 'f-tag', 'f-plat', 'f-rated'].filter(function (id) { return $(id).value; }).length;
    $('f-more').textContent = t('more_filters') + (moreN ? ' · ' + moreN : '');
  }
  function apply() {
    var q = queryParams(0);
    ['kind', 'cuis', 'plat', 'sort', 'tag', 'rated'].forEach(function (k) { LS.set(k, q[k]); });
    LS.set('from', q.from);
    moreLabel();
    var my = ++seq;
    if (!view.length) $('count').textContent = $('gcount').textContent = t('loading');
    DS.search(q).then(function (r) {
      if (my !== seq) return;
      view = r.rows; total = r.total; marks = r.markers || [];
      markById = {};
      marks.forEach(function (m) { markById[m[0]] = m; });
      view.forEach(seed);
      renderList();
      renderMarkers();
    }, function (e) {
      if (my !== seq) return;
      $('count').textContent = $('gcount').textContent = '';
      $('list').innerHTML = $('grid').innerHTML = '<li class="empty">' + esc(apiErrText(e)) + '</li>';
      $('gmore').hidden = true;
    });
  }
  function loadMore(btn) {
    var my = seq;
    btn.disabled = true;
    DS.search(queryParams(view.length)).then(function (r) {
      if (my !== seq) return;
      r.rows.forEach(seed);
      view = view.concat(r.rows);
      renderList();
    }, function (e) { btn.disabled = false; btn.textContent = apiErrText(e); });
  }
  function renderList() {
    $('count').textContent = t('count', { n: total.toLocaleString() });
    var html = view.map(function (p) {
      var st = p.st, open = st && st.open && !p.cl;
      var op = open ? (st.all ? t('open_short24') : t('open_short', { t: hm(st.until) })) : '';
      return '<li class="item' + (sel === p.i ? ' sel' : '') + '" data-i="' + p.i + '">' + thumbHtml(p) +
        '<div class="body"><div class="nm">' + esc(p.n) + (p.z ? '<span class="zh">' + esc(p.z) + '</span>' : '') + '</div>' +
        hlHtml(p, X.badge ? X.badge(full(p), lang) : '') + '<div class="meta">' + metaHtml(p, op) + '</div>' +
        (p.cl ? '<div class="flag">' + esc(statusText(p)) + '</div>' : '') +
        '</div>' + scoreHtml(p.o) + '</li>';
    }).join('');
    if (total > view.length) html += '<li><button class="more-btn" id="more">' + t('more', { n: Math.min(60, total - view.length) }) + '</button></li>';
    if (!view.length) html = '<li class="empty">' + t('empty') + '</li>';
    $('list').innerHTML = html;
    var mb = $('more');
    if (mb) mb.onclick = function (e) { e.stopPropagation(); loadMore(mb); };
    renderGrid();
  }
  // Full-width cards from the same results; a card is a link, so the browser's back button returns here
  function renderGrid() {
    $('gcount').textContent = t('count', { n: total.toLocaleString() });
    $('grid').innerHTML = view.length ? view.map(function (p) {
      var st = p.st, open = st && st.open && !p.cl;
      var op = open ? (st.all ? t('open_short24') : t('open_short', { t: hm(st.until) })) : '';
      return '<li><a class="card" href="#p=' + p.i + '">' + cardImg(p) + '<div class="cbody"><div class="nm">' + esc(p.n) +
        (p.z ? '<span class="zh">' + esc(p.z) + '</span>' : '') + '</div>' + hlHtml(p, X.badge ? X.badge(full(p), lang) : '') +
        '<div class="meta">' + metaHtml(p, op) + '</div>' + (p.cl ? '<div class="flag">' + esc(statusText(p)) + '</div>' : '') + '</div></a></li>';
    }).join('') : '<li class="empty">' + t('empty') + '</li>';
    var gm = $('gmore'), left = total - view.length;
    gm.hidden = left <= 0;
    gm.disabled = false;
    if (left > 0) gm.textContent = t('more', { n: Math.min(60, left) });
  }

  // ---------- map ----------
  function tiles(attr) {
    return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: attr });
  }
  var map = L.map('map', { preferCanvas: true }).setView([43.0731, -89.4012], 13);
  tiles('Tiles &copy; Esri &middot; Data: OpenStreetMap, PHMDC, Google, DoorDash, Uber Eats, Toast, EatStreet, Grubhub').addTo(map);
  var layer = L.layerGroup().addTo(map), markers = {};
  var legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () { var d = L.DomUtil.create('div', 'legend'); d.id = 'legend'; return d; };
  legend.addTo(map);
  function dark() {
    var th = document.documentElement.getAttribute('data-theme');
    if (th) return th === 'dark';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  var TIERS = ['na', 's3', 's2', 's1'];
  function markerStyle(tr, on) {
    var ink = dark() ? '#fff' : '#000', paper = dark() ? '#000' : '#fff';
    if (on) return { radius: 10, weight: 3, color: paper, fillColor: ink, fillOpacity: 1 };
    if (tr === 's1') return { radius: 7, weight: 1.5, color: paper, fillColor: ink, fillOpacity: 1 };
    if (tr === 's2') return { radius: 6, weight: 2, color: ink, fillColor: paper, fillOpacity: 1 };
    if (tr === 's3') return { radius: 4.5, weight: 1, color: paper, fillColor: '#8C8C8C', fillOpacity: 1 };
    return { radius: 3, weight: 1, color: '#8C8C8C', fillColor: paper, fillOpacity: 1 };
  }
  function renderLegend() {
    var ink = dark() ? '#fff' : '#000', paper = dark() ? '#000' : '#fff';
    $('legend').innerHTML = '<span><i style="background:' + ink + '"></i>80+</span><span><i style="background:' + paper + ';border:2px solid ' + ink +
      '"></i>65–79</span><span><i style="background:#8C8C8C"></i>&lt;65</span><span><i style="background:' + paper + ';border:1px solid #8C8C8C"></i>' + t('not_rated') + '</span>';
  }
  function tipText(i) { var nm = names[i]; return nm ? esc(nm.n) + (nm.o != null ? '  ' + nm.o : '') : '…'; }
  function renderMarkers() {
    layer.clearLayers();
    markers = {};
    marks.forEach(function (mk) {
      var i = mk[0], m = L.circleMarker([mk[1], mk[2]], markerStyle(TIERS[mk[3]], sel === i));
      m.bindTooltip(function () { return tipText(i); }, { className: 'tip', direction: 'top', offset: [0, -6] });
      // Names of places beyond the loaded list page are fetched on hover
      m.on('mouseover', function () {
        if (names[i]) return;
        DS.peek([i]).then(function (r) { r.rows.forEach(function (x) { names[x[0]] = { n: x[1], o: x[2] }; }); m.setTooltipContent(tipText(i)); }, function () { /* tooltip stays '…' */ });
      });
      m.on('click', function () { openPlace(i, true); });
      m.addTo(layer);
      markers[i] = m;
    });
  }
  function restyle(i) {
    var m = markers[i], mk = markById[i];
    if (!m || !mk) return;
    m.setStyle(markerStyle(TIERS[mk[3]], sel === i));
    if (sel === i) m.bringToFront();
  }

  // ---------- details ----------
  function openPlace(i, fromMap) {
    var prev = sel;
    sel = (prev === i && fromMap) ? null : i;
    if (sel === null) { closeDrawer(); return; }
    document.querySelectorAll('.item.sel').forEach(function (el) { el.classList.remove('sel'); });
    var li = document.querySelector('.item[data-i="' + i + '"]');
    if (li) { li.classList.add('sel'); if (fromMap) li.scrollIntoView({ block: 'nearest' }); }
    restyle(prev); restyle(i);
    var mk = markById[i];
    if (mk && !fromMap) map.setView([mk[1], mk[2]], Math.max(map.getZoom(), 15), { animate: false });
    try { history.replaceState(null, '', '#p=' + i); } catch (e) { /* file url */ }
    var dr = $('drawer');
    dr.hidden = false;
    document.body.classList.add('drawer-open');
    dr.innerHTML = '<div class="dbody"><h2>' + esc(names[i] ? names[i].n : '') + '</h2><p class="src">' + t('loading') + '</p></div>';
    DS.place(i, { ref: refPoint() }).then(function (r) {
      if (sel !== i) return;
      if (!r) throw Object.assign(new Error('gone'), { status: 404 });
      cur = r;
      if (!mk && r.p.la != null && !fromMap) map.setView([r.p.la, r.p.lo], Math.max(map.getZoom(), 15), { animate: false });
      renderDrawer(r.p, r.d);
    }).catch(function (e) {
      if (sel !== i) return;
      dr.innerHTML = '<div class="close-wrap"><button class="close" id="dclose" aria-label="Close">×</button></div><div class="dbody"><p>' + esc(apiErrText(e)) + '</p></div>';
      $('dclose').onclick = closeDrawer;
    });
  }
  function closeDrawer() {
    var prev = sel;
    sel = null;
    $('drawer').hidden = true;
    document.body.classList.remove('drawer-open');
    restyle(prev);
    document.querySelectorAll('.item.sel').forEach(function (el) { el.classList.remove('sel'); });
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file url */ }
  }
  function fmtPhone(s) {
    var d = String(s).replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : s;
  }
  function gmapsUrl(p, d) {
    if (d.gp) return 'https://www.google.com/maps/place/?q=place_id:' + d.gp;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.n + ' ' + (p.a || '') + ' ' + (p.t || 'Madison') + ' WI');
  }
  function dishMeta(x, short) {
    var m = /(\d+)%\s*\((\d+)\)/.exec(x[4] || '');
    var liked = m ? t(short ? 'liked_s' : 'liked', { p: m[1], n: m[2] }) : x[4] || '';
    return [x[2] ? '$' + Number(x[2]).toFixed(2) : '', liked].filter(Boolean).join(' · ');
  }
  function fold(title, body, note) {
    return '<details class="fold"><summary>' + esc(title) + (note ? '<small>' + esc(note) + '</small>' : '') + '</summary><div class="fold-body">' + body + '</div></details>';
  }
  // Pieces of a place's detail, shared by the map's side panel and the full-width page
  function detailParts(p, d) {
    var o = {}, h = [];
    // The big photo is the top dish when there is one, captioned; the dish row then starts at the next one
    var dp = d.dp || [], hd = !!(d.hd && d.hero && dp.length), rest = hd ? dp.slice(1) : dp;
    o.hero = '';
    if (d.hero) {
      var cap = hd ? '<figcaption><small>' + t('hero_dish') + '</small><b>' + esc(dp[0][0]) + (dp[0][1] ? ' ' + esc(dp[0][1]) : '') + '</b>' +
        (dishMeta(dp[0]) ? '<span>' + esc(dishMeta(dp[0])) + '</span>' : '') + '</figcaption>' : '';
      o.hero = '<figure class="hero"><img src="' + esc(d.hero) + '" alt="" referrerpolicy="no-referrer">' + cap + '</figure>';
    }
    var sub = [(p.c || []).map(cuisLabel).join(' / ') || kindLabel(p.k), p.pr ? '$'.repeat(p.pr) : ''].filter(Boolean).join(' · ');
    var st = statusText(p);
    o.addr = '<div class="dline">' + (p.a ? esc(p.a) + ' · ' : '') + '<a href="' + gmapsUrl(p, d) + '" target="_blank" rel="noopener">' + t('map_link') + '</a>' +
      (p.dk != null ? ' · <span class="dist">' + distLabel(p.dk) + '</span>' : '') + '</div>';
    // The page shows the address under its small map instead
    o.head = function (withAddr) {
      return '<div class="dhead"><div><h2>' + esc(p.n) + '</h2>' + (p.z ? '<div class="zh2">' + esc(p.z) + '</div>' : '') +
        '<div class="dline">' + esc(sub) + '</div>' + (withAddr ? o.addr : '') + (st ? '<div class="dline st">' + esc(st) + '</div>' : '') + '</div>' + scoreHtml(p.o, true) + '</div>';
    };
    // The verdict sits right under the name: warnings, the one-line verdict, then rank and what reviewers say
    var an = (d.an && d.an[lang]) || [], nk = d.an ? d.an.k : an.length, nw = d.an ? d.an.w || 0 : 0;
    o.verdict = nk ? '<section class="verdict">' + an.slice(0, nw).map(function (x) { return '<p class="warn">' + esc(x) + '</p>'; }).join('') +
      (nk > nw ? '<p class="lead">' + esc(an[nw]) + '</p>' : '') +
      an.slice(nw + 1, nk).map(function (x) { return '<p>' + emph(x) + '</p>'; }).join('') + '</section>' : '';
    var tags = (p.tg || []).map(function (g) { return TG[g] ? TG[g][lang === 'zh' ? 0 : 1] : g; });
    if (p.ag === 'r' || p.ag === 'y') tags.push(t(p.ag === 'r' ? 'age_r' : 'age_y'));
    o.tags = tags.length ? '<div class="tags">' + tags.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>' : '';
    // Order
    var acts = (d.lk || []).map(function (l, k) {
      return '<a class="act' + (k === 0 && l[2] ? ' primary' : '') + (l[2] ? '' : ' off') + '" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' +
        esc(SRC[l[0]]) + (l[2] ? '' : ' · ' + t('paused')) + '</a>';
    });
    if (d.ph) acts.push('<a class="act" href="tel:' + esc(d.ph.replace(/[^\d+]/g, '')) + '">' + t('call') + '</a>');
    if (d.w) acts.push('<a class="act" href="' + esc(d.w) + '" target="_blank" rel="noopener">' + t('site') + '</a>');
    o.actions = acts.length ? '<div class="actions">' + acts.join('') + '</div>' : '';
    o.host = d.host ? '<p class="dline">' + t('host') + esc(d.host) + '</p>' : '';
    // Dishes with photos
    o.dishes = '';
    if (rest.length) {
      o.dishes = ('<section class="sec"><h3>' + t('dishes') + '</h3><div class="dishrow">' + rest.map(function (x) {
        var meta = dishMeta(x, true);
        return '<div class="dish">' + (x[3] ? '<img loading="lazy" referrerpolicy="no-referrer" alt="" src="' + esc(x[3]) + '">' : '<div class="noimg"></div>') +
          '<div class="dn">' + esc(x[0]) + '</div>' + (x[1] ? '<div class="dz">' + esc(x[1]) + '</div>' : '') + (meta ? '<div class="dm">' + esc(meta) + '</div>' : '') + '</div>';
      }).join('') + '</div><p class="src">' + t('dishes_note') + '</p></section>');
    } else if ((d.ds || []).length) {
      o.dishes = ('<section class="sec"><h3>' + t('dishes') + '</h3><ul class="dishlist">' + d.ds.map(function (x) {
        return '<li><span>' + esc(x[0]) + (x[1] ? ' ' + esc(x[1]) : '') + '</span><span>' + (x[2] ? '$' + Number(x[2]).toFixed(2) : '') + '</span></li>';
      }).join('') + '</ul></section>');
    }
    // Five scores: strong ones solid, weak ones faded
    var labels = ['taste', 'pop', 'value', 'hyg', 'conv'];
    o.metrics = '<div class="metrics">' + labels.map(function (k, j) {
      var v = p.s ? p.s[j] : null, lv = v == null ? '' : v >= 80 ? ' hi' : v < 50 ? ' lo' : '';
      return '<div class="metric' + lv + '"><b>' + (v == null ? '—' : v) + '</b><span>' + t(k) + '</span><i><u style="width:' + (v || 0) + '%"></u></i></div>';
    }).join('') + '</div>';
    o.ext = X.drawer ? X.drawer(full(p), d, lang) || '' : '';
    // Folded details
    if ((d.rt || []).length) {
      h.push(fold(t('ratings'), '<table class="rtab">' + d.rt.map(function (r) {
        return '<tr><td>' + (r[3] ? '<a href="' + esc(r[3]) + '" target="_blank" rel="noopener">' + SRC[r[0]] + '</a>' : SRC[r[0]]) + '</td><td class="num">★ ' + Number(r[1]).toFixed(1) +
          '</td><td class="num">' + (r[0] === 'google' ? '' : t('n_ratings', { n: Number(r[2]).toLocaleString() })) + '</td></tr>';
      }).join('') + '</table>'));
    }
    if (p.h) {
      h.push(fold(t('hours'), '<table class="hours">' + p.h.map(function (iv, j) {
        return '<tr' + (j === NOW.d ? ' class="today"' : '') + '><td>' + t('days')[j] + '</td><td>' + (iv.length ? iv.map(function (x) { return hm(x[0]) + '–' + (x[1] >= 1440 && x[0] === 0 ? '24:00' : hm(x[1])); }).join(', ') : '—') + '</td></tr>';
      }).join('') + '</table>' + (d.ddh ? '<p class="src">' + t('dd_hours') + esc(d.ddh) + '</p>' : ''), st));
    } else {
      h.push(fold(t('hours'), '<p class="src">' + (d.ddh ? t('dd_hours') + esc(d.ddh) + '<br>' : '') + (d.ho ? esc(d.ho) + '<br>' : '') + t('no_hours') + '</p>'));
    }
    if (an.length > nk) h.push(fold(t('full'), '<ul>' + an.slice(nk).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'));
    if ((d.rv || []).length) {
      h.push(fold(t('reviews'), d.rv.map(function (r) {
        return '<blockquote class="quote">' + esc(r[3]) + '<div class="qm">' + SRC[r[0]] + (r[1] ? ' · ' + '★'.repeat(r[1]) : '') + (r[2] ? ' · ' + esc(r[2]) : '') + '</div></blockquote>';
      }).join(''), String(d.rv.length)));
    }
    if ((d.rd || []).length) {
      h.push(fold(t('reddit'), d.rd.map(function (r) {
        var meta = '<a href="' + esc(r[4]) + '" target="_blank" rel="noopener">' + esc(r[3] || 'Reddit') + '</a> · ' + esc(r[1]) + ' · ' + t('reddit_n', { s: r[0] });
        return r[2] ? '<blockquote class="quote">' + esc(r[2]) + '<div class="qm">' + meta + '</div></blockquote>' : '<p class="src">' + meta + '</p>';
      }).join('')));
    }
    h.push(fold(t('insp'), ((d.in || []).length ? '<ul class="insp">' + d.in.map(function (x) {
      var bad = /^Reinspection Required/.test(x[2]);
      return '<li>' + esc(x[1]) + ' · ' + esc(x[0]) + ' · <span class="' + (bad ? 'bad' : '') + '">' + (bad ? t('reinsp') : t('ok_insp')) + '</span></li>';
    }).join('') + '</ul>' : '<p class="src">' + t('insp_none') + '</p>') +
      '<p class="src"><a href="https://publichealthmdc.com/healthinspections/" target="_blank" rel="noopener">' + t('insp_link') + '</a></p>'));
    var srcs = (d.src || []).map(function (s) { return s === 'osm' ? t('src_osm') : s === 'uw' ? t('src_uw') : t('src_phmdc'); });
    (d.rt || []).forEach(function (r) { if (srcs.indexOf(SRC[r[0]]) < 0) srcs.push(SRC[r[0]]); });
    h.push(fold(t('about'), '<div class="howbox"><p>' + esc(srcs.join(' · ')) + (d.lic ? '<br>' + t('lic') + esc(d.lic) : '') + '<br>' + t('built', { d: META.built || '' }) + '</p>' +
      t('how_body').map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + (DS.remote ? '<p>' + esc(t('served')) + '</p>' : '') + '</div>'));
    o.folds = h.join('');
    return o;
  }
  function renderDrawer(p, d) {
    var o = detailParts(p, d), dr = $('drawer');
    dr.innerHTML = '<div class="close-wrap"><button class="close" id="dclose" aria-label="Close">×</button></div>' + o.hero +
      '<div class="dbody">' + o.head(true) + o.verdict + o.tags + o.actions + o.host + o.dishes + o.metrics + o.ext + o.folds + '</div>';
    dr.scrollTop = 0;
    $('dclose').onclick = closeDrawer;
  }

  // ---------- full-width page (grid view): the place on the left, a small map and the ways to order on the right ----------
  var gmap = null, gmark = null, pageId = null, pageNav = false, TITLE = document.title;
  function pageBar() { return '<div class="gp-bar"><button class="back" id="gback" type="button">' + esc(t('back')) + '</button></div>'; }
  function renderPage(p, d) {
    var o = detailParts(p, d), g = $('gpage');
    var loc = p.la != null ? '<div class="gp-map" id="gmap" role="img" aria-label="' + esc(t('map_of', { n: p.n })) + '"></div>' : '';
    g.innerHTML = pageBar() + '<div class="gp"><div class="gp-main"><div class="gp-hero">' + o.hero + '</div>' +
      '<div class="gp-head">' + o.head(false) + o.verdict + o.tags + '</div>' +
      '<div class="gp-body">' + o.dishes + o.ext + o.folds + '</div></div>' +
      '<aside class="gp-side">' + loc + o.addr + o.actions + o.host + o.metrics + '</aside></div>';
    $('gback').onclick = leavePage;
    if (loc) miniMap(p);
  }
  function miniMap(p) {
    if (gmap) gmap.remove();
    // Page scrolling stays page scrolling: no wheel zoom, and no dragging on touch screens
    gmap = L.map('gmap', { scrollWheelZoom: false, dragging: !L.Browser.mobile }).setView([p.la, p.lo], 16);
    tiles('Tiles &copy; Esri').addTo(gmap);
    gmark = L.circleMarker([p.la, p.lo], markerStyle('s1', true)).addTo(gmap);
  }
  function openPage(i, nav) {
    pageId = i;
    pageNav = !!nav;
    var g = $('gpage');
    g.hidden = false;
    g.scrollTop = 0;
    document.body.classList.add('page-open');
    g.innerHTML = pageBar() + '<div class="gp"><div class="gp-head"><h2>' + esc(names[i] ? names[i].n : '') + '</h2><p class="src">' + t('loading') + '</p></div></div>';
    $('gback').onclick = leavePage;
    DS.place(i, { ref: refPoint() }).then(function (r) {
      if (pageId !== i) return;
      if (!r) throw Object.assign(new Error('gone'), { status: 404 });
      cur = r;
      renderPage(r.p, r.d);
      document.title = r.p.n + ' · ' + TITLE;
    }).catch(function (e) {
      if (pageId !== i) return;
      g.innerHTML = pageBar() + '<div class="gp"><div class="gp-head"><p>' + esc(apiErrText(e)) + '</p></div></div>';
      $('gback').onclick = leavePage;
    });
  }
  function closePage() {
    if (pageId == null) return;
    pageId = null;
    if (gmap) { gmap.remove(); gmap = gmark = null; }
    $('gpage').hidden = true;
    $('gpage').innerHTML = '';
    document.body.classList.remove('page-open');
    document.title = TITLE;
  }
  // Back undoes the card click; a page opened from a shared link just closes
  function leavePage() {
    if (pageNav) { history.back(); return; }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file url */ }
    closePage();
  }

  // ---------- delivery apps ----------
  // PS: the last answer (cards and price check come with the first page; rows grow with "more")
  var pfilter = '', PS = null, pseq = 0;
  function platQuery(offset) { return { pf: pfilter, text: $('pq').value.trim(), cuis: platPick.get(), sort: $('p-sort').value, offset: offset || 0 }; }
  function loadPlat() {
    var my = ++pseq;
    if (!PS) $('plat-list').innerHTML = '<p class="plat-note">' + t('loading') + '</p>';
    DS.plat(platQuery(0)).then(function (r) {
      if (my !== pseq) return;
      PS = r;
      drawPlat();
    }, function (e) {
      if (my !== pseq) return;
      $('plat-list').innerHTML = '<p class="plat-note">' + esc(apiErrText(e)) + '</p>';
    });
  }
  function morePlat(btn) {
    var my = pseq;
    btn.disabled = true;
    DS.plat(platQuery(PS.rows.length)).then(function (r) {
      if (my !== pseq) return;
      PS.rows = PS.rows.concat(r.rows);
      drawPlat();
    }, function (e) { btn.disabled = false; btn.textContent = apiErrText(e); });
  }
  function drawPlat() {
    if (!PS) return;
    // Cards
    $('plat-cards').innerHTML = (PS.cards || []).map(function (x) {
      var c = x[0], avg = x[2] == null ? '' : x[2].toFixed(2);
      return '<button class="pcard" type="button" data-c="' + c + '" aria-pressed="' + (pfilter === c) + '"><div class="pn">' + PLAT[c] + '</div>' +
        '<div class="pbig">' + x[1].toLocaleString() + '</div><div class="psub">' + t('p_count') + '</div>' +
        '<div class="psub">' + (avg ? t('p_avg', { r: avg }) + ' · ' : '') + t('p_excl', { n: x[3] }) + '</div></button>';
    }).join('');
    // Same dish, DoorDash vs Uber Eats (px = Uber Eats vs DoorDash, %)
    var px = PS.price || { n: 0 };
    $('plat-price').innerHTML = px.n < 20 ? '' : '<b>' + t(px.same / px.n >= 0.6 ? 'px_head_same' : 'px_head_diff') + '</b><p>' +
      esc(t('px_body', { n: px.n.toLocaleString(), s: px.same.toLocaleString(), u: px.ued, d: px.ddd, p: px.p90 })) + '</p>';
    $('plat-note').textContent = t('plat_note', { d: META.built || '' });
    var head = '<div class="prow head"><span></span><span>' + t('col_place') + '</span><span>' + t('col_score') + '</span><div class="pcells">' +
      PCODES.map(function (c) { return '<span>' + PLAT[c] + '</span>'; }).join('') + '</div></div>';
    var body = PS.rows.map(function (p) {
      var cells = PCODES.map(function (c) {
        var l = p.cells[c];
        if (!l) return '<div class="pcell nil"><span class="no">—</span></div>';
        if (!l[1]) return '<div class="pcell"><span class="paused"><span class="pa">' + PLAT[c] + ' · </span>' + t('listed') + '</span></div>';
        // App name (.pa) only shows on phones, where the column headers are hidden
        var label = l[2] != null ? '<span class="pa">' + PLAT[c] + ' </span>★ ' + Number(l[2]).toFixed(1) : PLAT[c];
        var cheap = p.px && c === (p.px > 0 ? 'd' : 'u') ? '<small class="cheap">' + t('cheaper', { x: Math.abs(p.px) }) + '</small>' : '';
        return '<div class="pcell"><a href="' + esc(l[0]) + '" target="_blank" rel="noopener" title="' + esc(t('order_on', { p: PLAT[c] })) + '">' + label + '</a>' +
          (l[3] != null ? '<small>' + (lang === 'zh' ? fmtN(l[3]) + ' 条评分' : fmtN(l[3]) + ' ratings') + '</small>' : '') + cheap + '</div>';
      }).join('');
      return '<div class="prow" data-i="' + p.i + '">' + thumbHtml(p) + '<div class="pname"><b>' + esc(p.n) + (p.z ? ' ' + esc(p.z) : '') + '</b><span>' +
        esc([(p.c || []).slice(0, 2).map(cuisLabel).join(' / '), p.pr ? '$'.repeat(p.pr) : ''].filter(Boolean).join(' · ')) + '</span></div>' +
        scoreHtml(p.o) + '<div class="pcells">' + cells + '</div></div>';
    }).join('');
    $('plat-list').innerHTML = head + body + (PS.total > PS.rows.length ? '<button class="more-btn" id="pmore">' + t('more', { n: Math.min(60, PS.total - PS.rows.length) }) + '</button>' : '');
    var pm = $('pmore');
    if (pm) pm.onclick = function () { morePlat(pm); };
    $('plat-extra').innerHTML = X.platPanel ? (X.platPanel(lang) || '') : '';
  }

  // ---------- wiring ----------
  function i18n() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    // Full tab names, short ones on phones
    document.querySelectorAll('[data-tab]').forEach(function (el) {
      var k = 'tab_' + el.getAttribute('data-tab');
      el.innerHTML = '<span class="tl">' + esc(t(k)) + '</span><span class="ts">' + esc(t(k + '_s')) + '</span>';
    });
    $('lang').textContent = lang === 'zh' ? 'EN' : '中文';
    $('theme').setAttribute('aria-label', t('theme'));
    $('theme').title = t('theme');
    $('switcher').textContent = document.body.classList.contains('show-map') ? t('show_list') : t('show_map');
    renderLegend();
  }
  $('lang').onclick = function () {
    lang = lang === 'zh' ? 'en' : 'zh';
    LS.set('lang', lang);
    // Same results in the other language: redraw, no new request
    buildFilters(); i18n(); moreLabel();
    if (view.length || total) renderList();
    if (sel != null && cur && cur.p.i === sel) renderDrawer(cur.p, cur.d);
    if (pageId != null && cur && cur.p.i === pageId) renderPage(cur.p, cur.d);
    drawPlat();
  };
  var qt;
  $('q').addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(apply, DS.remote ? 250 : 160); });
  ['f-kind', 'f-plat', 'f-sort', 'f-rated', 'f-tag'].forEach(function (id) { $(id).addEventListener('change', apply); });
  document.addEventListener('click', function (e) {
    [cuisPick, platPick].forEach(function (pk) { if (pk.open() && !pk.owns(e.target)) pk.hide(false); });
  });
  $('f-open').onclick = function () { this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); apply(); };
  $('f-more').onclick = function () {
    var p = $('more-panel'); p.hidden = !p.hidden; this.setAttribute('aria-expanded', String(!p.hidden));
  };
  $('f-from').addEventListener('change', function () {
    if ($('f-from').value === 'gps' && !gps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) { gps = [pos.coords.latitude, pos.coords.longitude]; apply(); }, function () { apply(); });
      return;
    }
    apply();
  });
  $('list').addEventListener('click', function (e) { var li = e.target.closest('.item'); if (li) openPlace(+li.getAttribute('data-i'), false); });
  $('gmore').onclick = function () { loadMore(this); };
  // Views: the card grid, the map with its list, the delivery apps; one filter bar moves to whichever list is showing
  var curView = 'grid';
  function showView(name) {
    curView = name;
    document.querySelectorAll('.tab').forEach(function (x) {
      var on = x.getAttribute('data-view') === name;
      x.classList.toggle('active', on);
      x.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + name); });
    var f = document.querySelector('.filters');
    if (name === 'grid' && f.parentNode !== $('ghead')) $('ghead').appendChild(f);
    if (name === 'map' && f.parentNode !== $('rail')) $('rail').insertBefore(f, $('count'));
    LS.set('view', name);
    if (name === 'plat') { if (PS) drawPlat(); else loadPlat(); }
    if (name === 'map') setTimeout(function () { map.invalidateSize(); }, 0);
  }
  document.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { showView(b.getAttribute('data-view')); }; });
  // #p=<id>: a place page in the grid view (a card click pushes it, so Back returns to the grid), the side panel on the map
  function openFromView(i) {
    if (curView !== 'grid') showView('grid');
    if (location.hash === '#p=' + i) openPage(i, false); else location.hash = 'p=' + i;
  }
  // The map's side panel leaves its place in the hash; a card for that place must still open
  $('grid').addEventListener('click', function (e) {
    var a = e.target.closest('a.card');
    if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); openPage(+a.getAttribute('href').slice(3), false); }
  });
  window.addEventListener('hashchange', function () {
    var m = /#p=(\d+)/.exec(location.hash);
    if (curView === 'map') { if (m) openPlace(+m[1], false); else if (sel != null) closeDrawer(); return; }
    if (curView !== 'grid') showView('grid');
    if (m) openPage(+m[1], true); else closePage();
  });
  $('plat-cards').addEventListener('click', function (e) {
    var b = e.target.closest('.pcard');
    if (!b) return;
    pfilter = pfilter === b.getAttribute('data-c') ? '' : b.getAttribute('data-c');
    loadPlat();
  });
  var pqt;
  $('pq').addEventListener('input', function () { clearTimeout(pqt); pqt = setTimeout(loadPlat, DS.remote ? 250 : 0); });
  $('p-sort').addEventListener('change', loadPlat);
  $('plat-list').addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    var row = e.target.closest('.prow[data-i]');
    if (row) openFromView(+row.getAttribute('data-i'));
  });
  $('switcher').onclick = function () { document.body.classList.toggle('show-map'); i18n(); setTimeout(function () { map.invalidateSize(); }, 0); };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var pk = [cuisPick, platPick].filter(function (x) { return x.open(); })[0];
    if (pk) pk.hide(true);
    else if (curView === 'grid' && pageId != null) leavePage();
    else if (sel != null) closeDrawer();
  });
  // Black on white or white on black; follows the system until the button is used
  $('theme').onclick = function () {
    var next = dark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    LS.set('theme', next);
    renderLegend(); renderMarkers();
    if (gmark) gmark.setStyle(markerStyle('s1', true));
  };
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { renderLegend(); renderMarkers(); });

  // Small API for local extensions
  window.MEApp = { open: openFromView };

  buildFilters();
  i18n();
  var saved = LS.get('view', 'grid');
  showView(['grid', 'map', 'plat'].indexOf(saved) >= 0 ? saved : 'grid');
  apply();
  var m = /#p=(\d+)/.exec(location.hash);
  if (m) {
    if (curView === 'map') openPlace(+m[1], false);
    else { showView('grid'); openPage(+m[1], false); }
  }
  // Local extensions may load data later; refresh what they decorate
  if (X.load) X.load().then(function () { buildFilters(); apply(); drawPlat(); });
})();
