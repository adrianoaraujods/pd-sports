import { buscarProdutoPorId, listarProdutos } from "../servicos/catalogo.js";
import { criarCard } from "../componentes/card-produto.js";

const quantidadeProduto = document.querySelector("#quantidade-produto");
const diminuirQuantidade = document.querySelector("#diminuir-quantidade");
const aumentarQuantidade = document.querySelector("#aumentar-quantidade");

const statusProduto = document.querySelector("#status-produto");
const detalhesProduto = document.querySelector("#detalhes-produto");
const secaoVariantes = document.querySelector("#secao-variantes");
const containerVariantes = document.querySelector("#produto-variantes");
const avisoVariante = document.querySelector("#aviso-variante");
const botaoAdicionarCarrinho = document.querySelector("#botao-adicionar-carrinho");

let quantidade = 1;
let varianteSelecionada = null;
let produtoAtual = null;

const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

/**
 * Verifica se o produto possui variantes reais para seleção.
 * Produtos sem variantes ou com apenas "Único" não mostram o seletor.
 * @param {object} produto
 * @returns {boolean}
 */
export function produtoTemVariantes(produto) {
    const variantes = produto?.variantes ?? [];
    return variantes.length > 1 || (variantes.length === 1 && variantes[0] !== "Único");
}

/**
 * Retorna a variante atualmente selecionada (ou "Único" se não houver seletor).
 * @returns {string|null}
 */
export function obterVarianteSelecionada() {
    return varianteSelecionada;
}

function atualizarQuantidade(valor) {
    quantidade = Math.max(1, valor);
    quantidadeProduto.value = String(quantidade);
    diminuirQuantidade.disabled = quantidade === 1;
}

diminuirQuantidade.addEventListener("click", () => {
    atualizarQuantidade(quantidade - 1);
});

aumentarQuantidade.addEventListener("click", () => {
    atualizarQuantidade(quantidade + 1);
});

function configurarVariantes(produto) {
    const temVariantes = produtoTemVariantes(produto);
    secaoVariantes.hidden = !temVariantes;

    if (!temVariantes) {
        varianteSelecionada = "Único";
        botaoAdicionarCarrinho.disabled = produto.estoque <= 0;
        containerVariantes.replaceChildren();
        return;
    }

    varianteSelecionada = null;
    botaoAdicionarCarrinho.disabled = true;
    avisoVariante.textContent = "Selecione uma variante para continuar.";
    avisoVariante.className = "text-muted d-block mt-1";

    const botoes = produto.variantes.map((variante) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "pd-badge pd-badge-neutral variante-botao";
        botao.textContent = variante;
        botao.setAttribute("aria-pressed", "false");

        botao.addEventListener("click", () => {
            varianteSelecionada = variante;

            containerVariantes.querySelectorAll(".variante-botao").forEach((btn) => {
                const ativo = btn === botao;
                btn.classList.toggle("selecionada", ativo);
                btn.setAttribute("aria-pressed", String(ativo));
            });

            avisoVariante.innerHTML = `Variante selecionada: <strong>${variante}</strong>`;
            avisoVariante.className = "text-success d-block mt-1";
            botaoAdicionarCarrinho.disabled = produto.estoque <= 0;
        });

        return botao;
    });

    containerVariantes.replaceChildren(...botoes);
}

function preencherProduto(produto) {
    produtoAtual = produto;

    document.querySelector("#produto-nome").textContent = produto.nome;

    document.querySelector("#produto-modalidade").textContent =
        produto.modalidade_nome;

    document.querySelector("#produto-preco").textContent =
        moeda.format(produto.preco);

    document.querySelector("#produto-descricao").textContent =
        produto.descricao;

    const imagem = document.querySelector("#produto-imagem");
    imagem.src = produto.imagem;
    imagem.alt = produto.nome;

    document.querySelector("#produto-estoque").textContent =
        produto.estoque > 0
            ? `Estoque: ${produto.estoque} unidades`
            : "Produto indisponível";

    configurarVariantes(produto);

    document.title = `${produto.nome} | PD Sports`;
}

async function iniciarDetalhes() {
    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    if (!id) {
        statusProduto.textContent =
            "Selecione um produto no catálogo para ver os detalhes.";
        return;
    }

    statusProduto.textContent = "Carregando produto...";

    try {
        const produto = await buscarProdutoPorId(id);

        if (!produto) {
            statusProduto.textContent = "Produto não encontrado.";
            return;
        }

        preencherProduto(produto);

        detalhesProduto.hidden = false;
        statusProduto.textContent = "";
        await carregarRelacionados(produto);
    } catch (erro) {
        statusProduto.textContent =
            "Não foi possível carregar o produto. Tente novamente.";
        console.error("Erro ao carregar produto:", erro);
    }
}

async function carregarRelacionados(produtoAtual) {
    const secao = document.querySelector("#secao-relacionados");
    const lista = document.querySelector("#produtos-relacionados");

    secao.hidden = true;
    lista.replaceChildren();

    try {
        const produtos = await listarProdutos();
        const relacionados = produtos
            .filter((produto) =>
                String(produto.modalidade_id) === String(produtoAtual.modalidade_id) &&
                produto.id !== produtoAtual.id
            )
            .slice(0, 4);

        const fragmento = document.createDocumentFragment();
        for (const produto of relacionados) {
            fragmento.appendChild(criarCard(produto));
        }

        lista.replaceChildren(fragmento);
        secao.hidden = relacionados.length === 0;
    } catch (erro) {
        console.error("Erro ao carregar produtos relacionados:", erro);
    }
}

iniciarDetalhes();
