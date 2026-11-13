import { criarCard } from "../componentes/card-produto.js";
import { listarProdutos, listarModalidades } from "../servicos/catalogo.js";

let todosProdutos = [];
const camposBusca = document.querySelectorAll('input[name="q"]');

let modalidadeSelecionada = "";
const filtroModalidades = document.querySelector("#filtro-modalidades");

const lista = document.querySelector("#lista-produtos");
const status = document.querySelector("#status-produtos");

const ordenacao = document.querySelector("#ordenacao");

function renderizarProdutos(produtos) {
    const fragmento = document.createDocumentFragment();////////////!!!!!!!!!!///////////

    for (const produto of produtos) {
        fragmento.appendChild(criarCard(produto));
    }

    lista.replaceChildren(fragmento);
}

async function iniciarCatalogo() {

    camposBusca.forEach((campo) => {
        campo.disabled = true;////////////!!!!!!!!!!///////////
    });

    status.textContent = "Carregando produtos...";
    lista.setAttribute("aria-busy", "true");

    try {
        todosProdutos = await listarProdutos();
        const modalidades = await listarModalidades();

        renderizarModalidades(modalidades);

        camposBusca.forEach((campo) => {
            campo.disabled = false;
        });

        ordenacao.disabled = false;

        aplicarBusca();
    } catch (erro) {
        status.textContent =
            "Não foi possível carregar os produtos. Tente novamente.";
        console.error("Erro ao carregar catálogo:", erro);
    } finally {
        lista.setAttribute("aria-busy", "false");
    }
}

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}




function aplicarBusca() {
    const termo = normalizarTexto(camposBusca[0]?.value ?? "");

    const encontrados = todosProdutos.filter((produto) => {
        const correspondeAoNome =
            normalizarTexto(produto.nome).includes(termo);

        const correspondeAModalidade =
            modalidadeSelecionada === "" ||
            String(produto.modalidade_id) === modalidadeSelecionada;////////////!!!!!!!!!!///////////

        return correspondeAoNome && correspondeAModalidade;
    });

    if (ordenacao.value === "menor-preco") {
        encontrados.sort((a, b) => a.preco - b.preco);
    } else if (ordenacao.value === "maior-preco") {
        encontrados.sort((a, b) => b.preco - a.preco);
    }

    renderizarProdutos(encontrados);

    status.textContent = encontrados.length === 0
        ? "Nenhum produto encontrado."
        : "";
}



camposBusca.forEach((campo) => {
    campo.addEventListener("input", () => {
        // Mantém os campos de desktop e celular com o mesmo texto.
        camposBusca.forEach((outroCampo) => {
            outroCampo.value = campo.value;
        });

        aplicarBusca();
    });

    // Evita recarregar a página ao apertar Enter ou clicar em Buscar.
    campo.form?.addEventListener("submit", (evento) => {
        evento.preventDefault();
        aplicarBusca();
    });
});






function renderizarModalidades(modalidades) {
    filtroModalidades.replaceChildren();

    const opcoes = [
        { id: "", nome: "Todas" },
        ...modalidades,
    ];

    for (const modalidade of opcoes) {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.textContent = modalidade.nome;
        botao.dataset.modalidade = String(modalidade.id);
        botao.className = "btn flex-shrink-0";

        const selecionado =
            botao.dataset.modalidade === modalidadeSelecionada;

        // botao.classList.toggle("active", selecionado);
        botao.classList.toggle("border-bot", selecionado);
        botao.setAttribute("aria-pressed", String(selecionado));

        botao.addEventListener("click", () => {
            modalidadeSelecionada = botao.dataset.modalidade;

            filtroModalidades.querySelectorAll("button").forEach((item) => {
                const ativo =
                    item.dataset.modalidade === modalidadeSelecionada;

                // item.classList.toggle("active", ativo);
                item.classList.toggle("border-bot", ativo);
                item.setAttribute("aria-pressed", String(ativo));
            });

            aplicarBusca();
        });

        filtroModalidades.appendChild(botao);
    }
}
ordenacao.addEventListener("change", aplicarBusca);
iniciarCatalogo();