import { carregarCatalogo } from "../servicos/catalogo.js";
import { protegerRotaAdministrativa } from "../servicos/admin.js";
import { excluirProduto } from "../servicos/produtos.js";

const tabela = document.querySelector("#lista-produtos")
const modeloLinha = tabela.querySelector("tr").cloneNode(true)

const filtroModalidade = document.querySelector("#filtro-modalidade");
const buscaProduto = document.querySelector("#busca-produto");

let todosProdutos = [];

let produtoParaExcluir = null;
let excluindo = false;

const elementoModal = document.querySelector("#modalExcluir");
const modalExcluir = new bootstrap.Modal(elementoModal);
const nomeProdutoExcluir = document.querySelector("#nomeProdutoExcluir");
const erroExcluir = document.querySelector("#erroExcluir");
const confirmarExclusão = document.querySelector("#confirmarExclusao");
const botoesFechar = elementoModal.querySelectorAll('[data-bs-dismiss="modal"]');

const toastExclusao = new bootstrap.Toast(document.querySelector("#toastExclusao"));


function abrirExclusao(produto) {
    produtoParaExcluir = produto;
    nomeProdutoExcluir.textContent = produto.nome;
    erroExcluir.textContent = "";
    erroExcluir.classList.add("d-none");
    modalExcluir.show();
}


elementoModal.addEventListener("hide.bs.modal", (evento) => {
    if (excluindo) evento.preventDefault();
});


elementoModal.addEventListener("hidden.bs.modal", () => {
    produtoParaExcluir = null;
})





const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

function mostrarMensagem(texto) {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");

    celula.colSpan = 6;
    celula.textContent = texto;

    linha.appendChild(celula);
    tabela.replaceChildren(linha);
}





function criarLinha(produto) {
    const linha = modeloLinha.cloneNode(true);
    const celulas = linha.querySelectorAll("td");
    const imagem = linha.querySelector("img");

    imagem.src = produto.imagem;
    imagem.alt = produto.nome;

    celulas[1].textContent = produto.nome;
    celulas[2].textContent = produto.modalidade_nome;
    celulas[3].textContent = moeda.format(produto.preco);
    celulas[4].textContent = produto.destaque ? "Sim" : "Não";

    linha.dataset.produtoId = produto.id;

    const editar = linha.querySelector(".btn-primary");
    const excluir = linha.querySelector(".btn-danger");

    editar.setAttribute("aria-label", `Editar ${produto.nome}`);
    editar.addEventListener("click", () => {
        location.assign(`./produto.html?id=${encodeURIComponent(produto.id)}`);
    });
    excluir.setAttribute("aria-label", `Excluir ${produto.nome}`);

    excluir.addEventListener("click", () => {
        abrirExclusao(produto);
    })

    return linha;
}




function preencherModalidades(modalidades) {
    filtroModalidade.replaceChildren(
        new Option("Todas as modalidades", "")
    );

    modalidades.forEach((modalidade) => {
        const opcao = new Option(modalidade.nome, modalidade.id);
        filtroModalidade.appendChild(opcao);
    });
}

function normalizarTexto(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function aplicarFiltros() {
    const modalidadeSelecionada = filtroModalidade.value;
    const termo = normalizarTexto(buscaProduto.value);

    const filtrados = todosProdutos.filter((produto) => {
        const correspondeModalidade =
            modalidadeSelecionada === "" ||
            String(produto.modalidade_id) === modalidadeSelecionada;

        const correspondeNome =
            normalizarTexto(produto.nome).includes(termo);

        return correspondeModalidade && correspondeNome;
    });

    if (filtrados.length === 0) {
        mostrarMensagem(
            todosProdutos.length === 0
                ? "Nenhum produto cadastrado."
                : "Nenhum produto encontrado com esses filtros."
        );
        return;
    }

    const fragmento = document.createDocumentFragment();

    filtrados.forEach((produto) => {
        fragmento.appendChild(criarLinha(produto));
    });

    tabela.replaceChildren(fragmento);
}




async function carregarTabela() {
    filtroModalidade.disabled = true;
    buscaProduto.disabled = true;
    mostrarMensagem("Carregando produtos...");

    try {
        const { produtos, modalidades } = await carregarCatalogo();

        todosProdutos = produtos;

        preencherModalidades(modalidades);
        aplicarFiltros();

        filtroModalidade.disabled = false;
        buscaProduto.disabled = false;
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        mostrarMensagem("Não foi possível carregar os produtos.");
    }
}






async function confirmarExclusaoProduto() {
    if (!produtoParaExcluir || excluindo) return;

    const produto = produtoParaExcluir;

    excluindo = true;
    confirmarExclusão.disabled = true;
    confirmarExclusão.textContent = "Excluindo...";
    botoesFechar.forEach((botao) => {
        botao.disabled = true;
    });
    erroExcluir.classList.add("d-none");

    try {
        await excluirProduto(produto.id);
    } catch (erro) {
        erroExcluir.textContent = erro.message || "Não foi possível excluir o produto.";
        erroExcluir.classList.remove("d-none");
        return;
    } finally {
        excluindo = false;
        confirmarExclusão.disabled = false;
        confirmarExclusão.textContent = "Excluir";
        botoesFechar.forEach((botao) => {
            botao.disabled = false;
        });
    }

    todosProdutos = todosProdutos.filter((p) => p.id !== produto.id);
    aplicarFiltros();

    modalExcluir.hide();
    toastExclusao.show();

}







if (protegerRotaAdministrativa()) {
    filtroModalidade.addEventListener("change", aplicarFiltros);
    buscaProduto.addEventListener("input", aplicarFiltros);

    confirmarExclusao.addEventListener("click", confirmarExclusaoProduto);

    carregarTabela();
}