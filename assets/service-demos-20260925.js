/* ============================================================
   SERVIÇOS v14 — interações das três demonstrações
   Autossuficiente: não depende do restante dos scripts da página.
   ============================================================ */
(function () {
  "use strict";
  /* O cabeçalho é fixo e cobre o topo da janela. As seções que se encaixam
     na tela inteira precisam saber quanto ele ocupa, senão o começo do
     conteúdo fica escondido atrás dele — era o que acontecia com o título
     de "Um projeto, quatro fases" em telas mais baixas. */
  (function medirCabecalho() {
    var barra = document.querySelector(".top");
    if (!barra) return;
    var lastHeight = -1;
    var aplicar = function () {
      var height = barra.offsetHeight;
      if (height === lastHeight) return;
      lastHeight = height;
      document.documentElement.style.setProperty("--barra-topo", height + "px");
    };
    aplicar();
    addEventListener("resize", aplicar, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(aplicar).observe(barra);
  })();

  var panels = document.querySelectorAll("#apps.service-panel,#sites.service-panel,#ti.service-panel");
  if (!panels.length) return;

  var reduceQuery = matchMedia("(prefers-reduced-motion:reduce)");
  var finePointer = matchMedia("(pointer:fine)");
  var reduce = function () { return reduceQuery.matches; };

  /* ---------- utilidades ---------- */
  function onActivate(el, fn) {
    el.addEventListener("click", fn);
  }

  // Navegação por setas em qualquer conjunto de abas (tabindex móvel).
  function wireRoving(tabs, select) {
    tabs.forEach(function (tab, i) {
      tab.addEventListener("keydown", function (e) {
        var next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next < 0) return;
        e.preventDefault();
        select(next);
        tabs[next].focus();
      });
    });
  }

  /* ---------- contadores ---------- */
  var nf = new Intl.NumberFormat("pt-BR");
  function runCounter(el) {
    if (el.dataset.done === "1") return;
    el.dataset.done = "1";
    var to = parseFloat(el.dataset.count) || 0;
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var money = el.dataset.money === "1";
    var render = function (v) {
      var n = money ? nf.format(Math.round(v)) : nf.format(Math.round(v));
      el.textContent = prefix + n + suffix;
    };
    if (reduce()) { render(to); return; }
    var t0 = 0, dur = 900;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      render(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function countersIn(root) {
    root.querySelectorAll("[data-count]").forEach(runCounter);
  }
  function resetCounters(root) {
    root.querySelectorAll("[data-count]").forEach(function (el) { el.dataset.done = ""; });
  }

  /* ---------- 01 · aplicativos ---------- */
  (function setupApps() {
    var panel = document.getElementById("apps");
    if (!panel) return;

    var tabs = Array.prototype.slice.call(panel.querySelectorAll(".svc-tab"));
    var scenes = tabs.map(function (t) { return document.getElementById(t.dataset.scene); });

    function selectScene(i) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (scenes[j]) scenes[j].classList.toggle("is-on", on);
      });
      if (scenes[i]) { resetCounters(scenes[i]); countersIn(scenes[i]); }
    }
    tabs.forEach(function (t, i) { onActivate(t, function () { selectScene(i); }); });
    wireRoving(tabs, selectScene);

    // telas internas do celular
    var phTabs = Array.prototype.slice.call(panel.querySelectorAll(".ph-nav-btn"));
    var phViews = Array.prototype.slice.call(panel.querySelectorAll(".ph-view"));
    function selectPhone(i) {
      phTabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      phViews.forEach(function (v, j) { v.classList.toggle("is-on", i === j); });
      if (phViews[i]) { resetCounters(phViews[i]); countersIn(phViews[i]); }
    }
    phTabs.forEach(function (t, i) { onActivate(t, function () { selectPhone(i); }); });
    wireRoving(phTabs, selectPhone);

    // leve inclinação 3D do aparelho seguindo o ponteiro
    var phone = panel.querySelector(".ph");
    if (phone) {
      var tiltRaf = 0, tiltX = 0, tiltY = 0;
      var applyTilt = function () {
        tiltRaf = 0;
        phone.style.setProperty("--tx", tiltX.toFixed(2) + "deg");
        phone.style.setProperty("--ty", tiltY.toFixed(2) + "deg");
      };
      panel.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse" || !finePointer.matches || reduce()) return;
        var r = phone.getBoundingClientRect();
        tiltY = Math.max(-9, Math.min(9, ((e.clientX - (r.left + r.width / 2)) / r.width) * 14));
        tiltX = Math.max(-7, Math.min(7, ((r.top + r.height / 2 - e.clientY) / r.height) * 11));
        if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
      }, { passive: true });
      panel.addEventListener("pointerleave", function () {
        tiltX = tiltY = 0;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
      }, { passive: true });
    }
  })();

  /* ---------- 02 · refatoração ----------
     A divisória e o painel "depois" andam só com transform (camadas no
     compositor): nada de layout nem repintura da cena a cada quadro. O range
     usa passo 0.1 para o movimento acompanhar o cursor sem saltos de 1%. */
  (function setupCompare() {
    var cmp = document.querySelector("#sites .cmp");
    if (!cmp) return;
    var range = cmp.querySelector(".cmp-range");
    var reveal = cmp.querySelector(".cmp-reveal");
    var revealInner = reveal && reveal.querySelector(".cmp-new");
    var split = cmp.querySelector(".cmp-split");
    var metrics = {
      load: document.querySelector('#sites [data-cmp="load"]'),
      perf: document.querySelector('#sites [data-cmp="perf"]'),
      err: document.querySelector('#sites [data-cmp="err"]')
    };
    var cells = Array.prototype.slice.call(document.querySelectorAll("#sites .cmp-metric"));
    var before = { load: 4.8, perf: 38, err: 17 };
    var after = { load: 0.9, perf: 98, err: 0 };
    var shown = { load: "", perf: "", err: "", state: "", label: "" };
    var pending = 0, raf = 0, userTook = false;

    function mix(a, b, t) { return a + (b - a) * t; }
    function clamp(v) { return Math.max(0, Math.min(100, v)); }
    function setText(key, text) {
      var el = metrics[key];
      if (el && shown[key] !== text) { shown[key] = text; el.textContent = text; }
    }

    function paint(pos) {
      pos = clamp(pos);
      var x = pos.toFixed(2);
      if (revealInner) {
        reveal.style.transform = "translate3d(" + x + "%,0,0)";
        revealInner.style.transform = "translate3d(-" + x + "%,0,0)";
        if (split) split.style.transform = "translate3d(" + x + "%,0,0)";
      } else {
        cmp.style.setProperty("--pos", x);
      }
      // pos 0 = tudo "depois"; pos 100 = tudo "antes"
      var t = 1 - pos / 100;
      setText("load", mix(before.load, after.load, t).toFixed(1).replace(".", ",") + " s");
      setText("perf", String(Math.round(mix(before.perf, after.perf, t))));
      setText("err", String(Math.round(mix(before.err, after.err, t))));
      var state = t > .62 ? "new" : (t < .38 ? "old" : "mid");
      if (state !== shown.state) {
        shown.state = state;
        cells.forEach(function (c) { c.dataset.state = state; });
      }
      var label = Math.round(pos) + "%";
      if (label !== shown.label) { shown.label = label; range.setAttribute("aria-valuetext", label); }
    }

    // um desenho por quadro, mesmo com mouse de alta taxa de atualização
    function schedule(pos) {
      pending = pos;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(pending); });
    }

    range.addEventListener("input", function () { schedule(+range.value); });
    range.addEventListener("pointerdown", function () { userTook = true; }, { passive: true });

    // teclado: mantém o passo de 1% (Shift, Page Up/Down: 10%)
    range.addEventListener("keydown", function (e) {
      var k = e.key, v = +range.value, d = e.shiftKey ? 10 : 1, next = null;
      if (k === "ArrowLeft" || k === "ArrowDown") next = v - d;
      else if (k === "ArrowRight" || k === "ArrowUp") next = v + d;
      else if (k === "PageDown") next = v - 10;
      else if (k === "PageUp") next = v + 10;
      else if (k === "Home") next = 0;
      else if (k === "End") next = 100;
      if (next === null) return;
      e.preventDefault();
      userTook = true;
      range.value = clamp(Math.round(next));
      schedule(+range.value);
    });

    paint(+range.value);

    // ao entrar na tela, a divisória se move sozinha uma vez para sinalizar o gesto
    if (!reduce() && "IntersectionObserver" in window) {
      var teased = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting || teased) return;
          teased = true;
          io.disconnect();
          if (userTook) return;
          var t0 = 0, from = 94, to = 52, dur = 1100;
          range.value = from; paint(from);
          function step(ts) {
            if (userTook) return; // o visitante assumiu a divisória
            if (!t0) t0 = ts;
            var p = Math.min(1, (ts - t0) / dur);
            var e = 1 - Math.pow(1 - p, 3);
            var v = from + (to - from) * e;
            range.value = v; paint(v);
            if (p < 1) requestAnimationFrame(step);
          }
          setTimeout(function () { requestAnimationFrame(step); }, 260);
        });
      }, { threshold: .4 });
      io.observe(cmp);
    }
  })();

  /* ---------- 03 · assessoria ---------- */
  (function setupInfra() {
    var panel = document.getElementById("ti");
    if (!panel) return;
    var nodes = Array.prototype.slice.call(panel.querySelectorAll(".infra-node"));
    var links = panel.querySelectorAll(".infra-links path");
    var out = panel.querySelector(".infra-readout");
    if (!nodes.length || !out) return;

    var copy = {
      host: ["Hospedagem", "Levantamos onde cada sistema roda, quanto custa e quem tem acesso — e ajustamos o ambiente antes que ele vire um problema."],
      dns: ["Domínio e DNS", "Registro, renovação, apontamentos e certificados sob um só controle, com as mudanças planejadas para não derrubar nada no ar."],
      mail: ["E-mail corporativo", "Contas, encaminhamentos, assinaturas e os registros de autenticação que mantêm sua mensagem fora da caixa de spam."],
      integra: ["Integrações", "Mapeamos o que conversa com o quê: ERP, gateways, formulários e APIs — com as dependências e credenciais documentadas."],
      backup: ["Backup e continuidade", "Rotina de cópias testada de verdade, com prazo de retenção definido e um caminho claro de retorno quando algo falha."],
      monitor: ["Monitoramento", "Acompanhamento de disponibilidade, certificados e erros, para tratar a falha antes que o cliente precise avisar."]
    };

    function select(i) {
      var key = nodes[i].dataset.node;
      nodes.forEach(function (n, j) {
        var on = i === j;
        n.setAttribute("aria-selected", on ? "true" : "false");
        n.tabIndex = on ? 0 : -1;
      });
      links.forEach(function (p) { p.classList.toggle("is-live", p.dataset.link === key); });
      var c = copy[key];
      if (c) {
        var title = out.querySelector("b");
        var text = out.querySelector("p");
        if (title) title.textContent = c[0];
        if (text) text.textContent = c[1];
      }
    }

    nodes.forEach(function (n, i) {
      onActivate(n, function () { select(i); });
      n.addEventListener("mouseenter", function () { if (finePointer.matches) select(i); });
      n.addEventListener("focus", function () { select(i); });
    });
    wireRoving(nodes, select);
    select(0);
  })();

  /* ---------- abater o satélite ----------
     Clicar destrói aquele satélite: um clarão, a casca de detritos se
     abrindo e os cacos girando para longe. Ele sai de cena e não volta
     mais no ciclo — o outro satélite do painel segue passando, então dá
     para caçar os seis. Recarregar a página traz todos de volta. */
  function explodirSatelite(sat) {
    if (sat.dataset.abatido) return;
    sat.dataset.abatido = '1';

    const fundo = sat.parentElement;
    const corpo = sat.querySelector('.svc-sat-body') || sat;
    const rf = fundo.getBoundingClientRect();
    const rc = corpo.getBoundingClientRect();
    // posição exata onde ele estava no instante do clique
    const x = rc.left + rc.width / 2 - rf.left;
    const y = rc.top + rc.height / 2 - rf.top;

    sat.classList.add('is-destruido');

    const boom = document.createElement('span');
    boom.className = 'svc-boom';
    boom.style.left = x.toFixed(1) + 'px';
    boom.style.top = y.toFixed(1) + 'px';

    const partes = ['<i class="svc-boom-clarao"></i>', '<i class="svc-boom-poeira"></i>'];
    // cacos em leque, com comprimento, alcance e velocidade variados
    for (var i = 0; i < 18; i++) {
      var ang = (i / 18) * 360 + (Math.random() * 26 - 13);
      var dist = 34 + Math.random() * 54;
      var comp = 6 + Math.random() * 7;
      var dur = 520 + Math.random() * 380;
      partes.push('<i class="svc-boom-caco" style="--a:' + ang.toFixed(1) + 'deg;--d:' +
        dist.toFixed(0) + 'px;--l:' + comp.toFixed(0) + 'px;--t:' + dur.toFixed(0) + 'ms"></i>');
    }
    // três lascas rápidas que saem muito além do resto
    for (var j = 0; j < 3; j++) {
      var a2 = Math.random() * 360;
      var d2 = 92 + Math.random() * 62;
      partes.push('<i class="svc-boom-lasca" style="--a:' + a2.toFixed(1) + 'deg;--d:' +
        d2.toFixed(0) + 'px;--l:' + (14 + Math.random() * 10).toFixed(0) + 'px;--t:' +
        (860 + Math.random() * 260).toFixed(0) + 'ms"></i>');
    }
    boom.innerHTML = partes.join('');
    fundo.appendChild(boom);
    setTimeout(function () { boom.remove(); }, 1500);
  }

  panels.forEach(function (panel) {
    panel.querySelectorAll('.svc-sat').forEach(function (sat) {
      sat.addEventListener('click', function (e) {
        e.preventDefault();
        if (reduce()) return;
        explodirSatelite(sat);
      });
    });
  });

  /* ---------- fundo vivo apenas no painel que está na tela ----------
     A malha, as estrelas e o satélite só consomem quadros enquanto o
     painel aparece; fora da tela as animações ficam pausadas. */
  if ("IntersectionObserver" in window) {
    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle("svc-live", en.isIntersecting);
      });
    }, { threshold: .12 });
    panels.forEach(function (p) { liveIO.observe(p); });
  } else {
    panels.forEach(function (p) { p.classList.add("svc-live"); });
  }

  /* ---------- brilho contínuo do capítulo Serviços ----------
     Um único cursor pertence ao container #servicos. Assim a iluminação não
     reinicia ao cruzar Introdução -> Apps -> Sites -> Assessoria. */
  if (finePointer.matches) {
    var servicesRoot = document.getElementById("servicos");
    if (servicesRoot) {
      var serviceGlowRaf = 0, serviceGlowX = 50, serviceGlowY = 50;
      var applyServiceGlow = function () {
        serviceGlowRaf = 0;
        servicesRoot.style.setProperty("--svc-mx", serviceGlowX.toFixed(1) + "px");
        servicesRoot.style.setProperty("--svc-my", serviceGlowY.toFixed(1) + "px");
      };
      var servicesRect = null;
      var updateServicesRect = function () {
        servicesRect = servicesRoot.getBoundingClientRect();
      };
      servicesRoot.addEventListener("pointerenter", updateServicesRect, { passive: true });
      addEventListener("resize", function () { servicesRect = null; }, { passive: true });
      addEventListener("scroll", function () { servicesRect = null; }, { passive: true });
      servicesRoot.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse" || reduce()) return;
        if (!servicesRect) updateServicesRect();
        serviceGlowX = e.clientX - servicesRect.left;
        serviceGlowY = e.clientY - servicesRect.top;
        if (!serviceGlowRaf) serviceGlowRaf = requestAnimationFrame(applyServiceGlow);
      }, { passive: true });
    }
  }

  /* ---------- primeira animação de números ao entrar na tela ---------- */
  if ("IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io2.unobserve(en.target);
        countersIn(en.target);
      });
    }, { threshold: .25 });
    document.querySelectorAll("#apps .svc-scene.is-on").forEach(function (s) { io2.observe(s); });
  } else {
    document.querySelectorAll("#apps .svc-scene.is-on").forEach(countersIn);
  }
})();
