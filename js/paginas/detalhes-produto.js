const quantidadeProduto = document.querySelector("#quantidade-produto");
const diminuirQuantidade = document.querySelector("#diminuir-quantidade");
const aumentarQuantidade = document.querySelector("#aumentar-quantidade");

import { buscarProdutoPorId, listarProdutos } from "../servicos/catalogo.js";
import { criarCard } from "../componentes/card-produto.js";

let quantidade = 1;
let varianteSelecionada = null;

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







const statusProduto = document.querySelector("#status-produto");
const detalhesProduto = document.querySelector("#detalhes-produto");

const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

function preencherProduto(produto) {
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

    const variantes = document.querySelector("#produto-variantes");
    variantes.replaceChildren();

    varianteSelecionada = null;

    for (const variante of produto.variantes ?? []) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = "pd-badge pd-badge-neutral variante-botao";
        botao.textContent = variante;
        botao.setAttribute("aria-pressed", "false");

        botao.addEventListener("click", () => {
            varianteSelecionada = variante;

            variantes.querySelectorAll("button").forEach((item) => {
                const selecionado = item === botao;

                item.classList.toggle("selecionada", selecionado);
                item.setAttribute("aria-pressed", String(selecionado));
            });
        });

        variantes.appendChild(botao);
    }

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
