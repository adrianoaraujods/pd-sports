/**
 * Serviço de sessão.
 * Login com e-mail e senha contra a entidade `usuarios` da MockAPI, sessão guardada
 * no `localStorage` (persiste ao recarregar), logout e consulta do papel.
 * Senha em texto simples é uma limitação conhecida do MVP; a senha nunca é guardada na sessão.
 */

import clienteHttp, { ErroApi } from "../api/cliente-http.js";
import { CONFIG } from "../api/config.js";

const CHAVE_SESSAO = "pd-sports:sessao";

export const PAPEL_CLIENTE = "cliente";
export const PAPEL_ADMINISTRADOR = "administrador";

/** @typedef {{ id: string, nome: string, email: string, papel: "cliente"|"administrador" }} Sessao */

/** Busca usuários pelo e-mail. A MockAPI filtra por substring e responde 404 sem resultados. */
async function buscarUsuariosPorEmail(email) {
  try {
    const usuarios = await clienteHttp.get(
      `${CONFIG.API_MOCK.USUARIOS}?email=${encodeURIComponent(email)}`
    );
    return Array.isArray(usuarios) ? usuarios : [];
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) return [];
    throw erro;
  }
}

function salvarSessao(sessao) {
  try {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  } catch (erro) {
    throw new ErroApi("Não foi possível salvar sua sessão neste navegador.", 0, erro);
  }
}

/**
 * Autentica o usuário e inicia a sessão.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<Sessao>}
 * @throws {ErroApi} credenciais inválidas (status 401) ou falha de rede/API (mensagem pronta para exibir).
 */
export async function entrar(email, senha) {
  const emailNormalizado = String(email ?? "").trim().toLowerCase();
  const senhaInformada = String(senha ?? "");

  if (!emailNormalizado || !senhaInformada) {
    throw new ErroApi("Informe e-mail e senha.", 400);
  }

  const usuarios = await buscarUsuariosPorEmail(emailNormalizado);
  const usuario = usuarios.find(
    (u) => String(u.email).toLowerCase() === emailNormalizado && u.senha === senhaInformada
  );

  if (!usuario) {
    throw new ErroApi("E-mail ou senha incorretos.", 401);
  }

  /** @type {Sessao} */
  const sessao = {
    id: String(usuario.id),
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  };
  salvarSessao(sessao);
  return sessao;
}

/** Encerra a sessão. Não mexe no Carrinho salvo do Cliente. */
export function sair() {
  try {
    localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // localStorage indisponível: não há sessão a limpar
  }
}

/** @returns {Sessao|null} Sessão atual, ou null se não houver (ou se estiver corrompida). */
export function obterSessao() {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto);
    if (!sessao?.id || !sessao?.papel) return null;
    return sessao;
  } catch {
    return null;
  }
}

/** @returns {boolean} Há usuário logado? */
export function estaLogado() {
  return obterSessao() !== null;
}

/** @returns {"cliente"|"administrador"|null} Papel do usuário logado. */
export function obterPapel() {
  return obterSessao()?.papel ?? null;
}

/** @returns {boolean} O usuário logado é Administrador? */
export function ehAdministrador() {
  return obterPapel() === PAPEL_ADMINISTRADOR;
}
