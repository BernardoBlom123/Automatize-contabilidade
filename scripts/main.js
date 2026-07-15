/* ============================================================
   AUTOMATIZE CONTABILIDADE — interações
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Animação de digitação no H1 ---------- */
  const title = document.querySelector(".hero__title");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (title && !reduceMotion) {
    const full = title.textContent.trim();
    title.setAttribute("aria-label", full);
    // Reserva a altura atual para evitar reflow enquanto o texto é digitado
    title.style.minHeight = title.offsetHeight + "px";

    title.textContent = "";
    const typed = document.createElement("span");
    typed.className = "hero__caret"; // cursor via border-right (não quebra linha)
    title.append(typed);
    title.classList.add("is-typing");

    let i = 0;
    const speed = 55; // ms por caractere
    (function step() {
      typed.textContent = full.slice(0, i);
      if (i < full.length) {
        i++;
        // pequena pausa extra após espaços/pontuação, deixa mais natural
        const ch = full.charAt(i - 1);
        setTimeout(step, ch === "." || ch === "," ? speed * 5 : speed);
      } else {
        title.classList.remove("is-typing"); // cursor volta a piscar
      }
    })();
  }

  /* ---------- Menu mobile ---------- */
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    // Fecha ao clicar em um link
    nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Dropdown "Soluções" (toque/mobile e teclado) ---------- */
  const trigger = document.querySelector(".nav__trigger");
  const dropdown = document.getElementById("menu-solucoes");
  if (trigger && dropdown) {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      const open = dropdown.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!trigger.parentElement.contains(e.target)) {
        dropdown.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Header com sombra ao rolar ---------- */
  const header = document.querySelector(".header");
  const onScroll = function () {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 8 ? "0 8px 30px rgba(25,15,89,.08)" : "none";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Modal (E-Book) ---------- */
  const openModal = function (id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const first = modal.querySelector("input, button");
    if (first) first.focus();
  };
  const closeModal = function (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  document.querySelectorAll("[data-modal-open]").forEach(function (btn) {
    btn.addEventListener("click", function () { openModal(btn.getAttribute("data-modal-open")); });
  });
  document.querySelectorAll("[data-modal-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      const modal = el.closest(".modal");
      if (modal) closeModal(modal);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const open = document.querySelector(".modal.is-open");
      if (open) closeModal(open);
    }
  });

  /* ---------- Máscara simples de telefone ---------- */
  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
    input.addEventListener("input", function () {
      let v = input.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 6)      v = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
      else if (v.length > 2) v = "(" + v.slice(0, 2) + ") " + v.slice(2);
      else if (v.length > 0) v = "(" + v;
      input.value = v;
    });
  });

  /* ---------- Envio de formulários (demo) ---------- */
  const handleForm = function (form, msg) {
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const btn = form.querySelector('button[type="submit"]');
      const label = btn ? btn.textContent : "";
      if (btn) { btn.textContent = "Enviando…"; btn.disabled = true; }
      setTimeout(function () {
        if (btn) { btn.textContent = "✓ " + msg; }
        setTimeout(function () {
          form.reset();
          if (btn) { btn.textContent = label; btn.disabled = false; }
          const modal = form.closest(".modal");
          if (modal) closeModal(modal);
        }, 1600);
      }, 900);
    });
  };
  handleForm(document.getElementById("lead-form"), "Recebido! Em breve entramos em contato.");
  handleForm(document.getElementById("ebook-form"), "Pronto! Confira seu e-mail.");

  /* ---------- Banner de cookies ---------- */
  const cookie = document.getElementById("cookie-banner");
  const KEY = "automatize_cookie_consent";
  if (cookie && !localStorage.getItem(KEY)) {
    setTimeout(function () { cookie.hidden = false; }, 1200);
  }
  const dismiss = function () {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    if (cookie) cookie.hidden = true;
  };
  const accept = document.getElementById("cookie-accept");
  const config = document.getElementById("cookie-config");
  if (accept) accept.addEventListener("click", dismiss);
  if (config) config.addEventListener("click", dismiss);

  /* ---------- Reveal on scroll (com stagger em sequência) ---------- */
  const revealEls = document.querySelectorAll(
    ".segment, .solution-card, .post, .stat"
  );
  if ("IntersectionObserver" in window && !reduceMotion) {
    // atraso menor em telas pequenas para a sequência não "arrastar"
    var stepMs = window.matchMedia("(max-width: 600px)").matches ? 55 : 80;
    revealEls.forEach(function (el) {
      // atraso escalonado conforme a posição do card dentro do seu grupo (limitado),
      // fazendo os cards "acenderem" em ordem
      var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty("--reveal-delay", (Math.min(idx, 7) * stepMs) + "ms");
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity .5s ease var(--reveal-delay), transform .5s ease var(--reveal-delay)";
      el.style.willChange = "opacity, transform";
    });
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "none";
          io.unobserve(entry.target);
          setTimeout(function () { entry.target.style.willChange = "auto"; }, 800);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }
})();
