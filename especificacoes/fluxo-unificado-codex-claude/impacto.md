# Impacto — fluxo unificado para Codex e Claude

| Projeto ou superfície | Papel atual | Mudança | Motivo | Dependências | Ordem | Efeito |
|---|---|---|---|---|---|---|
| Regras da raiz | Define o fluxo global em `AGENTS.md` | Atualizar fluxo e gates | RN01–RN06 | Skills canônicas | 2 | Altera documentação operacional |
| Skills Codex | Fonte dos 11 comandos em `.agents/skills/` | Ajustar orquestração e política de protótipo | RN02–RN06, RN10 | `AGENTS.md` | 2 | Altera comportamento dos comandos |
| Integração Claude | Inexistente | Criar `CLAUDE.md` e 11 adaptadores | RN07–RN09 | Skills canônicas | 3 | Adiciona compatibilidade |
| Documentação de uso | Descreve fluxo antigo | Documentar entrada única, gate e protótipo sob demanda | RN01–RN09 | Regras e catálogos | 4 | Altera documentação |
| Validação estrutural | Valida somente Codex | Validar fluxo, paridade e apontamentos Claude | AC05–AC08 | Todos os arquivos anteriores | 1 e 5 | Altera teste |

Nenhum diretório `projects/` ou projeto consumidor existe neste repositório;
portanto não há outro alvo que exija mudança ou validação local.
