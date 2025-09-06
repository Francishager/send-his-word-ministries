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
- [React Query Documentation](https://tanstack.com/query/latest)
