/* ============================================================
   AUTOMATIZE — Simulador de receita (Simples Nacional)

   Tabelas dos Anexos da LC 123/2006 (vigentes desde 2018).
   Cada faixa: [teto da RBT12, alíquota nominal, parcela a deduzir]

   Alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) / RBT12
   DAS do mês       = faturamento do mês × alíquota efetiva

   Atenção: na 6ª faixa o ICMS e o ISS saem do DAS e são recolhidos à parte.
   Por isso a efetiva "cai" ao entrar nela — o DAS cobre menos tributos, e não
   significa carga menor. O simulador sinaliza isso ao usuário.
   ============================================================ */
(function () {
  "use strict";

  const form = document.getElementById("calc");
  if (!form) return;

  const TABELAS = {
    I: [ // Comércio
      [180000, 0.040, 0], [360000, 0.073, 5940], [720000, 0.095, 13860],
      [1800000, 0.107, 22500], [3600000, 0.143, 87300], [4800000, 0.190, 378000]
    ],
    II: [ // Indústria
      [180000, 0.045, 0], [360000, 0.078, 5940], [720000, 0.100, 13860],
      [1800000, 0.112, 22500], [3600000, 0.147, 85500], [4800000, 0.300, 720000]
    ],
    III: [ // Serviços em geral
      [180000, 0.060, 0], [360000, 0.112, 9360], [720000, 0.135, 17640],
      [1800000, 0.160, 35640], [3600000, 0.210, 125640], [4800000, 0.330, 648000]
    ],
    IV: [ // Serviços (construção, limpeza, advocacia…)
      [180000, 0.045, 0], [360000, 0.090, 8100], [720000, 0.102, 12420],
      [1800000, 0.140, 39780], [3600000, 0.220, 183780], [4800000, 0.330, 828000]
    ],
    V: [ // Serviços (Fator R abaixo de 28%)
      [180000, 0.155, 0], [360000, 0.180, 4500], [720000, 0.195, 9900],
      [1800000, 0.205, 17100], [3600000, 0.230, 62100], [4800000, 0.305, 540000]
    ]
  };

  const TETO_SIMPLES = 4800000; // limite anual do Simples Nacional

  /* Planos da Automatize — definidos por faixa de faturamento mensal.
     Acima do último teto o plano é sob medida (sem preço fixo). */
  const PLANOS = [
    { teto: 25000,  nome: "Básico",        preco: 249 },
    { teto: 50000,  nome: "Intermediário", preco: 389 },
    { teto: 150000, nome: "Avançado",      preco: 869 }
  ];

  function planoDe(fatMensal) {
    for (let i = 0; i < PLANOS.length; i++) if (fatMensal <= PLANOS[i].teto) return PLANOS[i];
    return { nome: "Sob medida", preco: null };
  }

  /* ---------- Cálculo ---------- */
  function faixaDe(rbt12, anexo) {
    const t = TABELAS[anexo];
    for (let i = 0; i < t.length; i++) if (rbt12 <= t[i][0]) return { faixa: i + 1, dados: t[i] };
    return { faixa: t.length, dados: t[t.length - 1] };
  }

  function aliquotaEfetiva(rbt12, anexo) {
    if (rbt12 <= 0) return 0;
    const d = faixaDe(rbt12, anexo).dados;
    const efetiva = (rbt12 * d[1] - d[2]) / rbt12;
    return Math.max(efetiva, 0);
  }

  /* ---------- Formatação ---------- */
  const brl = function (v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };
  const pct = function (v) {
    return (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  };

  /* ---------- Elementos ---------- */
  const range  = form.querySelector("#calc-range");
  const campo  = form.querySelector("#calc-fat");
  const anexoEl = form.querySelector("#calc-anexo");
  const out = {
    bruto: document.getElementById("r-bruto"),
    das:   document.getElementById("r-das"),
    plano: document.getElementById("r-plano"),
    planoNome: document.getElementById("r-plano-nome"),
    liq:   document.getElementById("r-liq"),
    aliq:  document.getElementById("r-aliq"),
    faixa: document.getElementById("r-faixa"),
    rbt:   document.getElementById("r-rbt"),
    nota6: document.getElementById("r-nota6"),
    notaPlano: document.getElementById("r-nota-plano"),
    aviso: document.getElementById("r-aviso")
  };

  let valor = parseInt(range.value, 10);

  /* ---------- Render ---------- */
  function render() {
    const anexo = anexoEl.value;

    // O plano decorre do faturamento — não é escolha livre
    const plano = planoDe(valor);
    const custoPlano = plano.preco === null ? 0 : plano.preco;

    // Simplificação: assume faturamento constante nos 12 meses
    const rbt12 = valor * 12;
    const acimaDoTeto = rbt12 > TETO_SIMPLES;

    const faixa = faixaDe(rbt12, anexo).faixa;
    const efetiva = aliquotaEfetiva(rbt12, anexo);
    const das = valor * efetiva;
    const liquido = valor - das - custoPlano;

    out.bruto.textContent = brl(valor);
    out.das.textContent   = "− " + brl(das);
    out.planoNome.textContent = plano.nome;
    out.plano.textContent = plano.preco === null ? "sob consulta" : "− " + brl(plano.preco);
    out.liq.textContent   = brl(liquido);

    // Sem preço fixo acima do último teto: o líquido ainda não desconta o plano
    out.notaPlano.hidden = plano.preco !== null;
    out.aliq.textContent  = pct(efetiva);
    out.faixa.textContent = faixa + "ª";
    out.rbt.textContent   = brl(rbt12);

    // Na 6ª faixa o DAS não inclui ICMS/ISS: o simulado fica ABAIXO da carga real
    out.nota6.hidden = !(faixa === 6 && !acimaDoTeto);
    // Acima de R$ 4,8 mi/ano a empresa não pode permanecer no Simples
    out.aviso.hidden = !acimaDoTeto;

    // sincroniza o campo de texto quando a mudança veio do slider
    if (document.activeElement !== campo) campo.value = valor.toLocaleString("pt-BR");
  }

  /* ---------- Eventos ---------- */
  range.addEventListener("input", function () {
    valor = parseInt(range.value, 10);
    render();
  });

  campo.addEventListener("input", function () {
    const n = parseInt(campo.value.replace(/\D/g, ""), 10);
    valor = isNaN(n) ? 0 : n;
    // o slider acompanha até o seu máximo; acima disso ele fica no fim
    range.value = Math.min(Math.max(valor, parseInt(range.min, 10)), parseInt(range.max, 10));
    render();
  });

  campo.addEventListener("blur", function () {
    campo.value = valor.toLocaleString("pt-BR");
  });

  anexoEl.addEventListener("change", render);

  render();
})();
