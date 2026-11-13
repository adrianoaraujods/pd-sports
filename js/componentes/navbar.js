/**
 * Navbar compartilhada. Troca a navbar de Visitante (HTML estático das páginas) pela versão
 * do usuário autenticado:
 * - Cliente: Início, Produtos, busca, carrinho e menu do usuário (com "Sair");
 * - Administrador: Visão Geral, Produtos, busca e menu do usuário (sem carrinho).
 * Expandir/recolher no mobile e o dropdown são do Bootstrap (data-bs-*), sem JS próprio.
 * O HTML das páginas já traz a versão do Visitante (renderizada sem JS, bom para SEO);
 * mantenha as duas em sincronia.
 */

import { obterSessao, sair, PAPEL_ADMINISTRADOR } from "../servicos/sessao.js";

const BOTAO_ICONE = "btn text-white fs-4 lh-1 p-2";

function obterPrefixoBase() {
  const segmentos = location.pathname.split("/").filter(Boolean);
  const idxPaginas = segmentos.indexOf("paginas");
  if (idxPaginas !== -1) {
    const niveisAbaixo = segmentos.length - 1 - idxPaginas;
    return "../".repeat(niveisAbaixo);
  }
  return "./";
}

function montarLinks(sessao, base) {
  if (sessao.papel === PAPEL_ADMINISTRADOR) {
    return [
      { texto: "Visão Geral", href: `${base}paginas/admin/dashboard.html` },
      { texto: "Produtos", href: `${base}paginas/catalogo.html` },
    ];
  }
  return [
    { texto: "Início", href: `${base}index.html` },
    { texto: "Produtos", href: `${base}paginas/catalogo.html` },
  ];
}

function ativo(href) {
  if (href === "#") return false;
  const pagina = location.pathname.split("/").pop() || "index.html";
  return href.endsWith(`/${pagina}`);
}

function montarMenuUsuario(sessao) {
  return `
    <div class="dropdown">
      <button class="${BOTAO_ICONE}" type="button" data-bs-toggle="dropdown" aria-expanded="false"
        aria-label="Menu do usuário"><i class="bi bi-person" aria-hidden="true"></i></button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><h6 class="dropdown-header">${sessao.nome}</h6></li>
        <li><hr class="dropdown-divider"></li>
        <li>
          <button type="button" class="dropdown-item d-flex align-items-center gap-2" data-acao="sair">
            <i class="bi bi-box-arrow-right fs-6" aria-hidden="true"></i> Sair
          </button>
        </li>
      </ul>
    </div>`;
}

function montarNavbar(sessao) {
  const base = obterPrefixoBase();
  const links = montarLinks(sessao, base);
  const carrinho = sessao.papel !== PAPEL_ADMINISTRADOR;

  return `
    <nav class="navbar navbar-expand-lg" data-bs-theme="dark">
      <div class="container" id="navbarConteudo">
        <a href="${base}index.html" class="navbar-brand">
          <img src="${base}assets/imagens/logo.png" alt="logo" class="logo-img"> PD Sports
        </a>

        <div class="d-flex align-items-center gap-1 ms-auto ms-lg-0 order-lg-last">
          <button class="btn text-white fs-4 lh-1 p-2 d-lg-none" type="button" data-bs-toggle="collapse"
              data-bs-target="#buscaNavbar" aria-controls="buscaNavbar" aria-expanded="false" aria-label="Abrir busca">
              <i class="bi bi-search" aria-hidden="true"></i>
          </button>
          ${carrinho ? `<a href="${base}paginas/carrinho.html" class="${BOTAO_ICONE}" aria-label="Carrinho"><i class="bi bi-cart4" aria-hidden="true"></i></a>` : ""}
          ${montarMenuUsuario(sessao)}
          <button class="${BOTAO_ICONE} d-lg-none" type="button" data-bs-toggle="collapse"
            data-bs-target="#menuNavbar" aria-controls="menuNavbar" aria-expanded="false" aria-label="Abrir menu">
            <i class="bi bi-list" aria-hidden="true"></i>
          </button>
        </div>

        <div class="collapse navbar-collapse" id="menuNavbar" data-bs-parent="#navbarConteudo">
          <ul class="navbar-nav me-lg-auto">
            ${links
              .map(
                (l) => `
            <li class="nav-item">
              <a href="${l.href}" class="nav-link${ativo(l.href) ? " active" : ""}"${ativo(l.href) ? ' aria-current="page"' : ""}>${l.texto}</a>
            </li>`,
              )
              .join("")}
          </ul>
          <form class="d-none d-lg-flex" role="search" action="${base}paginas/catalogo.html" method="GET">
            <input type="search" name="q" class="form-control" placeholder="Buscar produtos..." aria-label="Buscar produtos">
          </form>
        </div>

        <div class="collapse d-lg-none w-100" id="buscaNavbar" data-bs-parent="#navbarConteudo">
            <form class="d-flex gap-2 py-2" role="search" action="${base}paginas/catalogo.html" method="GET">
                <input type="search" name="q" class="form-control" placeholder="Buscar produtos..." aria-label="Buscar produtos">
                <button type="submit" class="btn btn-primary">Buscar</button>
            </form>
        </div>
      </div>
    </nav>`;
}

export function renderizarNavbar() {
  const sessao = obterSessao();
  if (!sessao) return;

  const header = document.getElementById("navbar");
  if (!header) return;

  header.innerHTML = montarNavbar(sessao);
  header.querySelector('[data-acao="sair"]')?.addEventListener("click", () => {
    sair();
    const base = obterPrefixoBase();
    location.replace(`${base}index.html`);
  });
}

renderizarNavbar();
