import { redirect } from "next/navigation";

// Old setup links now use the API-backed invitation flow.
export default function CreatePasswordPage() {
  redirect("/bonds/join");
}
