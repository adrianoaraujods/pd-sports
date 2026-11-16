import { criarCard } from "../componentes/card-produto.js";
import { listarProdutos, listarModalidades } from "../servicos/catalogo.js";

export const ITENS_POR_PAGINA = 12;

let todosProdutos = [];
let modalidadeSelecionada = "";
let paginaAtual = 1;

const filtroModalidades = document.querySelector("#filtro-modalidades");
const lista = document.querySelector("#lista-produtos");
const status = document.querySelector("#status-produtos");
const ordenacao = document.querySelector("#ordenacao");
const navPaginacao = document.querySelector("#paginacao");

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function obterBusca() {
    return document.querySelector('input[name="q"]')?.value ?? "";
}

function preencherBusca(termo) {
    document.querySelectorAll('input[name="q"]').forEach((campo) => {
        campo.value = termo;
    });
}

function lerParametrosUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
        modalidade: params.get("modalidade") || "",
        q: params.get("q") || "",
        ordem: params.get("ordem") || "",
        pagina: Math.max(1, Number(params.get("pagina")) || 1),
    };
}

function sincronizarUrl(substituir = false) {
    const params = new URLSearchParams();

    if (modalidadeSelecionada) {
        params.set("modalidade", modalidadeSelecionada);
    }

    const termo = obterBusca().trim();
    if (termo) {
        params.set("q", termo);
    }

    if (ordenacao.value) {
        params.set("ordem", ordenacao.value);
    }

    if (paginaAtual > 1) {
        params.set("pagina", String(paginaAtual));
    }

    const qs = params.toString();
    const novaUrl = qs ? `?${qs}` : window.location.pathname;

    if (substituir) {
        history.replaceState(null, "", novaUrl);
    } else {
        history.pushState(null, "", novaUrl);
    }
}

function renderizarProdutos(produtos) {
    const fragmento = document.createDocumentFragment();

    for (const produto of produtos) {
        fragmento.appendChild(criarCard(produto));
    }

    lista.replaceChildren(fragmento);
}

function renderizarPaginacao(totalPaginas) {
    if (totalPaginas <= 1) {
        navPaginacao.innerHTML = "";
        return;
    }

    let itens = "";

    itens += `<li class="page-item ${paginaAtual <= 1 ? "disabled" : ""}">
        <button class="page-link" data-pagina="${paginaAtual - 1}" ${paginaAtual <= 1 ? "disabled" : ""}>Anterior</button>
    </li>`;

    for (let i = 1; i <= totalPaginas; i++) {
        const ativo = i === paginaAtual;
        itens += `<li class="page-item ${ativo ? "active" : ""}">
            <button class="page-link" data-pagina="${i}" ${ativo ? 'aria-current="page"' : ""}>${i}</button>
        </li>`;
    }

    itens += `<li class="page-item ${paginaAtual >= totalPaginas ? "disabled" : ""}">
        <button class="page-link" data-pagina="${paginaAtual + 1}" ${paginaAtual >= totalPaginas ? "disabled" : ""}>Próximo</button>
    </li>`;

    navPaginacao.innerHTML = `<ul class="pagination flex-wrap justify-content-center gap-1 mb-0">${itens}</ul>`;
}

function aplicarBusca(manterPagina = false) {
    if (!manterPagina) {
        paginaAtual = 1;
    }

    const termo = normalizarTexto(obterBusca());

    const encontrados = todosProdutos.filter((produto) => {
        const correspondeAoNome = normalizarTexto(produto.nome).includes(termo);
        const correspondeAModalidade =
            modalidadeSelecionada === "" ||
            String(produto.modalidade_id) === modalidadeSelecionada;

        return correspondeAoNome && correspondeAModalidade;
    });

    if (ordenacao.value === "menor-preco") {
        encontrados.sort((a, b) => a.preco - b.preco);
    } else if (ordenacao.value === "maior-preco") {
        encontrados.sort((a, b) => b.preco - a.preco);
    }

    const totalPaginas = Math.ceil(encontrados.length / ITENS_POR_PAGINA) || 1;
    if (paginaAtual > totalPaginas) {
        paginaAtual = totalPaginas;
    }

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    renderizarProdutos(encontrados.slice(inicio, inicio + ITENS_POR_PAGINA));

    status.textContent =
        encontrados.length === 0 ? "Nenhum produto encontrado." : "";

    renderizarPaginacao(totalPaginas);
}

function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    sincronizarUrl();
    aplicarBusca(true);
    lista.scrollIntoView({ behavior: "smooth" });
}

function renderizarModalidades(modalidades) {
    filtroModalidades.replaceChildren();

    const opcoes = [{ id: "", nome: "Todas" }, ...modalidades];

    for (const modalidade of opcoes) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.textContent = modalidade.nome;
        botao.dataset.modalidade = String(modalidade.id);
        botao.className = "btn flex-shrink-0";

        const selecionado = botao.dataset.modalidade === modalidadeSelecionada;
        botao.classList.toggle("border-bot", selecionado);
        botao.setAttribute("aria-pressed", String(selecionado));

        botao.addEventListener("click", () => {
            modalidadeSelecionada = botao.dataset.modalidade;

            filtroModalidades.querySelectorAll("button").forEach((item) => {
                const ativo = item.dataset.modalidade === modalidadeSelecionada;
                item.classList.toggle("border-bot", ativo);
                item.setAttribute("aria-pressed", String(ativo));
            });

            sincronizarUrl();
            aplicarBusca();
        });

        filtroModalidades.appendChild(botao);
    }
}

document.addEventListener("input", (evento) => {
    if (evento.target.matches('input[name="q"]')) {
        const valor = evento.target.value;
        document.querySelectorAll('input[name="q"]').forEach((outroCampo) => {
            if (outroCampo !== evento.target) {
                outroCampo.value = valor;
            }
        });

        sincronizarUrl(true);
        aplicarBusca();
    }
});

document.addEventListener("submit", (evento) => {
    if (evento.target.querySelector('input[name="q"]')) {
        evento.preventDefault();
        sincronizarUrl();
        aplicarBusca();
    }
});

ordenacao.addEventListener("change", () => {
    sincronizarUrl();
    aplicarBusca();
});

navPaginacao.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-pagina]");
    if (botao && !botao.disabled) {
        mudarPagina(Number(botao.dataset.pagina));
    }
});

window.addEventListener("popstate", () => {
    const estado = lerParametrosUrl();

    modalidadeSelecionada = estado.modalidade;
    preencherBusca(estado.q);
    ordenacao.value = estado.ordem;
    paginaAtual = estado.pagina;

    filtroModalidades.querySelectorAll("button").forEach((item) => {
        const ativo = item.dataset.modalidade === modalidadeSelecionada;
        item.classList.toggle("border-bot", ativo);
        item.setAttribute("aria-pressed", String(ativo));
    });

    aplicarBusca(true);
});

async function iniciarCatalogo() {
    status.textContent = "Carregando produtos...";
    lista.setAttribute("aria-busy", "true");

    try {
        todosProdutos = await listarProdutos();
        const modalidades = await listarModalidades();

        const estado = lerParametrosUrl();
        modalidadeSelecionada = estado.modalidade;
        paginaAtual = estado.pagina;

        preencherBusca(estado.q);
        ordenacao.value = estado.ordem;
        ordenacao.disabled = false;

        renderizarModalidades(modalidades);
        aplicarBusca(true);
    } catch (erro) {
        status.textContent =
            "Não foi possível carregar os produtos. Tente novamente.";
        console.error("Erro ao carregar catálogo:", erro);
    } finally {
        lista.setAttribute("aria-busy", "false");
    }
}

iniciarCatalogo();