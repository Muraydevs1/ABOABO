import AdminAuth  from "@/app/admin/AdminAuth";

export const metadata = {
  title: "AboaBo - Admin",
  description: "AboaBo - Admin",
};

export default function RootAdminLayout({ children }) {
  return <AdminAuth>{children}</AdminAuth>;
}