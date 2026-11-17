/** Dashboard administrativo (Visão Geral): acesso restrito ao Administrador. */

import { protegerRotaAdministrativa } from "../servicos/admin.js";
import { carregarMetricas } from "../servicos/dashboard.js";
import { exibirFeedback } from "../servicos/carrinho.js";
import { criarCard } from "../componentes/card-produto.js";

const CORES = {
  roxo: "#8884D8",
  verde: "#82CA9D",
  salmao: "#FF9F96",
  grade: "rgba(0, 0, 0, 0.08)",
};

const numero = new Intl.NumberFormat("pt-BR");
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const secaoMetricas = document.querySelector("#metricas");
const caixaErro = document.querySelector("#erro-dashboard");
const mensagemErro = document.querySelector("#erro-dashboard-mensagem");
const botaoTentarNovamente = document.querySelector("#tentar-novamente");
const listaMaisVendidos = document.querySelector("#mais-vendidos");
const statusMaisVendidos = document.querySelector("#status-mais-vendidos");

const graficos = {};

function preencherMetricas(metricas) {
  const formatos = {
    totalProdutos: numero.format,
    totalDestaques: numero.format,
    totalUsuarios: numero.format,
    valorEmCarrinhos: moeda.format,
    carrinhosEmAberto: numero.format,
  };

  for (const [chave, formatar] of Object.entries(formatos)) {
    const elemento = secaoMetricas.querySelector(`[data-metrica="${chave}"]`);
    elemento.textContent = formatar(metricas[chave]);
  }
  secaoMetricas.setAttribute("aria-busy", "false");
}

/** Cria o gráfico ou substitui o anterior (ao tentar novamente). */
function desenharGrafico(id, configuracao) {
  graficos[id]?.destroy();
  graficos[id] = new Chart(document.getElementById(id), configuracao);
}

const opcoesBase = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
  },
  scales: {
    x: { grid: { color: CORES.grade }, ticks: { autoSkip: false, maxRotation: 60 } },
    y: { beginAtZero: true, grid: { color: CORES.grade } },
  },
};

function desenharGraficos(porModalidade) {
  if (typeof Chart === "undefined") {
    throw new Error("Não foi possível carregar a biblioteca de gráficos.");
  }

  const rotulos = porModalidade.map((m) => m.nome);

  desenharGrafico("grafico-modalidades", {
    type: "bar",
    data: {
      labels: rotulos,
      datasets: [
        { label: "Produtos", data: porModalidade.map((m) => m.totalProdutos), backgroundColor: CORES.roxo },
        { label: "Destaques", data: porModalidade.map((m) => m.totalDestaques), backgroundColor: CORES.verde },
        { label: "Itens em carrinhos", data: porModalidade.map((m) => m.itensEmCarrinhos), backgroundColor: CORES.salmao },
      ],
    },
    options: {
      ...opcoesBase,
      scales: { ...opcoesBase.scales, y: { ...opcoesBase.scales.y, ticks: { precision: 0 } } },
    },
  });

  desenharGrafico("grafico-preco-medio", {
    type: "line",
    data: {
      labels: rotulos,
      datasets: [
        {
          label: "Preço médio",
          data: porModalidade.map((m) => m.precoMedio),
          borderColor: CORES.roxo,
          backgroundColor: "#FFFFFF",
          pointBorderColor: CORES.roxo,
          pointRadius: 4,
          tension: 0,
        },
      ],
    },
    options: {
      ...opcoesBase,
      plugins: {
        ...opcoesBase.plugins,
        tooltip: { callbacks: { label: (ctx) => `Preço médio: ${moeda.format(ctx.parsed.y)}` } },
      },
      scales: {
        ...opcoesBase.scales,
        y: { ...opcoesBase.scales.y, ticks: { callback: (valor) => moeda.format(valor) } },
      },
    },
  });
}

function criarCardMaisVendido({ produto, quantidade }) {
  const coluna = criarCard(produto);
  const rodape = coluna.querySelector(".card-bottom");

  const qtd = document.createElement("p");
  qtd.className = "metrica-quantidade";
  qtd.textContent = `${numero.format(quantidade)} ${quantidade === 1 ? "unidade" : "unidades"} em carrinhos`;
  rodape.querySelector(".product-price").after(qtd);

  const editar = document.createElement("a");
  editar.className = "btn btn-editar";
  editar.href = `./produto.html?id=${encodeURIComponent(produto.id)}`;
  editar.innerHTML = 'Editar Produto <i class="bi bi-arrow-right-short fs-5 align-middle" aria-hidden="true"></i>';
  editar.setAttribute("aria-label", `Editar ${produto.nome}`);
  rodape.appendChild(editar);

  return coluna;
}

function preencherMaisVendidos(maisVendidos) {
  listaMaisVendidos.replaceChildren(...maisVendidos.map(criarCardMaisVendido));
  statusMaisVendidos.textContent = maisVendidos.length ? "" : "Nenhum produto nos carrinhos ainda.";
  statusMaisVendidos.hidden = maisVendidos.length > 0;
}

function mostrarErro(mensagem) {
  mensagemErro.textContent = mensagem;
  caixaErro.hidden = false;
  statusMaisVendidos.hidden = false;
  statusMaisVendidos.textContent = "Não foi possível carregar os produtos.";
  secaoMetricas.setAttribute("aria-busy", "false");
  exibirFeedback(mensagem, "erro");
}

async function iniciar() {
  caixaErro.hidden = true;
  botaoTentarNovamente.disabled = true;
  secaoMetricas.setAttribute("aria-busy", "true");
  statusMaisVendidos.hidden = false;
  statusMaisVendidos.textContent = "Carregando...";

  try {
    const metricas = await carregarMetricas();
    preencherMetricas(metricas);
    preencherMaisVendidos(metricas.maisVendidos);
    desenharGraficos(metricas.porModalidade);
  } catch (erro) {
    console.error(erro);
    mostrarErro(erro.message || "Não foi possível carregar o dashboard.");
  } finally {
    botaoTentarNovamente.disabled = false;
  }
}

if (protegerRotaAdministrativa()) {
  botaoTentarNovamente.addEventListener("click", iniciar);
  iniciar();
}
