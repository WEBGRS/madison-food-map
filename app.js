(function () {
  'use strict';
  var P = window.PLACES || [], META = window.META || {}, LOCAL = window.LOCAL || {};
  var CU = META.cuisines || {}, KI = META.kinds || {}, PLAT = META.plat || {}, TG = META.tags || {};
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
      tab_map: '地图', tab_plat: '外卖平台', search_ph: '店名、菜系或菜名，例如 拉面、dumpling', search_ph2: '搜店名',
      open_now: '现在营业', rated_only: '只看有评分的', dist_from: '距离从',
      all_kinds: '所有类型', all_cuis: '所有菜系', any_plat: '不限外卖平台', no_plat: '不在任何平台',
      on: '能在 {p} 下单', sort_overall: '按综合分', sort_taste: '按口味', sort_pop: '按人气', sort_value: '按性价比',
      sort_hyg: '按卫生', sort_dist: '按距离', sort_count: '按评分人数',
      from_home: '家', from_gps: '我的位置', from_campus: '校园（Library Mall）', from_capitol: '州议会',
      count: '{n} 家', more: '再显示 {n} 家', empty: '没有符合条件的店。', show_map: '地图', show_list: '列表',
      open_until: '营业中 · {t} 关门', opens_at: '已打烊 · {d}{t} 开门', closed_today: '今天休息', open_24: '24 小时营业',
      today: '', tomorrow: '明天 ', perm_closed: '可能已永久关闭', temp_closed: '暂停营业', maybe_closed: '可能已关门或换店',
      score: '综合评分', taste: '口味', pop: '人气', value: '性价比', hyg: '卫生', conv: '方便',
      conf_high: '数据充分', conf_mid: '数据一般', conf_low: '评分样本少，仅供参考', not_rated: '暂无评分',
      analysis: '分析', order: '去下单', ratings: '各平台评分', hours: '营业时间', dishes: '招牌 / 热销',
      reviews: '顾客评论（外卖平台原文）', reddit: 'Reddit r/madisonwi 上的讨论', insp: '卫生检查记录',
      sources: '数据来源', site: '官网', call: '电话', gmap: 'Google 地图', directions: '导航',
      paused: '已下架/暂停', toast_note: 'Toast 官方点单', days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      no_hours: '没有营业时间数据，出门前先看 Google 地图。', ratings_n: '{n} 条', reinsp: '需复检', ok_insp: '通过',
      insp_none: '没有找到这家店的卫生检查记录。', insp_link: '在官网查完整报告',
      src_osm: 'OpenStreetMap', src_phmdc: 'Public Health Madison & Dane County 营业执照',
      dd_hours: 'DoorDash 今日菜单时间：', virtual_host: '实际出餐：', plat_title: '外卖平台覆盖',
      p_all: '至少一个平台', p_none: '哪个平台都没有', p_only: '只在 {p}', p_any: '全部',
      col_name: '店名', col_cuis: '菜系', col_score: '综合', col_n: '平台数',
      plat_note: '✓ = 现在能在该平台下单（点击直达店铺页）；○ = 平台上有店铺页但已下架或暂停。饭团、熊猫外卖只有 App，网页查不到上架情况，这里没有列。数据抓取于 {d}。',
      unknown: '—', listed_only: '在平台上但已下架', reddit_n: '高赞 {s}', age_r: '21+ 酒吧，未满 21 岁进不去', age_y: '晚上可能查 ID',
      lic: '执照名称：', excl: '其中 {n} 家只在这里', any_tag: '适合任何场景', legend: '综合分', legend_na: '无评分', how: '评分标准',
      how_body: [
        '<b>口味（占综合分 50%）</b>：把 Google、DoorDash、Uber Eats、Toast、EatStreet、Grubhub 的星级分别换算成「在该平台麦迪逊所有店里的百分位」，因为各平台打分松紧不同（Toast 平均 4.8，EatStreet 平均 4.0）。评分人数越少，越往 50 拉；只有一个平台有分的再多拉一点。然后按平台加权平均，再用外卖评论原文里夸/骂口味的比例微调 ±6，Best of Madison 读者票选和 James Beard 入围最多加 10。',
        '<b>人气（15%）</b>：各平台评分人数之和（取对数）+ r/madisonwi 上被提到的次数 + 获奖次数，再换算成百分位。',
        '<b>性价比（15%）</b>：口味分 × 55% + 便宜程度 × 45%。便宜程度用 DoorDash 菜单中位价和同菜系的店比；没有菜单就用 $ 价位。评论里夸分量足、划算或嫌贵会再调 ±5。',
        '<b>卫生（10%）</b>：Public Health Madison & Dane County 近 3 年的检查记录。常规检查每次「需复检」扣 18 分，复检又没过扣 12，投诉检查扣 6。近 3 年没有常规检查的不打分。',
        '<b>方便（10%）</b>：现在能下单的外卖平台数（最多算 4 个），一周有 3 天以上开到晚上 10 点，7 天营业。',
        '缺某一项就按剩下几项的权重重新分配；连口味都没有的店不给综合分。所有分数都是和麦迪逊其他店相比的相对分，50 分大约是中等水平。'
      ].join('<br><br>')
    },
    en: {
      tab_map: 'Map', tab_plat: 'Delivery apps', search_ph: 'Name, cuisine or dish, e.g. ramen', search_ph2: 'Search by name',
      open_now: 'Open now', rated_only: 'Rated only', dist_from: 'Distance from',
      all_kinds: 'All types', all_cuis: 'All cuisines', any_plat: 'Any delivery app', no_plat: 'On no delivery app',
      on: 'Order on {p}', sort_overall: 'Sort: overall', sort_taste: 'Sort: taste', sort_pop: 'Sort: popularity',
      sort_value: 'Sort: value', sort_hyg: 'Sort: hygiene', sort_dist: 'Sort: distance', sort_count: 'Sort: # ratings',
      from_home: 'Home', from_gps: 'My location', from_campus: 'Campus (Library Mall)', from_capitol: 'Capitol',
      count: '{n} places', more: 'Show {n} more', empty: 'Nothing matches these filters.', show_map: 'Map', show_list: 'List',
      open_until: 'Open · closes {t}', opens_at: 'Closed · opens {d}{t}', closed_today: 'Closed today', open_24: 'Open 24 hours',
      today: '', tomorrow: 'tomorrow ', perm_closed: 'May be permanently closed', temp_closed: 'Temporarily closed', maybe_closed: 'May have closed or changed',
      score: 'Overall', taste: 'Taste', pop: 'Popularity', value: 'Value', hyg: 'Hygiene', conv: 'Convenience',
      conf_high: 'Plenty of data', conf_mid: 'Some data', conf_low: 'Few ratings; rough score', not_rated: 'No ratings yet',
      analysis: 'Analysis', order: 'Order', ratings: 'Ratings by source', hours: 'Hours', dishes: 'Popular dishes',
      reviews: 'Customer reviews (delivery apps)', reddit: 'On r/madisonwi', insp: 'Health inspections',
      sources: 'Sources', site: 'Website', call: 'Call', gmap: 'Google Maps', directions: 'Directions',
      paused: 'Unavailable', toast_note: 'Toast ordering', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      no_hours: 'No hours on file; check Google Maps before you go.', ratings_n: '{n}', reinsp: 'Re-inspection required', ok_insp: 'Passed',
      insp_none: 'No inspection record found for this place.', insp_link: 'Full reports on the county site',
      src_osm: 'OpenStreetMap', src_phmdc: 'Public Health Madison & Dane County licence',
      dd_hours: 'DoorDash menu today: ', virtual_host: 'Cooked by: ', plat_title: 'Delivery app coverage',
      p_all: 'On at least one app', p_none: 'On no app', p_only: 'Only on {p}', p_any: 'All',
      col_name: 'Name', col_cuis: 'Cuisine', col_score: 'Overall', col_n: 'Apps',
      plat_note: '✓ = orderable now (click for the store page); ○ = has a store page but is paused or delisted. Fantuan and HungryPanda are app-only and cannot be checked from the web, so they are not listed. Data collected {d}.',
      unknown: '—', listed_only: 'Listed but unavailable', reddit_n: '{s} upvotes', age_r: '21+ bar', age_y: 'May card at night',
      lic: 'Licence name: ', excl: '{n} only here', any_tag: 'Any occasion', legend: 'Overall', legend_na: 'Unrated', how: 'How scores work',
      how_body: [
        '<b>Taste (50% of overall)</b>: each star rating (Google, DoorDash, Uber Eats, Toast, EatStreet, Grubhub) becomes a percentile among Madison places on that same app, since apps grade differently (Toast averages 4.8, EatStreet 4.0). Few ratings pull the value toward 50, a single source pulls it further, then sources are weighted and averaged. Taste words in delivery reviews shift it by up to ±6; Best of Madison and James Beard recognition add up to 10.',
        '<b>Popularity (15%)</b>: total number of ratings (log), r/madisonwi mentions and awards, as a percentile.',
        '<b>Value (15%)</b>: 55% taste + 45% cheapness, where cheapness compares the median DoorDash menu price with places of the same cuisine (or the $ level when there is no menu). Reviews praising portions or value, or calling it pricey, shift it by up to ±5.',
        '<b>Hygiene (10%)</b>: Public Health Madison & Dane County inspections from the last 3 years: -18 for each routine inspection that required a re-inspection, -12 for each failed re-inspection, -6 per complaint visit. No routine inspection in 3 years means no score.',
        '<b>Convenience (10%)</b>: delivery apps it can be ordered on now (up to 4), open past 10 pm at least 3 days a week, open 7 days.',
        'Missing parts are left out and the remaining weights rescaled; places without any taste data get no overall score. Scores are relative to other Madison places, so 50 is roughly the middle.'
      ].join('<br><br>')
    }
  };
  function t(k, vars) {
    var s = (T[lang] && k in T[lang]) ? T[lang][k] : (k in T.en ? T.en[k] : k);
    if (vars) Object.keys(vars).forEach(function (v) { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }

  // Chinese search terms -> English keywords
  var SYN = {
    '拉面': ['ramen', 'hand pulled', 'hand-pulled', 'lamian', 'la mian'], '面': ['noodle', 'ramen', 'pho', 'udon', 'lo mein'], '米线': ['rice noodle', 'mixian'],
    '饺子': ['dumpling', 'momo', 'gyoza', 'pelmeni'], '小笼包': ['soup dumpling', 'xiao long bao', 'xlb'], '包子': ['bao', 'bun'],
    '火锅': ['hot pot', 'hotpot', 'shabu'], '麻辣烫': ['malatang', 'mala'], '麻辣': ['mala', 'sichuan', 'szechuan', 'spicy'],
    '川菜': ['sichuan', 'szechuan'], '湘菜': ['hunan'], '粤菜': ['cantonese', 'dim sum'], '早茶': ['dim sum'], '台湾': ['taiwan'],
    '寿司': ['sushi'], '日料': ['japanese', 'sushi', 'ramen'], '韩餐': ['korean'], '韩国': ['korean'], '烤肉': ['bbq', 'kbbq', 'korean bbq', 'grill'],
    '烧烤': ['bbq', 'barbecue', 'skewer'], '串': ['skewer', 'kebab'], '泰': ['thai'], '越南': ['vietnamese', 'pho', 'banh mi'],
    '印度': ['indian', 'curry', 'tandoori'], '咖喱': ['curry'], '墨西哥': ['mexican', 'taco', 'burrito'], '塔可': ['taco'],
    '披萨': ['pizza'], '汉堡': ['burger'], '炸鸡': ['fried chicken', 'chicken', 'wings'], '鸡翅': ['wings'], '牛排': ['steak'],
    '海鲜': ['seafood', 'fish', 'oyster', 'crab', 'boil'], '早餐': ['breakfast', 'brunch', 'bagel', 'pancake'], '早午餐': ['brunch'],
    '咖啡': ['coffee', 'espresso', 'cafe'], '奶茶': ['bubble tea', 'boba', 'milk tea'], '茶': ['tea'], '甜品': ['dessert', 'cake', 'cookie', 'crepe'],
    '蛋糕': ['cake', 'cheesecake'], '冰淇淋': ['ice cream', 'custard', 'gelato'], '面包': ['bakery', 'bread', 'bagel', 'croissant'],
    '甜甜圈': ['donut'], '素食': ['vegan', 'vegetarian'], '清真': ['halal'], '沙拉': ['salad'], '三明治': ['sandwich', 'sub'],
    '意大利': ['italian', 'pasta'], '意面': ['pasta'], '地中海': ['mediterranean', 'gyro', 'falafel'], '中东': ['middle eastern', 'kebab', 'shawarma'],
    '炒饭': ['fried rice'], '粥': ['congee', 'porridge'], '馄饨': ['wonton'], '牛肉面': ['beef noodle'], '酸菜鱼': ['pickled fish'],
    '中餐': ['chinese'], '中国': ['chinese'], '日本': ['japanese'], '酒吧': ['bar', 'pub', 'brewery'], '啤酒': ['beer', 'brewery', 'pub'],
    '鸡': ['chicken'], '鱼': ['fish'], '虾': ['shrimp'], '鸭': ['duck'], '羊肉': ['lamb'], '猪': ['pork']
  };

  // ---------- time ----------
  var DOW = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  function chicagoNow() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (x) { o[x.type] = x.value; });
    var h = parseInt(o.hour, 10) % 24, m = parseInt(o.minute, 10);
    return { d: DOW[o.weekday], m: h * 60 + m };
  }
  var NOW = chicagoNow();
  setInterval(function () { NOW = chicagoNow(); }, 60000);
  function hm(min) { min = ((min % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  function openState(p) {
    var w = p.h;
    if (!w) return null;
    var d = NOW.d, m = NOW.m;
    var today = w[d] || [], yest = w[(d + 6) % 7] || [];
    for (var i = 0; i < today.length; i++) if (m >= today[i][0] && m < today[i][1]) return { open: true, until: today[i][1], all: today[i][0] === 0 && today[i][1] >= 1440 };
    for (i = 0; i < yest.length; i++) if (yest[i][1] > 1440 && m + 1440 < yest[i][1]) return { open: true, until: yest[i][1] - 1440 };
    for (i = 0; i < today.length; i++) if (today[i][0] > m) return { open: false, next: today[i][0], day: 0 };
    for (var k = 1; k <= 7; k++) {
      var dd = w[(d + k) % 7] || [];
      if (dd.length) return { open: false, next: dd[0][0], day: k };
    }
    return { open: false };
  }
  function statusHtml(p, short) {
    if (p.cl === 1) return '<span class="status warn">' + t('perm_closed') + '</span>';
    if (p.cl === 2) return '<span class="status warn">' + t('temp_closed') + '</span>';
    if (p.cl === 3) return '<span class="status warn">' + t('maybe_closed') + '</span>';
    var s = openState(p);
    if (!s) return '';
    if (s.open) return '<span class="status open">' + (s.all ? t('open_24') : t('open_until', { t: hm(s.until) })) + '</span>';
    if (s.next == null) return '<span class="status closed">' + t('closed_today') + '</span>';
    var day = s.day === 0 ? t('today') : s.day === 1 ? t('tomorrow') : (t('days')[(NOW.d + s.day) % 7] + ' ');
    return '<span class="status closed">' + t('opens_at', { d: day, t: hm(s.next) }) + '</span>';
  }

  // ---------- distance ----------
  var FROM = {
    campus: [43.0753, -89.3990], capitol: [43.0747, -89.3843]
  };
  var gps = null;
  function refPoint() {
    var f = $('f-from').value;
    if (f === 'home' && LOCAL.home) return [LOCAL.home.lat, LOCAL.home.lon];
    if (f === 'gps' && gps) return gps;
    return FROM[f] || FROM.campus;
  }
  function km(a, b) {
    var R = 6371, toR = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function distLabel(k) {
    if (k == null) return '';
    var walk = Math.round(k * 1.25 / 0.08 / 1);
    var mins = Math.round(k * 1000 * 1.25 / 80);
    if (mins <= 25) return (lang === 'zh' ? '步行 ' + mins + ' 分钟' : mins + ' min walk');
    return (k / 1.609).toFixed(1) + ' mi';
  }

  // ---------- labels ----------
  function cuisLabel(c) { return CU[c] ? CU[c][lang === 'zh' ? 0 : 1] : c; }
  function kindLabel(k) { return KI[k] ? KI[k][lang === 'zh' ? 0 : 1] : k; }
  function tier(v) { return v == null ? 'na' : v >= 85 ? 'b5' : v >= 75 ? 'b4' : v >= 65 ? 'b3' : v >= 50 ? 'b2' : 'b1'; }
  function badge(v, big) { return v == null ? '<span class="badge na' + (big ? ' big' : '') + '">' + (big ? '—' : '?') + '</span>' : '<span class="badge ' + tier(v) + (big ? ' big' : '') + '">' + v + '</span>'; }
  function pills(p) {
    var on = p.pf || '', listed = p.pl || '';
    return '<span class="pills">' + PCODES.filter(function (c) { return listed.indexOf(c) >= 0; }).map(function (c) {
      return '<span class="pill ' + (on.indexOf(c) >= 0 ? c : 'off') + '" title="' + PLAT[c] + '">' + PLAT[c].charAt(0) + '</span>';
    }).join('') + '</span>';
  }

  // ---------- filters ----------
  function fillSelect(sel, opts, val) {
    sel.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('');
    if (val != null && opts.some(function (o) { return o[0] === val; })) sel.value = val;
  }
  function buildFilters() {
    var kinds = {}, cuis = {};
    P.forEach(function (p) { if (p.cl === 1 || p.cl === 3) return; kinds[p.k] = (kinds[p.k] || 0) + 1; (p.c || []).forEach(function (c) { cuis[c] = (cuis[c] || 0) + 1; }); });
    var kopts = [['', t('all_kinds')]].concat(['restaurant', 'fast_food', 'cafe', 'dessert', 'bar', 'cart', 'market', 'virtual'].filter(function (k) { return kinds[k]; })
      .map(function (k) { return [k, kindLabel(k) + ' (' + kinds[k] + ')']; }));
    fillSelect($('f-kind'), kopts, LS.get('kind', ''));
    var copts = [['', t('all_cuis')]].concat(Object.keys(CU).filter(function (c) { return cuis[c]; })
      .sort(function (a, b) { return cuis[b] - cuis[a]; }).map(function (c) { return [c, cuisLabel(c) + ' (' + cuis[c] + ')']; }));
    fillSelect($('f-cuis'), copts, LS.get('cuis', ''));
    fillSelect($('p-cuis'), copts, '');
    var popts = [['', t('any_plat')]].concat(PCODES.map(function (c) { return [c, t('on', { p: PLAT[c] })]; })).concat([['none', t('no_plat')]]);
    fillSelect($('f-plat'), popts, LS.get('plat', ''));
    fillSelect($('f-sort'), [['overall', t('sort_overall')], ['taste', t('sort_taste')], ['pop', t('sort_pop')], ['value', t('sort_value')],
      ['hyg', t('sort_hyg')], ['dist', t('sort_dist')], ['count', t('sort_count')]], LS.get('sort', 'overall'));
    var fopts = [];
    if (LOCAL.home) fopts.push(['home', LOCAL.home.name || t('from_home')]);
    fopts.push(['campus', t('from_campus')], ['capitol', t('from_capitol')], ['gps', t('from_gps')]);
    fillSelect($('f-from'), fopts, LS.get('from', LOCAL.home ? 'home' : 'campus'));
    var tcount = {};
    P.forEach(function (p) { (p.tg || []).forEach(function (g) { tcount[g] = (tcount[g] || 0) + 1; }); });
    fillSelect($('f-tag'), [['', t('any_tag')]].concat(Object.keys(TG).filter(function (g) { return tcount[g]; }).map(function (g) {
      return [g, TG[g][lang === 'zh' ? 0 : 1]];
    })), LS.get('tag', ''));
    fillSelect($('p-only'), [['', t('p_any')], ['any', t('p_all')], ['none', t('p_none')]].concat(PCODES.map(function (c) { return ['only-' + c, t('p_only', { p: PLAT[c] })]; })), '');
  }
  function matchQuery(p, q) {
    if (!q) return true;
    var hay = (p.n + ' ' + (p.z || '') + ' ' + (p.kw || '') + ' ' + (p.c || []).map(function (c) { return CU[c] ? CU[c].join(' ') : c; }).join(' ') + ' ' + (p.a || '')).toLowerCase();
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return terms.every(function (term) {
      if (hay.indexOf(term) >= 0) return true;
      var keys = Object.keys(SYN).filter(function (z) { return term.indexOf(z) >= 0; });
      return keys.some(function (z) { return SYN[z].some(function (e) { return hay.indexOf(e) >= 0; }); });
    });
  }
  var SORT = {
    overall: function (p) { return p.o == null ? -1 : p.o; }, taste: function (p) { return (p.s && p.s[0] != null) ? p.s[0] : -1; },
    pop: function (p) { return p.s ? p.s[1] : -1; }, value: function (p) { return (p.s && p.s[2] != null) ? p.s[2] : -1; },
    hyg: function (p) { return (p.s && p.s[3] != null) ? p.s[3] : -1; }, count: function (p) { return p.rc || 0; }
  };
  var view = [], shown = 150, sel = null;
  function apply() {
    var q = $('q').value.trim(), kind = $('f-kind').value, cuis = $('f-cuis').value, plat = $('f-plat').value;
    var open = $('f-open').checked, rated = $('f-rated').checked, sort = $('f-sort').value, tag = $('f-tag').value;
    LS.set('kind', kind); LS.set('cuis', cuis); LS.set('plat', plat); LS.set('sort', sort); LS.set('from', $('f-from').value); LS.set('tag', tag);
    var ref = refPoint();
    view = P.filter(function (p) {
      if ((p.cl === 1 || p.cl === 3) && !(q && p.n.toLowerCase().indexOf(q.toLowerCase()) >= 0)) return false;
      if (kind ? p.k !== kind : (p.k === 'market' || p.k === 'virtual')) return false;
      if (cuis && (p.c || []).indexOf(cuis) < 0) return false;
      if (plat === 'none' ? (p.pf || '') !== '' : (plat && (p.pf || '').indexOf(plat) < 0)) return false;
      if (rated && p.o == null) return false;
      if (tag && (p.tg || []).indexOf(tag) < 0) return false;
      if (open) { var s = openState(p); if (!s || !s.open) return false; }
      return matchQuery(p, q);
    });
    view.forEach(function (p) { p._d = (p.la != null) ? km(ref, [p.la, p.lo]) : null; });
    if (sort === 'dist') view.sort(function (a, b) { return (a._d == null ? 1e9 : a._d) - (b._d == null ? 1e9 : b._d); });
    else view.sort(function (a, b) { return SORT[sort](b) - SORT[sort](a) || (a._d || 99) - (b._d || 99); });
    shown = 150;
    renderList();
    renderMarkers();
  }
  function renderList() {
    $('count').textContent = t('count', { n: view.length.toLocaleString() });
    var html = view.slice(0, shown).map(function (p) {
      var meta = [(p.c || []).slice(0, 2).map(cuisLabel).join(' · ') || kindLabel(p.k), p.pr ? '$'.repeat(p.pr) : '', distLabel(p._d)].filter(Boolean).join(' · ');
      return '<li class="item' + (sel === p.i ? ' sel' : '') + '" data-i="' + p.i + '">' +
        '<div class="nm">' + esc(p.n) + (p.z ? '<span class="zh">' + esc(p.z) + '</span>' : '') + '</div>' + badge(p.o) +
        '<div class="meta">' + esc(meta) + '</div>' +
        '<div class="line3">' + pills(p) + statusHtml(p) + '</div></li>';
    }).join('');
    if (view.length > shown) html += '<li><button class="more" id="more">' + t('more', { n: Math.min(150, view.length - shown) }) + '</button></li>';
    if (!view.length) html = '<li class="empty">' + t('empty') + '</li>';
    $('list').innerHTML = html;
    var mb = $('more');
    if (mb) mb.onclick = function (e) { e.stopPropagation(); shown += 150; renderList(); };
  }

  // ---------- map ----------
  var map = L.map('map', { preferCanvas: true, zoomControl: true }).setView([43.0731, -89.4012], 13);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, attribution: 'Tiles &copy; Esri &middot; Data: OpenStreetMap, PHMDC, Google, DoorDash, Uber Eats, Toast, EatStreet, Grubhub'
  }).addTo(map);
  var layer = L.layerGroup().addTo(map), markers = {};
  var legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () { var d = L.DomUtil.create('div', 'legend'); d.id = 'legend'; return d; };
  legend.addTo(map);
  function renderLegend() {
    var rows = [['b5', '85+'], ['b4', '75–84'], ['b3', '65–74'], ['b2', '50–64'], ['b1', '<50'], ['na', t('legend_na')]];
    $('legend').innerHTML = '<b>' + t('legend') + '</b>' + rows.map(function (r) {
      return '<span><i style="background:' + COLORS[r[0]] + '"></i>' + r[1] + '</span>';
    }).join('');
  }
  var COLORS = { b5: '#0E6B47', b4: '#2F8A57', b3: '#6FA867', b2: '#B5CC98', b1: '#D3D0C6', na: '#B9B9B9' };
  function renderMarkers() {
    layer.clearLayers();
    markers = {};
    view.forEach(function (p) {
      if (p.la == null) return;
      var tr = tier(p.o);
      var m = L.circleMarker([p.la, p.lo], { radius: sel === p.i ? 9 : (p.o == null ? 3.5 : (tr === 'b5' || tr === 'b4') ? 7 : 5.5), weight: sel === p.i ? 3 : 1,
        color: sel === p.i ? '#111' : (tr === 'b1' || tr === 'b2' || tr === 'na' ? '#8A877E' : '#fff'), fillColor: COLORS[tr], fillOpacity: p.o == null ? 0.7 : 0.95 });
      m.bindTooltip(esc(p.n) + (p.o != null ? ' · ' + p.o : ''), { className: 'tip', direction: 'top', offset: [0, -6] });
      m.on('click', function () { openPlace(p.i, true); });
      m.addTo(layer);
      markers[p.i] = m;
    });
  }

  // ---------- details ----------
  var DETAILS = null, detailsP = null;
  function loadDetails() {
    if (DETAILS) return Promise.resolve(DETAILS);
    if (!detailsP) detailsP = fetch('data/details.json?v=0663b70e3f').then(function (r) { return r.json(); }).then(function (d) { DETAILS = d; return d; });
    return detailsP;
  }
  var byId = {};
  P.forEach(function (p) { byId[p.i] = p; });
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
    dr.innerHTML = '<button class="close" id="dclose" aria-label="Close">×</button><div class="dh"><div><h2>' + esc(p.n) + '</h2></div></div>';
    $('dclose').onclick = closeDrawer;
    loadDetails().then(function (D) { if (sel === i) renderDrawer(p, D[i] || {}); });
  }
  function restyle(i) {
    var m = markers[i], p = byId[i];
    if (!m || !p) return;
    var tr = tier(p.o);
    m.setStyle({ radius: sel === i ? 9 : (p.o == null ? 3.5 : (tr === 'b5' || tr === 'b4') ? 7 : 5.5), weight: sel === i ? 3 : 1,
      color: sel === i ? '#111' : (tr === 'b1' || tr === 'b2' || tr === 'na' ? '#8A877E' : '#fff') });
    if (sel === i) m.bringToFront();
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
  function renderDrawer(p, d) {
    var h = [];
    h.push('<button class="close" id="dclose" aria-label="Close">×</button>');
    var sub = [kindLabel(p.k), (p.c || []).map(cuisLabel).join(' / '), p.pr ? '$'.repeat(p.pr) : '', p.t].filter(Boolean).join(' · ');
    h.push('<div class="dh"><div><h2>' + esc(p.n) + '</h2>' + (p.z ? '<div class="zh2">' + esc(p.z) + '</div>' : '') +
      '<div class="sub">' + esc(sub) + '</div>' +
      '<div class="sub">' + (p.a ? esc(p.a) + ' · ' : '') + '<a href="' + gmapsUrl(p, d) + '" target="_blank" rel="noopener">' + t('gmap') + '</a>' +
      (p._d != null ? ' · ' + distLabel(p._d) : '') + '</div>' +
      '<div class="sub">' + statusHtml(p) + '</div></div>' + badge(p.o, true) + '</div>');
    if (p.ag === 'r' || p.ag === 'y') h.push('<div class="warnbox">' + t(p.ag === 'r' ? 'age_r' : 'age_y') + '</div>');
    // Scores
    var labels = ['taste', 'pop', 'value', 'hyg', 'conv'];
    h.push('<div class="dsec"><div class="bars">' + labels.map(function (k, j) {
      var v = p.s ? p.s[j] : null;
      return '<span>' + t(k) + '</span><div class="bar"><i style="width:' + (v == null ? 0 : v) + '%;background:' + COLORS[tier(v)] + '"></i></div>' +
        '<span class="v' + (v == null ? ' na' : '') + '">' + (v == null ? '—' : v) + '</span>';
    }).join('') + '</div><div class="conf">' + (p.o == null ? t('not_rated') : t('conf_' + (p.cf || 'low'))) +
      ' · <button class="linkish" id="how">' + t('how') + '</button></div><div class="howbox" id="howbox" hidden>' + t('how_body') + '</div></div>');
    // Analysis
    var an = (d.an && d.an[lang]) || [];
    if (an.length) h.push('<div class="dsec"><h3>' + t('analysis') + '</h3><ul class="analysis">' + an.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>');
    // Order buttons
    var btns = (d.lk || []).map(function (l) {
      var code = SRC_CODE[l[0]], col = { d: 'var(--dd)', u: 'var(--ue)', g: 'var(--gh)', e: 'var(--es)', t: 'var(--tt)' }[code];
      return '<a class="obtn' + (l[2] ? '' : ' dis') + '" href="' + esc(l[1]) + '" target="_blank" rel="noopener"><span class="dot" style="background:' + col + '"></span>' +
        SRC[l[0]] + (l[2] ? '' : ' · ' + t('paused')) + '</a>';
    });
    if (d.w) btns.push('<a class="obtn" href="' + esc(d.w) + '" target="_blank" rel="noopener">' + t('site') + '</a>');
    if (d.ph) btns.push('<a class="obtn" href="tel:' + esc(d.ph.replace(/[^\d+]/g, '')) + '">' + t('call') + ' ' + esc(fmtPhone(d.ph)) + '</a>');
    if (btns.length) h.push('<div class="dsec"><h3>' + t('order') + '</h3><div class="btns">' + btns.join('') + '</div></div>');
    if (d.host) h.push('<div class="warnbox">' + t('virtual_host') + esc(d.host) + '</div>');
    // Ratings
    if ((d.rt || []).length) {
      h.push('<div class="dsec"><h3>' + t('ratings') + '</h3><table class="rtab">' + d.rt.map(function (r) {
        return '<tr><td>' + (r[3] ? '<a href="' + esc(r[3]) + '" target="_blank" rel="noopener">' + SRC[r[0]] + '</a>' : SRC[r[0]]) + '</td><td class="num">★ ' + Number(r[1]).toFixed(1) +
          '</td><td class="num">' + (r[0] === 'google' ? '' : t('ratings_n', { n: Number(r[2]).toLocaleString() })) + '</td></tr>';
      }).join('') + '</table></div>');
    }
    // Hours
    if (p.h) {
      h.push('<div class="dsec"><h3>' + t('hours') + '</h3><table class="hours">' + p.h.map(function (iv, j) {
        return '<tr' + (j === NOW.d ? ' class="today"' : '') + '><td>' + t('days')[j] + '</td><td>' + (iv.length ? iv.map(function (x) { return hm(x[0]) + '–' + (x[1] >= 1440 && x[0] === 0 ? '24:00' : hm(x[1])); }).join(', ') : '—') + '</td></tr>';
      }).join('') + '</table>' + (d.ddh ? '<div class="src">' + t('dd_hours') + esc(d.ddh) + '</div>' : '') + '</div>');
    } else {
      h.push('<div class="dsec"><h3>' + t('hours') + '</h3><div class="src">' + (d.ddh ? t('dd_hours') + esc(d.ddh) + '<br>' : '') + (d.ho ? esc(d.ho) + '<br>' : '') + t('no_hours') + '</div></div>');
    }
    // Dishes
    if ((d.ds || []).length) {
      h.push('<div class="dsec"><h3>' + t('dishes') + '</h3><ul class="dishes">' + d.ds.map(function (x) {
        return '<li><span>' + esc(x[0]) + (x[1] ? '<span class="zhd">' + esc(x[1]) + '</span>' : '') + '</span><span>' + (x[2] ? '$' + Number(x[2]).toFixed(2) : '') + '</span></li>';
      }).join('') + '</ul></div>');
    }
    // Reviews
    if ((d.rv || []).length) {
      h.push('<div class="dsec"><h3>' + t('reviews') + '</h3>' + d.rv.map(function (r) {
        return '<blockquote class="quote">' + esc(r[3]) + '<div class="qm">' + SRC[r[0]] + (r[1] ? ' · ' + '★'.repeat(r[1]) : '') + (r[2] ? ' · ' + esc(r[2]) : '') + '</div></blockquote>';
      }).join('') + '</div>');
    }
    // Reddit
    if ((d.rd || []).length) {
      h.push('<div class="dsec"><h3>' + t('reddit') + '</h3>' + d.rd.map(function (r) {
        var meta = '<a href="' + esc(r[4]) + '" target="_blank" rel="noopener">' + esc(r[3] || 'Reddit') + '</a> · ' + esc(r[1]) + ' · ' + t('reddit_n', { s: r[0] });
        // Public build ships links without comment text
        return r[2] ? '<blockquote class="quote">' + esc(r[2]) + '<div class="qm">' + meta + '</div></blockquote>' : '<div class="rlink">' + meta + '</div>';
      }).join('') + '</div>');
    }
    // Inspections
    h.push('<div class="dsec"><h3>' + t('insp') + '</h3>' + ((d.in || []).length ? '<ul class="insp">' + d.in.map(function (x) {
      var bad = /^Reinspection Required/.test(x[2]);
      return '<li>' + esc(x[1]) + ' · ' + esc(x[0]) + ' · <span class="' + (bad ? 'bad' : '') + '">' + (bad ? t('reinsp') : t('ok_insp')) + '</span></li>';
    }).join('') + '</ul>' : '<div class="src">' + t('insp_none') + '</div>') +
      '<div class="src"><a href="https://publichealthmdc.com/healthinspections/" target="_blank" rel="noopener">' + t('insp_link') + '</a></div></div>');
    // Sources
    var srcs = (d.src || []).map(function (s) { return s === 'osm' ? t('src_osm') : t('src_phmdc'); });
    (d.rt || []).forEach(function (r) { if (srcs.indexOf(SRC[r[0]]) < 0) srcs.push(SRC[r[0]]); });
    h.push('<div class="dsec src">' + t('sources') + '：' + esc(srcs.join(' · ')) + (d.lic ? '<br>' + t('lic') + esc(d.lic) : '') +
      (d.gd ? '<br>Google：' + esc(d.gd) : '') + '<br>' + esc(META.built || '') + '</div>');
    var dr = $('drawer');
    dr.innerHTML = h.join('');
    dr.scrollTop = 0;
    $('dclose').onclick = closeDrawer;
    $('how').onclick = function () { $('howbox').hidden = !$('howbox').hidden; };
  }

  // ---------- platforms view ----------
  var psort = { k: 'o', dir: -1 }, pshown = 300;
  function renderPlat() {
    var q = $('pq').value.trim().toLowerCase(), cuis = $('p-cuis').value, only = $('p-only').value;
    var rows = P.filter(function (p) {
      if (p.cl === 1 || p.cl === 3 || p.k === 'market') return false;
      if (cuis && (p.c || []).indexOf(cuis) < 0) return false;
      var on = p.pf || '';
      if (only === 'any' && !on) return false;
      if (only === 'none' && on) return false;
      if (only.indexOf('only-') === 0 && on !== only.slice(5)) return false;
      if (q && (p.n + ' ' + (p.z || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var key = psort.k;
    rows.sort(function (a, b) {
      var va, vb;
      if (key === 'n') { va = a.n.toLowerCase(); vb = b.n.toLowerCase(); return va < vb ? -psort.dir : va > vb ? psort.dir : 0; }
      if (key === 'np') { va = (a.pf || '').length; vb = (b.pf || '').length; }
      else if (key.length === 1) { va = (a.pf || '').indexOf(key) >= 0 ? 1 : 0; vb = (b.pf || '').indexOf(key) >= 0 ? 1 : 0; }
      else { va = a.o == null ? -1 : a.o; vb = b.o == null ? -1 : b.o; }
      return (vb - va) * -psort.dir || ((b.o || 0) - (a.o || 0));
    });
    // Summary
    var all = P.filter(function (p) { return p.cl !== 1 && p.cl !== 3 && p.k !== 'market'; });
    var cnt = {}, anyN = 0;
    all.forEach(function (p) { var on = p.pf || ''; if (on) anyN++; PCODES.forEach(function (c) { if (on.indexOf(c) >= 0) cnt[c] = (cnt[c] || 0) + 1; }); });
    $('plat-sum').innerHTML = PCODES.map(function (c) {
      var excl = all.filter(function (p) { return p.pf === c; }).length;
      return '<div class="psum"><b>' + (cnt[c] || 0) + '</b><span>' + PLAT[c] + ' · ' + t('excl', { n: excl }) + '</span></div>';
    }).join('') + '<div class="psum"><b>' + anyN + ' / ' + all.length + '</b><span>' + t('p_all') + '</span></div>';
    var cols = [['n', t('col_name')], ['c', t('col_cuis')], ['o', t('col_score')]].concat(PCODES.map(function (c) { return [c, PLAT[c]]; })).concat([['np', t('col_n')]]);
    $('plat-th').innerHTML = cols.map(function (c) { return '<th data-k="' + c[0] + '">' + esc(c[1]) + (psort.k === c[0] ? (psort.dir < 0 ? ' ↓' : ' ↑') : '') + '</th>'; }).join('');
    var lkCache = DETAILS;
    $('plat-tb').innerHTML = rows.slice(0, pshown).map(function (p) {
      var on = p.pf || '', listed = p.pl || '';
      var links = lkCache && lkCache[p.i] ? lkCache[p.i].lk : null;
      return '<tr data-i="' + p.i + '"><td class="nmc">' + esc(p.n) + (p.z ? ' <span class="zh">' + esc(p.z) + '</span>' : '') + '</td><td>' + esc((p.c || []).slice(0, 2).map(cuisLabel).join(' / ')) +
        '</td><td class="c">' + (p.o == null ? '—' : p.o) + '</td>' + PCODES.map(function (c) {
          if (on.indexOf(c) >= 0) {
            var url = null;
            if (links) links.forEach(function (l) { if (SRC_CODE[l[0]] === c) url = l[1]; });
            return '<td class="c">' + (url ? '<a class="yes" href="' + esc(url) + '" target="_blank" rel="noopener" style="color:var(--' + { d: 'dd', u: 'ue', g: 'gh', e: 'es', t: 'tt' }[c] + ')">✓</a>' : '✓') + '</td>';
          }
          return '<td class="c">' + (listed.indexOf(c) >= 0 ? '<span title="' + t('listed_only') + '">○</span>' : '<span class="no">·</span>') + '</td>';
        }).join('') + '<td class="c">' + on.length + '</td></tr>';
    }).join('') + (rows.length > pshown ? '<tr><td colspan="9"><button class="more" id="pmore">' + t('more', { n: Math.min(300, rows.length - pshown) }) + '</button></td></tr>' : '');
    $('plat-note').textContent = t('plat_note', { d: META.built || '' });
    var pm = $('pmore');
    if (pm) pm.onclick = function () { pshown += 300; renderPlat(); };
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
    if (sel != null) openPlace(sel, false);
    if ($('view-plat').classList.contains('active')) renderPlat();
  };
  ['q'].forEach(function (id) { var tm; $(id).addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(apply, 160); }); });
  ['f-kind', 'f-cuis', 'f-plat', 'f-sort', 'f-open', 'f-rated', 'f-tag'].forEach(function (id) { $(id).addEventListener('change', apply); });
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
      if (b.getAttribute('data-view') === 'plat') { loadDetails().then(renderPlat); renderPlat(); }
      else setTimeout(function () { map.invalidateSize(); }, 0);
    };
  });
  ['pq', 'p-cuis', 'p-only'].forEach(function (id) { $(id).addEventListener(id === 'pq' ? 'input' : 'change', function () { pshown = 300; renderPlat(); }); });
  $('plat-th').addEventListener('click', function (e) {
    var th = e.target.closest('th');
    if (!th) return;
    var k = th.getAttribute('data-k');
    psort = { k: k, dir: psort.k === k ? -psort.dir : (k === 'n' ? 1 : -1) };
    renderPlat();
  });
  $('plat-tb').addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    var tr = e.target.closest('tr[data-i]');
    if (!tr) return;
    document.querySelector('.tab[data-view="map"]').click();
    openPlace(+tr.getAttribute('data-i'), false);
  });
  $('switcher').onclick = function () {
    document.body.classList.toggle('show-map');
    i18n();
    setTimeout(function () { map.invalidateSize(); }, 0);
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sel != null) closeDrawer(); });

  buildFilters();
  i18n();
  apply();
  var m = /#p=(\d+)/.exec(location.hash);
  if (m) openPlace(+m[1], false);
})();
