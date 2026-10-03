(function () {
  'use strict';
  var P = window.PLACES || [], META = window.META || {}, LOCAL = window.LOCAL || {};
  var CU = META.cuisines || {}, KI = META.kinds || {}, PLAT = META.plat || {}, TG = META.tags || {};
  // Optional local-only extensions (defined in local.js, never published)
  var X = window.MEX || {};
  var PCODES = ['d', 'u', 'g', 'e', 't'];
  var SRC = { google: 'Google', dd: 'DoorDash', ue: 'Uber Eats', gh: 'Grubhub', es: 'EatStreet', toast: 'Toast' };
  var CODE_SRC = { d: 'dd', u: 'ue', g: 'gh', e: 'es', t: 'toast' };
  var SRC_CODE = { dd: 'd', ue: 'u', gh: 'g', es: 'e', toast: 't' };
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('me:' + k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('me:' + k, v); } catch (e) { /* storage blocked */ } }
  };
  var lang = LS.get('lang', /^zh/i.test(navigator.language || '') ? 'zh' : 'en');

  var T = {
    zh: {
      tab_map: '美食', tab_plat: '外卖平台', search_ph: '搜店名、菜系或菜名', search_ph2: '搜店名',
      open_now: '营业中', more_filters: '更多筛选', dist_from: '距离从',
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
      col_place: '店', col_score: '综合', none: '—', listed: '已下架'
    },
    en: {
      tab_map: 'Food', tab_plat: 'Delivery apps', search_ph: 'Name, cuisine or dish', search_ph2: 'Search by name',
      open_now: 'Open now', more_filters: 'More filters', dist_from: 'Distance from',
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
      col_place: 'Place', col_score: 'Score', none: '—', listed: 'delisted'
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

  // Chinese search words -> English keywords
  var SYN = {
    '拉面': ['ramen', 'hand pulled', 'hand-pulled', 'lamian'], '面': ['noodle', 'ramen', 'pho', 'udon', 'lo mein'], '米线': ['rice noodle', 'mixian'],
    '饺子': ['dumpling', 'momo', 'gyoza', 'pelmeni'], '小笼包': ['soup dumpling', 'xiao long bao'], '包子': ['bao', 'bun'],
    '火锅': ['hot pot', 'hotpot', 'shabu'], '麻辣烫': ['malatang', 'mala'], '麻辣': ['mala', 'sichuan', 'szechuan', 'spicy'],
    '川菜': ['sichuan', 'szechuan'], '湘菜': ['hunan'], '粤菜': ['cantonese', 'dim sum'], '早茶': ['dim sum'], '台湾': ['taiwan'],
    '寿司': ['sushi'], '日料': ['japanese', 'sushi', 'ramen'], '韩餐': ['korean'], '烤肉': ['bbq', 'korean bbq', 'grill'],
    '烧烤': ['bbq', 'barbecue', 'skewer'], '串': ['skewer', 'kebab'], '泰': ['thai'], '越南': ['vietnamese', 'pho', 'banh mi'],
    '印度': ['indian', 'curry', 'tandoori'], '咖喱': ['curry'], '墨西哥': ['mexican', 'taco', 'burrito'], '披萨': ['pizza'],
    '汉堡': ['burger'], '炸鸡': ['fried chicken', 'chicken', 'wings'], '鸡翅': ['wings'], '牛排': ['steak'],
    '海鲜': ['seafood', 'fish', 'oyster', 'crab', 'boil'], '早餐': ['breakfast', 'brunch', 'bagel', 'pancake'], '早午餐': ['brunch'],
    '咖啡': ['coffee', 'espresso', 'cafe'], '奶茶': ['bubble tea', 'boba', 'milk tea'], '甜品': ['dessert', 'cake', 'cookie', 'crepe'],
    '蛋糕': ['cake', 'cheesecake'], '冰淇淋': ['ice cream', 'custard', 'gelato'], '面包': ['bakery', 'bread', 'bagel', 'croissant'],
    '素食': ['vegan', 'vegetarian'], '清真': ['halal'], '沙拉': ['salad'], '三明治': ['sandwich', 'sub'], '意大利': ['italian', 'pasta'],
    '地中海': ['mediterranean', 'gyro', 'falafel'], '炒饭': ['fried rice'], '粥': ['congee'], '中餐': ['chinese'], '酒吧': ['bar', 'pub', 'brewery']
  };

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
    var s = openState(p);
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
  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
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
    }
  }, true);
  function metaLine(p) {
    return [(p.c || []).slice(0, 2).map(cuisLabel).join(' / ') || kindLabel(p.k), p.pr ? '$'.repeat(p.pr) : '', distLabel(p._d)].filter(Boolean).join(' · ');
  }

  // ---------- filters ----------
  function fillSelect(sel, opts, val) {
    sel.innerHTML = opts.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('');
    if (val != null && opts.some(function (o) { return o[0] === val; })) sel.value = val;
  }
  function buildFilters() {
    var kinds = {}, cuis = {}, tcount = {};
    P.forEach(function (p) {
      if (p.cl === 1 || p.cl === 3) return;
      kinds[p.k] = (kinds[p.k] || 0) + 1;
      (p.c || []).forEach(function (c) { cuis[c] = (cuis[c] || 0) + 1; });
      (p.tg || []).forEach(function (g) { tcount[g] = (tcount[g] || 0) + 1; });
    });
    var copts = [['', t('all_cuis')]].concat(Object.keys(CU).filter(function (c) { return cuis[c]; })
      .sort(function (a, b) { return cuis[b] - cuis[a]; }).map(function (c) { return [c, cuisLabel(c)]; }));
    fillSelect($('f-cuis'), copts, LS.get('cuis', ''));
    fillSelect($('p-cuis'), copts, '');
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
  function matchQuery(p, q) {
    if (!q) return true;
    var hay = (p.n + ' ' + (p.z || '') + ' ' + (p.kw || '') + ' ' + (p.c || []).map(function (c) { return CU[c] ? CU[c].join(' ') : c; }).join(' ') + ' ' + (p.a || '')).toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (term) {
      if (hay.indexOf(term) >= 0) return true;
      return Object.keys(SYN).filter(function (z) { return term.indexOf(z) >= 0; })
        .some(function (z) { return SYN[z].some(function (e) { return hay.indexOf(e) >= 0; }); });
    });
  }
  var SORT = {
    overall: function (p) { return p.o == null ? -1 : p.o; }, taste: function (p) { return p.s && p.s[0] != null ? p.s[0] : -1; },
    pop: function (p) { return p.s ? p.s[1] : -1; }, value: function (p) { return p.s && p.s[2] != null ? p.s[2] : -1; },
    hyg: function (p) { return p.s && p.s[3] != null ? p.s[3] : -1; }, count: function (p) { return p.rc || 0; }
  };
  var view = [], shown = 120, sel = null;
  function apply() {
    var q = $('q').value.trim(), kind = $('f-kind').value, cuis = $('f-cuis').value, plat = $('f-plat').value, tag = $('f-tag').value;
    var open = $('f-open').getAttribute('aria-pressed') === 'true', rated = $('f-rated').value, sort = $('f-sort').value;
    ['kind', 'cuis', 'plat', 'sort', 'tag', 'rated'].forEach(function (k) { LS.set(k, { kind: kind, cuis: cuis, plat: plat, sort: sort, tag: tag, rated: rated }[k]); });
    LS.set('from', $('f-from').value);
    var ref = refPoint(), ql = q.toLowerCase();
    view = P.filter(function (p) {
      if ((p.cl === 1 || p.cl === 3) && !(q && p.n.toLowerCase().indexOf(ql) >= 0)) return false;
      if (kind ? p.k !== kind : (p.k === 'market' || p.k === 'virtual')) return false;
      if (cuis && (p.c || []).indexOf(cuis) < 0) return false;
      if (plat === 'none' ? (p.pf || '') !== '' : (plat && (p.pf || '').indexOf(plat) < 0)) return false;
      if (rated === 'rated' && p.o == null) return false;
      if (rated === 'conf' && (p.o == null || p.cf === 'low')) return false;
      if (tag) {
        var ext = (X.tagOptions || []).some(function (o) { return o[0] === tag; });
        if (ext ? !(X.match && X.match(p, tag)) : (p.tg || []).indexOf(tag) < 0) return false;
      }
      if (open) { var s = openState(p); if (!s || !s.open) return false; }
      return matchQuery(p, q);
    });
    view.forEach(function (p) { p._d = p.la != null ? km(ref, [p.la, p.lo]) : null; });
    if (sort === 'dist') view.sort(function (a, b) { return (a._d == null ? 1e9 : a._d) - (b._d == null ? 1e9 : b._d); });
    else view.sort(function (a, b) { return SORT[sort](b) - SORT[sort](a) || (a._d || 99) - (b._d || 99); });
    shown = 120;
    var moreN = ['f-kind', 'f-tag', 'f-plat', 'f-rated'].filter(function (id) { return $(id).value; }).length;
    $('f-more').textContent = t('more_filters') + (moreN ? ' · ' + moreN : '');
    renderList();
    renderMarkers();
  }
  function renderList() {
    $('count').textContent = t('count', { n: view.length.toLocaleString() });
    var html = view.slice(0, shown).map(function (p) {
      var st = openState(p), open = st && st.open && !p.cl;
      return '<li class="item' + (sel === p.i ? ' sel' : '') + '" data-i="' + p.i + '">' + thumbHtml(p) +
        '<div class="body"><div class="nm">' + esc(p.n) + (p.z ? '<span class="zh">' + esc(p.z) + '</span>' : '') + '</div>' +
        '<div class="meta">' + esc(metaLine(p)) + (X.badge ? X.badge(p, lang) : '') + '</div>' +
        (open ? '<div class="open">' + esc(statusText(p)) + '</div>' : (p.cl ? '<div class="open">' + esc(statusText(p)) + '</div>' : '')) +
        '</div>' + scoreHtml(p.o) + '</li>';
    }).join('');
    if (view.length > shown) html += '<li><button class="more-btn" id="more">' + t('more', { n: Math.min(120, view.length - shown) }) + '</button></li>';
    if (!view.length) html = '<li class="empty">' + t('empty') + '</li>';
    $('list').innerHTML = html;
    var mb = $('more');
    if (mb) mb.onclick = function (e) { e.stopPropagation(); shown += 120; renderList(); };
  }

  // ---------- map ----------
  var map = L.map('map', { preferCanvas: true }).setView([43.0731, -89.4012], 13);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, attribution: 'Tiles &copy; Esri &middot; Data: OpenStreetMap, PHMDC, Google, DoorDash, Uber Eats, Toast, EatStreet, Grubhub'
  }).addTo(map);
  var layer = L.layerGroup().addTo(map), markers = {};
  var legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () { var d = L.DomUtil.create('div', 'legend'); d.id = 'legend'; return d; };
  legend.addTo(map);
  function dark() { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  function markerStyle(p, on) {
    var tr = tier(p.o), ink = dark() ? '#fff' : '#000', paper = dark() ? '#000' : '#fff';
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
  function renderMarkers() {
    layer.clearLayers();
    markers = {};
    view.forEach(function (p) {
      if (p.la == null) return;
      var m = L.circleMarker([p.la, p.lo], markerStyle(p, sel === p.i));
      m.bindTooltip(esc(p.n) + (p.o != null ? '  ' + p.o : ''), { className: 'tip', direction: 'top', offset: [0, -6] });
      m.on('click', function () { openPlace(p.i, true); });
      m.addTo(layer);
      markers[p.i] = m;
    });
  }
  function restyle(i) {
    var m = markers[i], p = byId[i];
    if (!m || !p) return;
    m.setStyle(markerStyle(p, sel === i));
    if (sel === i) m.bringToFront();
  }

  // ---------- details ----------
  var DETAILS = null, detailsP = null, byId = {};
  P.forEach(function (p) { byId[p.i] = p; });
  function loadDetails() {
    if (DETAILS) return Promise.resolve(DETAILS);
    if (!detailsP) detailsP = fetch('data/details.json?v=d03b135272').then(function (r) { return r.json(); }).then(function (d) { DETAILS = d; return d; });
    return detailsP;
  }
  function openPlace(i, fromMap) {
    var p = byId[i];
    if (!p) return;
    var prev = sel;
    sel = (prev === i && fromMap) ? null : i;
    if (sel === null) { closeDrawer(); return; }
    document.querySelectorAll('.item.sel').forEach(function (el) { el.classList.remove('sel'); });
    var li = document.querySelector('.item[data-i="' + i + '"]');
    if (li) { li.classList.add('sel'); if (fromMap) li.scrollIntoView({ block: 'nearest' }); }
    restyle(prev); restyle(i);
    if (p.la != null && !fromMap) map.setView([p.la, p.lo], Math.max(map.getZoom(), 15), { animate: false });
    try { history.replaceState(null, '', '#p=' + i); } catch (e) { /* file url */ }
    var dr = $('drawer');
    dr.hidden = false;
    document.body.classList.add('drawer-open');
    dr.innerHTML = '<div class="dbody"><h2>' + esc(p.n) + '</h2></div>';
    loadDetails().then(function (D) { if (sel === i) renderDrawer(p, D[i] || {}); });
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
  function renderDrawer(p, d) {
    var h = ['<div class="close-wrap"><button class="close" id="dclose" aria-label="Close">×</button></div>'];
    // The big photo is the top dish when there is one, captioned; the dish row then starts at the next one
    var dp = d.dp || [], hd = !!(d.hd && d.hero && dp.length), rest = hd ? dp.slice(1) : dp;
    if (d.hero) {
      var cap = hd ? '<figcaption><small>' + t('hero_dish') + '</small><b>' + esc(dp[0][0]) + (dp[0][1] ? ' ' + esc(dp[0][1]) : '') + '</b>' +
        (dishMeta(dp[0]) ? '<span>' + esc(dishMeta(dp[0])) + '</span>' : '') + '</figcaption>' : '';
      h.push('<figure class="hero"><img src="' + esc(d.hero) + '" alt="" referrerpolicy="no-referrer">' + cap + '</figure>');
    }
    h.push('<div class="dbody">');
    var sub = [(p.c || []).map(cuisLabel).join(' / ') || kindLabel(p.k), p.pr ? '$'.repeat(p.pr) : ''].filter(Boolean).join(' · ');
    var st = statusText(p);
    h.push('<div class="dhead"><div><h2>' + esc(p.n) + '</h2>' + (p.z ? '<div class="zh2">' + esc(p.z) + '</div>' : '') +
      '<div class="dline">' + esc(sub) + '</div>' +
      '<div class="dline">' + (p.a ? esc(p.a) + ' · ' : '') + '<a href="' + gmapsUrl(p, d) + '" target="_blank" rel="noopener">' + t('map_link') + '</a>' +
      (p._d != null ? ' · <span class="dist">' + distLabel(p._d) + '</span>' : '') + '</div>' + (st ? '<div class="dline st">' + esc(st) + '</div>' : '') + '</div>' + scoreHtml(p.o, true) + '</div>');
    var tags = (p.tg || []).map(function (g) { return TG[g] ? TG[g][lang === 'zh' ? 0 : 1] : g; });
    if (p.ag === 'r' || p.ag === 'y') tags.push(t(p.ag === 'r' ? 'age_r' : 'age_y'));
    if (tags.length) h.push('<div class="tags">' + tags.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>');
    // Order
    var acts = (d.lk || []).map(function (l, k) {
      return '<a class="act' + (k === 0 && l[2] ? ' primary' : '') + (l[2] ? '' : ' off') + '" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' +
        esc(SRC[l[0]]) + (l[2] ? '' : ' · ' + t('paused')) + '</a>';
    });
    if (d.ph) acts.push('<a class="act" href="tel:' + esc(d.ph.replace(/[^\d+]/g, '')) + '">' + t('call') + '</a>');
    if (d.w) acts.push('<a class="act" href="' + esc(d.w) + '" target="_blank" rel="noopener">' + t('site') + '</a>');
    if (acts.length) h.push('<div class="actions">' + acts.join('') + '</div>');
    if (d.host) h.push('<p class="dline">' + t('host') + esc(d.host) + '</p>');
    // Dishes with photos
    if (rest.length) {
      h.push('<section class="sec"><h3>' + t('dishes') + '</h3><div class="dishrow">' + rest.map(function (x) {
        var meta = dishMeta(x, true);
        return '<div class="dish">' + (x[3] ? '<img loading="lazy" referrerpolicy="no-referrer" alt="" src="' + esc(x[3]) + '">' : '<div class="noimg"></div>') +
          '<div class="dn">' + esc(x[0]) + '</div>' + (x[1] ? '<div class="dz">' + esc(x[1]) + '</div>' : '') + (meta ? '<div class="dm">' + esc(meta) + '</div>' : '') + '</div>';
      }).join('') + '</div><p class="src">' + t('dishes_note') + '</p></section>');
    } else if ((d.ds || []).length) {
      h.push('<section class="sec"><h3>' + t('dishes') + '</h3><ul class="dishlist">' + d.ds.map(function (x) {
        return '<li><span>' + esc(x[0]) + (x[1] ? ' ' + esc(x[1]) : '') + '</span><span>' + (x[2] ? '$' + Number(x[2]).toFixed(2) : '') + '</span></li>';
      }).join('') + '</ul></section>');
    }
    // Key lines
    var an = (d.an && d.an[lang]) || [], nk = d.an ? d.an.k : an.length, nw = d.an ? d.an.w || 0 : 0;
    if (an.length) h.push('<section class="sec key">' + an.slice(0, nk).map(function (x, j) { return '<p' + (j < nw ? ' class="warn"' : '') + '>' + esc(x) + '</p>'; }).join('') + '</section>');
    var labels = ['taste', 'pop', 'value', 'hyg', 'conv'];
    h.push('<div class="metrics">' + labels.map(function (k, j) {
      var v = p.s ? p.s[j] : null;
      return '<div class="metric"><b>' + (v == null ? '—' : v) + '</b><span>' + t(k) + '</span><i><u style="width:' + (v || 0) + '%"></u></i></div>';
    }).join('') + '</div>');
    if (X.drawer) h.push(X.drawer(p, d, lang) || '');
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
      t('how_body').map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>'));
    h.push('</div>');
    var dr = $('drawer');
    dr.innerHTML = h.join('');
    dr.scrollTop = 0;
    $('dclose').onclick = closeDrawer;
  }

  // ---------- delivery apps ----------
  var pfilter = '', pshown = 150;
  function platRating(d, c) {
    var src = CODE_SRC[c], r = (d && d.rt || []).filter(function (x) { return x[0] === src; })[0];
    return r ? { r: r[1], n: r[2], u: r[3] } : null;
  }
  function platLink(d, c) {
    var src = CODE_SRC[c], l = (d && d.lk || []).filter(function (x) { return x[0] === src; })[0];
    return l ? { u: l[1], on: l[2] } : null;
  }
  function renderPlat() {
    var D = DETAILS || {};
    var base = P.filter(function (p) { return p.cl !== 1 && p.cl !== 3 && p.k !== 'market'; });
    // Cards
    $('plat-cards').innerHTML = PCODES.map(function (c) {
      var on = base.filter(function (p) { return (p.pf || '').indexOf(c) >= 0; });
      var rs = on.map(function (p) { return platRating(D[p.i], c); }).filter(Boolean);
      var avg = rs.length ? (rs.reduce(function (a, x) { return a + x.r; }, 0) / rs.length).toFixed(2) : '';
      var excl = on.filter(function (p) { return p.pf === c; }).length;
      return '<button class="pcard" type="button" data-c="' + c + '" aria-pressed="' + (pfilter === c) + '"><div class="pn">' + PLAT[c] + '</div>' +
        '<div class="pbig">' + on.length.toLocaleString() + '</div><div class="psub">' + t('p_count') + '</div>' +
        '<div class="psub">' + (avg ? t('p_avg', { r: avg }) + ' · ' : '') + t('p_excl', { n: excl }) + '</div></button>';
    }).join('');
    // Same dish, DoorDash vs Uber Eats (px = Uber Eats vs DoorDash, %)
    var gaps = base.filter(function (p) { return p.px; }), same = 0, ued = 0, ddd = 0, diff = [];
    gaps.forEach(function (p) { var g = p.px[0]; if (g === 0) same++; else { if (g > 0) ued++; else ddd++; diff.push(Math.abs(g)); } });
    diff.sort(function (a, b) { return a - b; });
    var p90 = diff.length ? diff[Math.min(diff.length - 1, Math.floor(diff.length * 0.9))] : 0;
    $('plat-price').innerHTML = gaps.length < 20 ? '' : '<b>' + t(same / gaps.length >= 0.6 ? 'px_head_same' : 'px_head_diff') + '</b><p>' +
      esc(t('px_body', { n: gaps.length.toLocaleString(), s: same.toLocaleString(), u: ued, d: ddd, p: p90 })) + '</p>';
    $('plat-note').textContent = t('plat_note', { d: META.built || '' });
    var q = $('pq').value.trim().toLowerCase(), cuis = $('p-cuis').value, sort = $('p-sort').value;
    var rows = base.filter(function (p) {
      if (!(p.pl || '')) return false;
      if (pfilter && (p.pf || '').indexOf(pfilter) < 0) return false;
      if (cuis && (p.c || []).indexOf(cuis) < 0) return false;
      if (q && (p.n + ' ' + (p.z || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    function key(p) {
      if (sort === 'napps') return (p.pf || '').length * 1000 + (p.o || 0);
      if (sort.charAt(0) === 'r' && sort.length === 2) { var r = platRating(D[p.i], sort.charAt(1)); return r ? r.r * 1e6 + Math.min(r.n, 999999) : -1; }
      return p.o == null ? -1 : p.o;
    }
    rows.sort(function (a, b) { return key(b) - key(a); });
    var head = '<div class="prow head"><span></span><span>' + t('col_place') + '</span><span>' + t('col_score') + '</span><div class="pcells">' +
      PCODES.map(function (c) { return '<span>' + PLAT[c] + '</span>'; }).join('') + '</div></div>';
    var body = rows.slice(0, pshown).map(function (p) {
      var d = D[p.i];
      var cells = PCODES.map(function (c) {
        var l = platLink(d, c), r = platRating(d, c);
        if (!l) return '<div class="pcell nil"><span class="no">—</span></div>';
        if (!l.on) return '<div class="pcell"><span class="paused"><span class="pa">' + PLAT[c] + ' · </span>' + t('listed') + '</span></div>';
        // App name (.pa) only shows on phones, where the column headers are hidden
        var label = r ? '<span class="pa">' + PLAT[c] + ' </span>★ ' + Number(r.r).toFixed(1) : PLAT[c];
        var cheap = p.px && p.px[0] !== 0 && c === (p.px[0] > 0 ? 'd' : 'u') ? '<small class="cheap">' + t('cheaper', { x: Math.abs(p.px[0]) }) + '</small>' : '';
        return '<div class="pcell"><a href="' + esc(l.u) + '" target="_blank" rel="noopener" title="' + esc(t('order_on', { p: PLAT[c] })) + '">' + label + '</a>' +
          (r ? '<small>' + (lang === 'zh' ? fmtN(r.n) + ' 条评分' : fmtN(r.n) + ' ratings') + '</small>' : '') + cheap + '</div>';
      }).join('');
      return '<div class="prow" data-i="' + p.i + '">' + thumbHtml(p) + '<div class="pname"><b>' + esc(p.n) + (p.z ? ' ' + esc(p.z) : '') + '</b><span>' +
        esc([(p.c || []).slice(0, 2).map(cuisLabel).join(' / '), p.pr ? '$'.repeat(p.pr) : ''].filter(Boolean).join(' · ')) + '</span></div>' +
        scoreHtml(p.o) + '<div class="pcells">' + cells + '</div></div>';
    }).join('');
    $('plat-list').innerHTML = head + body + (rows.length > pshown ? '<button class="more-btn" id="pmore">' + t('more', { n: Math.min(150, rows.length - pshown) }) + '</button>' : '');
    var pm = $('pmore');
    if (pm) pm.onclick = function () { pshown += 150; renderPlat(); };
    $('plat-extra').innerHTML = X.platPanel ? (X.platPanel(lang) || '') : '';
  }

  // ---------- wiring ----------
  function i18n() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    $('lang').textContent = lang === 'zh' ? 'EN' : '中文';
    $('switcher').textContent = document.body.classList.contains('show-map') ? t('show_list') : t('show_map');
    renderLegend();
  }
  $('lang').onclick = function () {
    lang = lang === 'zh' ? 'en' : 'zh';
    LS.set('lang', lang);
    buildFilters(); i18n(); apply();
    if (sel != null) loadDetails().then(function (D) { renderDrawer(byId[sel], D[sel] || {}); });
    if ($('view-plat').classList.contains('active')) renderPlat();
  };
  var qt;
  $('q').addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(apply, 160); });
  ['f-kind', 'f-cuis', 'f-plat', 'f-sort', 'f-rated', 'f-tag'].forEach(function (id) { $(id).addEventListener('change', apply); });
  $('f-open').onclick = function () { this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); apply(); };
  $('f-more').onclick = function () {
    var p = $('more-panel'); p.hidden = !p.hidden; this.setAttribute('aria-expanded', String(!p.hidden));
  };
  $('f-from').addEventListener('change', function () {
    if ($('f-from').value === 'gps' && !gps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) { gps = [pos.coords.latitude, pos.coords.longitude]; apply(); }, function () { apply(); });
    }
    apply();
  });
  $('list').addEventListener('click', function (e) { var li = e.target.closest('.item'); if (li) openPlace(+li.getAttribute('data-i'), false); });
  document.querySelectorAll('.tab').forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === b); });
      document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + b.getAttribute('data-view')); });
      if (b.getAttribute('data-view') === 'plat') { renderPlat(); loadDetails().then(renderPlat); }
      else setTimeout(function () { map.invalidateSize(); }, 0);
    };
  });
  $('plat-cards').addEventListener('click', function (e) {
    var b = e.target.closest('.pcard');
    if (!b) return;
    pfilter = pfilter === b.getAttribute('data-c') ? '' : b.getAttribute('data-c');
    pshown = 150;
    renderPlat();
  });
  $('pq').addEventListener('input', function () { pshown = 150; renderPlat(); });
  ['p-cuis', 'p-sort'].forEach(function (id) { $(id).addEventListener('change', function () { pshown = 150; renderPlat(); }); });
  $('plat-list').addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    var row = e.target.closest('.prow[data-i]');
    if (!row) return;
    document.querySelector('.tab[data-view="map"]').click();
    openPlace(+row.getAttribute('data-i'), false);
  });
  $('switcher').onclick = function () { document.body.classList.toggle('show-map'); i18n(); setTimeout(function () { map.invalidateSize(); }, 0); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sel != null) closeDrawer(); });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { renderLegend(); renderMarkers(); });

  // Small API for local extensions
  window.MEApp = { open: function (i) { document.querySelector('.tab[data-view="map"]').click(); openPlace(i, false); } };

  buildFilters();
  i18n();
  apply();
  var m = /#p=(\d+)/.exec(location.hash);
  if (m) openPlace(+m[1], false);
  // Local extensions may load data later; refresh what they decorate
  if (X.load) X.load().then(function () { buildFilters(); apply(); if ($('view-plat').classList.contains('active')) renderPlat(); });
})();
