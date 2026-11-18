/**
 * Tela do formulário de Produto (admin): cadastro e edição.
 * Sem parâmetro na URL cria um Produto; com `?id=<id do produto>` edita o existente.
 * Aceita trocar a Modalidade do Produto ao editar.
 */

import { protegerRotaAdministrativa } from "../servicos/admin.js";
import {
  carregarCatalogo,
  MAPA_CORES,
  SEPARADOR_CORES,
} from "../servicos/catalogo.js";
import { criarProduto, editarProduto } from "../servicos/produtos.js";
import { validarProduto } from "../servicos/validacao-produto.js";

const PAGINA_LISTA = "./admin-lista-produtos.html";
const ATRASO_REDIRECIONAMENTO_MS = 1200;

if (protegerRotaAdministrativa()) iniciar();

async function iniciar() {
  const form = document.getElementById("formProduto");
  const botaoSalvar = document.getElementById("botaoSalvar");

  const produtoId = new URLSearchParams(location.search).get("id");
  let catalogo;
  let original = null; // Produto em edição (preserva campos que o formulário não mostra)
  let variantes = [];

  // ---------- Toasts ----------

  function mostrarToast(mensagem, tipo) {
    const toast = document.getElementById("toastAviso");
    toast.classList.remove("toast-sucesso", "toast-erro");
    toast.classList.add(tipo === "sucesso" ? "toast-sucesso" : "toast-erro");
    document.getElementById("toastMensagem").textContent = mensagem;
    bootstrap.Toast.getOrCreateInstance(toast, { delay: 5000 }).show();
  }

  function mostrarErroCampo(campo, mensagem) {
    campo.classList.add("is-invalid");
    campo.parentElement.querySelector(".invalid-feedback").textContent =
      mensagem;
  }

  function limparErros() {
    form
      .querySelectorAll(".is-invalid")
      .forEach((c) => c.classList.remove("is-invalid"));
  }

  // ---------- Variantes ----------

  function desenharVariantes() {
    const listaVariantes = document.getElementById("listaVariantes");
    listaVariantes.replaceChildren(
      ...variantes.map((texto) => {
        const item = document.createElement("li");
        item.className = "chip-variante";
        item.append(texto);
        const remover = document.createElement("button");
        remover.type = "button";
        remover.setAttribute("aria-label", `Remover variante ${texto}`);
        remover.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
        remover.addEventListener("click", () => {
          variantes = variantes.filter((v) => v !== texto);
          desenharVariantes();
        });
        item.append(remover);
        return item;
      }),
    );
  }

  const campoVariante = document.getElementById("campoVariante");

  function adicionarVariante() {
    const texto = campoVariante.value.trim();
    const repetida = variantes.some(
      (v) => v.toLowerCase() === texto.toLowerCase(),
    );
    if (texto && !repetida) {
      variantes.push(texto);
      desenharVariantes();
    }
    campoVariante.value = "";
    campoVariante.focus();
  }

  document
    .getElementById("botaoAdicionarVariante")
    .addEventListener("click", adicionarVariante);
  campoVariante.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault(); // Enter adiciona a variante, não envia o formulário
      adicionarVariante();
    }
  });

  // ---------- Pré-visualização da imagem ----------

  const campoImagem = document.getElementById("campoImagem");
  const previa = document.getElementById("previaImagem");
  const previaImagem = document.getElementById("previaImagemImg");
  const previaErro = document.getElementById("previaImagemErro");

  function atualizarPrevia() {
    const url = campoImagem.value.trim();
    previaErro.hidden = true;
    if (/^https?:\/\//i.test(url)) {
      previaImagem.src = url;
      previa.hidden = false;
    } else {
      previa.hidden = true;
      previaImagem.removeAttribute("src");
    }
  }

  previaImagem.addEventListener("error", () => {
    previa.hidden = true;
    previaErro.hidden = false;
  });
  campoImagem.addEventListener("input", atualizarPrevia);

  // ---------- Dados iniciais ----------

  const campoModalidade = document.getElementById("campoModalidade");
  const campoNome = document.getElementById("campoNome");
  const campoDescricao = document.getElementById("campoDescricao");
  const campoPreco = document.getElementById("campoPreco");
  const campoEstoque = document.getElementById("campoEstoque");
  const campoDestaque = document.getElementById("campoDestaque");
  const campoGenero = document.getElementById("campoGenero");
  const campoMarca = document.getElementById("campoMarca");
  const campoCorPrincipal = document.getElementById("campoCorPrincipal");
  const campoCorSecundaria = document.getElementById("campoCorSecundaria");

  function preencherModalidades() {
    campoModalidade.replaceChildren(
      ...catalogo.modalidades.map((m) => new Option(m.nome, m.id)),
    );
  }

  /** Marcas já cadastradas viram sugestões, para manter a mesma grafia. */
  function marcasCadastradas() {
    const marcas = catalogo.produtos.map((p) => p.marca?.trim()).filter(Boolean);
    return [...new Set(marcas)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function preencherMarcas() {
    document
      .getElementById("listaMarcas")
      .replaceChildren(...marcasCadastradas().map((m) => new Option(m)));
  }

  /** "adidas" vira "Adidas" se essa marca já existir; senão fica como digitada. */
  function marcaPadronizada(texto) {
    const marca = texto.trim();
    return (
      marcasCadastradas().find(
        (m) => m.toLowerCase() === marca.toLowerCase(),
      ) ?? marca
    );
  }

  function preencherCores() {
    const cores = Object.keys(MAPA_CORES).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
    for (const campo of [campoCorPrincipal, campoCorSecundaria]) {
      campo.append(...cores.map((cor) => new Option(cor, cor)));
    }
  }

  function atualizarAmostrasCor() {
    document.getElementById("amostraCorPrincipal").style.background =
      MAPA_CORES[campoCorPrincipal.value] ?? "transparent";
    document.getElementById("amostraCorSecundaria").style.background =
      MAPA_CORES[campoCorSecundaria.value] ?? "transparent";
  }

  campoCorPrincipal.addEventListener("change", atualizarAmostrasCor);
  campoCorSecundaria.addEventListener("change", atualizarAmostrasCor);

  function preencherFormulario(produto) {
    campoNome.value = produto.nome ?? "";
    campoModalidade.value = produto.modalidade_id;
    campoDescricao.value = produto.descricao ?? "";
    campoPreco.value = String(produto.preco ?? "").replace(".", ",");
    campoEstoque.value = produto.estoque ?? "";
    campoDestaque.checked = Boolean(produto.destaque);
    campoGenero.value = produto.genero ?? "";
    campoMarca.value = produto.marca ?? "";
    const [corPrincipal = "", corSecundaria = ""] = String(produto.cor ?? "")
      .split(SEPARADOR_CORES)
      .map((c) => c.trim());
    // Cor fora do MAPA_CORES fica sem seleção e a validação pede para escolher.
    campoCorPrincipal.value = corPrincipal;
    campoCorSecundaria.value = corSecundaria;
    atualizarAmostrasCor();
    campoImagem.value = produto.imagem ?? "";
    variantes = [...(produto.variantes ?? [])];
    desenharVariantes();
    atualizarPrevia();
  }

  botaoSalvar.disabled = true;
  try {
    catalogo = await carregarCatalogo({ forcar: true });
    preencherModalidades();
    preencherMarcas();
    preencherCores();

    if (produtoId) {
      original = catalogo.produtos.find((p) => p.id === produtoId);
      if (!original) throw new Error("Produto não encontrado.");
      document.getElementById("tituloPagina").textContent = "Editar Produto";
      document.getElementById("breadcrumbAtual").textContent = "Editar Produto";
      document.getElementById("colunaEstoque").hidden = true; // na edição o estoque não é alterado por aqui
      document.title = "Editar Produto | PD Sports";
      preencherFormulario(original);
    }
    botaoSalvar.disabled = false;
  } catch (erro) {
    const erroCarregamento = document.getElementById("erroCarregamento");
    erroCarregamento.textContent = `Não foi possível carregar o formulário: ${erro.message}`;
    erroCarregamento.classList.remove("d-none");
    form.hidden = true;
    return;
  }

  // ---------- Envio ----------

  function lerDados() {
    const preco = campoPreco.value.trim().replace(",", ".");
    const estoque = original ? original.estoque : campoEstoque.value.trim();
    const cores = [campoCorPrincipal.value, campoCorSecundaria.value].filter(
      Boolean,
    );
    return {
      nome: campoNome.value.trim(),
      descricao: campoDescricao.value.trim(),
      preco: preco === "" ? NaN : Number(preco),
      estoque: estoque === "" || estoque == null ? NaN : Number(estoque),
      imagem: campoImagem.value.trim(),
      destaque: campoDestaque.checked,
      genero: campoGenero.value,
      marca: marcaPadronizada(campoMarca.value),
      cor: cores.join(SEPARADOR_CORES),
      variantes,
    };
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros();

    const dados = lerDados();
    const modalidadeId = campoModalidade.value;
    const modalidade = catalogo.modalidades.find(
      (m) => String(m.id) === modalidadeId,
    );

    const erros = validarProduto(dados, {
      produtosDaModalidade: modalidade?.produtos ?? [],
      idAtual: produtoId ?? undefined,
    });
    if (!modalidade) erros.modalidade = "Selecione uma modalidade.";

    const camposComErro = Object.keys(erros);
    if (camposComErro.length > 0) {
      const camposDoFormulario = {
        nome: campoNome,
        modalidade: campoModalidade,
        descricao: campoDescricao,
        preco: campoPreco,
        estoque: campoEstoque,
        imagem: campoImagem,
        genero: campoGenero,
        marca: campoMarca,
        cor: campoCorPrincipal,
      };
      camposComErro.forEach((chave) =>
        mostrarErroCampo(camposDoFormulario[chave], erros[chave]),
      );
      camposDoFormulario[camposComErro[0]].focus();
      return;
    }

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
    try {
      if (original) {
        await editarProduto(
          original.id,
          { ...original, ...dados },
          modalidadeId,
        );
      } else {
        await criarProduto(modalidadeId, dados);
      }
      mostrarToast(
        original
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso.",
        "sucesso",
      );
      setTimeout(
        () => location.assign(PAGINA_LISTA),
        ATRASO_REDIRECIONAMENTO_MS,
      );
    } catch (erro) {
      mostrarToast(erro.message, "erro");
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar";
    }
  });

  // Corrigir um campo apaga o erro dele.
  form.addEventListener("input", (evento) =>
    evento.target.classList.remove("is-invalid"),
  );
}
