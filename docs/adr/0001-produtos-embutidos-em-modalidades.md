# Produtos embutidos no registro de Modalidade

O plano gratuito da MockAPI limita cada entidade a 100 registros, mas o catálogo exige no mínimo 135 Produtos (15 Modalidades × 9). Em vez de dividir Produtos em várias entidades, cada registro da entidade `modalidades` carrega um array `produtos`; não existe entidade `produtos`. Com isso o projeto usa 3 entidades (`modalidades`, `usuarios`, `carrinhos`), uma por estagiário.

## Consequências

- O CRUD de Produto é feito lendo a Modalidade, alterando o array e enviando PUT; edições simultâneas na mesma Modalidade podem se sobrescrever (aceito no MVP).
- Busca, ordenação e paginação não podem usar a query string da MockAPI sobre Produtos; são feitas no cliente sobre a lista carregada.
- O JSON inicial e o script de seed têm um registro por Modalidade, com seus Produtos aninhados.
