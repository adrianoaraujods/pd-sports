IDs gerados pela MockAPI (`Usuario`, `Modalidade`, `Carrinho`) são strings ("1", "2", ...).

```ts
type Usuario = {
  id: string;
  nome: string;
  email: string;
  senha: string; // texto simples (limitação do MVP)
  papel: "cliente" | "administrador";
};

type Modalidade = {
  id: string;
  nome: string;
  produtos: Produto[]; // embutidos (ADR 0001)
};

type Produto = {
  id: string; // "{modalidade}-{ordem}", ex.: "corrida-1"
  id_produto: number; // 1, 2, ... (único no catálogo)
  nome: string;
  imagem: string;
  destaque: boolean;

  preco: number;
  estoque: number; // por Produto, somado entre Variantes

  genero: string;
  tamanho: string;
  marca: string;
  cor: string;
  categoria: string;
  descricao: string;

  url_fonte: string;

  variantes: string[]; // todo Produto tem ao menos uma ("Único" quando não varia)
};

type Carrinho = {
  id: string;
  usuario_id: string; // Usuario.id (um Carrinho por Cliente)
  itens: ItemCarrinho[];
};

type ItemCarrinho = {
  produto_id: string; // Produto.id
  modalidade_id: string; // Modalidade.id
  variante: string;
  quantidade: number;
  // identidade do item: produto_id + variante
};
```
