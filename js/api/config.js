// URLs da MockAPI, ViaCEP e configurações

export const CONFIG = {
  API_MOCK: {
    MODALIDADES: "https://6aee279ba677fe0fc14fc855.mockapi.io/modalidades", // Ana
    USUARIOS: "https://6aea0de93d3dd3d37be61408.mockapi.io/usuarios", // Adriano
    CARRINHOS: "https://6aea0de93d3dd3d37be61408.mockapi.io/carrinhos", // Adriano
  },
  VIACEP_URL: "https://viacep.com.br/ws",
  FRETE: {
    UF_ORIGEM: "MG",
    GRATIS_ACIMA_DE: 300,
    // valor em R$ e prazo em dias úteis
    MESMA_UF: { valor: 15, prazo: 3 },
    MESMA_REGIAO: { valor: 25, prazo: 5 },
    OUTRAS_REGIOES: { valor: 40, prazo: 8 },
  },
  REGIOES_UF: {
    Norte: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
    Nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
    "Centro-Oeste": ["DF", "GO", "MT", "MS"],
    Sudeste: ["ES", "MG", "RJ", "SP"],
    Sul: ["PR", "RS", "SC"],
  },
};
