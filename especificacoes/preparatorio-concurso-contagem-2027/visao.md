# Preparatório Concurso Contagem/MG 2027 — Analista de TI

## Resultado esperado

O estudante (hoje, o autor do portal) abre o Letrume e encontra o preparatório
do concurso da Prefeitura de Contagem/MG (Edital PMC nº 01/2026, IBGP, cargo
501 – Analista de TI): o programa vigente do edital, a trilha de dez semanas
(16/11/2026 a 23/01/2027), o que estudar hoje, o que falta, o que precisa de
revisão, seus erros, seus simulados e a contagem regressiva até a prova
prevista para 24/01/2027. Tudo o que é regra do edital mostra a fonte; tudo o
que é sugestão pedagógica aparece como sugestão.

**Persona:** candidato que estuda cerca de 10 h por semana, em casa e no
celular, e precisa saber onde está fraco. **Benefício:** cobrir todo o
programa vigente a tempo, sem estudar item revogado nem esquecer item novo.

Fonte da validação: [edital-vigente.md](edital-vigente.md) (Anexo IV Ret. 02,
validado em 2026-11-11).

## Escopo e não escopo

**Escopo**

- Programa oficial do cargo 501 em hierarquia Concurso › Disciplina › Módulo ›
  Tópico › Subtópico, com referência ao edital e estado de validação.
- Trilha de dez semanas, rotina diária sugerida, "hoje" e "esta semana".
- Estado de estudo por tópico, separado de leitura, desempenho e confiança.
- Edição do cronograma e reagendamento com histórico.
- Sessões de estudo e tempo previsto × realizado.
- Questões com disciplina, assunto, gabarito e comentário; tentativas; caderno
  de erros.
- Simulados com nota ponderada pelo Anexo III e histórico.
- Revisões espaçadas e lista de pendentes.
- Painel de progresso geral e por disciplina; contagem regressiva.
- Modelo reutilizável para outro concurso.
- Treino da discursiva, já confirmada pelo edital.

**Não escopo**

- Questões apresentadas como oficiais do IBGP sem fonte verificável.
- Local de prova, que não foi divulgado.
- Inscrição, pagamento ou acompanhamento de convocações.
- Mudanças visuais em outras seções do portal.
- Cadastro de outros estudantes (o cadastro público segue desativado).

**Projetos potencialmente impactados:** o portal na raiz (única aplicação do
repositório): conteúdo privado, núcleo, seções, banco Supabase. A renomeação
para Letrume é outro corte (`especificacoes/renomeacao-letrume/`).

## Regras de negócio

### Programa e fontes

- RN01 (programa rastreável): todo tópico obrigatório do preparatório tem
  disciplina, documento de origem, versão (ex.: "Anexo IV – Ret. nº 02, de
  09/11/2026"), página e estado de validação `verificado`, `pendente` ou
  `divergente`; um tópico sem essas informações não é publicado como
  obrigatório.
- RN02 (cobertura declarada): o preparatório só declara "programa conferido
  com o edital vigente" quando todos os tópicos obrigatórios estão
  `verificado`; com qualquer tópico `pendente` ou `divergente`, mostra quantos
  são e quais.
- RN03 (reforço opcional): conteúdo que não consta no Anexo IV vigente (ex.:
  "desenvolvimento local") aparece só numa seção "Reforço opcional" e não
  entra em nenhum percentual de progresso do edital.
- RN04 (dados da prova com fonte): data, horário, número de questões, pesos,
  nota mínima, discursiva e títulos só aparecem com a fonte (documento e item);
  dado sem fonte documental não é exibido.
- RN05 (sugestão ≠ regra): cronograma, metas de questões, rotina diária e
  intervalos de revisão aparecem rotulados como "sugestão pedagógica".

### Trilha e tempo

- RN06 (trilha de dez semanas): a trilha tem as semanas 1 a 10, de 16/11/2026
  a 23/01/2027, cada uma com título, tópicos de cada uma das quatro
  disciplinas e meta de questões, conforme o planejamento de 2026-11-11
  ajustado ao edital vigente.
- RN07 (hoje): o dia corrente é calculado no fuso de Brasília. O conteúdo do
  dia segue a rotina sugerida: segunda Língua Portuguesa; terça Raciocínio
  Lógico; quarta Conhecimentos Específicos; quinta Conhecimentos Gerais do
  Município; sexta Conhecimentos Específicos e exercícios; sábado revisão,
  questões e simulado; domingo correção de erros e revisão leve. Os tópicos do
  dia são os tópicos da semana corrente daquela disciplina ainda não
  concluídos.
- RN08 (fora da trilha): antes de 16/11/2026 o preparatório mostra "começa em
  N dias" e a semana 1; depois de 23/01/2027 nenhuma semana fica destacada.
- RN09 (contagem regressiva): mostra os dias que faltam até 24/01/2027 com o
  rótulo "data prevista no edital (item 9.2.1), sujeita a retificação"; no dia
  24/01/2027 mostra "A prova é hoje"; depois, "Prova realizada em
  24/01/2027".
- RN10 (reagendamento com histórico): o estudante pode mover um tópico para
  outra semana; o tópico guarda a semana planejada original, cada
  replanejamento com data e a data real de conclusão.
- RN11 (sessão de estudo): o estudante registra uma sessão com disciplina,
  tópicos, data e duração; o tempo realizado da semana é a soma das sessões; o
  tempo previsto é o da rotina (10 h por semana, editável).

### Estado do estudo

- RN12 (estado do tópico): cada tópico tem um estado: `não iniciado`, `em
  andamento`, `concluído` ou `revisão necessária`. Todo tópico começa em `não
  iniciado`.
- RN13 (lido ≠ dominado): leitura concluída, desempenho em questões e
  confiança (baixa, média, alta) são registros independentes; marcar a leitura
  não altera desempenho, confiança nem estado de domínio.
- RN14 (progresso honesto): o percentual de uma disciplina é tópicos
  obrigatórios `concluído` ÷ tópicos obrigatórios da disciplina; o total é a
  mesma conta sobre todas as disciplinas, sem ponderação por peso; tópicos
  opcionais ficam fora.

### Questões, erros e revisões

- RN15 (origem da questão): toda questão tem disciplina, tópico, enunciado,
  alternativas, gabarito, comentário e origem (`autoral` ou referência
  externa verificável); nenhuma é atribuída ao IBGP ou a uma prova anterior
  sem referência.
- RN16 (tentativa): cada resposta registra data, alternativa marcada e acerto;
  a taxa de acertos é acertos ÷ tentativas; sem tentativas, a taxa aparece como
  "sem dados", nunca como 0%.
- RN17 (caderno de erros): uma tentativa errada põe a questão no caderno de
  erros com espaço para anotação; ela sai do caderno quando o estudante a
  acerta numa nova tentativa ou a marca como revisada.
- RN18 (revisão espaçada): ao concluir a leitura de um tópico na data D, são
  sugeridas revisões em D+1, D+7 e D+21; revisão que cairia depois de
  23/01/2027 não é criada. Revisão pendente é a que tem data até hoje e não foi
  feita.

### Simulados e painel

- RN19 (nota do simulado): a nota da objetiva é LP acertos × 2 + RL acertos × 2
  + CGM acertos × 1 + CE acertos × 3, de 0 a 100, com o mínimo de 60 pontos do
  edital como referência (Anexo III Ret. 01).
- RN20 (histórico de simulados): cada simulado guarda data, acertos por
  disciplina e nota; o histórico mostra a evolução por data e tentativa.
- RN21 (treino discursivo): o treino da discursiva usa o formato do edital
  (caso prático, até 10 linhas, 15 pontos) e a autoavaliação pelos cinco
  critérios do item 9.4.3; a nota é sempre rotulada "autoavaliação".
- RN22 (painel): o painel mostra, com dados reais: percentual concluído por
  disciplina e total; taxa de acertos geral, por disciplina e por tópico; tempo
  previsto, realizado e acumulado; revisões pendentes e feitas; evolução dos
  simulados; os cinco tópicos de menor taxa de acertos com ao menos uma
  tentativa.

### Reuso

- RN23 (concurso como dado): outro concurso pode ser cadastrado com o próprio
  programa, quadro de provas, data e trilha sem alterar o código do portal.

## Critérios de aceite

- AC01 — tópico rastreável: Dado o tópico "Endereçamento IP, máscaras e
  sub-redes", Quando abro o tópico, Então vejo "Conhecimentos Específicos ·
  Anexo IV – Ret. nº 02, de 09/11/2026 · p. 5" e o selo "verificado".
- AC02 — cobertura não confirmada: Dado o tópico "Plano de Cargos, Carreira e
  Salários (Lei Municipal nº 105/2011)" com validação `pendente`, Quando abro a
  capa do preparatório, Então vejo "1 tópico pendente de conferência com o
  edital" com link para ele, e não vejo "programa conferido".
- AC03 — cobertura confirmada: Dado que todos os tópicos obrigatórios estão
  `verificado`, Quando abro a capa, Então vejo "Programa conferido com o Anexo
  IV – Ret. nº 02".
- AC04 — reforço opcional: Dado o tópico opcional "Desenvolvimento local de
  Contagem" concluído e nenhum obrigatório de Conhecimentos Gerais concluído,
  Quando vejo o painel, Então Conhecimentos Gerais mostra 0%.
- AC05 — dado da prova com fonte: Dada a capa do preparatório, Quando vejo a
  composição da prova, Então vejo "45 questões · LP 10 (peso 2) · RL 5 (peso
  2) · CGM 10 (peso 1) · CE 20 (peso 3)" com a fonte "Anexo III – Ret. nº 01",
  e não vejo local de prova.
- AC06 — sugestão rotulada: Dada a semana 4, Quando vejo a meta "100 questões e
  um simulado parcial", Então ela tem o rótulo "sugestão pedagógica".
- AC07 — trilha: Dado o preparatório, Quando abro a trilha, Então vejo dez
  semanas, a semana 1 de 16/11/2026 a 22/11/2026 e a semana 10 de 18/01/2027 a
  23/01/2027, cada uma com tópicos das quatro disciplinas.
- AC08 — hoje: Dado que hoje é quarta-feira, 02/12/2026 (semana 3), e o tópico
  "Endereçamento IP" não está concluído, Quando abro o preparatório, Então
  "Hoje" mostra Conhecimentos Específicos com os tópicos de redes da semana 3,
  incluindo "Endereçamento IP".
- AC09 — hoje no fim de semana: Dado que hoje é sábado, 05/12/2026, Quando abro
  o preparatório, Então "Hoje" mostra revisão, questões e simulado, com as
  revisões pendentes.
- AC10 — antes do início: Dado que hoje é 11/11/2026, Quando abro o
  preparatório, Então vejo "Começa em 5 dias" e a semana 1.
- AC11 — depois da trilha: Dado que hoje é 25/01/2027, Quando abro a trilha,
  Então nenhuma semana está destacada como atual.
- AC12 — contagem: Dado que hoje é 14/01/2027, Quando abro o preparatório,
  Então vejo "Faltam 10 dias" e "data prevista no edital (item 9.2.1), sujeita
  a retificação".
- AC13 — dia da prova e depois: Dado que hoje é 24/01/2027, Quando abro o
  preparatório, Então vejo "A prova é hoje"; e dado 26/01/2027, vejo "Prova
  realizada em 24/01/2027".
- AC14 — reagendar: Dado o tópico "Crase" planejado para a semana 5, Quando o
  movo para a semana 7 em 20/12/2026, Então ele aparece na semana 7 e o
  histórico mostra "planejado: semana 5 · replanejado em 20/12/2026 para a
  semana 7".
- AC15 — sessão: Dadas sessões de 1 h e 1 h 30 na semana 2 com previsão de
  10 h, Quando vejo a semana 2, Então vejo "2 h 30 de 10 h".
- AC16 — estado inicial: Dado um preparatório recém-aberto, Quando vejo
  qualquer tópico, Então ele está "não iniciado".
- AC17 — lido ≠ dominado: Dado o tópico "Crase" com taxa de acertos 40% e
  confiança "baixa", Quando marco a leitura como concluída, Então a taxa
  continua 40%, a confiança continua "baixa" e o estado não muda sozinho para
  "concluído".
- AC18 — percentual: Dados 30 tópicos obrigatórios de Raciocínio Lógico com 6
  concluídos e 4 em "revisão necessária", Quando vejo o painel, Então
  Raciocínio Lógico mostra 20%.
- AC19 — origem da questão: Dada uma questão autoral, Quando a abro, Então vejo
  a origem "autoral" e não vejo "IBGP" como autor.
- AC20 — sem dados: Dado um tópico sem tentativas, Quando vejo seu desempenho,
  Então vejo "sem dados".
- AC21 — taxa: Dadas 10 tentativas em "Regência" com 7 acertos, Quando vejo o
  tópico, Então vejo 70%.
- AC22 — caderno de erros: Dada uma questão errada em 03/12/2026, Quando abro o
  caderno de erros, Então ela está lá; e Quando a acerto numa nova tentativa,
  Então ela sai do caderno e a tentativa errada continua no histórico.
- AC23 — revisão espaçada: Dada a leitura de "Crase" concluída em 14/12/2026,
  Quando vejo as revisões, Então há revisões em 15/12/2026, 21/12/2026 e
  04/01/2027.
- AC24 — revisão após a trilha: Dada a leitura concluída em 10/01/2027, Quando
  vejo as revisões, Então há revisões em 11/01/2027 e 17/01/2027, e nenhuma em
  31/01/2027.
- AC25 — revisão pendente: Dada a revisão de 15/12/2026 não feita, Quando abro
  o preparatório em 16/12/2026, Então ela aparece em "revisões pendentes".
- AC26 — nota: Dado um simulado com LP 8, RL 3, CGM 6 e CE 14 acertos, Quando o
  registro, Então a nota é 16 + 6 + 6 + 42 = 70 de 100, acima da referência de
  60.
- AC27 — histórico de simulados: Dados simulados em 13/12/2026 (58) e
  03/01/2027 (70), Quando vejo o histórico, Então vejo os dois em ordem de data
  com a evolução de +12.
- AC28 — discursiva: Dado um treino discursivo, Quando faço a autoavaliação,
  Então informo os cinco critérios (6,0; 3,0; 1,5; 3,0; 1,5), vejo o total de
  até 15 e o rótulo "autoavaliação".
- AC29 — temas fracos: Dados "Crase" 30%, "Sub-redes" 45%, "Regência" 50%,
  "Herança" 55%, "MMC" 60% e "Porcentagem" 90%, e "Probabilidade" sem
  tentativas, Quando vejo o painel, Então os temas fracos são os cinco
  primeiros nessa ordem e "Probabilidade" não aparece.
- AC30 — outro concurso: Dado o cadastro de um segundo concurso apenas com
  dados, Quando abro o portal, Então ele aparece com programa, trilha e
  contagem próprios, sem mudança de código.

## Exemplos e limites

- Semanas: 1 = 16–22/11/2026; 2 = 23–29/11; 3 = 30/11–06/12; 4 = 07–13/12;
  5 = 14–20/12; 6 = 21–27/12; 7 = 28/12/2026–03/01/2027; 8 = 04–10/01;
  9 = 11–17/01; 10 = 18–23/01/2027 (seis dias).
- Nota da objetiva: mínimo 0, máximo 10×2 + 5×2 + 10×1 + 20×3 = 100.
- Discursiva: 2 questões × 15 = 30 pontos; aprovação a partir de 18 (60%).
- Inscrições terminam em 17/11/2026 às 16h (página do concurso); o portal não
  trata disso, mas o candidato precisa confirmar a inscrição no cargo 501.

## Rastreabilidade

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN01 | AC01 | tópico com fonte e selo | Definido |
| RN02 | AC02, AC03 | cobertura pendente e confirmada | Definido |
| RN03 | AC04 | opcional fora do percentual | Definido |
| RN04 | AC05 | composição com fonte, sem local | Definido |
| RN05 | AC06 | meta rotulada | Definido |
| RN06 | AC07 | dez semanas com datas | Definido |
| RN07 | AC08, AC09 | dia útil e sábado | Definido; distribuição pode mudar (P6) |
| RN08 | AC10, AC11 | antes e depois da trilha | Definido |
| RN09 | AC12, AC13 | contagem, dia e pós-prova | Definido |
| RN10 | AC14 | reagendamento com histórico | Definido |
| RN11 | AC15 | tempo da semana | Definido |
| RN12 | AC16 | estado inicial | Parcial: transições automáticas em aberto (P7) |
| RN13 | AC17 | leitura não altera domínio | Definido |
| RN14 | AC18 | percentual por disciplina | Definido |
| RN15 | AC19 | origem autoral | Bloqueado (P1, P3) |
| RN16 | AC20, AC21 | sem dados e taxa | Bloqueado (P1) |
| RN17 | AC22 | entrada e saída do caderno | Bloqueado (P1) |
| RN18 | AC23, AC24, AC25 | datas, corte e pendência | Definido |
| RN19 | AC26 | nota ponderada | Definido |
| RN20 | AC27 | histórico | Bloqueado (P2) |
| RN21 | AC28 | autoavaliação | Definido |
| RN22 | AC29 | temas fracos | Definido |
| RN23 | AC30 | segundo concurso por dados | Definido |

## Perguntas em aberto

- P1 (bloqueante) Questões: o portal deve ter um banco próprio de questões
  respondidas dentro dele, permitir só registrar o resultado de questões
  resolvidas em outro lugar (ex.: "fiz 20 de Crase, acertei 14"), ou os dois?
  Impacto: RN15–RN17, AC19–AC22, volume de conteúdo. Responsável: autor.
- P2 (bloqueante) Simulados: são feitos dentro do portal (45 questões com tempo)
  ou o portal só registra a nota de simulados feitos fora? Impacto: RN20,
  AC27, necessidade de banco com ao menos 45 questões por simulado.
  Responsável: autor.
- P3 (bloqueante) Teoria e questões autorais: o portal deve trazer explicação
  teórica e exemplos escritos para cada tópico (como os temas atuais, escritos
  com IA e revisados pelo autor) ou apontar materiais externos? Quantas
  questões autorais por tópico? Impacto: escopo do corte 5 e prazo da semana 1
  (16/11/2026). Responsável: autor.
- P4 (bloqueante) Cortes e prazo: o que precisa estar no ar em 16/11/2026? A
  proposta é o corte 1 (programa, trilha, hoje, status, contagem) até lá e os
  demais em sequência. Impacto: ordem do plano. Responsável: autor.
- P5 (bloqueante) Onde fica: nova seção "Concursos" na tela inicial
  (`/concursos/contagem-2027`), ao lado da seção de estudos, ou dentro da seção
  de estudos? Impacto: AC "localizar facilmente o concurso" e navegação.
  Responsável: autor.
- P6 Rotina × pesos: os Conhecimentos Específicos valem 60% da objetiva e toda
  a discursiva, mas a rotina sugerida dá cerca de 3 h de 10 h (30%) a eles.
  Manter a rotina recebida ou rebalancear a sugestão? Impacto: RN07.
  Responsável: autor.
- P7 Estado automático: o tópico deve ir sozinho para "revisão necessária"
  quando a taxa de acertos ficar abaixo de um limite (ex.: 60%) ou quando uma
  revisão vencer, ou só o estudante muda o estado? Impacto: RN12.
  Responsável: autor.
- P8 Lei do PCCS: o edital cita "Lei Municipal nº 105/2011"; o planejamento
  dizia "Lei Complementar nº 105/2011". O autor confirma a espécie normativa ao
  ler a lei? Impacto: rótulo do tópico (fica `pendente` até lá). Responsável:
  autor.

## Gate funcional

**Em esclarecimento.** P1 a P5 são bloqueantes; o planejamento aguarda as
respostas.

## Extensão 2026-11-11 — respostas do autor

O autor respondeu às perguntas bloqueantes. As perguntas acima ficam como
histórico.

| Pergunta | Resposta |
|---|---|
| P1 Questões | **Banco próprio no portal**: questões autorais respondidas dentro do portal, com gabarito e comentário. |
| P2 Simulados | **No portal**: simulados de 45 questões, com tempo, montados com o banco próprio. |
| P3 Teoria e volume | **Teoria autoral em levas** (explicação, exemplos comentados, conceitos), escrita aqui e revisada pelo autor; **8 a 10 questões autorais por tópico**. |
| P4 Prazo | **Tudo antes de começar**: as funcionalidades obrigatórias ficam prontas antes do início do estudo no portal, mesmo que o início passe de 16/11/2026. O conteúdo (teoria e questões) segue em levas. |
| P5 Onde fica | **Dentro da seção de estudos** (Atlas de estudos), como área própria do mapa. |

Perguntas não bloqueantes P6, P7 e P8: até nova resposta, vale a rotina
recebida (P6, editável pelo estudante), o estado do tópico muda só por ação do
estudante (P7) e o tópico do PCCS fica `pendente` (P8).

### Regras acrescentadas

- RN24 (banco próprio): o estudante responde as questões dentro do portal; ao
  confirmar a alternativa, vê se acertou, o gabarito e o comentário, e a
  tentativa é registrada (RN16).
- RN25 (volume por tópico): todo tópico obrigatório com conteúdo publicado tem
  de 8 a 10 questões autorais; tópico ainda sem conteúdo aparece como "conteúdo
  em preparação" e não oferece questões.
- RN26 (simulado no portal): um simulado completo tem 45 questões na
  distribuição do Anexo III (10 LP, 5 RL, 10 CGM, 20 CE), sorteadas do banco
  entre tópicos publicados, com tempo de 4 h; ao terminar ou ao esgotar o
  tempo, a nota é calculada pela RN19 e guardada no histórico (RN20).
- RN27 (simulado parcial): se faltarem questões publicadas para a distribuição
  completa, o portal oferece simulado parcial, informa quantas questões de cada
  disciplina tem e rotula a nota como "parcial", sem compará-la aos 60 pontos.
- RN28 (teoria por tópico): todo tópico com conteúdo publicado tem objetivos,
  explicação teórica, ao menos um exemplo comentado, conceitos principais e
  critério de domínio; o conteúdo é autoral (sem cópia de material de
  terceiros).
- RN29 (local): o preparatório é uma área do Atlas de estudos, com cartão no
  mapa, e reaproveita a identidade visual da seção.

### Critérios acrescentados

- AC31 — responder: Dada a questão autoral de "Crase" com gabarito C, Quando
  marco B e confirmo, Então vejo "errou", o gabarito C e o comentário, e a
  tentativa conta na taxa do tópico.
- AC32 — volume: Dado o tópico "Crase" publicado, Quando abro suas questões,
  Então há entre 8 e 10.
- AC33 — tópico sem conteúdo: Dado o tópico "Probabilidade" ainda não
  publicado, Quando o abro, Então vejo "conteúdo em preparação" e nenhuma
  questão.
- AC34 — simulado completo: Dado um banco com ao menos 10 LP, 5 RL, 10 CGM e 20
  CE publicadas, Quando inicio um simulado, Então recebo 45 questões nessa
  distribuição e um cronômetro de 4 h; Quando o tempo acaba, Então o simulado é
  encerrado, as questões em branco contam como erro e a nota vai para o
  histórico.
- AC35 — simulado parcial: Dadas só 6 questões de CGM publicadas, Quando
  inicio um simulado, Então vejo "simulado parcial: CGM 6 de 10" e a nota fica
  rotulada "parcial", sem a referência de 60 pontos.
- AC36 — teoria: Dado o tópico "Crase" publicado, Quando o abro, Então vejo
  objetivos, explicação, exemplo comentado, conceitos e critério de domínio.
- AC37 — local: Dado o mapa do Atlas de estudos, Quando o abro, Então vejo o
  cartão do preparatório de Contagem com o progresso.

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN15 | AC19 | origem autoral | Definido (P1, P3 respondidas) |
| RN16 | AC20, AC21, AC31 | sem dados, taxa, resposta | Definido |
| RN17 | AC22 | caderno de erros | Definido |
| RN20 | AC27, AC34 | histórico | Definido |
| RN24 | AC31 | responder no portal | Definido |
| RN25 | AC32, AC33 | volume e tópico sem conteúdo | Definido |
| RN26 | AC34 | simulado completo com tempo | Definido |
| RN27 | AC35 | simulado parcial | Definido |
| RN28 | AC36 | teoria do tópico | Definido |
| RN29 | AC37 | cartão no mapa | Definido |

### Gate funcional

**Pronto para planejamento.** Nenhuma pergunta bloqueante; P6–P8 seguem com o
comportamento declarado acima.

## Extensão 2026-11-11 — pergunta surgida no planejamento

- P9 (bloqueante somente para a tarefa de simulados, T9) As respostas dadas
  num simulado contam como tentativas do tópico (entram na taxa de acertos da
  RN16 e, se erradas, no caderno de erros da RN17), ou o simulado fica separado
  das questões de fixação? Impacto: RN16, RN17, AC21, AC22, AC29.
  Responsável: autor.
