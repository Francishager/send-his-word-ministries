# Send His Word Ministries

A modern, role-based web application for Send His Word Ministries, featuring live streaming, prayer requests, devotionals, and community engagement tools.

## Features

- **Role-based access control** (Public, Attendee, Minister, Admin)
- **Live streaming** with chat and prayer requests
- **Devotionals & Bible study tools**
- **Prayer request system** with private 1:1 prayer rooms
- **Donation processing** with multiple payment methods
- **Community engagement** features

## Tech Stack

- **Frontend**: Next.js 13+ with TypeScript, Tailwind CSS
- **Backend**: Node.js with Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Realtime**: Socket.IO
- **Authentication**: NextAuth.js
- **Payments**: Stripe, Mobile Money integration

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env.local`)
4. Run the development server: `npm run dev`

## Development

- Run development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`
- Run tests: `npm test`

## Project Structure

- `/app` - Next.js 13+ app directory
- `/components` - Reusable UI components
- `/lib` - Utility functions and configurations
- `/prisma` - Database schema and migrations
- `/public` - Static assets

## License

MIT
