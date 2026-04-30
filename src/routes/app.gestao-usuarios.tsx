import { createFileRoute } from "@tanstack/react-router";
import { GestaoUsuariosPage } from "../features/indicacao/pages/GestaoUsuariosPage";

export const Route = createFileRoute("/app/gestao-usuarios")({
  component: GestaoUsuariosPage,
});
