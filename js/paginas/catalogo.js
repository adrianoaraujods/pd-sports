import { criarCard } from "../componentes/card-produto.js";
import {
  renderizarSecoesFiltros,
  escapar,
} from "../componentes/painel-filtros.js";
import {
  listarProdutos,
  listarModalidades,
  extrairFiltros,
  filtrarProdutos,
} from "../servicos/catalogo.js";

export const ITENS_POR_PAGINA = 12;

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

let todosProdutos = [];
let modalidadeDoPainel = null; // modalidade para a qual o painel foi montado

const filtroModalidades = document.querySelector("#filtro-modalidades");
const chipsCategorias = document.querySelector("#chips-categorias");
const formFiltros = document.querySelector("#form-filtros");
const painelFiltros = document.querySelector("#painel-filtros");
const contadorFiltros = document.querySelector("#contador-filtros");
const filtrosAtivos = document.querySelector("#filtros-ativos");
const listaFiltrosAtivos = document.querySelector("#lista-filtros-ativos");
const lista = document.querySelector("#lista-produtos");
const status = document.querySelector("#status-produtos");
const ordenacao = document.querySelector("#ordenacao");
const navPaginacao = document.querySelector("#paginacao");

function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// ---------- Busca ----------

const camposBusca = () => document.querySelectorAll('input[name="q"]');

function obterBusca() {
  return camposBusca()[0]?.value ?? "";
}

function preencherBusca(termo) {
  camposBusca().forEach((campo) => (campo.value = termo));
}

function definirBuscaHabilitada(habilitada) {
  camposBusca().forEach((campo) => (campo.disabled = !habilitada));
}

// ---------- Estado ----------

/** Grava o estado da página na URL e renderiza. Mudar qualquer filtro volta à página 1. */
function salvarEstado({ modalidade, pagina = 1, substituir = false } = {}) {
  const atual = new URLSearchParams(location.search);
  const params = new URLSearchParams();

  modalidade ??= atual.get("modalidade") ?? "";
  if (modalidade) params.set("modalidade", modalidade);
  for (const [nome, valor] of new FormData(formFiltros)) {
    if (valor) params.append(nome, valor);
  }
  if (obterBusca().trim()) params.set("q", obterBusca().trim());
  if (ordenacao.value) params.set("ordem", ordenacao.value);
  if (pagina > 1) params.set("pagina", String(pagina));

  const url = params.toString() ? `?${params}` : location.pathname;
  const repetida = params.toString() === atual.toString(); // ex.: "change" + "submit" do OK
  history[substituir || repetida ? "replaceState" : "pushState"](null, "", url);
  renderizar();
}

/** Marca no formulário os filtros da URL (os que não existirem no painel são descartados). */
function preencherFormulario(params) {
  for (const campo of formFiltros.elements) {
    if (campo.type === "checkbox")
      campo.checked = params.getAll(campo.name).includes(campo.value);
    else if (campo.name) campo.value = params.get(campo.name) ?? "";
  }
  formFiltros
    .querySelectorAll(".ver-mais:has(:checked)")
    .forEach((d) => (d.open = true));
}

function filtrosDoFormulario(modalidade) {
  const dados = new FormData(formFiltros);
  const preco = (nome) => (dados.get(nome) ? Number(dados.get(nome)) : null);
  return {
    modalidade,
    categorias: dados.getAll("categoria"),
    generos: dados.getAll("genero"),
    tamanhos: dados.getAll("tamanho"),
    faixas: dados.getAll("faixa"),
    marcas: dados.getAll("marca"),
    cores: dados.getAll("cor"),
    precoMin: preco("pmin"),
    precoMax: preco("pmax"),
  };
}

/** Converte o valor da URL (id ou nome da modalidade) no id correspondente. */
function resolverModalidade(valor, modalidades) {
  if (!valor) return "";
  const alvo = normalizarTexto(valor);
  const encontrada = modalidades.find(
    (m) =>
      String(m.id) === valor ||
      normalizarTexto(m.nome) === alvo ||
      normalizarTexto(m.nome).includes(alvo),
  );
  return encontrada ? String(encontrada.id) : valor;
}

// ---------- Renderização ----------

/** Restaura busca, ordem e filtros a partir da URL (início e voltar/avançar). */
function restaurarDaUrl() {
  const params = new URLSearchParams(location.search);
  preencherBusca(params.get("q") ?? "");
  ordenacao.value = params.get("ordem") ?? "";
  modalidadeDoPainel = null; // força remontar e preencher o painel
  renderizar();
}

function renderizar() {
  const params = new URLSearchParams(location.search);
  const modalidade = params.get("modalidade") ?? "";

  if (modalidade !== modalidadeDoPainel) {
    montarPainel(modalidade);
    preencherFormulario(params);
  }

  const termo = normalizarTexto(obterBusca());
  const encontrados = filtrarProdutos(
    todosProdutos,
    filtrosDoFormulario(modalidade),
  ).filter((produto) => normalizarTexto(produto.nome).includes(termo));
  if (ordenacao.value === "menor-preco")
    encontrados.sort((a, b) => a.preco - b.preco);
  if (ordenacao.value === "maior-preco")
    encontrados.sort((a, b) => b.preco - a.preco);

  const totalPaginas = Math.ceil(encontrados.length / ITENS_POR_PAGINA) || 1;
  const pagina = Math.min(
    Math.max(1, Number(params.get("pagina")) || 1),
    totalPaginas,
  );
  const inicio = (pagina - 1) * ITENS_POR_PAGINA;

  lista.replaceChildren(
    ...encontrados.slice(inicio, inicio + ITENS_POR_PAGINA).map(criarCard),
  );
  status.textContent =
    encontrados.length === 0 ? "Nenhum produto encontrado." : "";
  renderizarPaginacao(pagina, totalPaginas);
  marcarAtivos(
    filtroModalidades,
    "border-bot",
    (botao) => botao.dataset.modalidade === modalidade,
  );
  marcarAtivos(chipsCategorias, "ativo", categoriaAtiva);
  renderizarFiltrosAtivos();
}

/** Monta as seções do painel e os chips de categoria com as opções da modalidade. */
function montarPainel(modalidade) {
  const produtos = filtrarProdutos(todosProdutos, { modalidade });
  const opcoes = extrairFiltros(produtos);

  document.querySelector("#secoes-filtros").innerHTML =
    renderizarSecoesFiltros(opcoes);
  chipsCategorias.innerHTML = [
    { valor: "", rotulo: "Todos" },
    ...opcoes.categorias,
  ]
    .map(
      ({ valor, rotulo, quantidade }) =>
        `<button type="button" class="chip-categoria" data-categoria="${escapar(valor)}">
          ${escapar(rotulo)}${quantidade ? ` (${quantidade})` : ""}
        </button>`,
    )
    .join("");
  modalidadeDoPainel = modalidade;
}

/** Liga a `classe` e `aria-pressed` nos botões do container que estão ativos. */
function marcarAtivos(container, classe, estaAtivo) {
  container.querySelectorAll("button").forEach((botao) => {
    const ativo = estaAtivo(botao);
    botao.classList.toggle(classe, ativo);
    botao.setAttribute("aria-pressed", String(ativo));
  });
}

function checkboxesDeCategoria() {
  return [...formFiltros.querySelectorAll('input[name="categoria"]')];
}

function categoriaAtiva(botao) {
  const marcadas = checkboxesDeCategoria().filter((c) => c.checked);
  const valor = botao.dataset.categoria;
  return valor
    ? marcadas.some((c) => c.value === valor)
    : marcadas.length === 0;
}

function rotuloPreco(min, max) {
  if (min && max) return `${moeda.format(min)} - ${moeda.format(max)}`;
  return min ? `A partir de ${moeda.format(min)}` : `Até ${moeda.format(max)}`;
}

/** Um chip por filtro marcado no formulário; clicar no chip desmarca o filtro. */
function renderizarFiltrosAtivos() {
  const { pmin, pmax } = formFiltros.elements;
  const ativos = [...formFiltros.querySelectorAll("input:checked")].map(
    (campo) => ({
      rotulo: campo.dataset.rotulo,
      remover: () => (campo.checked = false),
    }),
  );
  if (pmin.value || pmax.value) {
    ativos.push({
      rotulo: rotuloPreco(pmin.value, pmax.value),
      remover: () => (pmin.value = pmax.value = ""),
    });
  }

  listaFiltrosAtivos.replaceChildren(
    ...ativos.map(({ rotulo, remover }) => {
      const item = document.createElement("li");
      item.innerHTML = `<button type="button" class="chip-filtro-ativo" aria-label="Remover filtro ${escapar(rotulo)}">
        ${escapar(rotulo)} <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>`;
      item.firstElementChild.addEventListener("click", () => {
        remover();
        salvarEstado();
      });
      return item;
    }),
  );

  filtrosAtivos.hidden = contadorFiltros.hidden = ativos.length === 0;
  contadorFiltros.textContent = String(ativos.length);
}

// ---------- Paginação ----------

/**
 * Retorna os itens da paginação: a primeira página, a atual com uma vizinha
 * de cada lado e a última. Nas pontas, a janela mantém três páginas.
 * Ex.: atual 1 de 12  → [1, 2, 3, "...", 12]
 *      atual 6 de 12  → [1, "...", 5, 6, 7, "...", 12]
 *      atual 12 de 12 → [1, "...", 10, 11, 12]
 */
function calcularPaginasVisiveis(atual, total) {
  let inicio = Math.max(2, Math.min(atual - 1, total - 2));
  let fim = Math.min(total - 1, Math.max(atual + 1, 3));

  if (inicio === 3) inicio = 2;
  if (fim === total - 2) fim = total - 1;

  const resultado = [1];
  if (inicio > 2) resultado.push("...");
  for (let p = inicio; p <= fim; p++) resultado.push(p);
  if (fim < total - 1) resultado.push("...");
  if (total > 1) resultado.push(total);
  return resultado;
}

function renderizarPaginacao(atual, total) {
  const item = (pagina, texto, { desabilitado = false, ativo = false } = {}) =>
    `<li class="page-item ${desabilitado ? "disabled" : ""} ${ativo ? "active" : ""}">
      <button class="page-link" data-pagina="${pagina}" ${desabilitado ? "disabled" : ""} ${ativo ? 'aria-current="page"' : ""}>${texto}</button>
    </li>`;
  const reticencias = `<li class="page-item disabled" aria-hidden="true"><span class="page-link">…</span></li>`;

  const itens = [
    item(atual - 1, "Anterior", { desabilitado: atual <= 1 }),
    ...calcularPaginasVisiveis(atual, total).map((p) =>
      p === "..." ? reticencias : item(p, p, { ativo: p === atual }),
    ),
    item(atual + 1, "Próximo", { desabilitado: atual >= total }),
  ];

  navPaginacao.innerHTML =
    total > 1
      ? `<ul class="pagination flex-wrap justify-content-center gap-1 mb-0">${itens.join("")}</ul>`
      : "";
}

// ---------- Eventos ----------

filtroModalidades.addEventListener("click", (evento) => {
  const botao = evento.target.closest("button[data-modalidade]");
  if (botao) salvarEstado({ modalidade: botao.dataset.modalidade });
});

chipsCategorias.addEventListener("click", (evento) => {
  const valor = evento.target.closest("button[data-categoria]")?.dataset
    .categoria;
  if (valor === undefined) return;
  for (const campo of checkboxesDeCategoria()) {
    if (!valor)
      campo.checked = false; // "Todos"
    else if (campo.value === valor) campo.checked = !campo.checked;
  }
  salvarEstado();
});

formFiltros.addEventListener("change", () => salvarEstado());

formFiltros.addEventListener("submit", (evento) => {
  evento.preventDefault();
  salvarEstado();
  bootstrap.Offcanvas.getInstance(painelFiltros)?.hide();
});

for (const seletor of ["#limpar-filtros", "#redefinir-filtros"]) {
  document.querySelector(seletor).addEventListener("click", () => {
    formFiltros.reset();
    salvarEstado();
  });
}

document.addEventListener("input", (evento) => {
  if (!evento.target.matches('input[name="q"]')) return;
  preencherBusca(evento.target.value); // mantém as buscas do desktop e do celular iguais
  salvarEstado({ substituir: true });
});

document.addEventListener("submit", (evento) => {
  if (!evento.target.querySelector('input[name="q"]')) return;
  evento.preventDefault();
  salvarEstado();
});

ordenacao.addEventListener("change", () => salvarEstado());

navPaginacao.addEventListener("click", (evento) => {
  const botao = evento.target.closest("button[data-pagina]");
  if (!botao || botao.disabled) return;
  salvarEstado({ pagina: Number(botao.dataset.pagina) });
  lista.scrollIntoView({ behavior: "smooth" });
});

window.addEventListener("popstate", restaurarDaUrl);

// ---------- Início ----------

async function iniciarCatalogo() {
  definirBuscaHabilitada(false);
  status.textContent = "Carregando produtos...";
  lista.setAttribute("aria-busy", "true");

  try {
    todosProdutos = await listarProdutos();
    const modalidades = await listarModalidades();

    filtroModalidades.innerHTML = [{ id: "", nome: "Todas" }, ...modalidades]
      .map(
        (m) =>
          `<button type="button" class="btn flex-shrink-0" data-modalidade="${escapar(m.id)}">${escapar(m.nome)}</button>`,
      )
      .join("");

    // Aceita ?modalidade=<id> ou ?modalidade=<nome> (ex.: links da home) e normaliza para o id
    const params = new URLSearchParams(location.search);
    const modalidade = resolverModalidade(params.get("modalidade"), modalidades);
    if (modalidade !== (params.get("modalidade") ?? "")) {
      params.set("modalidade", modalidade);
      history.replaceState(null, "", `?${params}`);
    }

    restaurarDaUrl();
    filtroModalidades
      .querySelector('button[aria-pressed="true"]:not([data-modalidade=""])')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
    definirBuscaHabilitada(true);
    ordenacao.disabled = false;
  } catch (erro) {
    status.textContent =
      "Não foi possível carregar os produtos. Tente novamente.";
    console.error("Erro ao carregar catálogo:", erro);
  } finally {
    lista.setAttribute("aria-busy", "false");
  }
}

iniciarCatalogo();
