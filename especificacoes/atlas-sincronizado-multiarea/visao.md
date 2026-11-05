# Atlas multiárea com progresso sincronizado entre aparelhos

**Estado:** Pronta para planejamento — perguntas respondidas em 2026-11-04 (ver extensão datada ao final)

## Resultado esperado

O autor lê o Atlas no celular e no PC com o mesmo progresso e as mesmas
anotações, inclusive offline, sem exportar/importar manualmente. O Atlas passa a
ser um mapa de áreas; política é a primeira área disponível e as demais
aparecem como "em breve".

## Escopo e não escopo

**Escopo**

- Quebrar o HTML único em `index.html`, `assets/` e `content/` (manifesto + `content/politica/curriculum.json`).
- Mapa de áreas, capa da área, rotas por hash, seletor de área no menu, busca na área com atalho para todas.
- Login por magic link (Supabase), sincronização offline-first por linha, fila de saída, indicador de estado.
- Migration `supabase/migrations/0001_init.sql`, `vercel.json`, `README.md`.
- `scripts/validate.mjs` + GitHub Action em todo push; GitHub Action diária de keepalive.
- `exemplos/` no `.gitignore`.

**Não escopo**

- Conteúdo de qualquer área além de política (pastas vazias com `.gitkeep`).
- Converter material de `exemplos/` por iniciativa própria.
- Reescrever, normalizar ou traduzir textos do currículo.
- Framework, bundler, build step, serverless functions.
- Múltiplos usuários (somente a conta do autor existe).

## Regras de negócio

- RN01 (conteúdo íntegro): o conteúdo de `content/politica/curriculum.json` é idêntico, caractere a caractere, ao bloco `atlas-data` do HTML original; o render de cada tema é idêntico ao original.
- RN02 (manifesto como fonte única): `content/areas.json` lista todas as áreas; acrescentar área = criar pasta + `curriculum.json` + entrada no manifesto, sem alterar código.
- RN03 (área planejada): área com `status: "planejado"` aparece no mapa em cinza, com "em breve", sem link nem rota navegável.
- RN04 (ID canônico): em memória e no banco o ID é `area/id` (ex.: `politica/m1e1`); o `curriculum.json` mantém IDs curtos.
- RN05 (carga sob demanda): a abertura busca só o manifesto; o currículo de uma área é buscado na primeira abertura dela e mantido em cache na sessão.
- RN06 (rotas): `#/` é o mapa, `#/politica` é a capa da área, `#/politica/m1e1` é o tema.
- RN07 (escrita local primeiro): toda marcação ou anotação grava em `localStorage` e atualiza a UI antes de qualquer chamada de rede.
- RN08 (granularidade): marcação = linha `(item_id, mark)`; anotação = linha `(item_id)`; nunca se envia o estado inteiro.
- RN09 (envio): marcações sobem imediatamente; anotações com debounce de ~800 ms.
- RN10 (merge por entrada): na carga, cada entrada local é comparada com a remota; vence o `updated_at` mais recente.
- RN11 (fila de saída): escrita remota que falha vai para fila persistida em `localStorage` e é reenviada no evento `online` e na próxima carga.
- RN12 (indicador): o cabeçalho mostra discretamente sincronizado / sincronizando / offline, e "não sincronizado" sem login.
- RN13 (sem login): sem usuário logado o app funciona integralmente com `localStorage`.
- RN14 (primeiro login): ao logar num aparelho com dados locais, aplica-se o merge da RN10; nada local é descartado sem perder para um dado remoto mais novo.
- RN15 (autenticação): login por magic link de e-mail; sessão persistida com refresh automático; só a conta do autor existe.
- RN16 (seguro contra lock-in): Exportar e Importar JSON continuam disponíveis.
- RN17 (offline): sem rede, o app abre, navega pelas áreas já visitadas e aceita marcações e anotações.
- RN18 (keepalive): uma Action diária consulta `heartbeat` com a chave `anon`; resposta diferente de 200 falha o job; disparo manual disponível.
- RN19 (validação de conteúdo): `scripts/validate.mjs` roda em todo push e falha (código 1) se faltar arquivo, houver ID repetido na área, faltar campo obrigatório, houver URL sem `https://` ou tema sem `book` e sem `bridge`.
- RN20 (exemplos fora do site): `exemplos/` não é versionada, não é lida em runtime e nenhum script ou Action depende dela.
- RN21 (busca): a busca do menu procura na área aberta e oferece atalho para buscar em todas as áreas disponíveis.

## Critérios de aceite

- AC01 — conteúdo idêntico: Dado o bloco `atlas-data` do HTML original, Quando comparado byte a byte com `content/politica/curriculum.json`, Então não há diferença.
- AC02 — render idêntico: Dado o tema `politica/m2e3`, Quando aberto no novo app, Então definição, conceitos, teses, os 2 vídeos, livro, críticas e perguntas aparecem com o mesmo texto do original.
- AC03 — área nova sem código: Dado um `content/historia/curriculum.json` válido e a entrada `historia` com `status: "disponivel"`, Quando o site é recarregado, Então a área aparece no mapa e navega, sem alteração em `assets/`.
- AC04 — área planejada: Dado `historia` com `status: "planejado"`, Quando o mapa é exibido, Então o cartão aparece em cinza com "em breve" e não é clicável; `#/historia` volta ao mapa.
- AC05 — livro no celular, PC depois: Dado login nos dois aparelhos, Quando marco o livro de `politica/m1e1` como lido no celular e abro o PC, Então o livro aparece marcado.
- AC06 — sessão intercalada: Dado os dois aparelhos abertos, Quando escrevo anotação em `politica/m1e2` no PC e marco o vídeo de `politica/m1e4` no celular, Então ao final ambos os aparelhos têm a anotação e a marcação.
- AC07 — modo avião: Dado o app já visitado com login, Quando ligo o modo avião, abro o app, navego e marco 3 itens, Então tudo funciona e o indicador mostra "offline"; ao voltar a rede, os 3 itens sobem e o indicador mostra "sincronizado".
- AC08 — deslogado: Dado nenhum login, Quando marco itens e escrevo anotações, Então tudo persiste após recarregar e o aviso "não sincronizado" aparece.
- AC09 — primeiro login com dados locais: Dado 5 marcações locais e 3 remotas diferentes, Quando faço login, Então o aparelho e o banco ficam com as 8.
- AC10 — LWW: Dado a anotação de `politica/m1e1` editada às 10:00 no celular e às 10:05 no PC, Quando ambos sincronizam, Então os dois aparelhos ficam com a versão das 10:05.
- AC11 — carga sob demanda: Dado o mapa aberto, Quando inspeciono a rede, Então só `areas.json` foi buscado; ao abrir `#/politica`, o currículo é buscado uma única vez na sessão.
- AC12 — rotas: Dado `#/politica/m1e1` colado na barra, Quando a página carrega, Então o tema abre direto.
- AC13 — exportar/importar: Dado progresso existente, Quando exporto e importo o arquivo em outro navegador, Então o progresso é restaurado.
- AC14 — validação: Dado um tema sem `check`, Quando `node scripts/validate.mjs` roda, Então sai com código 1 apontando área, tema e campo.
- AC15 — keepalive: Dado secrets configurados, Quando a Action roda, Então faz GET em `heartbeat` e falha se o status não for 200.
- AC16 — clone limpo: Dado um clone sem `exemplos/`, Quando `validate.mjs` e as Actions rodam, Então passam normalmente.
- AC17 — busca: Dado a área política aberta, Quando busco "Gramsci", Então vejo resultados da área e um atalho "buscar em todas as áreas".

## Exemplos e limites

- Política hoje: 7 módulos, 29 temas, 7 oficinas = 36 itens; 5 temas sem livro (`m1e3`, `m3e3`, `m5e1`, `m5e3`, `m6e3`), todos com `bridge`; 62 URLs, todas `https://`.
- Marcas por item: tema = `def` + `vid` (se houver vídeo) + `book` (se houver livro); oficina = `do`.
- Anotações: limite de 200 000 caracteres herdado do importador atual.
- Desmarcar não apaga linha: grava `done=false` com novo `updated_at`.

## Rastreabilidade

| RN | ACs | Cenários previstos | Situação |
|---|---|---|---|
| RN01 | AC01 | diff byte a byte | pronto |
| RN02 | AC03 | área nova sem código | depende de P2 |
| RN03 | AC04 | planejada não navega | pronto |
| RN04 | AC05, AC09 | IDs compostos | pronto |
| RN05 | AC11 | rede na abertura | pronto |
| RN06 | AC12 | rota direta | pronto |
| RN07 | AC07, AC08 | UI sem esperar rede | pronto |
| RN08 | AC06 | linhas independentes | pronto |
| RN09 | AC06 | debounce de nota | pronto |
| RN10 | AC10, AC09 | LWW | depende de P3, P4 |
| RN11 | AC07 | fila offline | depende de P3 |
| RN12 | AC07, AC08 | indicador | pronto |
| RN13 | AC08 | deslogado | pronto |
| RN14 | AC09 | merge no login | pronto |
| RN15 | AC05 | login | depende de P7 |
| RN16 | AC13 | export/import | depende de P5 |
| RN17 | AC07 | offline | depende de P8 |
| RN18 | AC15 | keepalive | pronto |
| RN19 | AC14, AC16 | validação | pronto |
| RN20 | AC16 | clone limpo | pronto |
| RN21 | AC17 | busca | pronto |

## Perguntas em aberto

- P1 (bloqueante) **Fonte do conteúdo.** Não existe `atlas-de-estudos.html` na raiz; o arquivo está em `exemplos/atlas-de-estudos-política.html`. É essa a fonte a extrair (conversão pedida explicitamente, compatível com a regra 3 do Adendo 2)? `exemplos/guia-tech-lead.html` fica intocado? — impacto: RN01.
- P2 (bloqueante) **Metadados por área fixos no JS.** São específicos de política: o mapa `TRAD` (8 tradições com rótulo e cor clara/escura), o preâmbulo do prompt "Estude com a IA", os títulos da capa, do cabeçalho, do menu e do PDF, e os três passos da rota. Onde ficam? Recomendação: na entrada da área em `areas.json`, mantendo `curriculum.json` byte-idêntico (verificável por hash). Alternativa: chave extra no `curriculum.json`. — impacto: RN01, RN02.
- P3 (bloqueante) **LWW no servidor.** O upsert do PostgREST sobrescreve sem comparar `updated_at`; uma fila offline antiga apagaria uma edição mais nova de outro aparelho. Proposta: acrescentar à migration um trigger `BEFORE UPDATE` que ignora escrita com `updated_at` mais antigo, e `updated_at` enviado pelo cliente com o instante da edição. Posso alterar a migration fornecida? — impacto: RN10, RN11.
- P4 (bloqueante) **Atualização com o app aberto.** Puxar do servidor só na carga, também ao voltar ao primeiro plano e ao reconectar, ou em tempo real (Realtime)? Recomendação: carga + volta ao primeiro plano + reconexão, sem Realtime. — impacto: AC06.
- P5 (bloqueante) **Zerar e Importar com sincronização.** Zerar apaga em todos os aparelhos, só neste (e volta no próximo merge), ou sai? Importar substitui tudo (propaga para todos) ou mescla por LWW? Formato novo do backup com `area/id` e `updated_at`, aceitando o v2 antigo (IDs mapeados para `politica/`)? — impacto: RN16.
- P6 (bloqueante) **Preferências e última posição.** Tamanho de texto e tema sincronizam ou ficam por aparelho? Abrir sem hash vai ao mapa ou retoma a última posição (deste aparelho ou do último usado)? — impacto: uso de `prefs`.
- P7 (bloqueante) **iOS e app na tela inicial.** No iOS, um magic link abre no Safari, não no atalho instalado na tela inicial, e a sessão não chega ao app; pedir no PC e clicar no celular também falha. Proposta: o e-mail traz link e código de 6 dígitos, e a tela aceita o código. — impacto: RN15.
- P8 (bloqueante) **Service worker.** O modo avião exige service worker (cache do app, manifesto, currículos visitados, supabase-js e fontes). Confirma? Cachear só áreas já abertas (recomendado) ou todas as disponíveis? — impacto: RN17, RN05.
- P9 **Mesma anotação editada offline em dois aparelhos.** LWW descarta a versão mais antiga inteira. Aceitável, ou preservar a perdedora (anexada com marcador)? — impacto: RN10.
- P10 **Logout.** Mantém os dados locais (recomendado) ou limpa o aparelho?
- P11 **Arquivos do Núcleo SDD.** `.agents/`, `.claude/`, `AGENTS.md`, `CLAUDE.md`, `docs/`, `especificacoes/`, `.discovery/`, `tests/` entram no repositório público ou vão para o `.gitignore`?

## Extensão 2026-11-04 — respostas do autor

Respostas dadas pela interface de perguntas. As RNs originais permanecem; o que
muda ou se acrescenta está abaixo.

| Pergunta | Resposta | Efeito |
|---|---|---|
| P1 | Extrair de `exemplos/atlas-de-estudos-política.html`, só leitura; `guia-tech-lead.html` intocado | RN01 usa essa fonte |
| P2 | Metadados da área na entrada de `areas.json` | RN22 |
| P3 | Trigger na migration ignora escrita mais antiga; `updated_at` = instante da edição no aparelho | RN23 |
| P4 | Buscar remoto ao abrir, ao voltar ao primeiro plano e ao reconectar; sem Realtime | RN24 |
| P5a | Zerar apaga em todos os aparelhos | RN25 |
| P5b | Importar mescla; vence o mais recente | RN26 |
| P6a | Tamanho e tema ficam por aparelho | RN27 |
| P6b | Abertura sem hash: mapa com "Continuar de onde parei" (última posição de qualquer aparelho) | RN28 |
| P7 | E-mail com link e código de 6 dígitos; tela aceita o código | RN29 (detalha RN15) |
| P8 | Service worker; cacheia só áreas já abertas | RN30 (detalha RN17) |
| P9 | Mesma anotação divergente: vence a mais recente e a outra é anexada com marcador | RN31 (detalha RN10) |
| P10 | Logout mantém dados locais e fila | RN32 |
| P11 | Framework SDD e especificações entram no repositório | fora das RNs (decisão de repositório) |

### Regras acrescentadas

- RN22 (metadados da área): rótulos e cores (claro/escuro) das tradições, títulos de capa/cabeçalho/menu/PDF, textos da capa e preâmbulo do prompt de IA vêm da entrada da área em `areas.json`; o JS não contém texto ou cor específicos de uma área.
- RN23 (LWW no servidor): uma escrita cujo `updated_at` é anterior ao já gravado para a mesma linha é ignorada pelo banco; `updated_at` é o instante da edição no aparelho.
- RN24 (atualização): o app busca as linhas remotas ao abrir, quando volta ao primeiro plano e quando a rede volta.
- RN25 (zerar global): Zerar, após confirmação que sugere exportar antes, desmarca todas as marcações e esvazia todas as anotações de todas as áreas, com `updated_at` novo, propagando a todos os aparelhos.
- RN26 (importar mescla): cada entrada do backup só substitui a local se for mais recente; nada ausente do backup é apagado; backup v2 (sem horário, IDs curtos) é aceito, com IDs prefixados por `politica/` e horário do momento da importação.
- RN27 (preferências locais): tamanho de texto e tema não sincronizam.
- RN28 (continuar): sem hash, o app abre no mapa com um atalho para a última posição lida em qualquer aparelho, quando houver.
- RN29 (login por código): o e-mail de login traz link e código de 6 dígitos; digitar o código na tela conclui o login no mesmo aparelho, mesmo que o link não funcione ali.
- RN30 (offline por área visitada): o service worker guarda app, manifesto e os currículos já abertos; área nunca aberta não fica disponível offline.
- RN31 (conflito de anotação): se a mesma anotação mudou nos dois lados desde a última sincronização e os textos divergem, o texto mais recente vence e o outro é anexado ao final com o marcador `— versão de outro aparelho (dd/mm/aaaa hh:mm) —`.
- RN32 (logout): sair da conta mantém marcações, anotações e fila locais; o app passa a "não sincronizado".

### Critérios acrescentados

- AC18 — metadados: Dado a entrada `politica` em `areas.json`, Quando abro `#/politica/m3e1`, Então a etiqueta e a cor da tradição `marx` são as do original, em claro e escuro.
- AC19 — escrita velha ignorada: Dado a linha `politica/m1e1:def` gravada com `updated_at` 10:05, Quando chega upsert com `updated_at` 10:00, Então a linha permanece com o valor das 10:05.
- AC20 — volta ao app: Dado o PC aberto em segundo plano, Quando marco algo no celular e volto à aba do PC, Então a marcação aparece sem recarregar.
- AC21 — zerar global: Dado 10 marcações e 2 anotações sincronizadas, Quando confirmo Zerar no celular e abro o PC, Então o PC mostra 0 marcações e anotações vazias.
- AC22 — importar mescla: Dado `politica/m1e1:def` marcado localmente às 10:00 e um backup v2 sem essa marcação mas com `m1e2:def`, Quando importo, Então ficam marcados os dois.
- AC23 — preferências locais: Dado tema escuro no PC, Quando abro o celular, Então o tema do celular não muda.
- AC24 — continuar: Dado o último tema lido no celular `politica/m2e3`, Quando abro o PC sem hash, Então o mapa mostra "Continuar de onde parei" apontando para esse tema.
- AC25 — código: Dado o pedido de login no PC, Quando digito no PC o código de 6 dígitos recebido, Então fico logado.
- AC26 — área não visitada offline: Dado que nunca abri uma área X, Quando estou offline e toco nela, Então vejo aviso de que ela precisa de conexão na primeira abertura.
- AC27 — conflito preservado: Dado a anotação de `politica/m1e1` editada offline para "A" no celular às 10:00 e para "B" no PC às 10:05, Quando ambos sincronizam, Então os dois ficam com "B" seguido do marcador e de "A".
- AC28 — logout: Dado 5 marcações, Quando saio da conta, Então as 5 continuam visíveis e o indicador mostra "não sincronizado".

### Rastreabilidade atualizada

| RN | ACs | Situação |
|---|---|---|
| RN02 | AC03 | pronto (P2 respondida) |
| RN10 | AC09, AC10, AC27 | pronto |
| RN11 | AC07, AC19 | pronto |
| RN15 | AC05, AC25 | pronto |
| RN16 | AC13, AC22 | pronto |
| RN17 | AC07, AC26 | pronto |
| RN22 | AC18 | pronto |
| RN23 | AC19 | pronto |
| RN24 | AC20 | pronto |
| RN25 | AC21 | pronto |
| RN26 | AC22 | pronto |
| RN27 | AC23 | pronto |
| RN28 | AC24 | pronto |
| RN29 | AC25 | pronto |
| RN30 | AC26 | pronto |
| RN31 | AC27 | pronto |
| RN32 | AC28 | pronto |

Nenhuma pergunta bloqueante aberta.
