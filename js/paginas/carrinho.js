import {
  obterCarrinho,
  detalharCarrinho,
  alterarQuantidadeItem,
  removerItem,
  finalizarCompra,
  exibirFeedback,
  EstoqueInsuficienteError,
} from "../servicos/carrinho.js";
import { obterSessao } from "../servicos/sessao.js";
import {
  consultarCep,
  calcularFrete,
  formatarCep,
  normalizarCep,
} from "../servicos/frete.js";
import { CONFIG } from "../api/config.js";

const statusCarrinho = document.querySelector("#status-carrinho");
const secaoCarrinhoVazio = document.querySelector("#secao-carrinho-vazio");
const secaoCarrinhoConteudo = document.querySelector(
  "#secao-carrinho-conteudo",
);
const listaItensCarrinho = document.querySelector("#lista-itens-carrinho");

const badgeTotalItens = document.querySelector("#badge-total-itens");
const resumoSubtotal = document.querySelector("#resumo-subtotal");
const resumoQtdItens = document.querySelector("#resumo-qtd-itens");
const resumoTotal = document.querySelector("#resumo-total");
const resumoFrete = document.querySelector("#resumo-frete");
const avisoFreteGratis = document.querySelector("#aviso-frete-gratis");

const formFrete = document.querySelector("#form-frete");
const campoCep = document.querySelector("#campo-cep");
const erroCep = document.querySelector("#erro-cep");
const btnCalcularFrete = document.querySelector("#btn-calcular-frete");
const resultadoFrete = document.querySelector("#resultado-frete");

/** Chave do endereço de entrega guardado na sessão do navegador. */
const CHAVE_ENDERECO_FRETE = "pd-sports:frete-endereco";

/** Estado do Frete na tela: endereço consultado e subtotal atual. */
const estadoFrete = {
  endereco: lerEnderecoSalvo(),
  subtotal: 0,
};

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function exibirCarregando() {
  statusCarrinho.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="text-muted mt-2">Carregando itens do carrinho...</p>
        </div>
    `;
  secaoCarrinhoVazio.hidden = true;
  secaoCarrinhoConteudo.hidden = true;
}

function exibirErro(mensagem) {
  statusCarrinho.innerHTML = `
        <div class="alert alert-danger d-flex align-items-center justify-content-between p-3 my-3" role="alert">
            <div>
                <i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
                <span>${mensagem}</span>
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm" id="btn-tentar-novamente">
                Tentar novamente
            </button>
        </div>
    `;
  document
    .querySelector("#btn-tentar-novamente")
    ?.addEventListener("click", () => carregarCarrinho());
}

function criarLinhaItem(item) {
  const tr = document.createElement("tr");
  tr.dataset.produtoId = item.produto_id;
  tr.dataset.variante = item.variante;
  tr.dataset.quantidade = item.quantidade;
  tr.dataset.nome = item.produto?.nome || "Produto";

  const nome = item.produto?.nome || "Produto";
  const imagem = item.produto?.imagem || "../assets/imagens/logo.png";
  const precoUnitario = moeda.format(item.preco_unitario);
  const subtotal = moeda.format(item.subtotal);

  tr.innerHTML = `
        <td data-rotulo="Produto">
            <div class="d-flex align-items-center gap-3">
                <img src="${imagem}" alt="${nome}" class="item-carrinho-img">
                <a href="./detalhes-produto.html?id=${encodeURIComponent(item.produto_id)}" class="item-carrinho-info text-decoration-none fw-semibold">
                    ${nome}
                </a>
            </div>
        </td>
        <td data-rotulo="Variante">
            <span class="pd-badge pd-badge-neutral">${item.variante}</span>
        </td>
        <td data-rotulo="Preço" class="text-end fw-semibold">
            ${precoUnitario}
        </td>
        <td data-rotulo="Quantidade" class="text-center">
            <div class="seletor-quantidade-carrinho">
                <button type="button" data-acao="diminuir" aria-label="Diminuir quantidade">−</button>
                <span class="qtd-valor" aria-live="polite">${item.quantidade}</span>
                <button type="button" data-acao="aumentar" aria-label="Aumentar quantidade"${item.limite_atingido ? ' class="limite-atingido" aria-disabled="true" title="Limite de estoque atingido"' : ""}>+</button>
            </div>
        </td>
        <td data-rotulo="Subtotal" class="text-end fw-bold">
            ${subtotal}
        </td>
        <td data-rotulo="Ações" class="text-center">
            <button type="button" class="btn btn-outline-danger btn-sm" data-acao="remover" aria-label="Remover ${nome} (${item.variante})">
                <i class="bi bi-trash" aria-hidden="true"></i> <span class="d-md-none ms-1">Remover</span>
            </button>
        </td>
    `;
  return tr;
}

/**
 * Atualiza os valores do resumo do pedido e do badge do cabeçalho.
 * O total inclui o Frete quando já houver um CEP consultado.
 * @param {{ valorTotal?: number, totalItens?: number }} [resumo]
 */
export function atualizarResumo(resumo = {}) {
  const totalItensNum = Number(resumo?.totalItens) || 0;
  const valorTotalNum = Number(resumo?.valorTotal) || 0;
  estadoFrete.subtotal = valorTotalNum;

  if (badgeTotalItens) {
    badgeTotalItens.textContent = `${totalItensNum} ${totalItensNum === 1 ? "item" : "itens"}`;
  }
  if (resumoSubtotal) {
    resumoSubtotal.textContent = moeda.format(valorTotalNum);
  }
  if (resumoQtdItens) {
    resumoQtdItens.textContent = String(totalItensNum);
  }

  const frete = freteAtual();
  renderizarFrete(frete);

  if (resumoTotal) {
    resumoTotal.textContent = moeda.format(valorTotalNum + (frete?.valor ?? 0));
  }
}

/* ---------- Frete ---------- */

function lerEnderecoSalvo() {
  try {
    const salvo = JSON.parse(sessionStorage.getItem(CHAVE_ENDERECO_FRETE));
    return salvo?.uf ? salvo : null;
  } catch {
    return null;
  }
}

function salvarEndereco(endereco) {
  try {
    if (endereco) {
      sessionStorage.setItem(CHAVE_ENDERECO_FRETE, JSON.stringify(endereco));
    } else {
      sessionStorage.removeItem(CHAVE_ENDERECO_FRETE);
    }
  } catch {
    // Sem sessionStorage (modo privado/bloqueado): o Frete vale só nesta tela.
  }
}

/** Recalcula o Frete com o subtotal atual (ou null se não houver CEP). */
function freteAtual() {
  if (!estadoFrete.endereco) return null;
  try {
    return calcularFrete(estadoFrete.endereco.uf, estadoFrete.subtotal);
  } catch {
    return null;
  }
}

const textoPrazo = (dias) => `${dias} ${dias === 1 ? "dia útil" : "dias úteis"}`;

/** Mostra o endereço, valor e prazo do Frete (ou o estado "a calcular"). */
function renderizarFrete(frete) {
  const { endereco } = estadoFrete;
  const limiteGratis = moeda.format(CONFIG.FRETE.GRATIS_ACIMA_DE);

  if (!endereco || !frete) {
    resultadoFrete.hidden = true;
    resultadoFrete.replaceChildren();
    resumoFrete.textContent = "A calcular";
    resumoFrete.classList.remove("frete-gratis");
    avisoFreteGratis.textContent = `Frete grátis em compras acima de ${limiteGratis}.`;
    avisoFreteGratis.hidden = false;
    return;
  }

  const linhaEndereco = [endereco.logradouro, endereco.bairro]
    .filter(Boolean)
    .join(", ");

  const titulo = document.createElement("div");
  titulo.className = "d-flex justify-content-between align-items-center gap-2 mb-1";
  const cep = document.createElement("strong");
  cep.textContent = `CEP ${endereco.cep}`;
  titulo.append(cep);
  if (frete.gratis) {
    const badge = document.createElement("span");
    badge.className = "pd-badge pd-badge-sucesso";
    badge.innerHTML = '<i class="bi bi-truck" aria-hidden="true"></i> Frete grátis';
    titulo.append(badge);
  }

  const enderecoEl = document.createElement("p");
  enderecoEl.className = "endereco-frete mb-2";
  enderecoEl.textContent = [linhaEndereco, `${endereco.cidade}/${endereco.uf}`]
    .filter(Boolean)
    .join(" · ");

  const detalhes = document.createElement("div");
  detalhes.className = "d-flex justify-content-between flex-wrap gap-2";
  const valor = document.createElement("span");
  valor.className = frete.gratis ? "fw-semibold frete-gratis" : "fw-semibold";
  valor.textContent = frete.gratis ? "Grátis" : moeda.format(frete.valor);
  const prazo = document.createElement("span");
  prazo.className = "text-muted";
  prazo.textContent = `Entrega em até ${textoPrazo(frete.prazo)}`;
  detalhes.append(valor, prazo);

  resultadoFrete.replaceChildren(titulo, enderecoEl, detalhes);
  resultadoFrete.hidden = false;

  resumoFrete.textContent = frete.gratis ? "Grátis" : moeda.format(frete.valor);
  resumoFrete.classList.toggle("frete-gratis", frete.gratis);

  if (frete.gratis) {
    avisoFreteGratis.hidden = true;
  } else {
    const falta = CONFIG.FRETE.GRATIS_ACIMA_DE - estadoFrete.subtotal;
    avisoFreteGratis.textContent =
      falta > 0
        ? `Faltam ${moeda.format(falta)} para ganhar Frete grátis (acima de ${limiteGratis}).`
        : `Frete grátis em compras acima de ${limiteGratis}.`;
    avisoFreteGratis.hidden = false;
  }
}

function mostrarErroCep(mensagem) {
  campoCep.classList.add("is-invalid");
  campoCep.setAttribute("aria-invalid", "true");
  erroCep.textContent = mensagem;
}

function limparErroCep() {
  campoCep.classList.remove("is-invalid");
  campoCep.removeAttribute("aria-invalid");
  erroCep.textContent = "";
}

// Máscara 00000-000 enquanto digita
campoCep.addEventListener("input", () => {
  const digitos = normalizarCep(campoCep.value).slice(0, 8);
  campoCep.value =
    digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
  limparErroCep();
});

let consultaAtual = 0;

formFrete.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limparErroCep();

  const consulta = ++consultaAtual;
  const textoOriginal = btnCalcularFrete.textContent;
  btnCalcularFrete.disabled = true;
  btnCalcularFrete.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="visually-hidden">Calculando...</span>';

  try {
    const endereco = await consultarCep(campoCep.value);
    if (consulta !== consultaAtual) return;
    estadoFrete.endereco = endereco;
    salvarEndereco(endereco);
    campoCep.value = endereco.cep;
    atualizarResumo({
      valorTotal: estadoFrete.subtotal,
      totalItens: Number(resumoQtdItens.textContent) || 0,
    });
  } catch (erro) {
    if (consulta !== consultaAtual) return;
    estadoFrete.endereco = null;
    salvarEndereco(null);
    atualizarResumo({
      valorTotal: estadoFrete.subtotal,
      totalItens: Number(resumoQtdItens.textContent) || 0,
    });
    mostrarErroCep(erro?.message || "Não foi possível calcular o frete.");
    campoCep.focus();
  } finally {
    if (consulta === consultaAtual) {
      btnCalcularFrete.disabled = false;
      btnCalcularFrete.textContent = textoOriginal;
    }
  }
});

if (estadoFrete.endereco) {
  campoCep.value = formatarCep(estadoFrete.endereco.cep);
}

export async function carregarCarrinho(mostrarSpinner = true) {
  const sessao = obterSessao();
  if (!sessao) {
    statusCarrinho.innerHTML = `
            <div class="card border-0 shadow-sm p-5 text-center my-4 mx-auto" style="max-width: 480px;">
                <i class="bi bi-person-lock display-3 text-secondary mb-3" aria-hidden="true"></i>
                <h2 class="h4 fw-bold">Faça login para ver seu carrinho</h2>
                <p class="text-muted mb-4">Entre com sua conta para acessar seus itens salvos e finalizar compras.</p>
                <a href="./login.html" class="btn btn-primary">Entrar na minha conta</a>
            </div>
        `;
    secaoCarrinhoVazio.hidden = true;
    secaoCarrinhoConteudo.hidden = true;
    atualizarResumo({ valorTotal: 0, totalItens: 0 });
    return;
  }

  if (mostrarSpinner) exibirCarregando();

  try {
    const carrinho = await obterCarrinho(sessao.id);
    const detalhado = await detalharCarrinho(carrinho);

    statusCarrinho.replaceChildren();

    const vazio = detalhado.itens.length === 0;
    secaoCarrinhoVazio.hidden = !vazio;
    secaoCarrinhoConteudo.hidden = vazio;

    atualizarResumo(detalhado);

    if (vazio) {
      listaItensCarrinho.replaceChildren();
      return;
    }

    const fragmento = document.createDocumentFragment();
    for (const item of detalhado.itens) {
      fragmento.appendChild(criarLinhaItem(item));
    }

    listaItensCarrinho.replaceChildren(fragmento);
  } catch {
    exibirErro(
      "Não foi possível conectar ao carrinho. Verifique sua conexão e tente novamente.",
    );
  }
}


// Delegação de eventos única para ações na tabela de itens
listaItensCarrinho.addEventListener("click", async (evento) => {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao || botao.disabled) return;

  const tr = botao.closest("tr");
  if (!tr) return;

  const sessao = obterSessao();
  if (!sessao) return;

  const { produtoId, variante, nome } = tr.dataset;
  const quantidade = Number(tr.dataset.quantidade) || 1;
  const acao = botao.dataset.acao;

  if (acao === "aumentar" && botao.classList.contains("limite-atingido")) {
    exibirFeedback("Limite de estoque atingido", "erro");
    return;
  }

  const desabilitarBotoes = (desabilitar) => {
    tr.style.opacity = desabilitar ? "0.5" : "1";
    tr.querySelectorAll("button").forEach(
      (btn) => (btn.disabled = desabilitar),
    );
  };

  try {
    if (acao === "aumentar") {
      desabilitarBotoes(true);
      await alterarQuantidadeItem(
        sessao.id,
        produtoId,
        variante,
        quantidade + 1,
      );
    } else if (acao === "diminuir" && quantidade > 1) {
      desabilitarBotoes(true);
      await alterarQuantidadeItem(
        sessao.id,
        produtoId,
        variante,
        quantidade - 1,
      );
    } else if (acao === "remover" || (acao === "diminuir" && quantidade <= 1)) {
      if (!confirm(`Remover "${nome}" (${variante}) do carrinho?`)) return;
      desabilitarBotoes(true);
      await removerItem(sessao.id, produtoId, variante);
    }

    await carregarCarrinho(false);
  } catch (erro) {
    // O serviço já exibiu o aviso de estoque; só recarrega para refletir o limite
    if (erro instanceof EstoqueInsuficienteError) {
      await carregarCarrinho(false);
      return;
    }
    exibirFeedback("Não foi possível atualizar o carrinho.", "erro");
    desabilitarBotoes(false);
  }
});

const btnFinalizarCompra = document.querySelector("#btn-finalizar-compra");

btnFinalizarCompra?.addEventListener("click", () => {
  const sessao = obterSessao();

  if (!sessao) {
    location.assign(
      "./login.html?redirect=" +
      encodeURIComponent("/paginas/finalizacao.html")
    );
    return;
  }

  location.assign("./finalizacao.html");
});

carregarCarrinho();
