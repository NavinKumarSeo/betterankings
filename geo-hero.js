/* ============================================================
   BetteRankings — animated "AI citation network" hero
   Vanilla canvas, no dependencies. Topic-literal: shows the
   four AI engines citing your brand while the visibility
   score climbs from invisible to cited.
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('geoNetwork');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var C1 = '#0ea5e9', C2 = '#7c3aed';

  var W = 0, H = 0, cx = 0, cy = 0, R = 0;
  var engines = [
    { name: 'ChatGPT', a: -Math.PI / 2 },
    { name: 'Perplexity', a: 0 },
    { name: 'Google AI', a: Math.PI / 2 },
    { name: 'Gemini', a: Math.PI }
  ];
  var sources = [], particles = [];
  var score = 0, scoreTarget = 0, pulse = 0, spin = 0;
  var scoreEl = document.getElementById('hvScore');

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    if (W === 0 || H === 0) return;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.30;
    sources = [];
    var n = 11;
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 + 0.35;
      sources.push({ x: cx + Math.cos(ang) * R * 1.72, y: cy + Math.sin(ang) * R * 1.72, r: 1.4 + Math.random() * 1.6 });
    }
  }

  function enginePos(e) {
    var a = e.a + spin;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  }

  function spawn() {
    var s = sources[(Math.random() * sources.length) | 0];
    var e = engines[(Math.random() * engines.length) | 0];
    particles.push({ sx: s.x, sy: s.y, e: e, t: 0, leg: 0, speed: 0.011 + Math.random() * 0.009 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    spin += reduce ? 0 : 0.0012;

    // connection lines engine -> brand
    for (var i = 0; i < engines.length; i++) {
      var ep = enginePos(engines[i]);
      var g = ctx.createLinearGradient(ep.x, ep.y, cx, cy);
      g.addColorStop(0, 'rgba(124,58,237,0.09)');
      g.addColorStop(1, 'rgba(14,165,233,0.20)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(ep.x, ep.y); ctx.lineTo(cx, cy); ctx.stroke();
    }

    // source dots
    ctx.fillStyle = 'rgba(124,58,237,0.30)';
    for (var s = 0; s < sources.length; s++) {
      ctx.beginPath(); ctx.arc(sources[s].x, sources[s].y, sources[s].r, 0, 6.283); ctx.fill();
    }

    // particles (source -> engine -> brand)
    for (var p = particles.length - 1; p >= 0; p--) {
      var pt = particles[p];
      pt.t += pt.speed;
      var ep2 = enginePos(pt.e);
      var fx, fy, tx, ty, col;
      if (pt.leg === 0) { fx = pt.sx; fy = pt.sy; tx = ep2.x; ty = ep2.y; col = 'rgba(14,165,233,0.85)'; }
      else { fx = ep2.x; fy = ep2.y; tx = cx; ty = cy; col = 'rgba(124,58,237,0.95)'; }
      var e2 = 1 - Math.pow(1 - Math.min(pt.t, 1), 2);
      var x = fx + (tx - fx) * e2, y = fy + (ty - fy) * e2;
      ctx.beginPath(); ctx.arc(x, y, pt.leg === 0 ? 2 : 2.4, 0, 6.283);
      ctx.fillStyle = col; ctx.fill();
      if (pt.t >= 1) {
        if (pt.leg === 0) { pt.leg = 1; pt.t = 0; }
        else { particles.splice(p, 1); pulse = 1; if (scoreTarget < 74) scoreTarget += 1.3; }
      }
    }

    // engine nodes + labels
    ctx.textAlign = 'center';
    for (var k = 0; k < engines.length; k++) {
      var q = enginePos(engines[k]);
      ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, 6.283);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C1; ctx.stroke();
      ctx.fillStyle = 'rgba(10,10,10,0.5)';
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.fillText(engines[k].name, q.x, q.y - 13);
    }

    // brand node — glow + gradient + pulse
    pulse *= 0.93;
    var pr = 23 + pulse * 7;
    var glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, pr + 18);
    glow.addColorStop(0, 'rgba(14,165,233,0.32)');
    glow.addColorStop(1, 'rgba(14,165,233,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, pr + 18, 0, 6.283); ctx.fill();
    var gg = ctx.createLinearGradient(cx - pr, cy - pr, cx + pr, cy + pr);
    gg.addColorStop(0, C1); gg.addColorStop(1, C2);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
    ctx.font = '800 ' + Math.round(pr * 0.92) + 'px Inter, system-ui, sans-serif';
    ctx.fillText('B', cx, cy + 1);
    ctx.textBaseline = 'alphabetic';

    // score readout
    score += (scoreTarget - score) * 0.06;
    if (scoreEl) scoreEl.textContent = Math.round(score);
  }

  var running = true, raf = 0, lastSpawn = 0;
  function loop(now) {
    if (running) {
      if (!reduce && now - lastSpawn > 360 && particles.length < 26) { spawn(); lastSpawn = now; }
      draw();
    }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    if (reduce) { scoreTarget = 74; score = 74; draw(); return; }
    // seed a few so it's alive immediately
    for (var i = 0; i < 5; i++) spawn();
    raf = requestAnimationFrame(loop);
  }

  // pause when tab hidden or canvas scrolled out of view
  document.addEventListener('visibilitychange', function () { running = !document.hidden; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { running = en[0].isIntersecting && !document.hidden; }, { threshold: 0.05 })
      .observe(canvas);
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); }, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
