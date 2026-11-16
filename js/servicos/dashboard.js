import clienteHttp, { ErroApi } from "../api/cliente-http.js";
import { CONFIG } from "../api/config.js";
import { carregarCatalogo } from "./catalogo.js";

const quantidade = (item) => Math.max(0, Number(item?.quantidade) || 0);

/** Garante que a resposta da API seja uma lista. */
function exigirLista(registros, entidade) {
  if (!Array.isArray(registros)) {
    throw new ErroApi(
      `Resposta inesperada da API ao carregar ${entidade}.`,
      0,
      registros,
    );
  }
  return registros;
}

/**
 * Calcula as métricas do dashboard (função pura, sem acesso à rede).
 * @param {{ produtos: object[], usuarios: object[], carrinhos: object[] }} dados
 * @returns {{
 *   totalProdutos: number,
 *   totalDestaques: number,
 *   totalUsuarios: number,
 *   carrinhosEmAberto: number,
 *   valorEmCarrinhos: number,
 * }}
 */
export function calcularMetricas({ produtos = [], usuarios = [], carrinhos = [] }) {
  const precoPorProduto = new Map(
    produtos.map((p) => [p.id, Number(p.preco) || 0]),
  );

  let valorEmCarrinhos = 0;
  let carrinhosEmAberto = 0;

  for (const carrinho of carrinhos) {
    const itens = (carrinho.itens ?? []).filter((item) => quantidade(item) > 0);
    if (itens.length > 0) carrinhosEmAberto++;

    for (const item of itens) {
      // Produto excluído do catálogo: ignorado no valor.
      if (!precoPorProduto.has(item.produto_id)) continue;
      valorEmCarrinhos += precoPorProduto.get(item.produto_id) * quantidade(item);
    }
  }

  return {
    totalProdutos: produtos.length,
    totalDestaques: produtos.filter((p) => p.destaque === true).length,
    totalUsuarios: usuarios.length,
    carrinhosEmAberto,
    valorEmCarrinhos: Number(valorEmCarrinhos.toFixed(2)),
  };
}

/**
 * Busca Produtos, Usuários e Carrinhos na MockAPI (em paralelo) e calcula as métricas.
 * O catálogo é sempre recarregado para refletir o CRUD recente de Produtos.
 * @returns {Promise<ReturnType<typeof calcularMetricas>>}
 * @throws {ErroApi} se qualquer uma das requisições falhar.
 */
export async function carregarMetricas() {
  try {
    const [{ produtos }, usuarios, carrinhos] = await Promise.all([
      carregarCatalogo({ forcar: true }),
      clienteHttp.get(CONFIG.API_MOCK.USUARIOS),
      clienteHttp.get(CONFIG.API_MOCK.CARRINHOS),
    ]);

    return calcularMetricas({
      produtos,
      usuarios: exigirLista(usuarios, "os usuários"),
      carrinhos: exigirLista(carrinhos, "os carrinhos"),
    });
  } catch (erro) {
    if (erro instanceof ErroApi) {
      throw new ErroApi(
        `Não foi possível carregar o dashboard: ${erro.message}`,
        erro.status,
        erro.detalhes,
      );
    }
    throw new ErroApi("Não foi possível carregar o dashboard.", 0, erro);
  }
}
