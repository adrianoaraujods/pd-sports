/**
 * Serviço de cadastro público.
 * Cria sempre um usuário com papel Cliente (nunca Administrador), validando nome,
 * e-mail (formato e unicidade) e senha (mínimo de 6 caracteres).
 */

import clienteHttp, { ErroApi } from "../api/cliente-http.js";
import { CONFIG } from "../api/config.js";
import { PAPEL_CLIENTE, buscarUsuariosPorEmail } from "./sessao.js";

export const SENHA_MIN = 6;

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida os campos do cadastro (formato apenas; a unicidade do e-mail é checada na API).
 * Função pura: devolve a mensagem de erro por campo.
 * @param {{ nome?: string, email?: string, senha?: string, confirmarSenha?: string }} dados
 *   `confirmarSenha` é opcional: quando informado (mesmo vazio), precisa ser igual à senha.
 * @returns {Record<string, string>} Objeto vazio se tudo estiver válido.
 */
export function validarCadastro(dados) {
  const erros = {};
  const nome = String(dados?.nome ?? "").trim();
  const email = String(dados?.email ?? "").trim();
  const senha = String(dados?.senha ?? "");

  if (!nome) erros.nome = "Informe seu nome.";

  if (!email) erros.email = "Informe seu e-mail.";
  else if (!REGEX_EMAIL.test(email)) erros.email = "Informe um e-mail válido.";

  if (senha.length < SENHA_MIN) {
    erros.senha = `A senha deve ter no mínimo ${SENHA_MIN} caracteres.`;
  }

  if (dados?.confirmarSenha !== undefined && dados.confirmarSenha !== senha) {
    erros.confirmarSenha = "As senhas não coincidem.";
  }

  return erros;
}

/**
 * Cadastra um novo Cliente. O papel é sempre Cliente: qualquer `papel` recebido é ignorado.
 * @param {{ nome: string, email: string, senha: string, confirmarSenha?: string }} dados
 * @returns {Promise<{ id: string, nome: string, email: string, papel: "cliente" }>} Usuário criado, sem a senha.
 * @throws {ErroApi} validação (status 400, `detalhes` com erros por campo), e-mail já cadastrado (409)
 *   ou falha de rede/API (mensagem pronta para exibir).
 */
export async function cadastrar(dados) {
  const erros = validarCadastro(dados);
  if (Object.keys(erros).length > 0) {
    throw new ErroApi(Object.values(erros)[0], 400, erros);
  }

  const nome = String(dados.nome).trim();
  const email = String(dados.email).trim().toLowerCase();

  const existentes = await buscarUsuariosPorEmail(email);
  if (existentes.some((u) => String(u.email).toLowerCase() === email)) {
    const mensagem = "Este e-mail já está cadastrado.";
    throw new ErroApi(mensagem, 409, { email: mensagem });
  }

  const criado = await clienteHttp.post(CONFIG.API_MOCK.USUARIOS, {
    nome,
    email,
    senha: String(dados.senha),
    papel: PAPEL_CLIENTE,
  });

  return {
    id: String(criado.id),
    nome: criado.nome,
    email: criado.email,
    papel: PAPEL_CLIENTE,
  };
}
