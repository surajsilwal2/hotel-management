import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role;

  if (role === "ADMIN") redirect("/admin");
  if (role === "STAFF") redirect("/staff");
  redirect("/guest/rooms");
}
