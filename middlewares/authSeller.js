import { prisma } from "@/lib/prisma";

export default async function authSeller(userId) {
  try {
    if (!userId) return false;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { store: true },
    });

    // console.log("USER:", user);
    // console.log("STORE:", user?.store);

    if (user?.store?.status === "approved") {
      return user.store.id;
    }

    return false;

  } catch (error) {
    console.error(error);
    return false;
  }
}