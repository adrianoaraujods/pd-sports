/** Interações locais da prévia; não altera o carrinho nem realiza compras. */
import { obterCarrinho, detalharCarrinho, finalizarCompra } from "../servicos/carrinho.js";
import { obterSessao } from "../servicos/sessao.js";
import { calcularFrete } from "../servicos/frete.js";

const formaPagamento = document.querySelector("#forma-pagamento");
let resumoPronto = false;

const lista = document.querySelector("#resumo-itens");
const modelo = document.querySelector("#modelo-item-resumo");
const status = document.querySelector("#status-finalizacao");

const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

function criarItemResumo(item) {
    const linha = modelo.content.firstElementChild.cloneNode(true);
    const produto = item.produto;

    const imagem = linha.querySelector("img");
    imagem.src = produto.imagem || "../assets/imagens/logo.png";
    imagem.alt = produto.nome;

    linha.querySelector("h3").textContent = produto.nome;
    linha.querySelector("p").textContent = item.variante || "Único";

    const informacoes = linha.querySelectorAll("span");
    informacoes[0].textContent = `Qtd: ${item.quantidade}`;
    informacoes[1].textContent = moeda.format(item.subtotal);

    return linha;
}


const modalFinalizar = document.querySelector("#modalFinalizar");
const confirmarCompra = document.querySelector("#confirmar-compra");
const erroFinalizacao = document.querySelector("#erro-finalizacao");
const botoesFechar = modalFinalizar.querySelectorAll(
    '[data-bs-dismiss="modal"]'
);

let finalizando = false;

function atualizarConfirmacao() {
    confirmarCompra.disabled = !resumoPronto || !formaPagamento.value || finalizando;
}

formaPagamento.addEventListener("change", atualizarConfirmacao);

modalFinalizar.addEventListener("show.bs.modal", (evento) => {
    if (!formaPagamento.reportValidity()) {
        evento.preventDefault();
        return;
    }
    atualizarConfirmacao();
    erroFinalizacao.classList.add("d-none");
});

confirmarCompra.addEventListener("click", async () => {
    if (finalizando || !resumoPronto || !formaPagamento.reportValidity()) return;

    const sessao = obterSessao();

    if (!sessao) {
        location.assign(
            "./login.html?redirect=" +
            encodeURIComponent(location.pathname)
        );
        return;
    }

    finalizando = true;
    formaPagamento.disabled = true;
    confirmarCompra.disabled = true;
    confirmarCompra.textContent = "Finalizando...";
    botoesFechar.forEach((botao) => {
        botao.disabled = true;
    });
    erroFinalizacao.classList.add("d-none");

    try {
        await finalizarCompra(sessao.id);
    } catch (erro) {
        erroFinalizacao.textContent =
            erro.message || "Não foi possível finalizar. Tente novamente.";
        erroFinalizacao.classList.remove("d-none");

        finalizando = false;
        formaPagamento.disabled = false;
        atualizarConfirmacao();
        confirmarCompra.textContent = "Confirmar compra";
        botoesFechar.forEach((botao) => {
            botao.disabled = false;
        });
        return;
    }
    confirmarCompra.textContent = "Compra confirmada!";

    setTimeout(() => {
        location.replace("./catalogo.html");
    }, 1500);
});




function lerEnderecoSalvo() {
    try {
        const endereco = JSON.parse(sessionStorage.getItem("pd-sports:frete-endereco"));

        return endereco?.uf ? endereco : null;

    } catch {
        return null;
    }
}




async function carregarResumo() {
    const sessao = obterSessao();

    if (!sessao) {
        location.replace(
            "./login.html?redirect=" +
            encodeURIComponent(location.pathname)
        );
        return;
    }

    status.textContent = "Carregando resumo...";
    lista.replaceChildren();

    try {
        const carrinho = await obterCarrinho(sessao.id);
        const resumo = await detalharCarrinho(carrinho);

        if (resumo.itens.length === 0) {
            status.textContent = "Seu carrinho está vazio.";
            return;
        }

        if (resumo.itens.some((item) => !item.produto)) {
            status.textContent =
                "Há um produto indisponível. Volte ao carrinho para removê-lo.";
            return;
        }

        const fragmento = document.createDocumentFragment();

        for (const item of resumo.itens) {
            fragmento.appendChild(criarItemResumo(item));
        }

        lista.replaceChildren(fragmento);

        document.querySelector("#resumo-subtotal").textContent =
            moeda.format(resumo.valorTotal);

        // Ainda não existe uma entrega definida para esta página.
        const endereco = lerEnderecoSalvo();

        if (!endereco) {
            status.textContent =
                "Volte ao carrinho e calcule o frete antes de finalizar.";
            return;
        }

        const frete = calcularFrete(endereco.uf, resumo.valorTotal);

        document.querySelector("#resumo-frete").textContent =
            frete.gratis ? "Grátis" : moeda.format(frete.valor);

        document.querySelector("#resumo-total").textContent =
            moeda.format(resumo.valorTotal + frete.valor);

        document.querySelector("#resumo-endereco").textContent = [
            endereco.logradouro,
            endereco.bairro,
            endereco.cidade,
            endereco.uf,
            endereco.cep
        ].filter(Boolean).join(", ");

        document.querySelector("#resumo-entrega").textContent =
            `Entrega em até ${frete.prazo} dias úteis`;

        resumoPronto = true;
        atualizarConfirmacao();
        status.textContent = "";
    } catch (erro) {
        status.textContent =
            "Não foi possível carregar o resumo. Recarregue a página para tentar novamente.";
        console.error(erro);
    }
}

carregarResumo();
