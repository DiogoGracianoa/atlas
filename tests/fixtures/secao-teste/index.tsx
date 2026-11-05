// Seção de teste (RN08): só os próprios arquivos + uma entrada no registro.
// Usa o armazenamento real pelo mesmo hook que qualquer seção usaria.
import { useAppState } from "../../../src/app/context";
import type { Section } from "../../../src/sections/types";

function PaginaTeste() {
  const state = useAppState();
  return (
    <section>
      <h1>Seção de teste</h1>
      <p>Tema atual: {state.theme}</p>
    </section>
  );
}

function CartaoTeste() {
  return <p>Conteúdo extra do cartão de teste</p>;
}

export const secaoTeste: Section = {
  slug: "teste",
  nome: "Seção de teste",
  resumo: "Prova de que uma seção nova não exige mexer no núcleo.",
  status: "disponivel",
  routes: [{ index: true, element: <PaginaTeste /> }],
  Card: CartaoTeste,
};
