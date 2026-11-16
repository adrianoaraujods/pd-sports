/** Dashboard administrativo (Visão Geral): acesso restrito ao Administrador. */

import { protegerRotaAdministrativa } from "../servicos/admin.js";
import { carregarMetricas } from "../servicos/dashboard.js";
import { exibirFeedback } from "../servicos/carrinho.js";

const numero = new Intl.NumberFormat("pt-BR");
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const secaoMetricas = document.querySelector("#metricas");
const caixaErro = document.querySelector("#erro-dashboard");
const mensagemErro = document.querySelector("#erro-dashboard-mensagem");
const botaoTentarNovamente = document.querySelector("#tentar-novamente");

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
}

function mostrarErro(mensagem) {
  mensagemErro.textContent = mensagem;
  caixaErro.hidden = false;
  exibirFeedback(mensagem, "erro");
}

async function iniciar() {
  caixaErro.hidden = true;
  botaoTentarNovamente.disabled = true;
  secaoMetricas.setAttribute("aria-busy", "true");

  try {
    preencherMetricas(await carregarMetricas());
  } catch (erro) {
    console.error(erro);
    mostrarErro(erro.message || "Não foi possível carregar o dashboard.");
  } finally {
    secaoMetricas.setAttribute("aria-busy", "false");
    botaoTentarNovamente.disabled = false;
  }
}

if (protegerRotaAdministrativa()) {
  botaoTentarNovamente.addEventListener("click", iniciar);
  iniciar();
}
