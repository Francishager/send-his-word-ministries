# Send His Word Ministries

A modern web application for Send His Word Ministries built with Next.js, TypeScript, and Tailwind
CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18.0 or higher
- npm 9.x or higher
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/send-his-word-ministries.git
   cd send-his-word-ministries
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update the environment variables in `.env.local` with your configuration.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `db:generate` - Generate Prisma client
- `db:migrate` - Run database migrations
- `db:studio` - Open Prisma Studio

## 🏗 Project Structure

```
.
├── .github/           # GitHub configurations
├── .husky/            # Git hooks
├── .next/             # Next.js build output
├── node_modules/      # Dependencies
├── prisma/            # Database schema and migrations
├── public/            # Static files
└── src/               # Source files
    ├── app/           # App Router
    ├── components/    # Reusable components
    ├── lib/           # Utility functions
    ├── pages/         # Pages router
    ├── styles/        # Global styles
    └── types/         # TypeScript type definitions
```

## 🔧 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Database**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **UI Components**: [Headless UI](https://headlessui.com/)
- **Icons**: [Heroicons](https://heroicons.com/)
- **Linting**: [ESLint](https://eslint.org/)
- **Formatting**: [Prettier](https://prettier.io/)
- **Git Hooks**: [Husky](https://typicode.github.io/husky/)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 💳 Payments (Stripe, Pesapal, M-Pesa)

This app supports multiple payment providers. All transactions are completed on the providers' platforms for security; our server creates sessions/orders and handles callbacks.

### Stripe

- Frontend pages:
  - `frontend/pages/give.tsx` and `frontend/pages/donate.tsx` support currency and Stripe Checkout.
  - Success page: `/payments/success`
  - Cancel page: `/payments/cancel`
- API routes:
  - Create session: `POST /api/payments/stripe/create-session`
  - Webhook: `POST /api/payments/stripe/webhook`
- Required env:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_SITE_URL` (used to build success/cancel URLs)
- Optional quick links (bypass server):
  - `NEXT_PUBLIC_STRIPE_LINK`

Set webhook endpoint in Stripe Dashboard to:

```
https://<your-site>/api/payments/stripe/webhook
```

### Pesapal (Placeholder scaffold)

- API routes:
  - Create order: `POST /api/payments/pesapal/create-order`
  - Callback: `GET|POST /api/payments/pesapal/callback`
- Env:
  - `PESAPAL_CONSUMER_KEY`
  - `PESAPAL_CONSUMER_SECRET`
  - `PESAPAL_CALLBACK_URL` (optional; defaults to site callback)

Configure Pesapal to call back to:

```
https://<your-site>/api/payments/pesapal/callback
```

### M-Pesa (Placeholder scaffold)

- API routes:
  - STK Push: `POST /api/payments/mpesa/stk-push`
  - Callback: `POST /api/payments/mpesa/callback`
- Env:
  - `MPESA_CONSUMER_KEY`
  - `MPESA_CONSUMER_SECRET`
  - `MPESA_SHORTCODE`
  - `MPESA_PASSKEY`
  - `MPESA_CALLBACK_URL` (optional; defaults to site callback)

Configure M-Pesa callback to:

```
https://<your-site>/api/payments/mpesa/callback
```

### Notes

- Stripe webhook requires raw body parsing; see `frontend/pages/api/payments/stripe/webhook.ts`.
- The Pesapal and M-Pesa endpoints here are scaffolds and do not process funds — they are intended to initiate provider-side flows and receive confirmations.
- For production, ensure your environment variables are set in your hosting provider and HTTPS is enabled.
- [React Query Documentation](https://tanstack.com/query/latest)
