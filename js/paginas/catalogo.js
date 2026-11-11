import { listarProdutos, listarModalidades } from "../servicos/catalogo.js";

let todosProdutos = [];
const camposBusca = document.querySelectorAll('input[name="q"]');

let modalidadeSelecionada = "";
const filtroModalidades = document.querySelector("#filtro-modalidades");

const lista = document.querySelector("#lista-produtos");
const status = document.querySelector("#status-produtos");

const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

function criarCard(produto) {
    const coluna = document.createElement("div");
    coluna.className = "col";

    coluna.innerHTML = `
    <article class="card product-card d-flex justify-content-between">
            <figure>
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
                    alt="Imagem do produto">
            </figure>
            <div class="card-bottom">
                <p class="product-name">Nome do produto</p>
                <p class="product-price">R$ 99,90</p>
                <a href="" class="btn btn-primary">Ver detalhes <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-arrow-right-short" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
</svg></a>
            </div>
        </article>
  `;

    const imagem = coluna.querySelector("img");
    imagem.src = produto.imagem;
    imagem.alt = produto.nome;

    coluna.querySelector(".product-name").textContent = produto.nome;
    coluna.querySelector(".product-price").textContent =
        moeda.format(produto.preco);

    return coluna;
}

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

iniciarCatalogo();