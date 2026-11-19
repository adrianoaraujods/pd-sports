import clienteHttp, { ErroApi } from "../api/cliente-http.js";
import { CONFIG } from "../api/config.js";
import { carregarCatalogo } from "./catalogo.js";

const arredondar = (valor) => Number(valor.toFixed(2));

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
 * @param {{ modalidades: object[], usuarios: object[], carrinhos: object[] }} dados
 * @param {{ limiteMaisVendidos?: number }} [opcoes]
 * @returns {{
 *   totalProdutos: number,
 *   totalDestaques: number,
 *   totalUsuarios: number,
 *   totalClientes: number,
 *   totalCarrinhos: number,
 *   carrinhosEmAberto: number,
 *   valorEmCarrinhos: number,
 *   porModalidade: { id: string, nome: string, totalProdutos: number, precoMedio: number, totalDestaques: number, itensEmCarrinhos: number }[],
 *   maisVendidos: { produto: object, quantidade: number }[],
 * }}
 */
export function calcularMetricas(
  { modalidades = [], usuarios = [], carrinhos = [] },
  { limiteMaisVendidos = 5 } = {},
) {
  const produtosPorId = new Map();
  for (const modalidade of modalidades) {
    for (const produto of modalidade.produtos ?? []) {
      produtosPorId.set(produto.id, {
        ...produto,
        modalidade_id: modalidade.id,
        modalidade_nome: modalidade.nome,
      });
    }
  }
  const produtos = [...produtosPorId.values()];

  // Quantidade de cada Produto somada entre todos os Carrinhos (e Variantes).
  const quantidadePorProduto = new Map();
  let valorEmCarrinhos = 0;
  let carrinhosEmAberto = 0;

  for (const carrinho of carrinhos) {
    const itens = (carrinho.itens ?? []).filter((item) => quantidade(item) > 0);
    if (itens.length > 0) carrinhosEmAberto++;

    for (const item of itens) {
      const produto = produtosPorId.get(item.produto_id);
      if (!produto) continue; // Produto excluído do catálogo: ignorado nas métricas.

      const qtd = quantidade(item);
      quantidadePorProduto.set(
        produto.id,
        (quantidadePorProduto.get(produto.id) ?? 0) + qtd,
      );
      valorEmCarrinhos += (Number(produto.preco) || 0) * qtd;
    }
  }

  const porModalidade = modalidades.map((modalidade) => {
    const lista = modalidade.produtos ?? [];
    const somaPrecos = lista.reduce(
      (soma, p) => soma + (Number(p.preco) || 0),
      0,
    );

    return {
      id: modalidade.id,
      nome: modalidade.nome,
      totalProdutos: lista.length,
      precoMedio: lista.length ? arredondar(somaPrecos / lista.length) : 0,
      totalDestaques: lista.filter((p) => p.destaque === true).length,
      itensEmCarrinhos: lista.reduce(
        (soma, p) => soma + (quantidadePorProduto.get(p.id) ?? 0),
        0,
      ),
    };
  });

  const maisVendidos = [...quantidadePorProduto]
    .map(([id, qtd]) => ({ produto: produtosPorId.get(id), quantidade: qtd }))
    .sort(
      (a, b) =>
        b.quantidade - a.quantidade ||
        a.produto.nome.localeCompare(b.produto.nome),
    )
    .slice(0, limiteMaisVendidos);

  return {
    totalProdutos: produtos.length,
    totalDestaques: produtos.filter((p) => p.destaque === true).length,
    totalUsuarios: usuarios.length,
    totalClientes: usuarios.filter((u) => u.papel === "cliente").length,
    totalCarrinhos: carrinhos.length,
    carrinhosEmAberto,
    valorEmCarrinhos: arredondar(valorEmCarrinhos),
    porModalidade,
    maisVendidos,
  };
}

/**
 * Busca Modalidades, Usuários e Carrinhos na MockAPI e calcula as métricas.
 * O catálogo é sempre recarregado para refletir o CRUD recente de Produtos.
 * @param {{ limiteMaisVendidos?: number }} [opcoes]
 * @returns {Promise<ReturnType<typeof calcularMetricas>>}
 * @throws {ErroApi} se qualquer uma das requisições falhar.
 */
export async function carregarMetricas(opcoes) {
  try {
    const [{ modalidades }, usuarios, carrinhos] = await Promise.all([
      carregarCatalogo({ forcar: true }),
      clienteHttp.get(CONFIG.API_MOCK.USUARIOS),
      clienteHttp.get(CONFIG.API_MOCK.CARRINHOS),
    ]);

    return calcularMetricas(
      {
        modalidades,
        usuarios: exigirLista(usuarios, "os usuários"),
        carrinhos: exigirLista(carrinhos, "os carrinhos"),
      },
      opcoes,
    );
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
