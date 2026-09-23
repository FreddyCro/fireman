/**
 * fire-edge — 段落邊界上的燃燒火焰，火勢隨議題遞減
 *
 * 對應設計師 feedback：
 *   1. ink-edge 像「燒成灰燼」的焦邊 → 改成會動、有溫度色階、火舌高低不一的大火。
 *   2. 火勢要從前面旺到後面逐漸變小 → 每一段的 data-fire（0–1）決定那段底邊的火勢。
 *
 * 架構：一張 position:fixed 的全視窗 canvas，一個 fragment shader。
 * 每一幀把「畫面中各段的底邊 y 座標 + 火勢」傳進 shader，shader 在每道邊界往上畫火。
 * 不依賴任何外部函式庫。
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------
  // 預設參數
  // ---------------------------------------------------------------
  var DEFAULTS = {
    gain: 1,       // 火勢總倍率（乘在每段 data-fire 上）
    height: 55,    // 滿火勢時的火焰高度（vh）
    scale: 110,    // 火舌尺度（px）：噪聲的基本週期，越大火舌越寬
    warp: 1.1,     // domain warp 強度：越大火舌越捲、越會分岔
    speed: 1,      // 竄升速度倍率
    sparks: 0.6,   // 火星密度
    res: 0.5       // 渲染解析度（相對 CSS px）；火焰本來就柔，半解析度看不出差別
  };
  var state = Object.assign({}, DEFAULTS);
  var MAX_BOUNDS = 8;

  // ---------------------------------------------------------------
  // Shader
  // ---------------------------------------------------------------
  var VERT = [
    'attribute vec2 a_pos;',
    'void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  u_res;',            // 視窗大小（CSS px）
    'uniform float u_rs;',             // 渲染倍率：canvas px / CSS px
    'uniform float u_time;',
    'uniform float u_bY[' + MAX_BOUNDS + '];', // 邊界 y（CSS px，從視窗頂端算）
    'uniform float u_bI[' + MAX_BOUNDS + '];', // 邊界火勢 0–1
    'uniform int   u_count;',
    'uniform float u_maxH;',           // 滿火勢火焰高度（CSS px）
    'uniform float u_scale;',
    'uniform float u_warp;',
    'uniform float u_speed;',
    'uniform float u_sparks;',

    // 不用 sin 的 hash，行動裝置上精度比較穩
    'float hash(vec2 p){',
    '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
    '  p3 += dot(p3, p3.yzx + 33.33);',
    '  return fract((p3.x + p3.y) * p3.z);',
    '}',
    'float noise(vec2 p){',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0; float a = 0.5;',
    '  for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.02 + vec2(17.13, 9.71); a *= 0.5; }',
    '  return v;',
    '}',
    'float fbm3(vec2 p){',
    '  float v = 0.0; float a = 0.5;',
    '  for (int i = 0; i < 3; i++){ v += a * noise(p); p = p * 2.03 + vec2(5.3, 11.7); a *= 0.5; }',
    '  return v;',
    '}',

    // 溫度 → 顏色：暗紅 → 紅 → 橘 → 黃 → 近白
    'vec3 fireColor(float t){',
    '  vec3 c = mix(vec3(0.30, 0.02, 0.00), vec3(0.85, 0.12, 0.02), smoothstep(0.00, 0.30, t));',
    '  c = mix(c, vec3(1.00, 0.45, 0.06), smoothstep(0.25, 0.60, t));',
    '  c = mix(c, vec3(1.00, 0.82, 0.30), smoothstep(0.55, 0.85, t));',
    '  c = mix(c, vec3(1.00, 0.97, 0.85), smoothstep(0.85, 1.00, t));',
    '  return c;',
    '}',

    'void main(){',
    '  vec2 frag = gl_FragCoord.xy / u_rs;',
    '  float x = frag.x;',
    '  float y = u_res.y - frag.y;',       // 轉成「從頂端往下」的 CSS 座標
    '  vec4 acc = vec4(0.0);',

    '  for (int i = 0; i < ' + MAX_BOUNDS + '; i++){',
    '    if (i >= u_count) break;',
    '    float I = u_bI[i];',
    '    if (I < 0.002) continue;',
    '    float up = u_bY[i] - y;',          // 高於邊界多少 px（負數 = 在邊界下方）
    '    float H = u_maxH * (0.08 + 0.92 * I);',
    '    if (up < -40.0 || up > H * 2.0) continue;',
    '    float fi = float(i);',
    '    float t = u_time * u_speed * (0.45 + 0.75 * I);', // 火小 → 燒得慢

    // 火舌：沿 x 方向的低頻噪聲改變局部高度，做出高低不一的火舌
    '    float tongue = fbm3(vec2(x / (u_scale * 2.4) + fi * 11.3, t * 0.35 + fi * 3.1));',
    '    float h = up / (H * (0.15 + 1.6 * tongue));', // 0 = 火根，1 = 名目火焰頂

    // 火焰本體：垂直拉長、往上捲動的 fbm，取樣座標再被另一組噪聲扭曲（domain warp）
    '    vec2 p = vec2(x / u_scale, y / (u_scale * 1.7)) + vec2(fi * 7.7, t * 1.3);',
    '    vec2 q = vec2(fbm3(p * 0.9 + vec2(0.0, t * 0.4)), fbm3(p * 0.9 + vec2(5.2, 1.3 + t * 0.5)));',
    '    float n = fbm(p + u_warp * (q - 0.5) * 2.2);',
    '    float f = n * 1.7 - 0.3 - h;',     // 火根處幾乎全滿，越往上只剩噪聲峰值
    // 斷續度：火勢越小，越只剩零星幾叢在燒（滿火勢時 = 一整排連續的火）
    '    float clump = fbm3(vec2(x / (u_scale * 3.5) + fi * 5.1, t * 0.12));',
    '    f -= (1.0 - I) * 1.5 * smoothstep(0.66, 0.35, clump);',
    // 火根不要是一條筆直的亮帶：邊界上下用噪聲把火根也打散
    '    f -= smoothstep(0.0, -40.0, up) * (0.9 - n);',

    '    float below = smoothstep(-40.0, 0.0, up);',
    '    float body  = smoothstep(0.0, 0.05, f) * below;',
    '    float temp  = clamp(f * 1.25 + 0.15, 0.0, 1.0) * mix(0.16, 1.0, pow(I, 0.7)) * mix(0.45, 1.0, below);',
    '    vec3  c     = fireColor(temp) * body;',
    '    float al    = body;',

    // 光暈：火焰外圍一圈橘光
    '    float glow = exp(min(f, 0.0) * 7.0) * (1.0 - body) * 0.28 * (0.3 + 0.7 * I) * below;',
    '    c  += vec3(1.0, 0.35, 0.05) * glow;',
    '    al += glow;',

    // 火星：兩層往上飄的格點，每格依機率放一顆
    '    float sp = 0.0;',
    '    for (int L = 0; L < 2; L++){',
    '      float fl = float(L);',
    '      float cell = 22.0 + fl * 16.0;',
    '      float rise = (90.0 + 60.0 * fl) * u_speed * (0.5 + 0.7 * I);',
    '      vec2 sc = vec2(x + fi * 37.0, y + u_time * rise) / cell;',
    '      vec2 id = floor(sc);',
    '      float r = hash(id + fi * 17.0 + fl * 91.0);',
    '      if (r < u_sparks * I * 0.18){',
    '        vec2 cc = 0.25 + 0.5 * vec2(hash(id + 3.7), hash(id + 9.1));',
    '        cc.x += 0.2 * sin(u_time * 2.0 + r * 60.0);',
    '        float d = length(fract(sc) - cc) * cell;',
    '        float life = 1.0 - clamp(up / (H * 2.0), 0.0, 1.0);',
    '        sp += smoothstep(2.6, 0.0, d) * life * step(0.0, up);',
    '      }',
    '    }',
    '    c  += vec3(1.0, 0.7, 0.3) * sp;',
    '    al += sp;',

    '    al = clamp(al, 0.0, 1.0);',
    '    acc.rgb += c * (1.0 - acc.a);',
    '    acc.a   += al * (1.0 - acc.a);',
    '  }',
    '  gl_FragColor = vec4(min(acc.rgb, vec3(1.0)), acc.a);', // premultiplied alpha
    '}'
  ].join('\n');

  // ---------------------------------------------------------------
  // WebGL 初始化
  // ---------------------------------------------------------------
  var canvas = document.getElementById('fire');
  var warn = document.getElementById('warn');
  var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });

  function fail(msg) {
    warn.hidden = false;
    warn.textContent = msg;
    canvas.style.display = 'none';
  }

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  var prog, U = {};
  if (!gl) {
    fail('這個瀏覽器不支援 WebGL，火焰無法顯示。');
  } else {
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      console.error(e);
      fail('shader 編譯失敗：' + e.message);
      gl = null;
    }
  }

  if (gl) {
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // 一個蓋滿畫面的三角形
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    ['u_res', 'u_rs', 'u_time', 'u_bY', 'u_bI', 'u_count', 'u_maxH', 'u_scale', 'u_warp', 'u_speed', 'u_sparks']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  }

  // ---------------------------------------------------------------
  // 段落
  // ---------------------------------------------------------------
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-fire]'));
  var initialFire = sections.map(function (s) { return parseFloat(s.dataset.fire) || 0; });

  function setSectionFire(sec, v) {
    sec.dataset.fire = String(v);
    sec.style.setProperty('--fire', String(v));   // 底部留白跟著火勢
    var tag = sec.querySelector('.tag b');
    if (tag) tag.textContent = '火勢 ' + Math.round(v * 100) + '%';
  }
  sections.forEach(function (s, i) { setSectionFire(s, initialFire[i]); });

  // ---------------------------------------------------------------
  // 尺寸
  // ---------------------------------------------------------------
  var vw = 0, vh = 0;
  function resize() {
    vw = document.documentElement.clientWidth;
    vh = window.innerHeight;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    canvas.width = Math.max(1, Math.round(vw * state.res));
    canvas.height = Math.max(1, Math.round(vh * state.res));
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);

  // ---------------------------------------------------------------
  // 主迴圈
  // ---------------------------------------------------------------
  var pauseBox = document.getElementById('pause');
  var fpsOut = document.getElementById('fpsOut');
  var liveOut = document.getElementById('liveOut');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) pauseBox.checked = true; // 減少動態：火焰定格，但捲動時仍會跟著邊界移動

  var bY = new Float32Array(MAX_BOUNDS);
  var bI = new Float32Array(MAX_BOUNDS);
  var time = 3.0;
  var last = performance.now();
  var frames = 0, fpsT = last;

  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!pauseBox.checked) time = (time + dt) % 1000;

    var maxH = state.height / 100 * vh;
    var count = 0, live = [];
    for (var i = 0; i < sections.length && count < MAX_BOUNDS; i++) {
      var I = Math.min(1, (parseFloat(sections[i].dataset.fire) || 0) * state.gain);
      if (I <= 0) continue;
      var bottom = sections[i].getBoundingClientRect().bottom;
      var H = maxH * (0.08 + 0.92 * I);
      // 只把在畫面內（含火焰往上竄的範圍）的邊界送進 shader
      if (bottom < -80 || bottom - H * 2 > vh) continue;
      bY[count] = bottom;
      bI[count] = I;
      count++;
      live.push(sections[i].dataset.label + ' ' + Math.round(I * 100) + '%');
    }

    if (gl) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (count > 0) {
        gl.uniform2f(U.u_res, vw, vh);
        gl.uniform1f(U.u_rs, canvas.width / vw);
        gl.uniform1f(U.u_time, time);
        gl.uniform1fv(U.u_bY, bY);
        gl.uniform1fv(U.u_bI, bI);
        gl.uniform1i(U.u_count, count);
        gl.uniform1f(U.u_maxH, maxH);
        gl.uniform1f(U.u_scale, state.scale);
        gl.uniform1f(U.u_warp, state.warp);
        gl.uniform1f(U.u_speed, state.speed);
        gl.uniform1f(U.u_sparks, state.sparks);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }

    frames++;
    if (now - fpsT > 500) {
      fpsOut.textContent = Math.round(frames * 1000 / (now - fpsT));
      frames = 0; fpsT = now;
      liveOut.textContent = live.length ? live.join('、') : '無';
    }
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------
  // 控制面板
  // ---------------------------------------------------------------
  var SLIDERS = [
    { key: 'gain',   fmt: function (v) { return Math.round(v * 100) + '%'; } },
    { key: 'height', fmt: function (v) { return v + 'vh'; } },
    { key: 'scale',  fmt: function (v) { return v + 'px'; } },
    { key: 'warp',   fmt: function (v) { return v.toFixed(2); } },
    { key: 'speed',  fmt: function (v) { return v.toFixed(2) + '×'; } },
    { key: 'sparks', fmt: function (v) { return Math.round(v * 100) + '%'; } },
    { key: 'res',    fmt: function (v) { return Math.round(v * 100) + '%'; } }
  ];

  SLIDERS.forEach(function (s) {
    var input = document.getElementById(s.key);
    var out = document.getElementById(s.key + 'Out');
    input.value = state[s.key];
    out.textContent = s.fmt(state[s.key]);
    input.addEventListener('input', function () {
      state[s.key] = parseFloat(input.value);
      out.textContent = s.fmt(state[s.key]);
      if (s.key === 'res') resize();
    });
  });

  // 各段火勢：依頁面上的 data-fire 段落動態產生
  var perSection = document.getElementById('perSection');
  var sectionInputs = sections.map(function (sec, i) {
    var id = 'fire-' + i;
    var wrap = document.createElement('div');
    wrap.className = 'ctrl';
    wrap.innerHTML =
      '<div class="ctrl-row"><label for="' + id + '"></label><output></output></div>' +
      '<input type="range" id="' + id + '" min="0" max="1" step="0.01">';
    wrap.querySelector('label').textContent = sec.dataset.label || ('段落 ' + (i + 1));
    var input = wrap.querySelector('input');
    var out = wrap.querySelector('output');
    input.value = sec.dataset.fire;
    out.textContent = Math.round(sec.dataset.fire * 100) + '%';
    input.addEventListener('input', function () {
      var v = parseFloat(input.value);
      setSectionFire(sec, v);
      out.textContent = Math.round(v * 100) + '%';
    });
    perSection.appendChild(wrap);
    return { input: input, out: out };
  });

  document.getElementById('reset').addEventListener('click', function () {
    Object.assign(state, DEFAULTS);
    SLIDERS.forEach(function (s) {
      document.getElementById(s.key).value = state[s.key];
      document.getElementById(s.key + 'Out').textContent = s.fmt(state[s.key]);
    });
    sections.forEach(function (sec, i) {
      setSectionFire(sec, initialFire[i]);
      sectionInputs[i].input.value = initialFire[i];
      sectionInputs[i].out.textContent = Math.round(initialFire[i] * 100) + '%';
    });
    resize();
  });

  var panel = document.getElementById('panel');
  var panelToggle = document.getElementById('panelToggle');
  document.getElementById('panelHead').addEventListener('click', function () {
    var open = panel.getAttribute('data-open') !== 'false';
    panel.setAttribute('data-open', open ? 'false' : 'true');
    panelToggle.textContent = open ? '展開 +' : '收合 −';
  });

  // ---------------------------------------------------------------
  // 起始
  // ---------------------------------------------------------------
  resize();
  requestAnimationFrame(frame);
})();
