---
name: d-er-relations
description: Interpreta diagramas entidade-relacionamento (D-ER, MER, modelo ER) e lista entidades, cardinalidades e relações para modelagem SQL ou Prisma. Use quando o usuário anexar ou citar um D-ER, diagrama ER, MER, modelo conceitual/lógico, ou pedir para identificar relações a partir de um diagrama.
---

# D-ER — extrair entidades e relações

## Quando aplicar

- Há imagem, PDF ou ficheiro de diagrama (`.drawio`, `.png`, etc.) no repositório ou no chat.
- O usuário descreve verbalmente um D-ER ou cola uma legenda de cardinalidade.

## Entrada

1. **Se houver ficheiro no projeto**: ler o caminho indicado ou procurar em pastas comuns (`docs/`, `diagramas/`, `*.drawio`, `*.png`).
2. **Se for só imagem no chat**: usar a visão/anexo disponível; não inventar entidades que não apareçam.
3. **Se estiver ilegível ou ambíguo**: pedir esclarecimento (cardinalidade, nome da relação, entidade fraca, etc.) em vez de supor.

## Passos

1. **Listar entidades** (retângulos / nós principais) com os atributos visíveis (simples, multivalor, derivados se marcados).
2. **Listar relacionamentos** (losangos / arestas nomeadas) e **cardinalidade** em cada ponta (1, N, 0..1, etc.), segundo a notação do diagrama (pé de galinha, Chen, etc.).
3. **Classificar cada ligação**:
   - **0:1** — chave estrangeira de um lado ou tabela de junção mínima.
   - **1:1** — chave estrangeira de um lado ou tabela de junção mínima.
   - **0:N** — FK no lado N.
   - **1:N** — FK no lado N.
   - **N:M** — entidade associativa ou tabela de junção com PK composta ou surrogate.
4. **Anotar restrições** visíveis: identificadores, participação total/parcial, herança/generalização se existir.
5. **Resumo para implementação**: quem referencia quem (direção da FK) e nomes sugeridos de tabelas/modelos.

## Formato de saída

Responder com:

1. **Tabela ou lista** — Entidade | Relacionamento com | Cardinalidade (lado A / lado B) | Observações.
2. **Lista de FKs implícitas** — entidade filha → campo(s) → entidade referenciada.
3. **Opcional (Prisma neste repositório)** — alinhar com a convenção de campos de relação em PascalCase (ex.: `UserBooks` em vez de `userBooks`), conforme regra do projeto em `schema.prisma` / `.cursor/rules/`.

## Erros a evitar

- Confundir **atributo** com **entidade**.
- Ignorar cardinalidade mínima (opcional vs obrigatório).
- Criar relação N:M sem entidade de junção quando o diagrama exige associação com atributos próprios.

## Se o diagrama não usar pé de galinha

Explicitar qual notação foi assumida e marcar incertezas com "(inferido — confirmar)".
