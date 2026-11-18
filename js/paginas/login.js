/** Tela de login: valida, autentica via serviço de sessão e volta à página de origem. */

import { entrar, estaLogado, sair, PAPEL_CLIENTE } from "../servicos/sessao.js";
import { mesclarCarrinhoVisitante } from "../servicos/carrinho.js";

const PAGINA_PADRAO = "/index.html";

/**
 * Lê o destino do parâmetro `redirect` e só aceita caminhos do mesmo site
 * (evita redirecionamento aberto para domínios externos).
 */
function obterDestino() {
  const bruto = new URLSearchParams(location.search).get("redirect");
  if (!bruto) return PAGINA_PADRAO;
  try {
    const url = new URL(bruto, location.href);
    if (url.origin !== location.origin) return PAGINA_PADRAO;
    if (url.pathname.endsWith("/login.html")) return PAGINA_PADRAO;
    return url.pathname + url.search + url.hash;
  } catch {
    return PAGINA_PADRAO;
  }
}

const form = document.getElementById("formLogin");
const campoEmail = document.getElementById("loginEmail");
const campoSenha = document.getElementById("loginSenha");
const campoEmailFeedback = document.getElementById("loginEmailFeedback");
const botao = document.getElementById("loginEnviar");
const caixaErro = document.getElementById("loginErro");

function mostrarErro(mensagem) {
  caixaErro.textContent = mensagem;
  caixaErro.classList.remove("d-none");
}

function limparErro() {
  caixaErro.classList.add("d-none");
  caixaErro.textContent = "";
}

if (estaLogado()) {
  location.replace(obterDestino());
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limparErro();

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  campoEmail.value = email;
  campoEmailFeedback.textContent = email
    ? "Informe um e-mail válido."
    : "Informe seu e-mail.";

  // Validação nativa + estilos do Bootstrap (.was-validated mostra os feedbacks)
  form.classList.add("was-validated");
  if (!form.checkValidity()) {
    form.querySelector(":invalid").focus();
    return;
  }

  botao.disabled = true;
  botao.textContent = "Entrando...";

  try {
    // await entrar(email, senha);
    // location.assign(obterDestino());
    const sessao = await entrar(email, senha);
    if (sessao.papel === PAPEL_CLIENTE) {
      botao.textContent = "Atualizando carrinho...";

      try {
        await mesclarCarrinhoVisitante(sessao.id);
      } catch (erro) {
        sair();

        throw new Error(`Não foi possível juntar os carrinhos: ${erro.message}`);
      }
    }

    location.assign(obterDestino());

  } catch (erro) {
    mostrarErro(erro.message || "Não foi possível entrar. Tente novamente.");
    botao.disabled = false;
    botao.textContent = "Entrar";
  }
});

// Ao editar, a mensagem de credenciais erradas deixa de valer.
form.addEventListener("input", limparErro);
