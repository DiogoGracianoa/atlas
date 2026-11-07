# Análise — Acesso obrigatório por login

Data: 2026-11-06. Base: visão e sua extensão da mesma data. Sem `.sdd/` e sem
`projects/`; contexto suprido pelos documentos e código abaixo.

## Evidências observadas

| Origem | Comportamento atual | Divergência desejada |
|---|---|---|
| `src/app/routes.tsx` | portal, login e seções sob o mesmo Layout público | separar login da árvore protegida |
| `src/app/HeaderActions.tsx`, `src/app/Ajustes.tsx` | cabeçalho oferece ajustes/utilidades | login não deve expor dados ou exportação |
| `src/app/pages/Entrar.tsx`, `src/app/conta.tsx` | código/link existentes; sucesso vai a `/atlas`; mensagem permite uso anônimo | preservar autenticação; corrigir mensagens |
| `src/core/sync.ts` | `user=null` tanto durante inicialização quanto sem sessão; cliente carregado sob demanda | distinguir restauração, ausência e erro; obter token sem publicá-lo no estado |
| `src/app/services.ts`, `src/core/content.ts` | fetch público e cache de objetos por sessão da aplicação | fetch autenticado; invalidar memória ao mudar/perder sessão |
| `public/content/` | manifesto e dois currículos estáticos | retirar da distribuição pública sem alterar os textos |
| `src/sw.ts`, `src/sw-rules.ts` | NetworkFirst com cache `atlas-conteudo`; navegação usa shell offline | conteúdo só pela rede; limpar cache anterior |
| `vercel.json` | Vite estático, conteúdo com cache público; rewrite da SPA sem exceção para API | função autenticada, no-store e roteamento próprio |
| `scripts/validate.mjs`, `scripts/check-extract.mjs`, `tests/ui/harness.tsx`, `tests/core/helpers.ts` | leem conteúdo em `public/` | atualizar raiz dos arquivos preservados |
| `docs/adr/0010-conteudo-em-public.md`, `README.md` | conteúdo estático e demo pública documentados | registrar decisão nova e atualizar documentação operacional |

## Inferências e direção proposta

Uma função Node na Vercel permite reutilizar hospedagem e arquivos versionados,
sem introduzir banco de conteúdo ou credenciais privilegiadas. Ela deve validar
o token com Supabase Auth antes de ler arquivo. A guarda React resolve UX;
somente o servidor protege o download. A função não torna privado um repositório
público nem revoga cópias anteriores.

## Alternativas

1. **Guarda React somente:** insuficiente para RN04/RN05; descartada.
2. **Função na Vercel e arquivos privados no pacote servidor:** recomendada;
   acrescenta execução por requisição e depende de Auth online, mas evita upload
   separado do conteúdo e preserva o formato e a validação locais.
3. **Bucket privado no Supabase:** viável, com políticas e downloads autenticados;
   acrescenta publicação/sincronização dos arquivos em outro serviço. Não
   recomendado neste escopo, que já mantém os materiais junto ao código.

Direção ainda **proposta**, para aprovação no gate; não é decisão aprovada.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação/decisão |
|---|---|---|---|
| Cópia dos JSONs permanece em `dist`, mapas ou caminhos antigos | alta sem alteração | exposição anônima | inspeção do artefato e HTTP; não apenas teste da guarda |
| Cache anterior ou resposta tardia reaparece após saída | alta no fluxo atual | exposição local | expurgar cache legado, conteúdo só em memória por sessão, invalidar requisições |
| Token decodificado é tratado como autenticado | média | acesso indevido | validar no Auth; não confiar em campo fornecido pelo cliente |
| Serviço de Auth cai | possível | materiais indisponíveis | negar entrega e retornar erro temporário; aceito exigir conexão |
| Arquivos escapam pelo GitHub ou deploy antigo | não confirmada | privacidade global incompleta | auditoria de canais antes de declarar proteção em produção; confirmação para alterações externas |
| Testes antigos dependem de acesso anônimo | alta | falsos positivos ou regressão | fixture autenticada explícita e cenários anônimos próprios |
| Vite preview não executa funções da Vercel | certa | e2e sem testar o servidor real | servidor local de teste com o mesmo handler; validar pacote Vercel separadamente |

## Fontes primárias consultadas

- [Funções com Vite](https://vercel.com/docs/frameworks/frontend/vite).
- [Empacotamento de arquivos em funções](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions).
- [Configuração `functions.includeFiles`](https://vercel.com/docs/project-configuration/vercel-json).
- [Supabase getUser: validação remota do token](https://supabase.com/docs/reference/javascript/auth-getuser).
- [Alternativa: arquivos privados no Storage](https://supabase.com/docs/guides/storage/serving/downloads).

## Limites da inspeção

O conector GitHub anunciou `get_repo`, mas sua execução retornou ferramenta
desconhecida; a consulta web ao repositório também não confirmou visibilidade.
Nenhuma mudança externa realizada. A auditoria de distribuição continua sendo
gate de publicação, não uma suposição de que os materiais já são privados.
