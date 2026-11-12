import { cadastrar, validarCadastro } from "../servicos/cadastro.js";
import { estaLogado } from "../servicos/sessao.js";

const PAGINA_LOGIN = "./login.html";

const form = document.getElementById("formCadastro");
const botao = document.getElementById("cadastroEnviar");
const caixaErro = document.getElementById("cadastroErro");
const campoTermos = document.getElementById("cadastroTermos");

const campos = {
  nome: document.getElementById("cadastroNome"),
  email: document.getElementById("cadastroEmail"),
  senha: document.getElementById("cadastroSenha"),
  confirmarSenha: document.getElementById("cadastroConfirmarSenha"),
};

function mostrarErroCampo(nome, mensagem) {
  const input = campos[nome];
  input.classList.add("is-invalid");
  document.getElementById(`${input.id}Feedback`).textContent = mensagem;
}

function limparErros() {
  caixaErro.classList.add("d-none");
  caixaErro.textContent = "";
  for (const input of [...Object.values(campos), campoTermos]) {
    input.classList.remove("is-invalid");
  }
}

function exibirErros(erros) {
  const nomes = Object.keys(erros).filter((n) => campos[n]);
  nomes.forEach((n) => mostrarErroCampo(n, erros[n]));
  if (nomes.length > 0) campos[nomes[0]].focus();
  return nomes.length > 0;
}

if (estaLogado()) location.replace("./index.html");

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limparErros();

  const dados = {
    nome: campos.nome.value.trim(),
    email: campos.email.value.trim(),
    senha: campos.senha.value,
    confirmarSenha: campos.confirmarSenha.value,
  };
  campos.nome.value = dados.nome;
  campos.email.value = dados.email;

  const erros = validarCadastro(dados);
  const temErroCampo = exibirErros(erros);
  if (!campoTermos.checked) {
    campoTermos.classList.add("is-invalid");
    if (!temErroCampo) campoTermos.focus();
    return;
  }
  if (temErroCampo) return;

  botao.disabled = true;
  botao.textContent = "Criando conta...";

  try {
    await cadastrar(dados);
    location.assign(PAGINA_LOGIN);
  } catch (erro) {
    const porCampo =
      erro.detalhes && typeof erro.detalhes === "object" ? erro.detalhes : {};
    if (!exibirErros(porCampo)) {
      caixaErro.textContent =
        erro.message || "Não foi possível criar a conta. Tente novamente.";
      caixaErro.classList.remove("d-none");
    }
    botao.disabled = false;
    botao.textContent = "Criar conta";
  }
});

// Ao editar um campo, o erro dele deixa de valer.
form.addEventListener("input", (evento) => {
  evento.target.classList.remove("is-invalid");
  caixaErro.classList.add("d-none");
});
form.addEventListener("change", (evento) =>
  evento.target.classList.remove("is-invalid"),
);
