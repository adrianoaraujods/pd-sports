const fs = require("fs");
const path = require("path");

const INTERVALO_MS = 600;
const MAX_TENTATIVAS = 4;

const pausar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function limparColecao(url) {
  if (!url) return;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return;

    const itens = await resposta.json();
    if (!Array.isArray(itens) || itens.length === 0) return;

    for (const item of itens) {
      await fetch(`${url}/${item.id}`, { method: "DELETE" });
      await pausar(200);
    }
  } catch (erro) {
    console.warn(`Aviso ao limpar ${url}: ${erro.message}`);
  }
}

async function enviarComTentativas(url, item, tentativa = 1) {
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    if (
      (resposta.status === 429 || resposta.status >= 500) &&
      tentativa <= MAX_TENTATIVAS
    ) {
      await pausar(INTERVALO_MS * Math.pow(2, tentativa));
      return enviarComTentativas(url, item, tentativa + 1);
    }

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}`);
    }

    return await resposta.json();
  } catch (erro) {
    if (tentativa <= MAX_TENTATIVAS) {
      await pausar(INTERVALO_MS * Math.pow(2, tentativa));
      return enviarComTentativas(url, item, tentativa + 1);
    }
    throw erro;
  }
}

// Retorna os registros criados, na mesma ordem do JSON (com o id real da MockAPI).
// `transformar` permite ajustar cada registro antes do envio.
async function semearColecao(
  url,
  nomeArquivo,
  nomeEntidade,
  transformar = (item) => item,
) {
  if (!url) return [];

  const caminhoArquivo = path.join(__dirname, "..", "dados", nomeArquivo);
  if (!fs.existsSync(caminhoArquivo)) return [];

  const dados = JSON.parse(fs.readFileSync(caminhoArquivo, "utf-8"));
  await limparColecao(url);

  console.log(`Enviando ${dados.length} registros para ${nomeEntidade}...`);

  const criados = [];
  for (let i = 0; i < dados.length; i++) {
    criados.push(await enviarComTentativas(url, transformar(dados[i], i)));
    if (i < dados.length - 1) await pausar(INTERVALO_MS);
  }

  console.log(`✔ ${nomeEntidade} cadastrado com sucesso.`);
  return criados;
}

function lerJson(nomeArquivo) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "dados", nomeArquivo), "utf-8"),
  );
}

async function executarSeed() {
  console.log("Iniciando seed da MockAPI...");

  const { CONFIG } = await import("../js/api/config.js");
  const endpoints = CONFIG.API_MOCK;

  // modalidade_id nos carrinhos = posição (1-index) da Modalidade em modalidades.json.
  const modalidades = await semearColecao(
    endpoints.MODALIDADES,
    "modalidades.json",
    "Modalidades",
  );

  // O id do JSON é só uma referência: a MockAPI gera o id real.
  const usuariosJson = lerJson("usuarios.json");
  const usuarios = await semearColecao(
    endpoints.USUARIOS,
    "usuarios.json",
    "Usuários",
    ({ id, ...usuario }) => usuario,
  );
  const idRealDoUsuario = new Map(
    usuariosJson.map((u, i) => [u.id, usuarios[i]?.id]),
  );

  await semearColecao(
    endpoints.CARRINHOS,
    "carrinhos.json",
    "Carrinhos",
    (carrinho) => ({
      usuario_id:
        idRealDoUsuario.get(carrinho.usuario_id) ?? carrinho.usuario_id,
      itens: carrinho.itens.map((item) => ({
        ...item,
        modalidade_id:
          modalidades[item.modalidade_id - 1]?.id ?? item.modalidade_id,
      })),
    }),
  );

  console.log("Seed finalizado com sucesso!");
}

executarSeed();
