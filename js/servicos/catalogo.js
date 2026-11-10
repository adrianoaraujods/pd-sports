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
