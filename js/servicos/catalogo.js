/**
 * Serviço de catálogo.
 * Carrega as Modalidades da MockAPI (com Produtos embutidos, ver ADR 0001),
 * monta uma lista única de Produtos e mantém tudo em cache em memória.
 * Filtro, busca, ordenação e paginação são feitos por quem consome a lista.
 */

import clienteHttp, { ErroApi } from "../api/cliente-http.js";
import { CONFIG } from "../api/config.js";

let cache = null; // { modalidades, produtos }
let carregamento = null; // Promise em andamento, evita requisições duplicadas

/**
 * Monta o catálogo a partir das Modalidades cruas da API.
 * Cada Produto da lista única recebe `modalidade_id` e `modalidade_nome`.
 */
function montarCatalogo(registros) {
  if (!Array.isArray(registros)) {
    throw new ErroApi("Resposta inesperada da API ao carregar o catálogo.", 0, registros);
  }

  const modalidades = registros.map((m) => ({ ...m, produtos: m.produtos ?? [] }));
  const produtos = modalidades.flatMap((m) =>
    m.produtos.map((p) => ({ ...p, modalidade_id: m.id, modalidade_nome: m.nome }))
  );

  return { modalidades, produtos };
}

/**
 * Carrega o catálogo (uma única vez; as demais chamadas usam o cache).
 * @param {{ forcar?: boolean }} [opcoes] `forcar: true` ignora o cache e recarrega da API.
 * @returns {Promise<{ modalidades: object[], produtos: object[] }>}
 * @throws {ErroApi} se a API falhar ou responder algo inválido; a falha não é guardada em cache.
 */
export async function carregarCatalogo({ forcar = false } = {}) {
  if (cache && !forcar) return cache;
  if (carregamento && !forcar) return carregamento;

  const requisicao = clienteHttp
    .get(CONFIG.API_MOCK.MODALIDADES)
    .then((registros) => {
      cache = montarCatalogo(registros);
      return cache;
    })
    .finally(() => {
      if (carregamento === requisicao) carregamento = null;
    });

  carregamento = requisicao;
  return requisicao;
}

/** @returns {Promise<object[]>} Modalidades, cada uma com seu array `produtos`. */
export async function listarModalidades() {
  return (await carregarCatalogo()).modalidades;
}

/** @returns {Promise<object[]>} Lista única com todos os Produtos de todas as Modalidades. */
export async function listarProdutos() {
  return (await carregarCatalogo()).produtos;
}

/** @returns {Promise<object|undefined>} Modalidade pelo id da MockAPI. */
export async function buscarModalidadePorId(id) {
  return (await listarModalidades()).find((m) => String(m.id) === String(id));
}

/** @returns {Promise<object|undefined>} Produto pelo seu `id` (ex.: "corrida-1"). */
export async function buscarProdutoPorId(id) {
  return (await listarProdutos()).find((p) => p.id === id);
}

/** Descarta o cache (útil após o CRUD de Produtos na área administrativa). */
export function limparCache() {
  cache = null;
  carregamento = null;
}

// ---------------------------------------------------------------------------
// Filtros do catálogo
// ---------------------------------------------------------------------------

/** Cores aceitas no cadastro de Produto → hexadecimal usado nos seletores. */
export const MAPA_CORES = {
  Amarelo: "#f5c518",
  Azul: "#1f5fbf",
  "Azul Claro": "#7cc4f0",
  "Azul Noturno": "#1b2a4a",
  Bege: "#d9c3a0",
  Bordô: "#6d1a2a",
  Branco: "#ffffff",
  Café: "#4b2e1e",
  Caramelo: "#b5651d",
  Chumbo: "#4a4e54",
  Cinza: "#8a8f96",
  Dourado: "#c9a227",
  Espelhado: "#c0c8d0",
  Grafite: "#3b3f45",
  Laranja: "#f2711c",
  Marinho: "#1a2a5a",
  Marrom: "#6b3f1f",
  Pink: "#ff3d9a",
  Prata: "#c0c0c0",
  Preto: "#111111",
  Rosa: "#f4a6c1",
  Roxo: "#6a2fd6",
  Verde: "#2e9e4f",
  Vermelho: "#d62828",
};

/** Valores aceitos em `Produto.genero` → rótulo exibido. */
export const GENEROS = { masc: "Masculino", fem: "Feminino", unissex: "Unissex" };

/** Separador das cores em `Produto.cor` ("Preto/Branco"). */
export const SEPARADOR_CORES = "/";

/** Ordem dos tamanhos em letra; tamanhos numéricos vêm antes, em ordem crescente. */
const ORDEM_TAMANHOS_LETRA = ["PP", "P", "M", "G", "GG", "XG"];

/** Faixas de preço fixas da sidebar (`max` exclusivo). */
const FAIXAS_PRECO = [
  { valor: "ate-200", rotulo: "Até R$ 199,99", min: 0, max: 200 },
  { valor: "200-400", rotulo: "R$ 200,00 - R$ 399,99", min: 200, max: 400 },
  { valor: "400-700", rotulo: "R$ 400,00 - R$ 699,99", min: 400, max: 700 },
  { valor: "acima-700", rotulo: "Acima de R$ 700,00", min: 700, max: Infinity },
];

function compararTamanhos(a, b) {
  const numA = /^\d+([.,]\d+)?$/.test(a);
  const numB = /^\d+([.,]\d+)?$/.test(b);
  if (numA && numB) return parseFloat(a) - parseFloat(b);
  if (numA !== numB) return numA ? -1 : 1;

  const ia = ORDEM_TAMANHOS_LETRA.indexOf(a.toUpperCase());
  const ib = ORDEM_TAMANHOS_LETRA.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== ib) return ia === -1 ? 1 : -1;
  return a.localeCompare(b, "pt-BR");
}

/**
 * Atributos filtráveis de um Produto, lidos dos seus campos.
 * Reaproveitar esta função ao aplicar os filtros garante a mesma regra da contagem.
 * Toda Variante é um tamanho, exceto "Único" (Produto sem variação).
 */
export function extrairAtributos(produto) {
  const cores = String(produto.cor ?? "")
    .split(SEPARADOR_CORES)
    .map((c) => c.trim())
    .filter(Boolean);
  const tamanhos = (produto.variantes ?? [])
    .map((v) => String(v).trim())
    .filter((v) => v && v !== "Único");

  return {
    modalidade: produto.modalidade_id != null ? String(produto.modalidade_id) : null,
    genero: GENEROS[produto.genero] ? produto.genero : null,
    marca: produto.marca?.trim() || null,
    cores: [...new Set(cores)],
    tamanhos: [...new Set(tamanhos)],
    preco: Number(produto.preco) || 0,
  };
}

function contar(mapa, valor, rotulo, extra) {
  if (valor == null) return;
  const item = mapa.get(valor) ?? { valor, rotulo, ...extra, quantidade: 0 };
  item.quantidade += 1;
  mapa.set(valor, item);
}

/**
 * Monta as opções de filtro da sidebar e quantos Produtos há em cada uma.
 * Cada Produto conta uma vez por opção (um "Preto/Branco" conta em Preto e em Branco).
 * @param {object[]} produtos lista única de Produtos (ver `listarProdutos`)
 * @returns {{
 *   modalidades: { valor: string, rotulo: string, quantidade: number }[],
 *   generos: { valor: string, rotulo: string, quantidade: number }[],
 *   tamanhos: { valor: string, rotulo: string, quantidade: number }[],
 *   precos: { min: number, max: number, faixas: { valor: string, rotulo: string, min: number, max: number, quantidade: number }[] },
 *   marcas: { valor: string, rotulo: string, quantidade: number }[],
 *   cores: { valor: string, rotulo: string, hex: string|null, quantidade: number }[],
 * }}
 */
export function extrairFiltros(produtos) {
  const modalidades = new Map();
  const generos = new Map();
  const tamanhos = new Map();
  const marcas = new Map();
  const cores = new Map();
  const faixas = FAIXAS_PRECO.map((f) => ({ ...f, quantidade: 0 }));
  let precoMin = Infinity;
  let precoMax = -Infinity;

  for (const produto of produtos) {
    const a = extrairAtributos(produto);

    contar(modalidades, a.modalidade, produto.modalidade_nome ?? a.modalidade);
    contar(generos, a.genero, GENEROS[a.genero]);
    contar(marcas, a.marca, a.marca);
    a.tamanhos.forEach((t) => contar(tamanhos, t, t));
    a.cores.forEach((c) => contar(cores, c, c, { hex: MAPA_CORES[c] ?? null }));

    const faixa = faixas.find((f) => a.preco >= f.min && a.preco < f.max);
    if (faixa) faixa.quantidade += 1;
    precoMin = Math.min(precoMin, a.preco);
    precoMax = Math.max(precoMax, a.preco);
  }

  const porRotulo = (x, y) => x.rotulo.localeCompare(y.rotulo, "pt-BR");
  const porQuantidade = (x, y) => y.quantidade - x.quantidade || porRotulo(x, y);

  return {
    modalidades: [...modalidades.values()].sort(porRotulo),
    generos: Object.keys(GENEROS).map((g) => generos.get(g)).filter(Boolean),
    tamanhos: [...tamanhos.values()].sort((x, y) => compararTamanhos(x.valor, y.valor)),
    precos: {
      min: produtos.length ? precoMin : 0,
      max: produtos.length ? precoMax : 0,
      faixas,
    },
    marcas: [...marcas.values()].sort(porQuantidade),
    cores: [...cores.values()].sort(porQuantidade),
  };
}
