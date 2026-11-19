/**
 * HTML das seções do painel de filtros do catálogo, a partir de `extrairFiltros()`.
 * Cada opção é um checkbox cujo `name` é o parâmetro da URL e `data-rotulo` é o
 * texto do chip em "Filtros ativos".
 */

/** Listas com mais opções que isto mostram as primeiras e um "Ver mais". */
const OPCOES_VISIVEIS = 5;

export function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function secao(titulo, conteudo) {
  return `<details class="secao-filtro" open>
    <summary><span>${titulo}</span><i class="bi bi-chevron-up" aria-hidden="true"></i></summary>
    <div class="secao-filtro-conteudo">${conteudo}</div>
  </details>`;
}

function checkbox(nome, { valor, rotulo, quantidade }) {
  return `<label class="opcao-filtro">
    <input class="form-check-input m-0" type="checkbox" name="${nome}" value="${escapar(valor)}" data-rotulo="${escapar(rotulo)}" />
    <span class="opcao-filtro-rotulo">${escapar(rotulo)}</span>
    <span class="opcao-filtro-quantidade">(${quantidade})</span>
  </label>`;
}

function listaCheckboxes(nome, itens) {
  const lista = (parte) =>
    `<div class="lista-opcoes">${parte.map((item) => checkbox(nome, item)).join("")}</div>`;
  const extras = itens.slice(OPCOES_VISIVEIS);

  return (
    lista(itens.slice(0, OPCOES_VISIVEIS)) +
    (extras.length
      ? `<details class="ver-mais"><summary>Ver mais (${extras.length})</summary>${lista(extras)}</details>`
      : "")
  );
}

/** Checkbox escondido (`.btn-check`) com um label estilizado no lugar. */
function botaoMarcavel(nome, indice, valor, rotulo, atributosLabel, conteudo = "") {
  const id = `filtro-${nome}-${indice}`;
  return `<div>
    <input class="btn-check" type="checkbox" id="${id}" name="${nome}" value="${escapar(valor)}" data-rotulo="${escapar(rotulo)}" />
    <label for="${id}" ${atributosLabel}>${conteudo}</label>
  </div>`;
}

function gradeTamanhos(itens) {
  const botoes = itens.map(({ valor, quantidade }, i) =>
    botaoMarcavel("tamanho", i, valor, `Tamanho ${valor}`,
      `class="btn botao-tamanho" title="${quantidade} produto(s)"`, escapar(valor)),
  );
  return `<div class="grade-tamanhos">${botoes.join("")}</div>`;
}

function amostrasCores(itens) {
  const botoes = itens.map(({ valor, hex, quantidade }, i) => {
    const titulo = escapar(`${valor} (${quantidade})`);
    return botaoMarcavel("cor", i, valor, valor,
      `class="amostra-cor-filtro" title="${titulo}" aria-label="${titulo}" style="--cor-amostra: ${hex ?? "transparent"}"`);
  });
  return `<div class="amostras-cores">${botoes.join("")}</div>`;
}

function camposPreco({ faixas }) {
  const campo = (nome, rotulo, placeholder) =>
    `<input type="number" min="0" step="0.01" class="form-control campo-preco" name="${nome}"
      placeholder="${placeholder}" aria-label="${rotulo}" />`;

  return `<div class="lista-opcoes">${faixas.map((f) => checkbox("faixa", f)).join("")}</div>
    <div class="d-flex align-items-center gap-2 mt-3">
      ${campo("pmin", "Preço mínimo", "Mín")}
      <span aria-hidden="true">-</span>
      ${campo("pmax", "Preço máximo", "Máx")}
      <button type="submit" class="btn botao-ok">OK</button>
    </div>`;
}

/** @param {ReturnType<import("../servicos/catalogo.js").extrairFiltros>} opcoes */
export function renderizarSecoesFiltros(opcoes) {
  return [
    opcoes.categorias.length && secao("Categoria", listaCheckboxes("categoria", opcoes.categorias)),
    opcoes.generos.length && secao("Gênero", listaCheckboxes("genero", opcoes.generos)),
    opcoes.tamanhos.length && secao("Tamanho", gradeTamanhos(opcoes.tamanhos)),
    secao("Preço (R$)", camposPreco(opcoes.precos)),
    opcoes.marcas.length && secao("Marca", listaCheckboxes("marca", opcoes.marcas)),
    opcoes.cores.length && secao("Cor", amostrasCores(opcoes.cores)),
  ]
    .filter(Boolean)
    .join("");
}
