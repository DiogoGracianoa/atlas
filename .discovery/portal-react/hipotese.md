# Hipótese — Portal Atlas em React

Acreditamos que **migrar a interface para React com TypeScript, organizar o site
como um portal de seções com rotas limpas e escrever documentação de
arquitetura** permitirá **ao autor acrescentar seções novas, como dossiês, sem
mexer no núcleo, e a quem avalia o portfólio entender o projeto rapidamente**.
Saberemos que funcionou quando:

1. **Seção nova sem mexer no núcleo:** acrescentar uma seção de teste ao portal
   exigir somente arquivos da própria seção e uma entrada no registro de seções,
   sem alterar o shell, a sincronização ou o armazenamento. Um teste automatizado
   comprova isso.
2. **Paridade funcional:** todo recurso do inventário da visão funcionar na nova
   base, e os dados de quem já usa abrirem sem perda.
3. **Documentação que se explica sozinha:** o README em inglês responder, sem
   precisar abrir código, o que o projeto faz, como a arquitetura se organiza,
   como a sincronização offline-first funciona e como rodar e testar. As decisões
   relevantes devem estar registradas como ADRs.
4. **Qualidade verificável:** CI verde com checagem de tipos estrita, testes,
   validação de conteúdo, testes do banco e build.

## Suposições

- O React com Vite atende sem SSR: o site é estático e não depende de SEO por
  página.
- A lógica atual de `assets/lib` e `assets/sync.js` pode ser portada para
  TypeScript sem mudar comportamento. Os testes existentes servem de rede de
  segurança.
- Rotas limpas funcionam na Vercel com reescrita para `index.html` e offline com
  fallback de navegação no service worker.

## Maior risco

Regressão silenciosa na sincronização ou no modo offline durante a troca de
base, que pode perder anotações ou marcações em aparelhos já em uso.

## Menor experimento

Portar primeiro o núcleo (store, merge, queue, sync) para TypeScript e rodar a
suíte atual adaptada antes de escrever qualquer tela.
