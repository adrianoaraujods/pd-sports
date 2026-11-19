# PD-Sports — E-commerce de Artigos Esportivos 

## 1. Descrição do Projeto

O **PD-Sports** é uma plataforma de e-commerce de artigos esportivos desenvolvida como MVP. O projeto conta com catálogo com 15 modalidades esportivas, fluxo completo de carrinho com cálculo de frete via ViaCEP, área administrativa para gerenciamento de produtos e dashboard com métricas da loja.

---

## 2. Integrantes da Equipe

- [**Adriano Araújo**](https://github.com/adrianoaraujods)
- [**Ana Clara Souza**](https://github.com/anaclpsouza)
- [**Matheus Kemuel**](https://github.com/MatheusKemuel)

---

## 3. Links Principais

| Recurso | Link de Acesso |
| :--- | :--- |
| **Repositório GitHub** | [https://github.com/adrianoaraujods/pd-sports](https://github.com/adrianoaraujods/pd-sports) |
| **Deploy em Produção (Vercel)** | [https://pd-sports.vercel.app](https://pd-sports.vercel.app) |
| **Figma (Design & Protótipo Navegável)** | [Protótipo no Figma](https://www.figma.com/design/qpM6sEynz4M2yYVGruiWMG/PD-Sports?node-id=72-638&t=xVWC65mlzZlpRjRI-1) |

---

## 4. Tecnologias Utilizadas

### Front-end & Interface
- **HTML5:** Estrutura semântica e acessível (landmarks, roles ARIA, labels descritivas).
- **CSS3:** Variáveis CSS, Flexbox, CSS Grid, media queries e transições fluidas.
- **Bootstrap 5.3 & Bootstrap Icons:** Sistema de grid, utilitários, modais, toasts e biblioteca de ícones vetoriais.
- **Chart.js (CDN):** Renderização dinâmica de gráficos de distribuição de produtos e preço médio no dashboard administrativo.

### Lógica & Comunicação
- **JavaScript Vanilla (ES6+):** Arquitetura 100% orientada a módulos nativos (`import`/`export`), sem dependência de frameworks ou bundlers.
- **Fetch API & Async/Await:** Comunicação assíncrona com tratamento robusto de erros e timeouts.

### APIs e Serviços Externos
- **MockAPI:** Persistência em nuvem dos dados de Modalidades (com produtos embutidos), Usuários e Carrinhos.
- **ViaCEP:** Integração com a API pública dos Correios para preenchimento de endereço e cálculo dinâmico de frete/prazos.

### Versionamento & Publicação
- **Git & GitHub:** Governança com GitFlow (`main`, `develop`, `feature/*`) e padrão **Conventional Commits**.
- **Vercel:** Hospedagem estática com integração contínua (CI/CD).

---

## 5. Arquitetura Adotada

A aplicação foi estruturada segundo o princípio da **separação clara de responsabilidades**, desacoplando requisições de rede, regras de negócio e manipulação da DOM.

```
pd-sports/
├── assets/
│   ├── css/
│   │   ├── variaveis.css            # Tokens de cor (Claro/Escuro), fontes e espaçamentos
│   │   ├── index.css                # Estilos da Home, seções de categorias e banners
│   │   ├── card.css                 # Cards de produtos e crachás
│   │   ├── catalogo.css             # Filtros, grid e paginação do catálogo
│   │   ├── carrinho.css             # Tabela de itens, resumo e frete
│   │   ├── dashboard.css            # Métricas, cards e gráficos gerenciais
│   │   ├── navbar.css & footer.css  # Componentes globais de layout
│   │   └── admin-lista-produtos.css # Tabela administrativa e ações rápidas
│   └── imagens/
│       ├── categorias/              # Imagens otimizadas das 15 modalidades esportivas
│       └── ...                      # Banners promocionais e hero
├── dados/                           # JSONs versionados para inicialização (seed)
│   ├── modalidades.json             # 15 modalidades com seus respectivos produtos
│   ├── usuarios.json                # Contas de administradores e clientes de teste
│   └── carrinhos.json               # Carrinhos iniciais
├── docs/                            # Documentação técnica, especificações e ADRs
│   ├── adr/
│   │   └── 0001-produtos-embutidos-em-modalidades.md # Decisão de aninhamento
│   ├── tarefas/                     # Backlog completo de implementação (tickets)
│   ├── ESPECIFICAÇÃO.md             # Histórias de usuário e critérios de aceite
│   └── PLANEJAMENTO.md              # Cronograma de desenvolvimento
├── js/
│   ├── api/
│   │   ├── config.js                # URLs das APIs, parâmetros de frete e constantes
│   │   └── cliente-http.js          # Wrapper de Fetch com interceptação e ErroApi
│   ├── servicos/
│   │   ├── catalogo.js              # Carregamento e cache em memória das modalidades
│   │   ├── carrinho.js              # Regras do carrinho, mesclagem e persistência
│   │   ├── sessao.js                # Autenticação, token/sessão e papéis de usuário
│   │   ├── frete.js                 # Integração ViaCEP, tabela de frete e prazos
│   │   ├── produtos-admin.js        # Operações de CRUD para a retaguarda
│   │   ├── cadastro.js              # Validações de criação de conta
│   │   └── metricas-dashboard.js    # Consolidação das métricas gerenciais
│   ├── componentes/
│   │   ├── navbar.js                # Barra de navegação com contador do carrinho
│   │   ├── card-produto.js          # Renderizador modular do card da vitrine
│   │   ├── categoriasHome.js        # Carrossel de modalidades na página inicial
│   │   ├── carrossel-destaques.js   # Vitrine de produtos em alta
│   │   └── notificacao.js           # Toasts visuais para feedback de usuário
│   └── paginas/
│       ├── catalogo.js              # Busca, filtros, ordenação e sincronização com a URL
│       ├── carrinho.js              # Interações de quantidade, exclusão e frete
│       ├── detalhes-produto.js      # Seleção de variantes, fotos e estoque
│       ├── dashboard.js             # Gráficos Chart.js e escuta de tema
│       ├── admin-lista-produtos.js  # Listagem e exclusão com modal
│       ├── admin-produto.js         # Formulário de criação/edição com preview
│       ├── login.js & cadastro.js   # Fluxos de autenticação
│       └── finalizacao.js           # Confirmação de pedido e limpeza do carrinho
├── paginas/
│   ├── admin/                       # Área restrita da administração
│   │   ├── dashboard.html
│   │   ├── admin-lista-produtos.html
│   │   └── produto.html
│   ├── catalogo.html
│   ├── detalhes-produto.html
│   ├── carrinho.html
│   ├── finalizacao.html
│   ├── login.html
│   └── cadastro.html
├── scripts/
│   └── seed.js                      # Script de seed da MockAPI
├── index.html                       # Página inicial da plataforma
└── README.md
```

---

## 6. Endpoints Utilizados

### MockAPI (Persistência Principal)
Conforme deliberado na [ADR 0001](docs/adr/0001-produtos-embutidos-em-modalidades.md), a entidade de produtos é embutida dentro de modalidades para otimizar os limites de requisições da MockAPI gratuita:

| Entidade | Endpoint | Descrição |
| :--- | :--- | :--- |
| **Modalidades** | `https://6aee279ba677fe0fc14fc855.mockapi.io/modalidades` | Armazena as 15 modalidades esportivas e os produtos vinculados em cada uma |
| **Usuários** | `https://6aea0de93d3dd3d37be61408.mockapi.io/usuarios` | Gerenciamento de clientes e administradores cadastrados |
| **Carrinhos** | `https://6aea0de93d3dd3d37be61408.mockapi.io/carrinhos` | Persistência dos carrinhos de clientes autenticados |

### API Pública Externa (ViaCEP)
- **URL Base:** `https://viacep.com.br/ws/{cep}/json/`
- **Utilidade:** Consulta de logradouro, bairro, localidade e UF a partir do CEP informado, utilizada no cálculo dinâmico de prazos e valores de frete no carrinho.

---

## 7. Credenciais para Acesso e Testes

Para facilitar a homologação e avaliação das funcionalidades, utilize as credenciais pré-semeadas na base:

| Perfil | E-mail | Senha | Acesso / Permissão |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@pdsports.com` | `admin123` | Acesso completo à área restrita (`/paginas/admin/`) e catálogo |
| **Cliente Teste** | `cliente@gmail.com` | `123456` | Acesso à vitrine, carrinho na nuvem e finalização de compras |

---

## 8. Como Executar o Projeto Localmente

A aplicação é **100% estática em HTML, CSS e JavaScript Vanilla**, sem necessidade de instalação de dependências ou ambientes de execução como Node.js.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/adrianoaraujods/pd-sports.git
   cd pd-sports
   ```

2. **Abra com o Live Server:**
   - No VS Code, com a extensão **Live Server** instalada, clique com o botão direito no arquivo `index.html` e selecione **Open with Live Server**.
   - A aplicação será aberta diretamente no seu navegador.

