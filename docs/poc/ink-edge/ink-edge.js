/**
 * ink-edge — weevolveit.com 火線／墨邊效果復刻
 *
 * 原站用 GSAP + ScrollTrigger，這裡用原生 scroll + requestAnimationFrame
 * 算出同一條進度曲線，效果一致且不需要任何外部函式庫。
 *
 * 真正在動的只有一個屬性：白色方塊的 transform: scaleY()。
 * 所有不規則邊緣都來自 index.html 裡的 <filter id="ink-edge">。
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------
  // 預設值 = weevolveit.com 線上實際使用的參數
  // ---------------------------------------------------------------
  var DEFAULTS = {
    bfx: 0.015,   // feTurbulence baseFrequency X
    bfy: 0.02,    // feTurbulence baseFrequency Y
    oct: 3,       // numOctaves
    scale: 220,   // feDisplacementMap scale → 實際位移 ±110px
    pre: 1.8,     // 前置模糊（讓 alpha 變成漸層，供下一步切割）
    thr: 0.5,     // alpha 閾值（原站 tableValues="0 0 0 0 0 1 1 1 1 1" 即 0.5）
    post: 0.4,    // 二值化後的抗鋸齒模糊
    prog: 0.35    // 手動模式的進度
  };

  var state = Object.assign({}, DEFAULTS);

  // filter 節點
  var turb = document.getElementById('f-turb');
  var disp = document.getElementById('f-disp');
  var preB = document.getElementById('f-pre');
  var cut  = document.getElementById('f-cut');
  var postB = document.getElementById('f-post');

  // 場景節點
  var fill = document.getElementById('inkFill');
  var filtered = document.getElementById('inkFiltered');
  var trigger = document.getElementById('trigger');

  // ---------------------------------------------------------------
  // ease：原站的自訂曲線
  //   p < 0.02 → 直接衝到 0.18（讓墨線一出現就有可見厚度，不是一條細縫）
  //   之後線性推到 1
  // ---------------------------------------------------------------
  function ease(p) {
    return p < 0.02
      ? (p / 0.02) * 0.18
      : 0.18 + ((p - 0.02) / 0.98) * 0.82;
  }

  // ---------------------------------------------------------------
  // 捲動進度：等價於 ScrollTrigger 的
  //   start: "top bottom"  → trigger 頂端碰到視窗底部時 p = 0
  //   end:   "top -25%"    → trigger 頂端超過視窗頂端 25vh 時 p = 1
  // ---------------------------------------------------------------
  function scrollProgress() {
    var vh = window.innerHeight;
    var top = trigger.getBoundingClientRect().top;
    var p = (vh - top) / (vh * 1.25);
    return Math.min(1, Math.max(0, p));
  }

  // ---------------------------------------------------------------
  // feFuncA type="discrete" 的 tableValues
  //
  // discrete 的行為：把 alpha 分成 n 段，第 k 段（k = floor(alpha*n)）
  // 直接取 tableValues[k]。所以前半填 0、後半填 1，就等於
  // 「alpha < 閾值 → 全透明；≥ 閾值 → 全不透明」的硬切。
  // 用 20 段是為了讓閾值可以用 0.05 為單位微調；
  // 閾值 0.5 時的結果與原站的 10 段版本完全相同。
  // ---------------------------------------------------------------
  function buildTable(threshold) {
    var n = 20;
    var k0 = Math.round(threshold * n);
    var out = [];
    for (var i = 0; i < n; i++) out.push(i < k0 ? '0' : '1');
    return out.join(' ');
  }

  // ---------------------------------------------------------------
  // 把 state 寫回 filter 節點
  // ---------------------------------------------------------------
  function applyFilter() {
    turb.setAttribute('baseFrequency', state.bfx + ' ' + state.bfy);
    turb.setAttribute('numOctaves', String(state.oct));
    disp.setAttribute('scale', String(state.scale));
    preB.setAttribute('stdDeviation', String(state.pre));
    cut.setAttribute('tableValues', buildTable(state.thr));
    postB.setAttribute('stdDeviation', String(state.post));
  }

  // ---------------------------------------------------------------
  // 每幀更新（rAF 節流，scroll 事件只負責標記 dirty）
  // ---------------------------------------------------------------
  var rawOut = document.getElementById('rawOut');
  var easedOut = document.getElementById('easedOut');
  var manualBox = document.getElementById('manual');
  var ticking = false;

  function render() {
    ticking = false;
    var raw = manualBox.checked ? state.prog : scrollProgress();
    var eased = ease(raw);
    fill.style.transform = 'scaleY(' + eased.toFixed(4) + ')';
    rawOut.textContent = raw.toFixed(3);
    easedOut.textContent = eased.toFixed(3);
  }

  function requestRender() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender);

  // ---------------------------------------------------------------
  // 控制面板
  // ---------------------------------------------------------------
  var SLIDERS = [
    { key: 'bfx',   fmt: function (v) { return v.toFixed(3); } },
    { key: 'bfy',   fmt: function (v) { return v.toFixed(3); } },
    { key: 'oct',   fmt: function (v) { return String(v); } },
    { key: 'scale', fmt: function (v) { return v + 'px (±' + (v / 2) + ')'; } },
    { key: 'pre',   fmt: function (v) { return v.toFixed(1); } },
    { key: 'thr',   fmt: function (v) { return v.toFixed(2); } },
    { key: 'post',  fmt: function (v) { return v.toFixed(1); } },
    { key: 'prog',  fmt: function (v) { return v.toFixed(2); } }
  ];

  SLIDERS.forEach(function (s) {
    var input = document.getElementById(s.key);
    var out = document.getElementById(s.key + 'Out');

    function sync() {
      var v = parseFloat(input.value);
      state[s.key] = v;
      out.textContent = s.fmt(v);
      if (s.key === 'prog') {
        // 拖進度時自動切到手動模式，不然會被捲動位置蓋掉
        if (!manualBox.checked) manualBox.checked = true;
        requestRender();
      } else {
        applyFilter();
      }
    }

    input.value = state[s.key];
    out.textContent = s.fmt(state[s.key]);
    input.addEventListener('input', sync);
    s.sync = sync;
  });

  manualBox.addEventListener('change', requestRender);

  document.getElementById('nofilter').addEventListener('change', function (e) {
    filtered.classList.toggle('no-filter', e.target.checked);
  });

  // 關閉外擴 → 位移被 overflow:hidden 切掉，兩側露出直線切口
  document.getElementById('nobleed').addEventListener('change', function (e) {
    filtered.classList.toggle('no-bleed', e.target.checked);
  });

  document.getElementById('reset').addEventListener('click', function () {
    Object.assign(state, DEFAULTS);
    SLIDERS.forEach(function (s) {
      document.getElementById(s.key).value = state[s.key];
      document.getElementById(s.key + 'Out').textContent = s.fmt(state[s.key]);
    });
    applyFilter();
    requestRender();
  });

  // 面板收合
  var panel = document.getElementById('panel');
  var panelToggle = document.getElementById('panelToggle');
  document.getElementById('panelHead').addEventListener('click', function () {
    var open = panel.getAttribute('data-open') !== 'false';
    panel.setAttribute('data-open', open ? 'false' : 'true');
    panelToggle.textContent = open ? '展開 +' : '收合 −';
  });

  // ---------------------------------------------------------------
  // 起始狀態
  // ---------------------------------------------------------------
  applyFilter();
  render();
})();
