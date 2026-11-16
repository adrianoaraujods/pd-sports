/** Interações locais da prévia; não altera o carrinho nem realiza compras. */
import { obterCarrinho, detalharCarrinho, finalizarCompra } from "../servicos/carrinho.js";
import { obterSessao } from "../servicos/sessao.js";

const modal = document.getElementById('modalEditar');
const campo = document.getElementById('valor-editar');
const rotulos = { endereco: 'Endereço de entrega', pagamento: 'Forma de pagamento', entrega: 'Entrega' };

let destino;


modal.addEventListener('show.bs.modal', (evento) => {
    const tipo = evento.relatedTarget.dataset.editar;
    destino = document.getElementById(`resumo-${tipo}`);
    document.getElementById('titulo-editar').textContent = `Editar ${rotulos[tipo].toLowerCase()}`;
    document.getElementById('rotulo-editar').textContent = rotulos[tipo];
    campo.value = destino.textContent;
    campo.setCustomValidity('');
});


modal.addEventListener('shown.bs.modal', () => campo.focus());
campo.addEventListener('input', () => campo.setCustomValidity(''));
document.getElementById('form-editar-resumo').addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!campo.value.trim()) { campo.setCustomValidity('Preencha este campo.'); campo.reportValidity(); return; }
    destino.textContent = campo.value.trim();
    bootstrap.Modal.getInstance(modal).hide();
});



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

modalFinalizar.addEventListener("show.bs.modal", () => {
    erroFinalizacao.classList.add("d-none");
});

confirmarCompra.addEventListener("click", async () => {
    if (finalizando) return;

    const sessao = obterSessao();

    if (!sessao) {
        location.assign(
            "./login.html?redirect=" +
            encodeURIComponent(location.pathname)
        );
        return;
    }

    finalizando = true;
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
        confirmarCompra.disabled = false;
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
        document.querySelector("#resumo-frete").textContent = "A calcular";
        document.querySelector("#resumo-total").textContent = "A calcular";
        document.querySelector("#resumo-endereco").textContent =
            "Endereço ainda não informado.";
        document.querySelector("#resumo-entrega").textContent =
            "Entrega ainda não definida.";

        status.textContent = "";
    } catch (erro) {
        status.textContent =
            "Não foi possível carregar o resumo. Recarregue a página para tentar novamente.";
        console.error(erro);
    }
}

carregarResumo();
