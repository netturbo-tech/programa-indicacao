import { createFileRoute } from "@tanstack/react-router";
import { CadastroPage } from "../features/indicacao/pages/CadastroPage";

export const Route = createFileRoute("/cadastro")({
  component: Cadastro,
});

function Cadastro() {
  return <CadastroPage />;
}