/* ============================================================
   AUTOMATIZE — Wizard de orçamento (formulário em etapas)
   Genérico: a solução vem do atributo data-solution do <form>.
   ============================================================ */
(function () {
  "use strict";

  const form = document.getElementById("wizard");
  if (!form) return;

  const solution = form.getAttribute("data-solution") || "";
  const steps = Array.prototype.slice.call(form.querySelectorAll(".wizard__step"));
  const done = form.querySelector(".wizard__done");
  const summary = form.querySelector(".wizard__summary");
  const bar = form.querySelector(".wizard__bar span");
  const counter = form.querySelector(".wizard__count");
  const current = form.querySelector("[data-wizard='current']");
  const total = form.querySelector("[data-wizard='total']");

  const btnBack = form.querySelector("[data-wizard='back']");
  const btnNext = form.querySelector("[data-wizard='next']");
  const btnSend = form.querySelector("[data-wizard='send']");

  let i = 0;
  if (total) total.textContent = String(steps.length);

  /* ---------- "Enviar pedido" só acende com tudo preenchido ---------- */
  // Considera o formulário inteiro (todas as etapas), não só a última.
  const syncSend = function () {
    if (btnSend) btnSend.disabled = !form.checkValidity();
  };
  form.addEventListener("input", syncSend);
  form.addEventListener("change", syncSend);

  /* ---------- Navegação ---------- */
  const render = function () {
    steps.forEach(function (s, idx) { s.classList.toggle("is-active", idx === i); });
    if (bar) bar.style.width = ((i + 1) / steps.length * 100) + "%";
    if (current) current.textContent = String(i + 1);
    if (btnBack) btnBack.hidden = i === 0;
    if (btnNext) btnNext.hidden = i === steps.length - 1;
    if (btnSend) btnSend.hidden = i !== steps.length - 1;
    syncSend();
    // foca o primeiro campo da etapa (sem rolar a página)
    const first = steps[i].querySelector("input, select, textarea");
    if (first) { try { first.focus({ preventScroll: true }); } catch (e) {} }
  };

  // Valida só os campos da etapa atual
  const validStep = function () {
    const fields = steps[i].querySelectorAll("input, select, textarea");
    for (let k = 0; k < fields.length; k++) {
      if (!fields[k].checkValidity()) { fields[k].reportValidity(); return false; }
    }
    return true;
  };

  if (btnNext) btnNext.addEventListener("click", function () {
    if (!validStep()) return;
    if (i < steps.length - 1) { i++; render(); }
  });

  if (btnBack) btnBack.addEventListener("click", function () {
    if (i > 0) { i--; render(); }
  });

  // Enter avança em vez de enviar antes da hora
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && i < steps.length - 1) {
      e.preventDefault();
      if (btnNext) btnNext.click();
    }
  });

  /* ---------- Envio ---------- */
  const labelOf = function (name) {
    const el = form.querySelector("[name='" + name + "']");
    if (!el) return null;
    const step = el.closest(".wizard__step");
    const legend = step ? step.querySelector(".wizard__legend") : null;
    return legend ? legend.textContent.trim() : name;
  };

  const valueOf = function (name) {
    const el = form.querySelector("[name='" + name + "']");
    if (!el) return "";
    if (el.type === "radio") {
      const checked = form.querySelector("[name='" + name + "']:checked");
      return checked ? checked.value : "";
    }
    return el.value;
  };

  const addRow = function (term, desc, cls) {
    const row = document.createElement("div");
    if (cls) row.className = cls;
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = desc;
    row.append(dt, dd);
    summary.append(row);
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validStep()) return;

    if (btnSend) { btnSend.textContent = "Enviando…"; btnSend.disabled = true; }

    setTimeout(function () {
      // Monta o resumo — a solução aparece sempre em primeiro, bem destacada
      if (summary) {
        summary.innerHTML = "";
        addRow("Solução", solution, "is-solution");
        ["necessidade", "momento", "faturamento"].forEach(function (n) {
          const v = valueOf(n);
          if (v) addRow(labelOf(n) || n, v);
        });
        const nome = valueOf("nome");
        if (nome) addRow("Contato", nome);
      }

      steps.forEach(function (s) { s.classList.remove("is-active"); });
      if (done) done.hidden = false;
      if (bar) bar.style.width = "100%";
      if (counter) counter.hidden = true;
      if (btnBack) btnBack.hidden = true;
      if (btnNext) btnNext.hidden = true;
      if (btnSend) btnSend.hidden = true;
    }, 800);
  });

  /* ---------- Máscara de telefone ---------- */
  const tel = form.querySelector("input[type='tel']");
  if (tel) {
    tel.addEventListener("input", function () {
      let v = tel.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 6)      v = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
      else if (v.length > 2) v = "(" + v.slice(0, 2) + ") " + v.slice(2);
      else if (v.length > 0) v = "(" + v;
      tel.value = v;
    });
  }

  render();
})();
