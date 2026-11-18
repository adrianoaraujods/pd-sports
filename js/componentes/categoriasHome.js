import { listarModalidades } from "../servicos/catalogo.js";

const lista = document.querySelector("#lista-categorias");
const status = document.querySelector("#status-categorias");

const imagensCategorias = {
    "Corrida": "corrida.avif",
    "Caminhada": "caminhada.jpg",
    "Musculação e Academia": "musculacao.avif",
    "Futebol": "futebol.avif",
    "Futebol Society": "society.jpg",
    "Futsal": "futsal.avif",
    "Vôlei": "volei.avif",
    "Natação": "natacao.avif",
    "Basquete": "basquete.avif",
    "Tênis": "tenis.avif",
    "Beach Tennis": "beach-tennis.avif",
    "Pilates e Yoga": "yoga.jpg",
    "Boxe e Artes Marciais": "lutas.avif",
    "Ciclismo": "ciclismo.avif",
    "Trilha e Camping": "tilha-camping.jpg"
};

function criarCategoria(modalidade) {
    const link = document.createElement("a");

    link.href =
        `./paginas/catalogo.html?modalidade=${encodeURIComponent(modalidade.id)}`;

    link.className =
        "categoria-link text-center text-decoration-none " +
        "text-body flex-shrink-0 d-flex flex-column align-items-center gap-2";

    const circulo = document.createElement("span");
    circulo.className = "categoria-circulo border rounded-circle overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0";

    const imagem = document.createElement("img");
    const arquivoImagem = imagensCategorias[modalidade.nome];
    if (arquivoImagem) {
        imagem.src = `./assets/imagens/categorias/${arquivoImagem}`;
    }
    imagem.className = "w-100 h-100 object-fit-cover";
    imagem.alt = "";
    imagem.loading = "lazy";

    const nome = document.createElement("span");
    nome.className = "w-100 text-wrap text-break lh-sm";
    nome.textContent = modalidade.nome;

    if (arquivoImagem) circulo.appendChild(imagem);
    link.appendChild(circulo);
    link.appendChild(nome);

    return link;
}

async function carregarCategorias() {
    status.textContent = "Carregando categorias...";
    lista.setAttribute("aria-busy", "true");

    try {
        const modalidades = await listarModalidades();
        const fragmento = document.createDocumentFragment();

        for (const modalidade of modalidades) {
            fragmento.appendChild(criarCategoria(modalidade));
        }

        lista.replaceChildren(fragmento);

        atualizarSetas();

        status.textContent = modalidades.length
            ? ""
            : "Nenhuma categoria disponível.";
    } catch (erro) {
        status.textContent = "Não foi possível carregar as categorias.";
        console.error("Erro ao carregar categorias:", erro);
    } finally {
        lista.setAttribute("aria-busy", "false");
    }
}

carregarCategorias();



const anterior = document.querySelector("#categorias-anterior");
const proximo = document.querySelector("#categorias-proximo");

function atualizarSetas() {
    anterior.disabled = lista.scrollLeft <= 1;

    proximo.disabled =
        lista.scrollLeft + lista.clientWidth >= lista.scrollWidth - 1;
}

function rolarCategorias(direcao) {
    const reduzirMovimento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    lista.scrollBy({
        left: direcao * lista.clientWidth * 0.8,
        behavior: reduzirMovimento ? "instant" : "smooth"
    });
}

anterior.addEventListener("click", () => rolarCategorias(-1));
proximo.addEventListener("click", () => rolarCategorias(1));

lista.addEventListener("scroll", atualizarSetas, { passive: true });
window.addEventListener("resize", atualizarSetas);
