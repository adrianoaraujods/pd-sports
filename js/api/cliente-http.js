/**
 * Cliente HTTP reutilizável para a aplicação PD-Sports
 * Utiliza Fetch API com async/await e tratamento centralizado de exceções.
 */

/**
 * Classe customizada de erro para falhas de requisição HTTP e rede.
 */
export class ErroApi extends Error {
  /**
   * @param {string} mensagem 
   * @param {number} status Código de status HTTP (0 se for erro de rede)
   * @param {any} [detalhes=null] Dados complementares da resposta ou exceção original
   */
  constructor(mensagem, status = 0, detalhes = null) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.detalhes = detalhes;
  }
}

/**
 * Função base para execução de requisições HTTP.
 * @param {string} url Endpoint de destino
 * @param {RequestInit} [opcoes={}] Opções adicionais do fetch
 * @returns {Promise<any>} Dados processados da resposta
 */
async function requisicao(url, opcoes = {}) {
  const configuracao = {
    headers: {
      "Content-Type": "application/json",
      ...opcoes.headers,
    },
    ...opcoes,
  };

  let resposta;

  try {
    // Trata a URL para permitir caracteres especiais
    resposta = await fetch(encodeURI(url), configuracao);
  } catch (erroRede) {
    // Trata problemas de DNS, conexão indisponível, CORS ou queda de rede
    throw new ErroApi(
      "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
      0,
      erroRede
    );
  }

  // Tratamento de códigos de status HTTP fora da faixa 200-299
  if (!resposta.ok) {
    let mensagemErro = `Erro na requisição: ${resposta.status} ${resposta.statusText}`;
    let dadosErro = null;

    try {
      dadosErro = await resposta.json();
      if (dadosErro) {
        mensagemErro =
          dadosErro.message ||
          dadosErro.mensagem ||
          (typeof dadosErro === "string" ? dadosErro : mensagemErro);
      }
    } catch {
      // Caso o corpo de erro não seja JSON
    }

    throw new ErroApi(mensagemErro, resposta.status, dadosErro);
  }

  // Se a requisição retornou 204 (No Content), não há corpo a processar
  if (resposta.status === 204) {
    return null;
  }

  try {
    return await resposta.json();
  } catch {
    // Se a resposta de sucesso não for JSON, retorna como texto simples
    return await resposta.text();
  }
}

/**
 * Métodos utilitários do cliente HTTP
 */
export const clienteHttp = {
  /**
   * Realiza uma requisição GET.
   * @param {string} url
   * @param {RequestInit} [opcoes]
   * @returns {Promise<any>}
   */
  async get(url, opcoes = {}) {
    return requisicao(url, { ...opcoes, method: "GET" });
  },

  /**
   * Realiza uma requisição POST com corpo serializado em JSON.
   * @param {string} url
   * @param {any} corpo
   * @param {RequestInit} [opcoes]
   * @returns {Promise<any>}
   */
  async post(url, corpo, opcoes = {}) {
    return requisicao(url, {
      ...opcoes,
      method: "POST",
      body: JSON.stringify(corpo),
    });
  },

  /**
   * Realiza uma requisição PUT com corpo serializado em JSON.
   * @param {string} url
   * @param {any} corpo
   * @param {RequestInit} [opcoes]
   * @returns {Promise<any>}
   */
  async put(url, corpo, opcoes = {}) {
    return requisicao(url, {
      ...opcoes,
      method: "PUT",
      body: JSON.stringify(corpo),
    });
  },

  /**
   * Realiza uma requisição DELETE.
   * @param {string} url
   * @param {RequestInit} [opcoes]
   * @returns {Promise<any>}
   */
  async delete(url, opcoes = {}) {
    return requisicao(url, { ...opcoes, method: "DELETE" });
  },
};

export default clienteHttp;
