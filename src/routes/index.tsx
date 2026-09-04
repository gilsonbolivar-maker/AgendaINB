import { createFileRoute } from "@tanstack/react-router";
import { AgendaApp } from "@/components/agenda/agenda-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AgendaApp />;
}
