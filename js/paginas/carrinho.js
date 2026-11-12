import {
    obterCarrinho,
    detalharCarrinho,
    alterarQuantidadeItem,
    removerItem,
    esvaziarCarrinho,
    exibirFeedback
} from "../servicos/carrinho.js";
import { obterSessao } from "../servicos/sessao.js";

const statusCarrinho = document.querySelector("#status-carrinho");
const secaoCarrinhoVazio = document.querySelector("#secao-carrinho-vazio");
const secaoCarrinhoConteudo = document.querySelector("#secao-carrinho-conteudo");
const listaItensCarrinho = document.querySelector("#lista-itens-carrinho");

const badgeTotalItens = document.querySelector("#badge-total-itens");
const resumoSubtotal = document.querySelector("#resumo-subtotal");
const resumoQtdItens = document.querySelector("#resumo-qtd-itens");
const resumoTotal = document.querySelector("#resumo-total");

const btnEsvaziarCarrinho = document.querySelector("#btn-esvaziar-carrinho");
const btnFinalizarCompra = document.querySelector("#btn-finalizar-compra");

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
    document.querySelector("#btn-tentar-novamente").addEventListener("click", () => carregarCarrinho());
}

function limparStatus() {
    statusCarrinho.replaceChildren();
}

function criarLinhaItem(item, usuarioId) {
    const tr = document.createElement("tr");
    tr.dataset.produtoId = item.produto_id;
    tr.dataset.variante = item.variante;

    const nome = item.produto?.nome || "Produto";
    const imagem = item.produto?.imagem || "../assets/imagens/logo.png";
    const precoUnitario = moeda.format(item.preco_unitario);
    const subtotal = moeda.format(item.subtotal);

    tr.innerHTML = `
        <td data-rotulo="Produto">
            <div class="d-flex align-items-center gap-3">
                <img src="${imagem}" alt="${nome}" class="item-carrinho-img">
                <div class="item-carrinho-info">
                    <a href="./detalhes-produto.html?id=${encodeURIComponent(item.produto_id)}" class="text-decoration-none">
                        ${nome}
                    </a>
                </div>
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
                <button type="button" class="btn-diminuir" aria-label="Diminuir quantidade">−</button>
                <span class="qtd-valor" aria-live="polite">${item.quantidade}</span>
                <button type="button" class="btn-aumentar" aria-label="Aumentar quantidade">+</button>
            </div>
        </td>
        <td data-rotulo="Subtotal" class="text-end fw-bold">
            ${subtotal}
        </td>
        <td data-rotulo="Ações" class="text-center">
            <button type="button" class="btn btn-outline-danger btn-sm btn-remover" aria-label="Remover ${nome} (${item.variante})">
                <i class="bi bi-trash" aria-hidden="true"></i> <span class="d-md-none ms-1">Remover</span>
            </button>
        </td>
    `;

    const btnDiminuir = tr.querySelector(".btn-diminuir");
    const btnAumentar = tr.querySelector(".btn-aumentar");
    const btnRemover = tr.querySelector(".btn-remover");

    const desabilitarBotoes = (desabilitar) => {
        btnDiminuir.disabled = desabilitar;
        btnAumentar.disabled = desabilitar;
        btnRemover.disabled = desabilitar;
        tr.style.opacity = desabilitar ? "0.5" : "1";
    };

    async function executarAcao(acao) {
        try {
            desabilitarBotoes(true);
            await acao();
            await carregarCarrinho(false);
        } catch {
            exibirFeedback("Não foi possível atualizar o carrinho.", "erro");
            desabilitarBotoes(false);
        }
    }

    btnAumentar.addEventListener("click", () => {
        executarAcao(() => alterarQuantidadeItem(usuarioId, item.produto_id, item.variante, item.quantidade + 1));
    });

    btnDiminuir.addEventListener("click", () => {
        if (item.quantidade > 1) {
            executarAcao(() => alterarQuantidadeItem(usuarioId, item.produto_id, item.variante, item.quantidade - 1));
        } else if (confirm(`Deseja remover "${nome}" (${item.variante}) do carrinho?`)) {
            executarAcao(() => removerItem(usuarioId, item.produto_id, item.variante));
        }
    });

    btnRemover.addEventListener("click", () => {
        if (confirm(`Remover "${nome}" (${item.variante}) do carrinho?`)) {
            executarAcao(() => removerItem(usuarioId, item.produto_id, item.variante));
        }
    });

    return tr;
}

export async function carregarCarrinho(mostrarSpinner = true) {
    const sessao = obterSessao();

    if (!sessao) {
        statusCarrinho.innerHTML = `
            <div class="card border-0 shadow-sm p-5 text-center my-4 mx-auto" style="max-width: 480px;">
                <i class="bi bi-person-lock display-3 text-secondary mb-3" aria-hidden="true"></i>
                <h2 class="h4 fw-bold">Faça login para ver seu carrinho</h2>
                <p class="text-muted mb-4">Entre com sua conta para acessar seus itens salvos e finalizar compras.</p>
                <a href="../login.html" class="btn btn-primary">Entrar na minha conta</a>
            </div>
        `;
        secaoCarrinhoVazio.hidden = true;
        secaoCarrinhoConteudo.hidden = true;
        badgeTotalItens.textContent = "0 itens";
        return;
    }

    if (mostrarSpinner) exibirCarregando();

    try {
        const carrinho = await obterCarrinho(sessao.id);
        const detalhado = await detalharCarrinho(carrinho);

        limparStatus();

        const vazio = detalhado.itens.length === 0;
        secaoCarrinhoVazio.hidden = !vazio;
        secaoCarrinhoConteudo.hidden = vazio;
        badgeTotalItens.textContent = `${detalhado.totalItens} ${detalhado.totalItens === 1 ? "item" : "itens"}`;

        if (vazio) return;

        resumoSubtotal.textContent = moeda.format(detalhado.valorTotal);
        resumoQtdItens.textContent = String(detalhado.totalItens);
        resumoTotal.textContent = moeda.format(detalhado.valorTotal);

        const fragmento = document.createDocumentFragment();
        for (const item of detalhado.itens) {
            fragmento.appendChild(criarLinhaItem(item, sessao.id));
        }

        listaItensCarrinho.replaceChildren(fragmento);
    } catch {
        exibirErro("Não foi possível conectar ao carrinho. Verifique sua conexão e tente novamente.");
    }
}

btnEsvaziarCarrinho.addEventListener("click", async () => {
    const sessao = obterSessao();
    if (!sessao || !confirm("Tem certeza de que deseja esvaziar todos os itens do carrinho?")) return;

    try {
        btnEsvaziarCarrinho.disabled = true;
        await esvaziarCarrinho(sessao.id);
        await carregarCarrinho(false);
    } catch {
        exibirFeedback("Não foi possível esvaziar o carrinho.", "erro");
    } finally {
        btnEsvaziarCarrinho.disabled = false;
    }
});

btnFinalizarCompra.addEventListener("click", () => {
    exibirFeedback("Redirecionando para finalização de compra...", "sucesso");
});

carregarCarrinho();
