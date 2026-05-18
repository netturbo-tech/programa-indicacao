import { createFileRoute } from "@tanstack/react-router";
import { PerfilPage } from "../features/indicacao/pages/PerfilPage";

export const Route = createFileRoute("/app/perfil")({
  component: PerfilPage,
});
