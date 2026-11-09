# Especificação: MVP PD-Sports

## Declaração do Problema

Uma loja de artigos esportivos precisa de um MVP de e-commerce publicado em ambiente público. O Visitante deve conseguir explorar um catálogo grande (15 Modalidades, no mínimo 9 Produtos cada), montar um Carrinho e estimar o Frete. O Administrador precisa gerir o catálogo sem mexer em código. A equipe (3 estagiários, ~150h em 3 semanas) precisa entregar isso usando apenas HTML, CSS, Bootstrap, JavaScript, Fetch API e MockAPI gratuita (limite de 100 registros por entidade), seguindo o fluxo Git e o padrão de commits exigidos.

## Solução

Um site estático em módulos ES, publicado na Vercel, que consome três entidades da MockAPI (`modalidades` com Produtos embutidos, `usuarios`, `carrinhos`) e o ViaCEP. A vitrine filtra, busca, ordena e pagina no cliente. O Carrinho do Visitante vive no navegador e o do Cliente é persistido na MockAPI, com Mesclagem no login. A área restrita permite CRUD de Produtos e exibe um dashboard. Há dark mode. Os dados iniciais vêm de JSONs versionados, carregados por um script de seed.

## Histórias de Usuário

### Vitrine

1. Como Visitante, quero ver uma lista de Produtos, para descobrir o que a loja vende.
2. Como Visitante, quero filtrar por Modalidade, para ver só artigos do meu esporte.
3. Como Visitante, quero buscar Produtos pelo nome, para achar rápido o que procuro.
4. Como Visitante, quero ordenar por preço (crescente e decrescente), para comparar custos.
5. Como Visitante, quero combinar Modalidade, busca e ordenação ao mesmo tempo, para refinar o resultado.
6. Como Visitante, quero navegar entre páginas de resultados, para não carregar uma lista enorme de uma vez.
7. Como Visitante, quero que a página e os filtros fiquem na URL, para compartilhar ou recarregar sem perder o contexto.
8. Como Visitante, quero ver os Destaques na página inicial, para conhecer os produtos principais.
9. Como Visitante, quero abrir a página de detalhes de um Produto, para ver descrição, preço, imagem e Variantes.
10. Como Visitante, quero ver uma mensagem clara quando a busca não retorna nada, para saber que não é um erro.
11. Como Visitante, quero ver indicação de carregamento e, quando a API falha, uma mensagem na própria tela (toast ou aviso), para entender o que está acontecendo.
12. Como Visitante, quero usar o site em celular e desktop, para comprar de qualquer aparelho.
13. Como Visitante, quero alternar entre tema claro e escuro, para navegar com conforto.
14. Como Visitante, quero que o tema escolhido seja lembrado, para não precisar trocar a cada visita.

### Carrinho

15. Como Visitante, quero adicionar um Produto ao Carrinho, para reunir o que pretendo comprar.
16. Como Visitante, quero escolher a Variante antes de adicionar, para comprar o tamanho certo.
17. Como Visitante, quero que o mesmo Produto em Variantes diferentes apareça em linhas separadas, para controlar cada um.
18. Como Visitante, quero alterar a quantidade de um Item do Carrinho, para ajustar o pedido.
19. Como Visitante, quero remover um Item do Carrinho, para desistir dele.
20. Como Visitante, quero ver o total recalculado automaticamente, para saber quanto pagarei.
21. Como Visitante, quero que meu Carrinho persista ao recarregar a página, para não perder o que escolhi.
22. Como Cliente, quero que meu Carrinho seja salvo na minha conta, para continuá-lo em outro aparelho.
23. Como Cliente, quero que os itens do meu Carrinho de Visitante sejam mesclados ao fazer login, somando quantidades iguais, para não perder nada.
24. Como Cliente, quero que minhas alterações no Carrinho sejam gravadas na API, para que fiquem salvas.
25. Como Cliente, quero que a quantidade no Carrinho respeite o estoque do Produto (somado entre Variantes), para não pedir o que não existe.
26. Como Cliente, quero calcular o Frete informando meu CEP, para saber o custo e o prazo.
27. Como Cliente, quero que o endereço seja preenchido pelo CEP (ViaCEP), para digitar menos.
28. Como Cliente, quero ver Frete grátis quando a compra passar de R$ 300,00, para ser recompensado.
29. Como Cliente, quero ver um erro claro para CEP inválido ou inexistente, para corrigi-lo.
30. Como Cliente, quero finalizar a compra vendo um resumo (itens, Frete, total), para confirmar o pedido.
31. Como Cliente, quero que o Carrinho seja esvaziado após a Finalização da Compra, para recomeçar.

### Contas

32. Como Visitante, quero me cadastrar com nome, e-mail e senha, para virar Cliente.
33. Como Visitante, quero que o cadastro rejeite e-mail repetido ou inválido e senha com menos de 6 caracteres, para evitar contas erradas.
34. Como Cliente, quero entrar com e-mail e senha, para acessar meu Carrinho.
35. Como Cliente, quero sair da conta, para proteger meu uso em aparelho compartilhado.
36. Como Cliente, quero continuar logado ao recarregar a página, para não repetir o login.
37. Como Cliente, quero ver erro claro para credenciais erradas, para saber o que corrigir.
38. Como Visitante, quero não conseguir me cadastrar como Administrador, para que o papel seja protegido.
39. Como Cliente, quero não conseguir abrir as páginas administrativas, para que a área seja restrita.

### Administração

40. Como Administrador, quero entrar na área restrita, para gerir o catálogo.
41. Como Administrador, quero ver a lista administrativa de Produtos, para ter visão geral.
42. Como Administrador, quero cadastrar um Produto em uma Modalidade, para ampliar o catálogo.
43. Como Administrador, quero informar a imagem por URL com pré-visualização, para conferir antes de salvar.
44. Como Administrador, quero cadastrar as Variantes de um Produto, para oferecer tamanhos.
45. Como Administrador, quero marcar um Produto como Destaque, para promovê-lo.
46. Como Administrador, quero editar um Produto, para corrigir dados.
47. Como Administrador, quero mover um Produto de Modalidade ao editar, para reclassificá-lo.
48. Como Administrador, quero excluir um Produto após confirmação em modal, para evitar acidentes.
49. Como Administrador, quero validação por campo (nome 3–80 e único na Modalidade, preço > 0, descrição 10–500, imagem http/https, estoque inteiro ≥ 0), para evitar dados inválidos.
50. Como Administrador, quero feedback visual (toast de sucesso ou erro), para saber se a ação funcionou.
51. Como Administrador, quero ver um dashboard com total de Produtos, Produtos por Modalidade, preço médio por Modalidade, Destaques e totais de usuários e Carrinhos, para acompanhar o catálogo.

### Equipe e entrega

52. Como membro da equipe, quero um script de seed idempotente, para recriar o banco da MockAPI a partir dos JSONs.
53. Como membro da equipe, quero JSONs versionados com 15 Modalidades e 9+ Produtos cada, para ter dados consistentes.
54. Como membro da equipe, quero um fluxo `feature/*` → `develop` → `main` por PR, para cumprir a governança.
55. Como membro da equipe, quero commits em português no padrão `feat`/`fix`/`docs`, para cumprir o padrão.
56. Como avaliador, quero README com descrição, integrantes, tecnologias, arquitetura, endpoints, e links do Figma, deploy e repositório, para entender o projeto.
57. Como avaliador, quero Figma com fluxograma, wireframes, protótipo navegável, cores e tipografia, para comparar com o layout final.
58. Como avaliador, quero o sistema publicado e funcional na Vercel, para testá-lo sem instalar nada.

## Decisões de Implementação

- **Arquitetura**: site estático, sem build e sem framework. JavaScript em módulos ES com camadas separadas: acesso à API (Fetch, `async`/`await` e tratamento de exceções), serviços de domínio (regras), componentes de interface e scripts por página.
- **Entidades da MockAPI (3, uma por conta)**: `modalidades` (`id`, `nome`, `slug`, `descricao`, `produtos[]`), `usuarios` (`id`, `nome`, `email`, `senha`, `papel`) e `carrinhos` (`id`, `usuario_id`, `itens[]`). Não existe entidade `produtos` (ver `docs/adr/0001-produtos-embutidos-em-modalidades.md`).
- **Produto** (embutido): `id` (UUID gerado no cliente), `nome`, `descricao`, `preco`, `imagem`, `destaque`, `estoque` (por Produto, agregado entre Variantes), `variantes[]` (textos; vazio = sem variação).
- **Item do Carrinho**: `produto_id`, `modalidade_id`, `variante` (nula se não houver), `quantidade`. O preço é lido do Produto. A identidade do item é `produto_id` + `variante`. Um Carrinho por usuário.
- **CRUD de Produto**: ler a Modalidade, alterar o array e enviar PUT. Mover de Modalidade altera dois registros. Edições simultâneas podem se sobrescrever (aceito no MVP).
- **Consulta do catálogo**: carregar todas as Modalidades uma vez, com cache em memória. Filtro, busca, ordenação e paginação são no cliente e refletidos na URL.
- **Autenticação**: senha em texto simples (limitação de segurança do MVP, registrada no README), sessão no `localStorage`, papéis `cliente` e `administrador`. O cadastro público só cria `cliente`. A rota protegida é verificada no cliente, sem garantia real de segurança.
- **Carrinho**: Visitante em `localStorage`. Cliente gravado na MockAPI a cada alteração. Mesclagem no login soma quantidades por `produto_id` + `variante` e limpa o `localStorage`. Logout não apaga o Carrinho salvo.
- **Ordem de entrega do Carrinho**: primeiro o Carrinho do Cliente (apenas logado, na MockAPI); depois o Carrinho do Visitante em `localStorage` e, por último, a Mesclagem. Até o Carrinho do Visitante existir, adicionar ao Carrinho leva ao login.
- **Sem páginas 404 nem telas de erro**: não há página 404, perfil nem histórico de pedidos. Falhas de rede e de API aparecem como toast ou aviso na própria tela; buscas sem resultado e Carrinho vazio têm mensagem inline.
- **Frete**: CEP consultado no ViaCEP. A origem é MG. Mesma UF R$ 15,00, mesma região R$ 25,00, outras regiões R$ 40,00, grátis acima de R$ 300,00. Valores e prazos (3, 5 e 8 dias úteis) ficam em configuração.
- **Finalização da Compra**: resumo e esvaziamento do Carrinho, sem pedido persistido.
- **Destaques**: marcação manual, sem limite rígido. A página inicial mostra até 8. Os dados iniciais têm 1 a 2 por Modalidade.
- **Dashboard**: cinco métricas calculadas a partir das Modalidades, Usuários e Carrinhos, com gráfico via Chart.js (CDN).
- **Dark mode**: tokens de cor em CSS variables, tema claro e escuro, preferência lembrada.
- **Dados iniciais**: um JSON por entidade, versionado. O script de seed (Node) limpa e recria os registros. O JSON de Modalidades traz os Produtos aninhados, e as imagens em `assets/` são referenciadas por caminho relativo.
- **Imagens**: uma por Produto, criadas pela equipe (método definido por quem executar). No admin, entram por URL.
- **Idioma**: documentos, código (identificadores), commits e interface em português.
- **Git e entrega**: `main`, `develop` e `feature/*`, PR obrigatório, sem aprovação obrigatória. A `develop` vai para a `main` por PR nos marcos. Deploy na Vercel.
- **Figma**: fluxos → mapa das telas → wireframes → design system → telas do protótipo → protótipo ligado e aprovado. O design system só começa depois de todos os wireframes. Cada pessoa faz os próprios wireframes e as telas correspondentes (no máximo 8 telas por dia, menos nos dias com outras tarefas). **Todo o código, inclusive a estrutura inicial, o seed e o deploy, só começa depois do protótipo aprovado.**
- **Cronograma** (dias contados a partir de 03/11/2026, de segunda a sexta, sem trabalho em 20/11, entrega em 24/11): dias 0 a 7 para o Figma, dias 8 a 21 para o código. Cada dia tem pelo menos um ticket por estagiário, respeitando 4h para dois deles e 2h para o terceiro. Os tickets estão em `.scratch/pd-sports/issues/`.
- **Corte de escopo**, avaliado no dia 14 (ter 17/11): primeiro o limite de estoque no Carrinho, depois o dark mode e por fim a Mesclagem do Carrinho. Dashboard e paginação não entram no corte.

## Fora de Escopo

- Pedidos persistidos, pagamento real, histórico de compras e perfil do usuário.
- Página 404 e telas de erro dedicadas.
- Segurança real: hash de senha, tokens, autorização no servidor.
- Controle de concorrência para edições simultâneas do mesmo registro.
- Upload de arquivos de imagem (só URL).
- Estoque por Variante.
- Identidade visual, nomes dos integrantes, contas da MockAPI e links (decididos depois).
- Criação das issues no GitHub e do quadro de tarefas (os tickets existem como arquivos markdown e podem virar issues depois).
- Frameworks, bundlers e qualquer etapa de build.

## Notas Adicionais

- O plano gratuito da MockAPI tem limites que conferimos só por fontes não oficiais (1 projeto por conta; 2 a 4 recursos por projeto; 100 registros por recurso). Vale revalidar na conta antes de semear. Se o limite de 100 registros não for real, o ADR 0001 ainda funciona.
- O registro de uma Modalidade com 9+ Produtos aninhados pode ficar grande. Convém verificar se a MockAPI aceita o tamanho do JSON na primeira execução do seed.
- A maior tarefa isolada de esforço é produzir as 135+ imagens. Ela deve entrar no backlog como trabalho paralelo e dividido entre os três.
- Termos e relações estão em [`GLOSSÁRIO.md`](./GLOSSÁRIO.md).
