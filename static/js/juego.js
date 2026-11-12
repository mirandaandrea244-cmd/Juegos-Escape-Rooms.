/* juego.js · pantallas, globos paginados, quiz, sonidos y confeti */
(() => {
  const $ = (id) => document.getElementById(id);
  const PAG = 5, TOTAL_PAG = Math.ceil(GLOBOS.length / PAG), RONDA = 10, SEG = 15;
  let sonido = true, reventados = new Set(), pagina = 0;

  /* ---------- Decoración del inicio ---------- */
  const COL = COLORES_GLOBOS.map(c => c.base);
  $("banderines").innerHTML = Array.from({length: 18}, (_, i) => `<span style="background:${COL[i % 6]}"></span>`).join("");
  $("toldo").innerHTML = "<span></span>".repeat(12);
  document.querySelectorAll(".luces").forEach(l => l.innerHTML = "<i></i>".repeat(+l.dataset.luces));
  $("total").textContent = GLOBOS.length;
  $("q-tot").textContent = RONDA;

  /* ---------- Sonidos (Web Audio) ---------- */
  let ctx;
  const audio = () => { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; };
  function nota(f, t, dur, tipo = "triangle", vol = .28) {
    const a = audio(), o = a.createOscillator(), g = a.createGain();
    o.type = tipo; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  function pop() {
    if (!sonido) return;
    const a = audio(), t = a.currentTime, n = a.sampleRate * .12, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .12);
    s.connect(g).connect(a.destination); s.start(t);
    const o = a.createOscillator(), og = a.createGain();
    o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(50, t + .12);
    og.gain.setValueAtTime(.7, t); og.gain.exponentialRampToValueAtTime(.001, t + .15); o.connect(og).connect(a.destination); o.start(t); o.stop(t + .16);
  }
  function win() { // fanfarria de victoria
    if (!sonido) return;
    const t = audio().currentTime + .05;
    [[523, 0], [523, .14], [523, .28], [659, .42], [784, .62], [659, .82], [784, .98], [1047, 1.2]]
      .forEach(([f, d]) => { nota(f, t + d, d === 1.2 ? .9 : .2, "square", .12); nota(f / 2, t + d, d === 1.2 ? .9 : .2, "triangle", .16); });
  }
  const bien = () => { if (sonido) { const t = audio().currentTime; nota(659, t, .15); nota(880, t + .1, .25); } };
  const mal = () => { if (sonido) { const t = audio().currentTime; nota(220, t, .2, "sawtooth", .12); nota(165, t + .15, .3, "sawtooth", .12); } };
  function chillido() {
    if (!sonido) return;
    const a = audio(), t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(950, t + .1); o.frequency.exponentialRampToValueAtTime(700, t + .2);
    g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g).connect(a.destination); o.start(t); o.stop(t + .26);
  }
  ["btn-sonido", "btn-sonido2"].forEach(id => $(id).addEventListener("click", () => {
    sonido = !sonido; ["btn-sonido", "btn-sonido2"].forEach(i => $(i).textContent = sonido ? "🔊" : "🔇");
  }));

  /* ---------- Confeti ---------- */
  const cv = $("confeti"), c2 = cv.getContext("2d"); let piezas = [], corre = false;
  const resize = () => { cv.width = innerWidth; cv.height = innerHeight; }; addEventListener("resize", resize); resize();
  function confeti(x, y, n = 90, f = 1) {
    for (let i = 0; i < n; i++) {
      const an = Math.random() * 6.28, v = (3 + Math.random() * 9) * f;
      piezas.push({x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 4, w: 6 + Math.random() * 7, h: 4 + Math.random() * 6,
        r: Math.random() * 6, vr: (Math.random() - .5) * .4, col: [...COL, "#fff"][(Math.random() * 7) | 0], vida: 90 + Math.random() * 70});
    }
    if (!corre) { corre = true; requestAnimationFrame(frame); }
  }
  function frame() {
    c2.clearRect(0, 0, cv.width, cv.height); piezas = piezas.filter(p => p.vida > 0 && p.y < cv.height + 30);
    for (const p of piezas) {
      p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vida--;
      c2.save(); c2.translate(p.x, p.y); c2.rotate(p.r); c2.globalAlpha = Math.min(1, p.vida / 30); c2.fillStyle = p.col; c2.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c2.restore();
    }
    if (piezas.length) requestAnimationFrame(frame); else { corre = false; c2.clearRect(0, 0, cv.width, cv.height); }
  }
  function trozos(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const t = document.createElement("div"); t.className = "trozo"; t.style.cssText = `background:${color};left:${x}px;top:${y}px`; document.body.appendChild(t);
      const an = i / 12 * 6.28, d = 50 + Math.random() * 60;
      t.animate([{transform: "none", opacity: 1}, {transform: `translate(${Math.cos(an) * d}px,${Math.sin(an) * d + 30}px) rotate(${Math.random() * 540}deg)`, opacity: 0}],
        {duration: 600 + Math.random() * 250, easing: "ease-out"}).onfinish = () => t.remove();
    }
  }

  /* ---------- Inicio interactivo: osos, luces y globos de fondo ---------- */
  document.querySelectorAll(".oso").forEach(o => o.addEventListener("click", e => {
    o.classList.remove("salta"); void o.offsetWidth; o.classList.add("salta"); chillido();
    const r = o.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const h = document.createElement("span"); h.className = "corazon"; h.textContent = ["💖", "💗", "✨", "⭐"][i % 4];
      h.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top}px`; document.body.appendChild(h);
      h.animate([{transform: "none", opacity: 1}, {transform: `translate(${(Math.random() - .5) * 120}px,-${90 + Math.random() * 80}px) scale(1.4)`, opacity: 0}],
        {duration: 1100, easing: "ease-out"}).onfinish = () => h.remove();
    }
  }));
  document.querySelectorAll(".luces").forEach(l => l.addEventListener("click", () => {
    const p = document.querySelector(".puesto"); p.classList.toggle("disco");
    if (sonido) { const t = audio().currentTime; [784, 988, 1175].forEach((f, i) => nota(f, t + i * .07, .2)); }
  }));
  function globosFondo() {
    const g = $("globos-fondo"); g.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const b = document.createElement("div"); b.className = "gf";
      b.style.cssText = `left:${5 + i * 11}%;--c:${COL[i % 6]};animation-duration:${9 + (i * 3) % 7}s;animation-delay:${-i * 2}s`;
      b.addEventListener("click", () => { const r = b.getBoundingClientRect(); pop(); trozos(r.left + 22, r.top + 28, COL[i % 6]); confeti(r.left + 22, r.top + 28, 40); b.remove(); });
      g.appendChild(b);
    }
  }
  globosFondo();

  /* ---------- Navegación ---------- */
  const pantallas = ["inicio", "juego", "quiz"];
  function ir(id) {
    pantallas.forEach(p => $(p).hidden = p !== id);
    $("info").hidden = $("final").hidden = true;
    document.body.classList.toggle("jugando-globos", id === "juego");
    if (id === "inicio") globosFondo();
    scrollTo(0, 0);
  }
  document.querySelectorAll(".btn-inicio").forEach(b => b.addEventListener("click", () => ir("inicio")));
  $("btn-menu").addEventListener("click", () => ir("inicio"));
  $("btn-globos").addEventListener("click", () => { audio(); reventados.clear(); pagina = 0; ir("juego"); dibujar(); });
  $("btn-quiz").addEventListener("click", () => { audio(); ir("quiz"); iniciarQuiz(); });

  /* ============ JUEGO 1: GLOBOS (5 por página, 4 páginas) ============ */
  function dibujar() {
    const t = $("tablero"); t.innerHTML = ""; $("contador").textContent = reventados.size;
    for (let k = 0; k < PAG; k++) {
      const i = pagina * PAG + k, col = COLORES_GLOBOS[i % 6], b = document.createElement("button");
      b.className = "globo" + (reventados.has(i) ? " reventado" : ""); b.type = "button";
      b.setAttribute("aria-label", `Globo ${i + 1}, ${col.nombre}`);
      b.style.cssText = `--c:${col.base};--luz:${col.luz};--sombra:${col.sombra};--d:${-k * .5}s`;
      b.innerHTML = `<span class="cuerpo">${i + 1}</span><span class="nudo"></span><span class="cuerda"></span>`;
      b.addEventListener("click", () => reventar(b, i, col));
      t.appendChild(b);
    }
    $("puntos").innerHTML = Array.from({length: TOTAL_PAG}, (_, p) => {
      const hechos = [...Array(PAG).keys()].every(k => reventados.has(p * PAG + k));
      return `<button class="punto${p === pagina ? " activo" : ""}${hechos ? " completa" : ""}" data-p="${p}" aria-label="Página ${p + 1}">${p + 1}</button>`;
    }).join("");
    $("pag-ant").disabled = pagina === 0; $("pag-sig").disabled = pagina === TOTAL_PAG - 1;
  }
  $("puntos").addEventListener("click", e => { if (e.target.dataset.p) { pagina = +e.target.dataset.p; dibujar(); } });
  $("pag-ant").addEventListener("click", () => { pagina--; dibujar(); });
  $("pag-sig").addEventListener("click", () => { pagina++; dibujar(); });

  function reventar(b, i, col) {
    if (b.classList.contains("explota")) return;
    const r = b.querySelector(".cuerpo").getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    b.classList.add("explota"); pop(); trozos(x, y, col.base); confeti(x, y, 80);
    const al = $("alfiler"); al.classList.remove("pinchando"); void al.offsetWidth; al.classList.add("pinchando");
    reventados.add(i); $("contador").textContent = reventados.size;
    setTimeout(() => mostrarInfo(i), 380);
  }
  function mostrarInfo(i) {
    $("info-titulo").textContent = GLOBOS[i].p;
    $("info-texto").innerHTML = GLOBOS[i].r.map(l => `<p>${l}</p>`).join("");
    $("info").hidden = false; $("btn-seguir").focus();
  }
  $("btn-seguir").addEventListener("click", () => {
    $("info").hidden = true; dibujar();
    if (reventados.size === GLOBOS.length) terminar("🏆", "¡Ganaste!", "Reventaste los 20 globos y repasaste todos los conceptos de metodologías ágiles. ¡Excelente trabajo!", "globos");
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && !$("info").hidden) $("btn-seguir").click(); });

  /* ============ JUEGO 2: PREGUNTAS RÁPIDAS ============ */
  let ronda = [], qi = 0, pts = 0, resp = false, reloj;
  const mezclar = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function iniciarQuiz() { ronda = mezclar(GLOBOS).slice(0, RONDA); qi = 0; pts = 0; mostrarPregunta(); }
  function mostrarPregunta() {
    const q = ronda[qi]; resp = false;
    $("q-num").textContent = qi + 1; $("q-pts").textContent = pts; $("q-aviso").textContent = "";
    $("q-texto").textContent = q.pq || q.p;
    $("q-opciones").innerHTML = "";
    mezclar([q.c, ...q.x]).forEach(txt => {
      const b = document.createElement("button"); b.className = "op"; b.textContent = txt; b.dataset.ok = txt === q.c;
      b.addEventListener("click", () => responder(b)); $("q-opciones").appendChild(b);
    });
    let t = SEG * 10; $("barra-t").style.width = "100%"; clearInterval(reloj);
    reloj = setInterval(() => { t--; $("barra-t").style.width = (t / (SEG * 10) * 100) + "%"; if (t <= 0) responder(null); }, 100);
  }
  function responder(b) {
    if (resp) return; resp = true; clearInterval(reloj);
    const botones = [...document.querySelectorAll(".op")]; botones.forEach(x => { x.disabled = true; if (x.dataset.ok === "true") x.classList.add("bien"); });
    if (b && b.dataset.ok === "true") {
      pts++; bien(); $("q-aviso").textContent = "¡Correcto! 🎉"; const r = b.getBoundingClientRect(); confeti(r.left + r.width / 2, r.top, 40, .7);
    } else {
      mal(); if (b) b.classList.add("mal"); $("q-aviso").textContent = b ? "Casi… la correcta está en verde." : "¡Se acabó el tiempo! ⏰";
    }
    $("q-pts").textContent = pts;
    setTimeout(() => { if (++qi < RONDA) mostrarPregunta(); else finQuiz(); }, 1800);
  }
  function finQuiz() {
    clearInterval(reloj);
    const g = pts >= 7;
    terminar(g ? "🏆" : "💪", g ? `¡Ganaste! ${pts} de ${RONDA}` : `Lograste ${pts} de ${RONDA}`,
      g ? "¡Dominas las metodologías ágiles! Eres de lo mejor de la feria." : "¡Buen intento! Con 7 aciertos ganas. Vuelve a intentarlo.", "quiz", g);
  }

  /* ---------- Pantalla final ---------- */
  let modo = "globos";
  function terminar(emoji, titulo, texto, m, gano = true) {
    modo = m; $("final-emoji").textContent = emoji; $("final-titulo").textContent = titulo; $("final-texto").textContent = texto;
    $("final").hidden = false; $("btn-otra").focus();
    if (gano) { win(); confeti(innerWidth * .2, innerHeight * .4, 120, 1.4); confeti(innerWidth * .8, innerHeight * .4, 120, 1.4); setTimeout(() => confeti(innerWidth / 2, innerHeight * .3, 200, 1.6), 400); }
    else mal();
  }
  $("btn-otra").addEventListener("click", () => { $("final").hidden = true; if (modo === "globos") { reventados.clear(); pagina = 0; dibujar(); } else iniciarQuiz(); });

  addEventListener("pointermove", e => { $("alfiler").style.transform = `translate(${e.clientX - 3}px,${e.clientY - 3}px)`; });
})();