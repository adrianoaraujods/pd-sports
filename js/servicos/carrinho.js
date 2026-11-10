/**
 * Serviço do Carrinho (API e regras)
 * Gerencia o Carrinho do Cliente gravado na MockAPI.
 */

import clienteHttp from "../api/cliente-http.js";
import { CONFIG } from "../api/config.js";
import { buscarProdutoPorId } from "./catalogo.js";

/**
 * Exibe um toast visual do Bootstrap para o usuário.
 * @param {string} mensagem
 * @param {"sucesso" | "erro" | "info"} [tipo="info"]
 */
export function exibirFeedback(mensagem, tipo = "info") {
  if (typeof document === "undefined" || !window.bootstrap) return;

  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    document.body.appendChild(container);
  }

  const bg = tipo === "erro" ? "danger" : tipo === "sucesso" ? "success" : "primary";
  const el = document.createElement("div");
  el.className = `toast align-items-center text-bg-${bg} border-0`;
  el.setAttribute("role", "alert");
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensagem}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  container.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 4000 });
  toast.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

/** Formata a variante garantindo "Único" como padrão. */
const formatarVariante = (variante) => variante?.trim() || "Único";

/**
 * Busca o carrinho do usuário na MockAPI (ou cria um novo se não existir).
 * @param {string|number} usuarioId
 * @returns {Promise<object>} Carrinho { id, usuario_id, itens }
 */
export async function obterCarrinho(usuarioId) {
  const carrinhos = await clienteHttp.get(CONFIG.API_MOCK.CARRINHOS);
  const idStr = String(usuarioId);

  const existente = Array.isArray(carrinhos)
    ? carrinhos.find((c) => String(c.usuario_id) === idStr)
    : null;

  if (existente) {
    return { ...existente, itens: existente.itens ?? [] };
  }

  return await clienteHttp.post(CONFIG.API_MOCK.CARRINHOS, {
    usuario_id: idStr,
    itens: [],
  });
}

/**
 * Persiste as alterações do carrinho na MockAPI.
 * @param {object} carrinho
 */
export async function salvarCarrinho(carrinho) {
  const payload = {
    usuario_id: String(carrinho.usuario_id),
    itens: carrinho.itens ?? [],
  };

  if (carrinho.id) {
    return await clienteHttp.put(`${CONFIG.API_MOCK.CARRINHOS}/${carrinho.id}`, payload);
  }

  return await clienteHttp.post(CONFIG.API_MOCK.CARRINHOS, payload);
}

/**
 * Adiciona um item ao carrinho. Soma a quantidade se a variante for igual.
 * @param {string|number} usuarioId
 * @param {{ produto_id: string, modalidade_id?: string|number, variante?: string, quantidade?: number }} item
 */
export async function adicionarItem(
  usuarioId,
  { produto_id, modalidade_id, variante, quantidade = 1 }
) {
  const varianteFinal = formatarVariante(variante);
  const qtd = Math.max(1, Number(quantidade) || 1);

  let idModalidade = modalidade_id;
  if (!idModalidade) {
    const produto = await buscarProdutoPorId(produto_id);
    idModalidade = produto?.modalidade_id ?? null;
  }

  const carrinho = await obterCarrinho(usuarioId);
  const existente = carrinho.itens.find(
    (i) => i.produto_id === produto_id && i.variante === varianteFinal
  );

  if (existente) {
    existente.quantidade += qtd;
  } else {
    carrinho.itens.push({
      produto_id,
      modalidade_id: idModalidade,
      variante: varianteFinal,
      quantidade: qtd,
    });
  }

  const resultado = await salvarCarrinho(carrinho);
  exibirFeedback("Item adicionado ao carrinho!", "sucesso");
  return resultado;
}

/**
 * Altera a quantidade de um item do carrinho. Se a quantidade for <= 0, remove o item.
 */
export async function alterarQuantidadeItem(
  usuarioId,
  produto_id,
  variante,
  novaQuantidade
) {
  const varianteFinal = formatarVariante(variante);
  const qtd = Number(novaQuantidade);

  if (qtd <= 0) {
    return await removerItem(usuarioId, produto_id, varianteFinal);
  }

  const carrinho = await obterCarrinho(usuarioId);
  const item = carrinho.itens.find(
    (i) => i.produto_id === produto_id && i.variante === varianteFinal
  );

  if (item) {
    item.quantidade = qtd;
    const resultado = await salvarCarrinho(carrinho);
    exibirFeedback("Quantidade atualizada!", "info");
    return resultado;
  }

  return carrinho;
}

/**
 * Remove um item do carrinho pela combinação produto_id + variante.
 */
export async function removerItem(usuarioId, produto_id, variante) {
  const varianteFinal = formatarVariante(variante);
  const carrinho = await obterCarrinho(usuarioId);

  carrinho.itens = carrinho.itens.filter(
    (i) => !(i.produto_id === produto_id && i.variante === varianteFinal)
  );

  const resultado = await salvarCarrinho(carrinho);
  exibirFeedback("Item removido do carrinho.", "info");
  return resultado;
}

/**
 * Esvazia todos os itens do carrinho na MockAPI.
 */
export async function esvaziarCarrinho(usuarioId) {
  const carrinho = await obterCarrinho(usuarioId);
  carrinho.itens = [];

  const resultado = await salvarCarrinho(carrinho);
  exibirFeedback("Carrinho esvaziado.", "info");
  return resultado;
}

/**
 * Calcula o total do carrinho a partir dos preços atuais no catálogo.
 * @param {object|object[]} carrinhoOuItens
 * @returns {Promise<number>}
 */
export async function calcularTotal(carrinhoOuItens) {
  const itens =
    carrinhoOuItens?.itens ?? (Array.isArray(carrinhoOuItens) ? carrinhoOuItens : []);
  let total = 0;

  for (const item of itens) {
    const produto = await buscarProdutoPorId(item.produto_id);
    total += (Number(produto?.preco) || 0) * (Number(item.quantidade) || 0);
  }

  return Number(total.toFixed(2));
}

/**
 * Retorna os itens detalhados com os dados do catálogo para renderização da tela.
 * @param {object|object[]} carrinhoOuItens
 */
export async function detalharCarrinho(carrinhoOuItens) {
  const itens =
    carrinhoOuItens?.itens ?? (Array.isArray(carrinhoOuItens) ? carrinhoOuItens : []);
  let valorTotal = 0;
  let totalItens = 0;

  const itensDetalhados = await Promise.all(
    itens.map(async (item) => {
      const produto = await buscarProdutoPorId(item.produto_id);
      const preco = Number(produto?.preco) || 0;
      const qtd = Number(item.quantidade) || 0;
      const subtotal = Number((preco * qtd).toFixed(2));

      valorTotal += subtotal;
      totalItens += qtd;

      return {
        ...item,
        produto: produto ?? null,
        preco_unitario: preco,
        subtotal,
      };
    })
  );

  return {
    itens: itensDetalhados,
    totalItens,
    valorTotal: Number(valorTotal.toFixed(2)),
  };
}
