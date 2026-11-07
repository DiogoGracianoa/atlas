// Web Handler da Vercel; o mesmo handler é usado em desenvolvimento e nos testes.
import { serveContent } from "../server/conteudo.js";
export default { fetch: serveContent };
