// Cảnh 3D "Hành trình ngọn lửa": các hạt lửa đổi hình theo chương khi cuộn.
// Thứ tự cảnh: 0 đốm than · 1 tia lửa · 2 ngọn lửa · 3 lò rèn · 4 ngọn đuốc + mạng nút · 5 năm ngọn lửa · 6 ngọn lửa lớn
(function () {
  'use strict';
  var root = document.documentElement;
  var sections = Array.prototype.slice.call(document.querySelectorAll('.ch'));
  var railLinks = Array.prototype.slice.call(document.querySelectorAll('.rail a'));
  var hudNum = document.getElementById('hud-num');
  var hudName = document.getElementById('hud-name');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LAST = sections.length - 1;
  var TOTAL = String(LAST).padStart(2, '0');

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    var label = copyBtn.textContent;
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy');
      var fallback = function () {
        var r = document.createRange(); r.selectNodeContents(document.getElementById('email-text'));
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        copyBtn.textContent = copyBtn.getAttribute('data-fallback');
      };
      try {
        navigator.clipboard.writeText(text).then(function () {
          copyBtn.textContent = copyBtn.getAttribute('data-done');
          setTimeout(function () { copyBtn.textContent = label; }, 1600);
        }, fallback);
      } catch (e) { fallback(); }
    });
  }

  /* ---------- Scroll → chapter progress ---------- */
  var centers = [];
  function measure() { centers = sections.map(function (s) { return s.offsetTop + s.offsetHeight / 2; }); }
  // Desktop đọc ở giữa màn hình; mobile đọc ở nửa dưới (nửa trên là cảnh 3D).
  function isWide() { return window.innerWidth > 860; }
  function scrollProgress() {
    var mid = window.scrollY + window.innerHeight * (isWide() ? 0.5 : 0.73);
    if (mid <= centers[0]) return 0;
    for (var k = 0; k < LAST; k++) {
      if (mid < centers[k + 1]) return k + (mid - centers[k]) / (centers[k + 1] - centers[k]);
    }
    return LAST;
  }
  var shown = -1;
  function updateHud(p) {
    var k = Math.round(p);
    if (k === shown) return;
    shown = k;
    if (hudNum) hudNum.textContent = String(k).padStart(2, '0') + '/' + TOTAL;
    if (hudName) hudName.textContent = sections[k].getAttribute('data-name');
    railLinks.forEach(function (a, i) { if (i === k) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  }
  measure();
  window.addEventListener('load', measure);
  updateHud(scrollProgress());
  window.addEventListener('scroll', function () { updateHud(scrollProgress()); }, { passive: true });

  /* ---------- Three.js ---------- */
  if (!window.THREE) { root.classList.add('no-webgl'); return; }
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: false, powerPreference: 'high-performance' });
  } catch (e) { root.classList.add('no-webgl'); return; }
  renderer.setClearColor(0x110C0A, 1);

  var small = Math.min(window.innerWidth, window.innerHeight) < 600;
  var N = small ? 2800 : 5200;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 7);
  var group = new THREE.Group();
  scene.add(group);

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rand = rng(20261105);
  var S = new Float32Array(N * 4);
  for (var i = 0; i < N * 4; i++) S[i] = rand();

  // Thang nhiệt: 0 = đỏ sẫm, 1 = lõi trắng nóng.
  var STOPS = [[0, 0x3a0f0b], [0.2, 0xB8392F], [0.4, 0xE5473A], [0.56, 0xFF6B2C], [0.7, 0xFF8F40], [0.84, 0xFFC15E], [1, 0xFFF1D6]];
  var LUT = new Float32Array(256 * 3);
  (function () {
    for (var j = 0; j < 256; j++) {
      var h = j / 255, a = 0;
      while (a < STOPS.length - 2 && h > STOPS[a + 1][0]) a++;
      var s0 = STOPS[a], s1 = STOPS[a + 1], f = (h - s0[0]) / (s1[0] - s0[0]);
      var c0 = new THREE.Color(s0[1]), c1 = new THREE.Color(s1[1]);
      LUT[j * 3] = c0.r + (c1.r - c0.r) * f;
      LUT[j * 3 + 1] = c0.g + (c1.g - c0.g) * f;
      LUT[j * 3 + 2] = c0.b + (c1.b - c0.b) * f;
    }
  })();

  // Mạng nút quanh ngọn đuốc (chương 4).
  var K = 34, nodes = [], edges = [];
  var TORCH_TOP = [0, 0.62, 0];
  (function () {
    var r2 = rng(7);
    while (nodes.length < K) {
      var a = r2() * Math.PI * 2, d = 1.25 + r2() * 1.45;
      nodes.push([Math.cos(a) * d * 1.15, Math.sin(a) * d * 0.72 + 0.35, (r2() - 0.5) * 1.4]);
    }
    var seen = {};
    function link(p, q) { var id = p < q ? p + '-' + q : q + '-' + p; if (seen[id]) return; seen[id] = 1; edges.push([nodes[p], nodes[q]]); }
    nodes.forEach(function (n, p) {
      var near = nodes.map(function (m, q) { return [q, Math.pow(m[0] - n[0], 2) + Math.pow(m[1] - n[1], 2) + Math.pow(m[2] - n[2], 2)]; })
        .filter(function (e) { return e[0] !== p; }).sort(function (u, v) { return u[1] - v[1]; });
      link(p, near[0][0]); link(p, near[1][0]);
    });
    nodes.map(function (n, p) { return [p, n[0] * n[0] + Math.pow(n[1] - 0.6, 2)]; }).sort(function (u, v) { return u[1] - v[1]; })
      .slice(0, 6).forEach(function (e) { edges.push([TORCH_TOP, nodes[e[0]]]); });
  })();
  var E = edges.length;

  var o = { x: 0, y: 0, z: 0, h: 0, s: 1 };

  function flame(i, t, sc, cx, cy) {
    var b = i * 4, s0 = S[b], s1 = S[b + 1], s2 = S[b + 2], s3 = S[b + 3];
    var u = (s0 + t * (0.2 + 0.3 * s1)) % 1;
    var ang = s2 * 6.2832;
    var prof = Math.pow(1 - u, 1.35) * Math.sin(Math.min(1, u * 3 + 0.25) * 1.5708);
    var tongues = 1 + 0.38 * Math.sin(ang * 3 + t * 1.7 + u * 4) * u;
    var rf = Math.sqrt(s3);
    var r = 0.62 * prof * rf * tongues;
    var sway = Math.sin(u * 5 - t * 2.2 + s1 * 2) * 0.13 * u * u + Math.sin(t * 0.9) * 0.05 * u;
    o.x = cx + (Math.cos(ang) * r + sway) * sc;
    o.y = cy + (u * 2.4 - 1.1) * sc;
    o.z = Math.sin(ang) * r * sc * 0.8;
    o.h = Math.max(0.05, 1.04 - u * 0.78 - rf * 0.32);
    o.s = 0.65 + (1 - u) * 0.7;
  }

  function embers(i, t) {
    var b = i * 4, s0 = S[b], s1 = S[b + 1], s2 = S[b + 2], s3 = S[b + 3];
    o.x = (s0 - 0.5) * 13 + Math.sin(t * 0.4 + s2 * 12) * 0.25;
    o.y = ((s1 * 9 + t * (0.1 + 0.22 * s3)) % 9) - 4.5;
    o.z = (s2 - 0.5) * 6 - 1;
    o.h = 0.28 + 0.45 * s3;
    o.s = 0.45 + s3 * 0.7;
  }

  function rotY(a, tilt) {
    var c = Math.cos(a), s = Math.sin(a), x = o.x * c + o.z * s, z = -o.x * s + o.z * c;
    var ct = Math.cos(tilt), st = Math.sin(tilt), y = o.y * ct - z * st; z = o.y * st + z * ct;
    o.x = x; o.y = y; o.z = z;
  }

  function state(k, i, t) {
    var b = i * 4, s0 = S[b], s1 = S[b + 1], s2 = S[b + 2], s3 = S[b + 3];
    switch (k) {
      case 0: embers(i, t); return;
      case 1: {
        if (s3 < 0.45) { o.x = 0; o.y = 0; o.z = 0; o.h = 0.9; o.s = 0; return; }
        if (s3 < 0.86) {
          var r = (0.04 + 0.14 * Math.pow(s0, 3)) * (1 + 0.12 * Math.sin(t * 3.1));
          var th = s1 * 6.2832, ph = Math.acos(2 * s2 - 1);
          o.x = r * Math.sin(ph) * Math.cos(th); o.y = r * Math.cos(ph); o.z = r * Math.sin(ph) * Math.sin(th);
          o.h = 1 - s0 * 0.45; o.s = 0.5; return;
        }
        var u = (s0 + t * (0.22 + 0.3 * s1)) % 1;
        o.x = Math.sin(s2 * 40) * u * 1.1 + Math.sin(t + s1 * 9) * 0.05;
        o.y = u * 2.3 - 0.1; o.z = Math.cos(s2 * 40) * u * 0.4;
        o.h = 1 - u * 0.9; o.s = 0.8; return;
      }
      case 2: flame(i, t, 1.15, 0, -0.15); return;
      case 3: {
        var g = i % 3, cx = (g - 1) * 1.75;
        if (s3 > 0.9) {
          var v = (s0 + t * 0.5) % 1;
          o.x = cx + (s1 - 0.5) * 0.9; o.y = -1.35 + v * 1.1; o.z = (s2 - 0.5) * 0.5;
          o.h = 1 - v; o.s = 0.55; return;
        }
        if (g === 0) {
          var face = Math.floor(s0 * 6), a = s1 - 0.5, c = s2 - 0.5;
          if (s3 < 0.45) { if (Math.abs(a) > Math.abs(c)) a = a > 0 ? 0.5 : -0.5; else c = c > 0 ? 0.5 : -0.5; }
          var ax = face % 3, sign = face < 3 ? 0.5 : -0.5;
          if (ax === 0) { o.x = sign; o.y = a; o.z = c; } else if (ax === 1) { o.x = a; o.y = sign; o.z = c; } else { o.x = a; o.y = c; o.z = sign; }
          o.x *= 1.05; o.y *= 1.05; o.z *= 1.05;
          o.h = 0.8 + 0.08 * s3;
        } else if (g === 1) {
          var T = s1 * 6.2832, P = s2 * 6.2832, R = 0.55, rr = 0.17;
          o.x = (R + rr * Math.cos(P)) * Math.cos(T); o.y = (R + rr * Math.cos(P)) * Math.sin(T); o.z = rr * Math.sin(P);
          o.h = 0.64 + 0.08 * s3;
        } else {
          var th2 = s1 * 6.2832, ph2 = Math.acos(2 * s2 - 1);
          var dx = Math.sin(ph2) * Math.cos(th2), dy = Math.cos(ph2), dz = Math.sin(ph2) * Math.sin(th2);
          var m = (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / 0.8;
          o.x = dx / m; o.y = dy / m; o.z = dz / m;
          o.h = 0.92 + 0.06 * s3;
        }
        rotY(t * 0.35 + g * 1.3, 0.35);
        o.x += cx; o.y += 0.15; o.s = 0.7; return;
      }
      case 4: {
        if (s3 < 0.2) {
          var hy = -1.95 + s0 * 1.5, ha = s1 * 6.2832, hr = 0.06 + 0.025 * s2 + (hy > -0.6 ? 0.03 : 0);
          o.x = Math.cos(ha) * hr; o.y = hy; o.z = Math.sin(ha) * hr;
          o.h = 0.16 + 0.12 * s2 + (hy > -0.65 ? 0.2 : 0); o.s = 0.55; return;
        }
        if (s3 < 0.5) { flame(i, t, 0.44, 0, 0.06); return; }
        if (s1 < 0.5) {
          var n = nodes[Math.floor(s0 * K)], j = 0.05;
          o.x = n[0] + (s2 - 0.5) * j; o.y = n[1] + (s3 - 0.75) * j * 2; o.z = n[2] + (s2 - 0.5) * j;
          o.h = 0.86; o.s = 0.85 + 0.35 * Math.sin(t * 2 + s0 * 30); return;
        }
        var e = edges[Math.floor(s2 * E)], f = ((s1 - 0.5) * 2 + t * 0.18) % 1;
        o.x = e[0][0] + (e[1][0] - e[0][0]) * f; o.y = e[0][1] + (e[1][1] - e[0][1]) * f; o.z = e[0][2] + (e[1][2] - e[0][2]) * f;
        o.h = 0.7; o.s = 0.45; return;
      }
      case 5: {
        var q = i % 5;
        flame(i, t * (0.92 + q * 0.04), 0.36, (q - 2) * 0.98, -0.2 - Math.abs(q - 2) * 0.16);
        return;
      }
      default: {
        if (s3 > 0.93) { embers(i, t); return; }
        flame(i, t, 1.42, 0, -0.35); o.s *= 1.1; return;
      }
    }
  }

  var pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N);
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  var mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1 } },
    vertexShader: 'attribute vec3 aColor; attribute float aSize; uniform float uScale; varying vec3 vColor;' +
      'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;' +
      'gl_PointSize = aSize * uScale / -mv.z; vColor = aColor; }',
    fragmentShader: 'varying vec3 vColor; void main(){ float d = length(gl_PointCoord - 0.5);' +
      'float a = smoothstep(0.5, 0.0, d); a *= a; if (a < 0.01) discard; gl_FragColor = vec4(vColor * a, 1.0); }',
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true
  });
  var points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  group.add(points);

  var lp = new Float32Array(E * 6);
  edges.forEach(function (e, k) { lp.set(e[0], k * 6); lp.set(e[1], k * 6 + 3); });
  var lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  var lmat = new THREE.LineBasicMaterial({ color: 0xFF7A33, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.LineSegments(lgeo, lmat));

  // Khung bao của từng cảnh trong hệ tọa độ thế giới: [minX, maxX, minY, maxY]. null = phủ toàn màn hình.
  var BOX = [
    null,                       // 0 đốm than
    [-1.2, 1.2, -0.35, 2.25],   // 1 tia lửa
    [-0.95, 0.95, -1.45, 1.4],  // 2 ngọn lửa
    [-2.45, 2.45, -1.45, 0.95], // 3 lò rèn
    [-3.25, 3.25, -2.0, 2.45],  // 4 ngọn đuốc + mạng nút
    [-2.4, 2.4, -1.0, 0.4],     // 5 năm ngọn lửa
    [-1.15, 1.15, -1.95, 1.55]  // 6 ngọn lửa lớn
  ];
  var canvas = renderer.domElement;
  var wide = true, halfW = 1, halfH = 1;
  var FIT = [];
  function resize() {
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wide = isWide();
    halfH = Math.tan(camera.fov * Math.PI / 360) * camera.position.z;
    halfW = halfH * camera.aspect;
    mat.uniforms.uScale.value = dpr * Math.max(h, 420) / 900 * (wide ? 44 : 56);
    // Vùng dành cho cảnh, theo tỉ lệ khung canvas (x trái→phải, y trên→dưới).
    var reg = wide ? [0.47, 0.93, 0.12, 0.9] : [0.05, 0.95, 0.17, 0.97];
    var rx0 = (reg[0] * 2 - 1) * halfW, rx1 = (reg[1] * 2 - 1) * halfW;
    var ry1 = (1 - reg[2] * 2) * halfH, ry0 = (1 - reg[3] * 2) * halfH;
    var maxS = wide ? 1.3 : 1.0;
    FIT = BOX.map(function (b) {
      if (!b) return { s: 1, x: wide ? 0 : 0, y: 0 };
      var s = Math.min(maxS, (rx1 - rx0) / (b[1] - b[0]), (ry1 - ry0) / (b[3] - b[2]));
      return { s: s, x: (rx0 + rx1) / 2 - s * (b[0] + b[1]) / 2, y: (ry0 + ry1) / 2 - s * (b[2] + b[3]) / 2 };
    });
    measure();
  }
  resize();
  window.addEventListener('resize', resize);

  var mouseX = 0, mouseY = 0;
  window.addEventListener('pointermove', function (e) {
    mouseX = e.clientX / window.innerWidth - 0.5; mouseY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  var A = { x: 0, y: 0, z: 0, h: 0, s: 0 };
  var p = scrollProgress(), t = 0, last = performance.now(), running = true;
  var k0 = Math.min(LAST, Math.round(p));
  var gx = FIT[k0].x, gy = FIT[k0].y, gs = FIT[k0].s;

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt * (reduce ? 0.2 : 1);
    var target = scrollProgress();
    p += (target - p) * Math.min(1, dt * (reduce ? 20 : 4.5));
    var k = Math.min(LAST - 1, Math.floor(p)), f = Math.min(1, Math.max(0, p - k));
    f = f * f * (3 - 2 * f);
    var swirl = reduce ? 0 : 4 * f * (1 - f) * 0.9;

    for (var i = 0; i < N; i++) {
      state(k, i, t); A.x = o.x; A.y = o.y; A.z = o.z; A.h = o.h; A.s = o.s;
      state(k + 1, i, t);
      var x = A.x + (o.x - A.x) * f, y = A.y + (o.y - A.y) * f, z = A.z + (o.z - A.z) * f;
      if (swirl > 0) {
        var b = i * 4;
        x += Math.sin(t * 1.3 + S[b] * 20) * swirl * (0.4 + S[b + 2]);
        y += Math.cos(t * 1.1 + S[b + 1] * 20) * swirl * 0.6;
        z += Math.sin(t * 0.9 + S[b + 3] * 20) * swirl * 0.5;
      }
      var h = A.h + (o.h - A.h) * f, s = A.s + (o.s - A.s) * f;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      var li = Math.max(0, Math.min(255, (h * 255) | 0)) * 3, inten = 0.42 + h * 0.4;
      col[i * 3] = LUT[li] * inten; col[i * 3 + 1] = LUT[li + 1] * inten; col[i * 3 + 2] = LUT[li + 2] * inten;
      siz[i] = s;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;

    lmat.opacity = Math.max(0, 1 - Math.abs(p - 4)) * 0.28 * (0.8 + 0.2 * Math.sin(t * 2));

    var FA = FIT[k], FB = FIT[k + 1];
    var tx = FA.x + (FB.x - FA.x) * f, ty = FA.y + (FB.y - FA.y) * f, ts = FA.s + (FB.s - FA.s) * f;
    var ease = Math.min(1, dt * 6);
    gx += (tx - gx) * ease; gy += (ty - gy) * ease; gs += (ts - gs) * ease;
    group.position.set(gx, gy, 0);
    group.scale.setScalar(gs);
    group.rotation.y = Math.sin(t * 0.12) * 0.18 + mouseX * 0.25;
    group.rotation.x = mouseY * 0.12;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });
})();
