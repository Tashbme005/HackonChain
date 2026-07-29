import { createFileRoute, redirect } from "@tanstack/react-router";

/** About is now the home page (`/`). */
export const Route = createFileRoute("/about")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "about" });
  },
  component: () => null,
});
