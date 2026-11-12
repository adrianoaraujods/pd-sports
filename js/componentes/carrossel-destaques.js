import { listarProdutos } from "../servicos/catalogo.js";
import { criarCard } from "./card-produto.js";

const wrapper = document.querySelector(".cards-wrapper");
const anterior = document.querySelector("#destaques-anterior");
const proximo = document.querySelector("#destaques-proximo");

function moverCards(direcao) {
    const card = wrapper.querySelector(".card");

    if (!card) return;

    const larguraCard = card.offsetWidth;
    const espacamento = parseFloat(getComputedStyle(wrapper).columnGap) || 0;

    wrapper.scrollBy({
        left: (larguraCard + espacamento) * direcao,
        behavior: "smooth"
    });
}

anterior.addEventListener("click", () => moverCards(-1));
proximo.addEventListener("click", () => moverCards(1));






function atualizarBotoes() {
    const posicaoAtual = wrapper.scrollLeft;
    const limite = wrapper.scrollWidth - wrapper.clientWidth;

    anterior.disabled = posicaoAtual <= 1;
    proximo.disabled = posicaoAtual >= limite - 1;
}

wrapper.addEventListener("scroll", atualizarBotoes);
window.addEventListener("resize", atualizarBotoes);

atualizarBotoes();





const status = document.querySelector("#status-destaques");

async function carregarDestaques() {
    status.textContent = "Carregando destaques...";
    wrapper.replaceChildren();
    atualizarBotoes();

    try {
        const produtos = await listarProdutos();
        const destaques = produtos.filter((produto) => produto.destaque === true);

        if(destaques.length === 0) {
            status.textContent = "Nenhum produto em destaque no momento.";
            return;
        }

        const fragmento = document.createDocumentFragment();

        destaques.forEach((produto) => {
            const coluna = criarCard(produto);
            const card = coluna.querySelector(".card");

            card.querySelector("a").href = `./paginas/detalhes-produto.html?id=${encodeURIComponent(produto.id)}`;

            fragmento.appendChild(card);
        });

        wrapper.replaceChildren(fragmento);
        wrapper.scrollLeft = 0;
        status.textContent = "";
    } catch(erro) {
        console.error("Erro ao carregar destaques:", erro);
        status.textContent = "Não foi possível carregar os destaques, Tente novamente mais tarde.";
    } finally {
        atualizarBotoes();
    }
}

carregarDestaques();