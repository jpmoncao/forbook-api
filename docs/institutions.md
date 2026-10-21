# Instituições e comunidades

Implementação gratuita baseada em OpenStreetMap: escola, universidade ou faculdade por estabelecimento/campus OSM. Vínculo autodeclarado, opcional e removível; nenhuma posição GPS é gravada no usuário. Não há ponto físico de troca nem comprovação de matrícula.

## Publicação

1. Configurar o ambiente do backend, executar `npx prisma generate`, `npx prisma migrate deploy` (ou o script Supabase existente) e `npm run build` antes de publicar o app atualizado.
2. A migração `20261019120000_add_institutions` adiciona catálogo/cache e uma FK anulável em `users`. Contas existentes ficam sem instituição; apagar uma instituição apenas remove o vínculo.
3. Configurar `OSM_USER_AGENT` com o nome do aplicativo, URL e contato real da operação. O padrão identifica o repositório ForBook.
4. Sem configuração, Overpass usa `https://overpass.private.coffee/api/interpreter` e, em falha, `https://overpass-api.de/api/interpreter`. `OVERPASS_URL` define um primário explícito e desativa o fallback implícito; `OVERPASS_FALLBACK_URLS` define alternativas separadas por vírgula (string vazia desativa alternativas). Máximo de três URLs distintas, sem credenciais. `NOMINATIM_URL` padrão: `https://nominatim.openstreetmap.org/search`. São substituíveis sem atualização do app.
5. A instância pública principal `overpass-api.de` tem orçamento conservador de **90 tentativas por janela móvel de 24h, total de todos os usuários do processo**, abaixo da recomendação pública de 100/dia para aplicativos. Não há rotação para contornar limites. Além disso, o corpo recebido da instância principal tem orçamento de **9 MB por janela móvel de 24h**, incluindo JSON inválido e resposta parcial. Cada resposta Overpass tem limite 4 MiB (leitura por streaming, inclusive JSON ainda não validado); `Content-Length` acima do saldo/limite é recusado e o corpo é cancelado. Ao atingir um limite o stream é cancelado; bytes decodificados já recebidos são contabilizados conservadoramente, mesmo em falha. Aliases e portas da instância principal compartilham a fila e os orçamentos; não são alternativas independentes. Os contadores são em memória: reinícios os zeram; operadores devem considerar todo o tráfego da instalação, inclusive reinícios, e usar provedor próprio em escala.
6. **Usar uma única réplica de API com o Nominatim público e o fallback Overpass público.** O limite de 1 chamada por segundo é global ao processo, com fila compartilhada por provedor. Para múltiplas réplicas, usar proxy com limite compartilhado ou provedor próprio. O cache em PostgreSQL é compartilhado, mas fila, deduplicação e cooldown são locais ao processo.

Não há chave comercial ou cobrança por requisição nesta implementação. A disponibilidade e a cobertura dependem dos provedores/dados; grandes volumes exigem coordenação com o provedor ou infraestrutura própria.

## Contratos autenticados

Respostas usam `{ message, data, meta? }`, com atribuição OSM em `meta.attribution`.

- `GET /institutions?q=&city=&page=1&limit=20`: catálogo persistido com paginação (limite máximo 50). A descoberta inicial de uma área ocorre em `nearby`; buscar por nome não consulta um geocoder externo.
- `GET /institutions/nearby?lat=&lng=&radius=5000`: raios aceitos 3000, 5000 ou 10000 metros; array de instituições com `distanceMeters`, ordenado por distância em linha reta. `meta.partial=true` indica que todos os provedores falharam e dados reais persistidos podem estar incompletos. Se falharem e não houver instituição catalogada no raio, retorna 503 `INSTITUTION_DISCOVERY_UNAVAILABLE` para o app oferecer nova tentativa. Um resultado vazio válido do provedor continua 200 com `partial=false`. Falhas de banco/cache retornam 500 `INSTITUTION_STORAGE_UNAVAILABLE`, sem tentar outro provedor.
- `GET /institutions/:id`: instituição ou 404.
- `POST /institutions/geocode` com `{ "query": "CEP ou endereço" }`: envio explícito, sem autocomplete, retorna candidatos `{ id, label, latitude, longitude }` para confirmação no app. Falha retorna 400 com `GEOCODER_UNAVAILABLE` e alternativa GPS.
- `PUT /users/me`: `institutionId` UUID vincula/troca, `null` remove, ausente preserva. UUID inexistente retorna 404. Perfis incluem `institutionId` e `Institution` anulável nas respostas detalhadas.
- `GET /user-books?institutionId=UUID`: combina instituição atual do anunciante com busca `term` ou legado `filter={"term":"texto","bookId":"UUID opcional"}` e paginação. Apenas anúncios ativos, públicos e de outro usuário; remover/trocar vínculo altera a comunidade dos anúncios imediatamente. Filtros fora desses campos são rejeitados.

Instituição: `{ id, name, type, address, city, state, latitude, longitude }`. `type` é `school`, `university` ou `college`; endereço/cidade/estado podem ser nulos. A identidade OSM composta impede importações duplicadas; nomes iguais não unem campi diferentes.

## Operação e privacidade

- Cache de área/raio e geocodificação, incluindo consultas vazias, dura 24 horas. Importação consulta o centro de uma célula de 0,01° com 1600 metros adicionais para cobrir toda a célula; a resposta é filtrada novamente pela origem real.
- Entradas de cache expiradas são removidas na próxima escrita, no máximo uma limpeza por hora por processo. Dados institucionais permanecem no catálogo para fallback.
- Cache de endereço usa SHA-256 da consulta normalizada como chave; não grava o texto de entrada, somente candidatos públicos. GPS não é salvo no perfil. As chaves de área representam células, não coordenadas exatas.
- 30 consultas por usuário/minuto. Overpass: fila e cooldown por origem, máximo 20 pedidos pendentes, intervalo 1100 ms; tentativas sequenciais de até 12 s e prazo total 26 s incluindo fila e leitura do JSON. Timeout/erro de transporte,429/5xx, JSON inválido, formato inesperado e `remark` tentam o próximo configurado; resposta válida vazia encerra sem consultar alternativas. Cooldown de60–300s por origem permite que outro provedor saudável funcione. Filtra elementos com `name` na consulta para reduzir transferência. Nominatim mantém timeout 25 s e fila compartilhada do processo. Pedidos simultâneos iguais são deduplicados; cache 24h evita chamadas repetidas.
- Sucesso do provedor só é concluído após normalização, importação e cache. Falhas de persistência não são tratadas como falhas de provedor e não iniciam failover. O limite 26 s cobre o trabalho externo; consultas de banco mantêm o timeout da conexão existente.
- Logs seguros distinguem `institution_provider` (hostname, etapa, razão, statusHTTP e duração) de `institution_storage` (`cache_read`, `catalog_write`, `cache_write`, `catalog_read`). Sem coordenadas, query/endereço, URL completa, credenciais, mensagens brutas de exceções ou corpo do provedor. Ex.: `reason=timeout` identifica indisponibilidade externa; `reason=storage_failure` identifica persistência. Validadores de corpo não registram os valores recebidos.
- Atribuição: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright.

Políticas: https://operations.osmfoundation.org/policies/nominatim/ e https://wiki.openstreetmap.org/wiki/Overpass_API.

## Verificação

- `npm test`: fixtures OSM, Haversine, cobertura da célula, validação, filtros, deduplicação, cache vazio, fallback e rate-limit. Sem chamar provedores públicos; integração é pulada por padrão.
- Integração: criar PostgreSQL **descartável**, aplicar todas as migrações nele, então executar `TEST_DATABASE_URL=postgresql://... npm test`. A suíte verifica perfil/vínculo, FK `SetNull`, identidade OSM, busca/paginação, visibilidade de anúncios, autenticação e OpenAPI. Remove os dados de teste.
- `npm run build` e `npx prisma validate` com `DATABASE_URL` configurada.

A suíte não comprova cobertura real do mapa, disponibilidade dos provedores ou permissões GPS nos aparelhos; esses cenários exigem validação manual no app. Nenhuma migração de produção é executada pelos testes automaticamente.
