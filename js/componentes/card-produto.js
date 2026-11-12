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

    const link = coluna.querySelector("a");
    link.href = `/paginas/detalhes-produto.html?id=${encodeURIComponent(produto.id)}`;

    return coluna;
}

