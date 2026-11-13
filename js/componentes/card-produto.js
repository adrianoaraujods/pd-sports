const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

export function criarCard(produto) {
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
                <a href="" class="btn btn-primary">Ver detalhes <i class="bi bi-arrow-right-short fs-5 align-middle" aria-hidden="true"></i></a>
            </div>
        </article>
  `;

    const imagem = coluna.querySelector("img");
    imagem.src = produto.imagem;
    imagem.alt = produto.nome;

    coluna.querySelector(".product-name").textContent = produto.nome;
    coluna.querySelector(".product-price").textContent =
        moeda.format(produto.preco);

    const link = coluna.querySelector("a");
    link.href = `/paginas/detalhes-produto.html?id=${encodeURIComponent(produto.id)}`;

    return coluna;
}

