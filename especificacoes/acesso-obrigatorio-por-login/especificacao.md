# Especificação — Acesso obrigatório por login

Data: 2026-11-06. Estado: proposta. Base: extensão vigente de `visao.md`.
Fronteiras: C01 e C02 de `contratos.md`. Testes abaixo são previstos, ainda não
escritos. “Anon” significa ausência de sessão reconhecida, não a chave pública.

## Cenários verificáveis

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível / teste previsto |
|---|---|---|---|---|---|---|---|
| S01 | RN01, AC01 | anon | `/` | abrir | `/entrar`, sem conteúdo ou ferramentas protegidas | nenhum material exibido | componente: `tests/ui/acesso.test.tsx` |
| S02 | RN01, AC02 | anon | `/atlas/politica/m1e1`, subtema e link legado | abrir/recarregar | `/entrar`; páginas protegidas nem montam | sem fetch antecipado de conteúdo | componente + e2e: `tests/ui/acesso.test.tsx`, `e2e/acesso.spec.ts` |
| S03 | RN02, AC03 | anon, inclusive marca conta-vista existente | `/entrar` | abrir e usar voltar | login acessível, sem loop, sem ajustes/exportação de dados | sem acesso por cabeçalho | componente: `tests/ui/acesso.test.tsx` |
| S04 | RN03, AC04 | sessão; marcação e nota locais | sair | confirmar saída existente | login; store preservado; memória de conteúdo limpa | voltar não mostra tela protegida | componente + e2e: `tests/ui/conta.test.tsx`, `e2e/acesso.spec.ts` |
| S05 | RN04, AC05 | servidor iniciado | GET manifesto/currículo sem bearer | requisitar diretamente | 401, no-store, sem JSON de estudo | arquivo não é lido | API/HTTP: `tests/server/conteudo.test.ts` |
| S06 | RN04, AC06 | token aceito pelo Auth | GET manifesto e dois currículos | requisitar | 200, mesmos JSONs/textos/IDs; no-store | sem cache compartilhado | API: `tests/server/conteudo.test.ts`; integridade: testes de conteúdo existentes |
| S07 | RN04/RN07, AC07 | Auth rejeita credencial | token falso, expirado, chave anon; usuário anônimo do provedor | GET conteúdo | 401, sem dados | sem confiar em payload decodificado | API: `tests/server/conteudo.test.ts` |
| S08 | RN05, AC08 | build e pacote servidor gerados | árvore pública, JS e mapas | inspecionar arquivos e trechos distintivos dos currículos | nenhum material público; cópias somente no pacote servidor | falha de inspeção bloqueia entrega | artefato: `tests/scripts/conteudo-privado.test.ts` e inspeção do pacote Vercel |
| S09 | RN05, AC09 | servidor completo iniciado | `/content/areas.json`, currículos, `/private/content/...` | GET sem login | 404 e nenhum material; sem fallback com JSON | arquivos legados inacessíveis | HTTP/e2e: `e2e/acesso.spec.ts` |
| S10 | RN06, AC10 | sessão reconhecida | área ainda não montada, rede offline | abrir/recarregar | indisponibilidade; não usa cache persistente | sem conteúdo offline recuperado | e2e: `e2e/offline.spec.ts` |
| S11 | RN06, AC11 | cache legado semeado | ativar SW novo; solicitar API e URL antiga | assumir controle e navegar | cache de conteúdo removido; nenhuma resposta de API persistida | cache legado nunca usado como fallback novo | unit + e2e: `tests/core/sw-rules.test.ts`, `e2e/offline.spec.ts` |
| S12 | RN07, AC12 | sem config ou Auth indisponível | abrir tela; GET conteúdo | restaurar/validar | tela adequada; API 503, sem arquivo ou erro interno | sem fallback público/local | componente + API: `tests/ui/acesso.test.tsx`, `tests/server/conteudo.test.ts` |
| S13 | RN08, AC13 | getSession pendente, depois sessão reconhecida | tema direto | iniciar e resolver sessão | verificação sem flash; depois tema; sem login intermediário | nenhum fetch antes da sessão | componente: `tests/ui/acesso.test.tsx` |
| S14 | RN08, AC14 | tela aberta autenticada | evento sem sessão ou API 401 | perder sessão | desmontar material e levar a `/entrar` | sem retentativa infinita ou uso de cache | componente + API: `tests/ui/acesso.test.tsx`, `tests/core/content-auth.test.ts` |
| S15 | RN02, AC15 | conta permitida existente | código correto/incorreto e callback de link válido/expirado | autenticar em `/entrar` | sucesso vai a `/atlas`; erro mantém login; callback limpo após processamento | parâmetros não perdidos por redirect prematuro | componente + core: `tests/ui/conta.test.tsx`, `tests/core/sync-auth.test.ts` |
| S16 | técnico: RN03/RN08, AC04/AC14 | requisição de A em andamento | sair/trocar sessão; resposta de A atrasada | concluir resposta | nenhum conteúdo reaparece; novo usuário não recebe cache de A | resposta obsoleta descartada | core: `tests/core/content-auth.test.ts` |
| S17 | técnico: RN04/RN07, AC05/AC12 | API em execução | `../`, separador codificado, caminho absoluto, query repetida, POST | solicitar | recusa conforme C01; erro genérico, sem leitura fora da lista | sem traversal, vazamento ou token em log | API: `tests/server/conteudo.test.ts` |
| S18 | técnico: RN04/RN05, AC05/AC06/AC08 | pacote Vercel inspecionado e deploy aprovado separadamente | URL real anônima/autenticada, domínio e versões anteriores | verificar HTTP real | nova API protege e nenhum canal publicado auditado entrega materiais anonimamente | exposição externa impede declarar privacidade global | integração real: roteiro de `revisao.md` e `docs/deploy.md` |

## Matriz RN → AC → cenário → teste

| RN | AC | Cenários | Testes / estado |
|---|---|---|---|
| RN01 | AC01, AC02 | S01, S02 | `tests/ui/acesso.test.tsx`, `e2e/acesso.spec.ts` — previstos |
| RN02 | AC03, AC15 | S03, S15 | `tests/ui/acesso.test.tsx`, `tests/ui/conta.test.tsx`, `tests/core/sync-auth.test.ts` — previstos/ajustar |
| RN03 | AC04 | S04, S16 | conta, acesso e content-auth — previstos/ajustar |
| RN04 | AC05, AC06, AC07 | S05–S07, S17, S18 | servidor e integração real — previstos |
| RN05 | AC08, AC09 | S08, S09, S18 | inspeção do build/pacote e e2e — previstos |
| RN06 | AC10, AC11 | S10, S11 | offline e sw-rules — ajustar |
| RN07 | AC07, AC12 | S07, S12, S17 | servidor e acesso — previstos |
| RN08 | AC13, AC14 | S13, S14, S16 | acesso e content-auth — previstos |

## Efeitos, gaps e limites

GET não modifica dados. Logout preserva progresso/fila existentes, mas limpa
conteúdo em memória. A atualização remove somente caches de conteúdo legados
conhecidos, sem apagar dados de estudo pessoais. Não existe bypass de produção
para desenvolvimento/testes; mocks de Auth ficam no runner de testes.

8 RNs, 15 ACs, 18 cenários e 2 contratos. Nenhum gap de planejamento na matriz.
Cobertura executada da mudança: **zero**, pois implementação não iniciada.
S18 depende de empacotamento/deploy e confirmação externa; visibilidade do
GitHub e versões antigas ainda não verificadas. Dono: responsável pela entrega
com solicitante para decisões externas. Isso impede afirmar privacidade global,
mas não impede preparar a implementação local aprovada.

## Extensão 2026-11-06 — rastreabilidade executada

O solicitante aprovou a implementação com “pode seguir”. A tabela original
permanece como histórico do planejamento. Os testes reais de servidor ficaram
no projeto Vitest Node existente (`tests/core/`), sem criar um runner redundante.

| Cenários | Teste real | Comportamento coberto |
|---|---|---|
| S01–S03, S12–S15 | `tests/ui/acesso.test.tsx`, `tests/ui/conta.test.tsx`, `tests/core/sync-auth.test.ts` | guarda, login isolado, restauração, indisponibilidade e métodos existentes |
| S04, S14, S16 | `tests/core/content-auth.test.ts`, `tests/ui/acesso.test.tsx`, `tests/ui/conta.test.tsx` | token, logout, rejeição persistente, respostas tardias e troca direta A→B |
| S05–S07, S12, S17 | `tests/core/conteudo-servidor.test.ts` | Auth real do SDK com transporte externo controlado, allowlist, erros e cache |
| S08 | `tests/scripts/conteudo-privado.test.ts`, `scripts/check-private-content.mjs` | materiais fora da árvore pública e do build, detecção de texto embutido |
| S09 | `e2e/acesso.spec.ts`, `e2e/smoke.spec.ts` | HTTP dos caminhos antigos e privados não entrega material |
| S10, S11 | `tests/core/sw-rules.test.ts`, `tests/ui/acesso.test.tsx`, `e2e/offline.spec.ts` | sem conteúdo offline, sem cache de API, remoção de caches legados |
| S18 local | `e2e/acesso.spec.ts` e inspeção de `dist/` | build real com handler real; Auth local exclusivo dos testes |
| S18 produção | roteiro de `docs/deploy.md` | pendente: publicação confirmada, pacote Vercel, URLs reais e canais antigos |

A evidência final e as lacunas de ambiente/produção são registradas em
`revisao.md`; os testes previstos não são apresentados como executados sem
resultado correspondente.
