import { createFileRoute } from "@tanstack/react-router";
import { ConfiguracoesPage } from "../features/indicacao/pages/ConfiguracoesPage";

export const Route = createFileRoute("/app/configuracoes")({
  component: ConfiguracoesPage,
});
