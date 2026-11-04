# PD-Sports

MVP de e-commerce de artigos esportivos: vitrine para o cliente, área administrativa para gestão do catálogo.

## Linguagem

### Catálogo

**Modalidade**:
Esporte ao qual um produto pertence (ex.: futebol, natação). É também a categoria do produto: o catálogo tem 15 modalidades.
_Evite_: Categoria, esporte, departamento

**Produto**:
Artigo esportivo à venda, pertencente a exatamente uma Modalidade. Cada Modalidade tem no mínimo 9 Produtos.
_Evite_: Item, artigo, mercadoria

**Variante**:
Opção de escolha de um Produto, como tamanho (P, M, G) ou numeração, apresentada como texto.
_Evite_: Tamanho, SKU, opção

**Destaque**:
Produto marcado para aparecer em evidência na vitrine.
_Evite_: Promoção, favorito

### Pessoas

**Visitante**:
Pessoa que navega sem estar autenticada.
_Evite_: Anônimo, convidado

**Cliente**:
Usuário autenticado com papel de comprador. É o único papel que o cadastro público cria.
_Evite_: Comprador, consumidor

**Administrador**:
Usuário autenticado com permissão de gerir Produtos e ver o dashboard. Existe apenas a partir dos dados iniciais.
_Evite_: Admin (na interface), gerente

### Compra

**Carrinho**:
Conjunto de Itens do Carrinho que uma pessoa pretende comprar. O do Visitante vive só no navegador; o do Cliente é persistido na MockAPI.
_Evite_: Cesta, sacola

**Item do Carrinho**:
Um Produto com uma quantidade dentro do Carrinho.
_Evite_: Linha, entrada

**Mesclagem do Carrinho**:
Ao fazer login, juntada do Carrinho do Visitante ao do Cliente, somando as quantidades de Produtos iguais.

**Frete**:
Valor e prazo de entrega simulados a partir do CEP, por regra própria baseada na UF. Grátis acima de R$ 300,00. A UF de origem é MG.
_Evite_: Entrega, envio

**Finalização da Compra**:
Resumo final (itens, Frete, total) seguido do esvaziamento do Carrinho. Não gera pedido persistido.
_Evite_: Checkout, pedido
