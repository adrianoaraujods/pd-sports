/**
 * Validação do formulário de Produto (administração).
 * Função pura: recebe os dados digitados e devolve as mensagens de erro por campo.
 */

import { GENEROS, MAPA_CORES, SEPARADOR_CORES } from "./catalogo.js";

export const LIMITES = {
  NOME_MIN: 3,
  NOME_MAX: 80,
  DESCRICAO_MIN: 10,
  DESCRICAO_MAX: 500,
  MARCA_MIN: 2,
  MARCA_MAX: 40,
  CORES_MAX: 2,
};

/** Aceita número ou texto digitado (aceita vírgula decimal); devolve NaN se vazio ou inválido. */
function paraNumero(valor) {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "").trim().replace(",", ".");
  return texto === "" ? NaN : Number(texto);
}

function urlHttpValida(texto) {
  try {
    const { protocol } = new URL(texto);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function validarNome(nome, produtosDaModalidade, idAtual) {
  if (nome.length < LIMITES.NOME_MIN || nome.length > LIMITES.NOME_MAX) {
    return `O nome deve ter entre ${LIMITES.NOME_MIN} e ${LIMITES.NOME_MAX} caracteres.`;
  }
  const repetido = produtosDaModalidade.some(
    (p) =>
      p.id !== idAtual &&
      p.nome.trim().toLowerCase() === nome.toLowerCase(),
  );
  return repetido ? "Já existe um produto com este nome nesta modalidade." : null;
}

/** `cor` deve ter de 1 a CORES_MAX cores diferentes do MAPA_CORES, separadas por "/". */
function validarCor(cor) {
  const cores = String(cor ?? "")
    .split(SEPARADOR_CORES)
    .map((c) => c.trim())
    .filter(Boolean);
  if (cores.length === 0) return "Selecione a cor do produto.";
  if (cores.length > LIMITES.CORES_MAX) return `Selecione no máximo ${LIMITES.CORES_MAX} cores.`;
  if (cores.some((c) => !Object.hasOwn(MAPA_CORES, c))) return "Selecione uma cor da lista.";
  if (new Set(cores).size !== cores.length) return "As cores devem ser diferentes.";
  return null;
}

/**
 * Valida os dados do formulário de Produto.
 * @param {{ nome?: string, descricao?: string, preco?: number|string, imagem?: string, estoque?: number|string, genero?: string, marca?: string, cor?: string }} dados
 * @param {{ produtosDaModalidade?: {id: string, nome: string}[], idAtual?: string }} [contexto]
 *   `produtosDaModalidade`: Produtos da Modalidade escolhida (para checar nome único);
 *   `idAtual`: id do Produto em edição (ele não conta como duplicado de si mesmo).
 * @returns {Record<string, string>} Mensagem de erro por campo; objeto vazio se tudo estiver válido.
 */
export function validarProduto(dados, { produtosDaModalidade = [], idAtual } = {}) {
  const erros = {};
  const nome = String(dados.nome ?? "").trim();
  const descricao = String(dados.descricao ?? "").trim();
  const imagem = String(dados.imagem ?? "").trim();
  const preco = paraNumero(dados.preco);
  const estoque = paraNumero(dados.estoque);
  const marca = String(dados.marca ?? "").trim();

  const erroNome = validarNome(nome, produtosDaModalidade, idAtual);
  if (erroNome) erros.nome = erroNome;

  if (!(preco > 0)) erros.preco = "O preço deve ser maior que zero.";

  if (
    descricao.length < LIMITES.DESCRICAO_MIN ||
    descricao.length > LIMITES.DESCRICAO_MAX
  ) {
    erros.descricao = `A descrição deve ter entre ${LIMITES.DESCRICAO_MIN} e ${LIMITES.DESCRICAO_MAX} caracteres.`;
  }

  if (!urlHttpValida(imagem)) {
    erros.imagem = "Informe uma URL de imagem válida, começando com http:// ou https://.";
  }

  if (!Number.isInteger(estoque) || estoque < 0) {
    erros.estoque = "O estoque deve ser um número inteiro maior ou igual a zero.";
  }

  if (!Object.hasOwn(GENEROS, String(dados.genero ?? ""))) erros.genero = "Selecione o gênero do produto.";

  if (marca.length < LIMITES.MARCA_MIN || marca.length > LIMITES.MARCA_MAX) {
    erros.marca = `A marca deve ter entre ${LIMITES.MARCA_MIN} e ${LIMITES.MARCA_MAX} caracteres.`;
  }

  const erroCor = validarCor(dados.cor);
  if (erroCor) erros.cor = erroCor;

  return erros;
}
