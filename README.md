<div align="center">
  <h1><img src="https://gocartshop.in/favicon.ico" width="20" height="20" alt="GoCart Favicon">
 ABOABO</h1>
  <p>
  ABOABO   is a centralized student marketplace built for University for Development Studies (UDS) students.
    It provides a single platform where students can showcase, sell, and discover products and services within the university community.

    The goal of ABOABO is simple:
    Make buying and selling on campus easier, safer, and more organized. 
  </p>
</div>

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## Features

- **Student Marketplace:** A centralized platform for UDS students to buy and sell products.
- **Vendor Registration:** Students can register and create their own stores.
- **Admin Approval System:** Stores must be approved before they can start selling.
- **Vendor Dashboard:** Vendors can manage their products and store.
- **Admin Dashboard:** Admin can manage stores, users, and products.
- **Authentication:** Secure login and signup with Clerk.
- **Automated Background Jobs:** Using Inngest for background tasks.
- **Image Upload:** Store logos and product images handled by ImageKit.
- **Database:** PostgreSQL database hosted on Neon using Prisma ORM.

## 🛠️ Tech Stack <a name="-tech-stack"></a>

- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React for icons
- **State Management:** Redux Toolkit

## 🚀 Getting Started <a name="-getting-started"></a>

First, install the dependencies. We recommend using `npm` for this project.

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/(public)/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Outfit](https://vercel.com/font), a new font family for Vercel.


---

## 📜 License <a name="-license"></a>

This project is licensed under the MIT License. See the [LICENSE.md](./LICENSE.md) file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
