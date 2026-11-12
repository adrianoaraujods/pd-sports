import { obterSessao, ehAdministrador } from "./sessao.js";

const PAGINA_LOGIN = "/paginas/login.html";
const PAGINA_INICIAL = "/index.html";

/**
 * Libera a página se o usuário for Administrador; caso contrário redireciona:
 * - Visitante (sem sessão) → login, com `redirect` para voltar depois de entrar;
 * - Cliente → página inicial.
 * @returns {boolean} true se o acesso foi liberado (a página pode continuar a carregar).
 */
export function protegerRotaAdministrativa() {
  if (ehAdministrador()) {
    document.documentElement.hidden = false;
    return true;
  }

  if (obterSessao() === null) {
    const destino = location.pathname + location.search + location.hash;
    location.replace(`${PAGINA_LOGIN}?redirect=${encodeURIComponent(destino)}`);
  } else {
    location.replace(PAGINA_INICIAL);
  }
  return false;
}
