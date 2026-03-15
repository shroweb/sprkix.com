import { redirect } from "next/navigation";

export default function LocalApiDocsPage() {
  // Convenience route for local development.
  redirect("/api-docs?baseUrl=http://localhost:3000/api/v1");
}

