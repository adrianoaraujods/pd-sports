/**
 * Serviço de Produtos (administração).
 * Cria, edita e exclui Produtos. Como os Produtos são embutidos na Modalidade
 * (ADR 0001), cada operação lê a Modalidade atual na API, altera o array
 * `produtos` e envia PUT. Mover de Modalidade altera dois registros.
 */

import clienteHttp, { ErroApi } from "../api/cliente-http.js";
import { CONFIG } from "../api/config.js";
import { carregarCatalogo, limparCache } from "./catalogo.js";

const urlModalidade = (id) => `${CONFIG.API_MOCK.MODALIDADES}/${id}`;

/** Remove campos derivados pelo catálogo, que não pertencem ao registro embutido. */
function limparProduto({ modalidade_id, modalidade_nome, ...produto }) {
  return produto;
}

/** Converte qualquer falha em `ErroApi` com mensagem amigável para o usuário. */
function montarErro(acao, erro) {
  const prefixo = `Não foi possível ${acao} o produto`;
  if (erro instanceof ErroApi) {
    return new ErroApi(
      `${prefixo}: ${erro.message}`,
      erro.status,
      erro.detalhes,
    );
  }
  return new ErroApi(`${prefixo}.`, 0, erro);
}

/** Lê a Modalidade direto da API (nunca do cache) para evitar sobrescrever edições recentes. */
async function lerModalidade(id) {
  const modalidade = await clienteHttp.get(urlModalidade(id));
  return { ...modalidade, produtos: modalidade.produtos ?? [] };
}

function salvarModalidade(modalidade) {
  return clienteHttp.put(urlModalidade(modalidade.id), modalidade);
}

/** Descobre a Modalidade que contém o Produto, usando o catálogo. */
async function localizarModalidadeDoProduto(produtoId) {
  const { produtos } = await carregarCatalogo({ forcar: true });
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) throw new ErroApi("Produto não encontrado.", 404);
  return produto.modalidade_id;
}

/**
 * Cria um Produto na Modalidade informada, com id UUID gerado no cliente.
 * @param {string} modalidadeId
 * @param {object} dados Campos do Produto (sem `id`).
 * @returns {Promise<object>} Produto criado.
 */
export async function criarProduto(modalidadeId, dados) {
  try {
    const modalidade = await lerModalidade(modalidadeId);
    const produto = { ...limparProduto(dados), id: crypto.randomUUID() };
    await salvarModalidade({
      ...modalidade,
      produtos: [...modalidade.produtos, produto],
    });
    return produto;
  } catch (erro) {
    throw montarErro("criar", erro);
  } finally {
    limparCache();
  }
}

/**
 * Edita um Produto; se `novaModalidadeId` for outra Modalidade, move o Produto
 * (atualiza a Modalidade de destino e a de origem).
 * @param {string} produtoId
 * @param {object} dados Campos a gravar (o `id` é preservado).
 * @param {string} [novaModalidadeId]
 * @returns {Promise<object>} Produto atualizado.
 */
export async function editarProduto(produtoId, dados, novaModalidadeId) {
  try {
    const origemId = await localizarModalidadeDoProduto(produtoId);
    const destinoId = novaModalidadeId ?? origemId;
    const produto = { ...limparProduto(dados), id: produtoId };

    if (String(destinoId) === String(origemId)) {
      const origem = await lerModalidade(origemId);
      const produtos = origem.produtos.map((p) =>
        p.id === produtoId ? produto : p,
      );
      await salvarModalidade({ ...origem, produtos });
    } else {
      await moverProduto(produto, origemId, destinoId);
    }
    return produto;
  } catch (erro) {
    throw montarErro("salvar", erro);
  } finally {
    limparCache();
  }
}

/**
 * Exclui um Produto da sua Modalidade.
 * @param {string} produtoId
 */
export async function excluirProduto(produtoId) {
  try {
    const modalidadeId = await localizarModalidadeDoProduto(produtoId);
    const modalidade = await lerModalidade(modalidadeId);
    await salvarModalidade({
      ...modalidade,
      produtos: modalidade.produtos.filter((p) => p.id !== produtoId),
    });
  } catch (erro) {
    throw montarErro("excluir", erro);
  } finally {
    limparCache();
  }
}

/**
 * Move o Produto para outra Modalidade: grava primeiro o destino e depois a
 * origem. Se a gravação da origem falhar, desfaz o destino para não deixar
 * o Produto duplicado.
 */
async function moverProduto(produto, origemId, destinoId) {
  const origem = await lerModalidade(origemId);
  const destino = await lerModalidade(destinoId);

  await salvarModalidade({
    ...destino,
    produtos: [...destino.produtos, produto],
  });
  try {
    await salvarModalidade({
      ...origem,
      produtos: origem.produtos.filter((p) => p.id !== produto.id),
    });
  } catch (erro) {
    try {
      await salvarModalidade(destino);
    } catch {
      // Reversão falhou: mantém o erro original.
    }
    throw erro;
  }
}
