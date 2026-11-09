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

    if ((resposta.status === 429 || resposta.status >= 500) && tentativa <= MAX_TENTATIVAS) {
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

async function semearColecao(url, nomeArquivo, nomeEntidade) {
  if (!url) return;

  const caminhoArquivo = path.join(__dirname, "..", "dados", nomeArquivo);
  if (!fs.existsSync(caminhoArquivo)) return;

  const dados = JSON.parse(fs.readFileSync(caminhoArquivo, "utf-8"));
  await limparColecao(url);

  console.log(`Enviando ${dados.length} registros para ${nomeEntidade}...`);

  for (let i = 0; i < dados.length; i++) {
    await enviarComTentativas(url, dados[i]);
    if (i < dados.length - 1) await pausar(INTERVALO_MS);
  }

  console.log(`✔ ${nomeEntidade} cadastrado com sucesso.`);
}

async function executarSeed() {
  console.log("Iniciando seed da MockAPI...");

  const { CONFIG } = await import("../js/api/config.js");
  const endpoints = CONFIG.API_MOCK;

  await semearColecao(endpoints.MODALIDADES, "modalidades.json", "Modalidades");
  await semearColecao(endpoints.USUARIOS, "usuarios.json", "Usuários");
  await semearColecao(endpoints.CARRINHOS, "carrinhos.json", "Carrinhos");

  console.log("Seed finalizado com sucesso!");
}

executarSeed();
