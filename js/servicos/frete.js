import clienteHttp, { ErroApi } from "../api/cliente-http.js";
import { CONFIG } from "../api/config.js";

/** Remove tudo que não for dígito. */
export const normalizarCep = (cep) => String(cep ?? "").replace(/\D/g, "");

/** Formata como 00000-000 (se tiver 8 dígitos). */
export function formatarCep(cep) {
  const d = normalizarCep(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Verifica se o CEP tem 8 dígitos. */
export const cepValido = (cep) => /^\d{8}$/.test(normalizarCep(cep));

/**
 * Consulta um CEP no ViaCEP.
 * @param {string} cep
 * @returns {Promise<{cep:string, logradouro:string, complemento:string, bairro:string, cidade:string, uf:string}>}
 * @throws {ErroApi} CEP inválido (400), inexistente (404) ou falha de rede/API.
 */
export async function consultarCep(cep) {
  const digitos = normalizarCep(cep);

  if (!cepValido(digitos)) {
    throw new ErroApi("CEP inválido. Informe os 8 dígitos do CEP.", 400);
  }

  let dados;
  try {
    dados = await clienteHttp.get(`${CONFIG.VIACEP_URL}/${digitos}/json/`);
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 400) {
      throw new ErroApi(
        "CEP inválido. Verifique o número informado.",
        400,
        erro.detalhes,
      );
    }
    if (erro instanceof ErroApi && erro.status === 0) throw erro;
    throw new ErroApi(
      "Não foi possível consultar o CEP no momento. Tente novamente.",
      erro?.status ?? 0,
      erro,
    );
  }

  if (!dados || typeof dados !== "object" || dados.erro) {
    throw new ErroApi(
      "CEP não encontrado. Confira o número e tente novamente.",
      404,
    );
  }

  return {
    cep: formatarCep(dados.cep || digitos),
    logradouro: dados.logradouro ?? "",
    complemento: dados.complemento ?? "",
    bairro: dados.bairro ?? "",
    cidade: dados.localidade ?? "",
    uf: String(dados.uf ?? "").toUpperCase(),
  };
}

/** Retorna a região do Brasil de uma UF (ou null). */
export function obterRegiao(uf) {
  const sigla = String(uf ?? "").toUpperCase();
  return (
    Object.entries(CONFIG.REGIOES_UF).find(([, ufs]) =>
      ufs.includes(sigla),
    )?.[0] ?? null
  );
}

/**
 * Calcula o Frete a partir da UF de destino e do valor da compra (função pura).
 * @param {string} ufDestino
 * @param {number} valorCompra
 * @returns {{valor:number, prazo:number, gratis:boolean, regra:"mesma_uf"|"mesma_regiao"|"outras_regioes"}}
 */
export function calcularFrete(ufDestino, valorCompra = 0) {
  const { UF_ORIGEM, GRATIS_ACIMA_DE, MESMA_UF, MESMA_REGIAO, OUTRAS_REGIOES } =
    CONFIG.FRETE;
  const uf = String(ufDestino ?? "").toUpperCase();

  if (!obterRegiao(uf)) {
    throw new ErroApi("UF de destino inválida para cálculo de frete.", 400);
  }

  let regra, tabela;
  if (uf === UF_ORIGEM) {
    regra = "mesma_uf";
    tabela = MESMA_UF;
  } else if (obterRegiao(uf) === obterRegiao(UF_ORIGEM)) {
    regra = "mesma_regiao";
    tabela = MESMA_REGIAO;
  } else {
    regra = "outras_regioes";
    tabela = OUTRAS_REGIOES;
  }

  const gratis = Number(valorCompra) > GRATIS_ACIMA_DE;
  return {
    valor: gratis ? 0 : tabela.valor,
    prazo: tabela.prazo,
    gratis,
    regra,
  };
}

/**
 * Consulta o CEP e calcula o Frete em uma só chamada.
 * @param {string} cep
 * @param {number} valorCompra
 * @returns {Promise<{endereco: object, frete: object}>}
 */
export async function consultarFrete(cep, valorCompra) {
  const endereco = await consultarCep(cep);
  return { endereco, frete: calcularFrete(endereco.uf, valorCompra) };
}
