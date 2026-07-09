import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import authAdmin from "@/middlewares/authAdmin";
import AdminAuth  from "@/app/admin/AdminAuth";

export const metadata = {
  title: "AboaBo - Admin",
  description: "AboaBo - Admin",
};

export default async function RootAdminLayout({ children }) {
  // Server-side authorization: enforced before any admin shell renders.
  // Reuses the existing authAdmin helper — no duplicated role logic.
  const { userId } = await auth();
  if (!userId) redirect("/");

  const isAdmin = await authAdmin(userId);
  if (!isAdmin) redirect("/");

  return <AdminAuth>{children}</AdminAuth>;
}