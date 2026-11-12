# Especificação: preparatório Concurso Contagem/MG 2027

Origem: [visao.md](visao.md) com as extensões de 2026-11-11 e
[edital-vigente.md](edital-vigente.md). Datas de "hoje" vêm de relógio injetado,
no fuso `America/Sao_Paulo`.

## Cenários

### Conteúdo e programa (validação + núcleo)

| ID | Origem | Pré-condição | Entrada / ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|
| S01 | RN01, AC01 | `concurso.json` | `npm run validate` | todo tópico obrigatório tem `disciplina`, `fonte.documento`, `fonte.versao`, `fonte.pagina` e `validacao` ∈ {verificado, pendente, divergente} | tópico sem fonte → erro `contagem-2027/<id>: fonte` | script (`validate.test.ts`) |
| S02 | RN01, AC01 | tópico "Endereçamento IP" | abrir o tópico | linha de fonte "Conhecimentos Específicos · Anexo IV – Ret. nº 02, de 09/11/2026 · p. 5" e selo "verificado" | — | componente |
| S03 | RN02, AC02 | 1 tópico `pendente` | abrir a capa | "1 tópico pendente de conferência com o edital" com link; sem "programa conferido" | — | componente |
| S04 | RN02, AC03 | todos `verificado` | abrir a capa | "Programa conferido com o Anexo IV – Ret. nº 02" | — | componente |
| S05 | RN03, AC04 | opcional concluído | `progressoDisciplina` | opcional fora do numerador e do denominador | tópico opcional sem `opcional: true` mas sem fonte → erro de validação | unitário |
| S06 | RN04, AC05 | quadro com fontes | abrir a capa | composição com "Anexo III – Ret. nº 01"; nenhum campo de local | dado de prova sem `fonte` → erro de validação | componente + script |
| S07 | RN05, AC06 | semana 4 | abrir a trilha | meta com rótulo "sugestão pedagógica" | — | componente |
| S08 | RN06, AC07 | `concurso.json` | `npm run validate` + abrir trilha | 10 semanas contíguas de 16/11/2026 a 23/01/2027, cada uma com ≥ 1 tópico das 4 disciplinas | semana sem disciplina, sobreposição ou lacuna de datas → erro | script + componente |
| S09 | técnico (cobertura) | `concurso.json` | `npm run validate` | todo tópico obrigatório está em exatamente uma semana | tópico obrigatório fora da trilha → erro | script |
| S10 | RN23, AC30 | fixture com 2º concurso | montar o mapa e abrir o 2º | programa, trilha e contagem próprios | — | componente (fixture em `tests/fixtures`) |

### Calendário (núcleo, puro)

| ID | Origem | Pré-condição | Entrada / ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|
| S11 | RN07, AC08 | relógio 2026-12-02T15:00Z | `hoje()` | semana 3, quarta, disciplina CE, tópicos de redes não concluídos | — | unitário |
| S12 | RN07, AC09 | 2026-12-05 | `hoje()` | sábado: revisão, questões, simulado + revisões pendentes | — | unitário |
| S13 | técnico (fuso) | relógio 2026-11-16T02:30Z (23h30 de 15/11 em Brasília) | `hoje()` | ainda 15/11: "Começa em 1 dia" | — | unitário |
| S14 | RN08, AC10 | 2026-11-11 | `hoje()` | "Começa em 5 dias", semana 1 em foco | — | unitário |
| S15 | RN08, AC11 | 2027-01-25 | `semanaAtual()` | nenhuma | — | unitário |
| S16 | RN09, AC12, AC13 | 2027-01-14 / 2027-01-24 / 2027-01-26 | `contagem()` | "Faltam 10 dias" / "A prova é hoje" / "Prova realizada em 24/01/2027", sempre com o rótulo de data prevista | — | unitário + componente |

### Registros do estudante (núcleo + banco)

| ID | Origem | Pré-condição | Entrada / ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|
| S17 | RN12, AC16 | sem registros | `estadoTopico(id)` | "não iniciado" | — | unitário |
| S18 | RN13, AC17 | taxa 40%, confiança baixa | registrar leitura | taxa 40%, confiança baixa, estado inalterado | — | unitário |
| S19 | RN10, AC14 | "Crase" na semana 5 | mover para 7 em 2026-12-20 | semana efetiva 7; histórico "planejado: semana 5 · replanejado em 20/12/2026 para a semana 7" | semana fora de 1–10 → recusado | unitário + componente |
| S20 | RN11, AC15 | sessões 60 e 90 min na semana 2 | `tempoSemana(2)` | 150 de 600 min ("2 h 30 de 10 h") | duração ≤ 0 ou > 24 h → recusado | unitário + componente |
| S21 | técnico (escrita local) | offline | registrar sessão | gravado em `localStorage` antes de avisar a interface; vai para a fila | — | unitário |
| S22 | técnico (sincronização) | dois aparelhos, fake backend | aparelho A registra tentativa; B sincroniza | B vê a tentativa | — | sincronização (`sync.test.ts`) |
| S23 | técnico (conflito) | mesmo `topico` editado em A e B | sincronizar | vence o `updated_at` mais recente; eventos (tentativa, sessão, replanejamento) nunca conflitam (ID único) | — | sincronização |
| S24 | técnico (RLS) | dois usuários | ler `registros` do outro | zero linhas | — | banco (`tests/db/test.sql`) |
| S25 | técnico (LWW no servidor) | linha mais nova no banco | upsert mais antigo | descartado pelo trigger | — | banco |
| S26 | técnico (limite) | corpo > 16 KB | upsert | recusado pelo banco; cliente registra aviso e descarta | — | banco + sincronização |

### Desempenho, erros e revisões (núcleo)

| ID | Origem | Pré-condição | Entrada / ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|
| S27 | RN14, AC18 | 30 tópicos RL, 6 concluídos, 4 em revisão | `progressoDisciplina("rl")` | 20% | — | unitário |
| S28 | RN16, AC20, AC21 | 0 tentativas / 10 com 7 acertos | `taxa(topico)` | "sem dados" / 70% | — | unitário |
| S29 | RN17, AC22 | erro em 03/12, acerto depois | `cadernoDeErros()` | entra; sai após o acerto; tentativa errada continua no histórico | — | unitário |
| S30 | RN18, AC23 | leitura em 2026-12-14 | `revisoes(topico)` | 15/12, 21/12, 04/01/2027 | — | unitário |
| S31 | RN18, AC24 | leitura em 2027-01-10 | `revisoes(topico)` | 11/01, 17/01; nenhuma em 31/01 | — | unitário |
| S32 | RN18, AC25 | revisão de 15/12 não feita; hoje 16/12 | `revisoesPendentes()` | inclui a de 15/12 | — | unitário |
| S33 | RN19, AC26 | LP 8, RL 3, CGM 6, CE 14 | `notaObjetiva()` | 70; acima de 60 | acertos acima do máximo da disciplina → recusado | unitário |
| S34 | RN22, AC29 | taxas do exemplo | `temasFracos(5)` | Crase, Sub-redes, Regência, Herança, MMC; sem Probabilidade | — | unitário |

### Interface

| ID | Origem | Pré-condição | Entrada / ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|
| S35 | RN29, AC37 | manifesto com "Concursos" › "contagem-2027" | abrir `/atlas` | cartão do concurso com progresso; `/atlas/concursos/contagem-2027` abre a capa | concurso `planejado` → não aparece | componente |
| S36 | RN15, AC19 | questão autoral | abrir | "Origem: autoral"; nenhum "IBGP" | questão com origem ausente → erro de validação | componente + script |
| S37 | RN24, AC31 | questão de Crase, gabarito C | marcar B, confirmar | "errou", gabarito C, comentário; tentativa registrada | confirmar sem alternativa → botão desabilitado | componente |
| S38 | RN25, AC32, AC33 | Crase publicado; Probabilidade não | abrir os dois | 8–10 questões / "conteúdo em preparação" | tópico publicado com < 8 ou > 10 questões → erro de validação | componente + script |
| S39 | RN28, AC36 | Crase publicado | abrir | objetivos, explicação, exemplo comentado, conceitos, critério de domínio | campo vazio → erro de validação | componente + script |
| S40 | RN26, AC34 | banco suficiente; relógio controlado | iniciar simulado; avançar 4 h | 45 questões 10/5/10/20; encerra no tempo; brancos = erro; nota no histórico | — | componente |
| S41 | técnico (recarga) | simulado em andamento | recarregar a página | retoma com respostas e tempo restante | — | componente |
| S42 | RN27, AC35 | 6 de CGM | iniciar simulado | "simulado parcial: CGM 6 de 10"; nota "parcial", sem referência de 60 | — | componente |
| S43 | RN20, AC27 | simulados 58 e 70 | abrir histórico | ordem por data; "+12" | — | componente |
| S44 | RN21, AC28 | treino discursivo | preencher critérios | total ≤ 15; rótulo "autoavaliação" | critério acima do máximo → recusado | componente |
| S45 | RN22, AC29 | registros de exemplo | abrir painel | percentuais, taxas, tempo, revisões, evolução e temas fracos | — | componente |
| S46 | técnico (privacidade) | build | `npm run privacy` | `concurso.json`, teoria e questões ausentes dos arquivos públicos | — | script |
| S47 | técnico (peso inicial) | build | `npm run size` | JS inicial ≤ 150 KB gzip; telas do concurso em chunk sob demanda | — | script |
| S48 | técnico (zerar e backup) | registros locais | "Zerar tudo"; exportar/importar | registros zerados em todos os aparelhos; backup v4 leva e traz registros; v2/v3 continuam importáveis | — | unitário |
| S49 | técnico (navegação) | sessão; build de produção | e2e: mapa → concurso → hoje → tópico → questão → painel; 320 px; axe | sem rolagem horizontal; sem violação axe | — | e2e |

## Matriz de cobertura

| RN | ACs | Cenários | Teste |
|---|---|---|---|
| RN01 | AC01 | S01, S02 | validate, componente |
| RN02 | AC02, AC03 | S03, S04 | componente |
| RN03 | AC04 | S05 | unitário |
| RN04 | AC05 | S06 | componente, validate |
| RN05 | AC06 | S07 | componente |
| RN06 | AC07 | S08, S09 | validate, componente |
| RN07 | AC08, AC09 | S11, S12, S13 | unitário |
| RN08 | AC10, AC11 | S14, S15 | unitário |
| RN09 | AC12, AC13 | S16 | unitário, componente |
| RN10 | AC14 | S19 | unitário, componente |
| RN11 | AC15 | S20, S21 | unitário, componente |
| RN12 | AC16 | S17 | unitário |
| RN13 | AC17 | S18 | unitário |
| RN14 | AC18 | S27 | unitário |
| RN15 | AC19 | S36 | componente, validate |
| RN16 | AC20, AC21, AC31 | S28, S37 | unitário, componente |
| RN17 | AC22 | S29 | unitário |
| RN18 | AC23, AC24, AC25 | S30, S31, S32 | unitário |
| RN19 | AC26 | S33 | unitário |
| RN20 | AC27, AC34 | S40, S43 | componente |
| RN21 | AC28 | S44 | componente |
| RN22 | AC29 | S34, S45 | unitário, componente |
| RN23 | AC30 | S10 | componente |
| RN24 | AC31 | S37 | componente |
| RN25 | AC32, AC33 | S38 | componente, validate |
| RN26 | AC34 | S40, S41 | componente |
| RN27 | AC35 | S42 | componente |
| RN28 | AC36 | S39 | componente, validate |
| RN29 | AC37 | S35 | componente |
| técnico | — | S09, S13, S21–S26, S41, S46–S49 | vários |

**Gaps declarados**

- P9 (simulado conta na taxa?) ainda aberta: S29, S34 e S40 assumem só
  questões de fixação até a resposta; a tarefa T9 não começa sem ela.
- RN28/RN25 dependem do conteúdo de cada leva: o cenário prova o formato; a
  qualidade do texto e das questões é revisada pelo autor a cada leva.
- P8 (Lei nº 105/2011) mantém um tópico `pendente`: AC03 só fica verdadeiro
  depois da conferência pelo autor.
