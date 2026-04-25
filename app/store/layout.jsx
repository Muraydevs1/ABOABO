import StoreAuth from "@/app/store/StoreAuth";

export const metadata = {
    title: "AboaBo - Store Dashboard",
    description: "AboaBo - Store Dashboard",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <StoreAuth>
                {children}
            </StoreAuth>
        </>
    );
}
