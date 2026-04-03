const { prisma } = require("@/lib/prisma");

export default async function authSeller(userId) {
    try{
        const user = await prisma.user.findFirst({
            where:{id: userId},
            include: {store: true}
        })

        if(user.store){
            if(user.store.status ==='approved'){
                return user.store.id
            }
        } else{
             return false;
        }
    } catch (error){
        console.log(error);
        return false
        
    }
}