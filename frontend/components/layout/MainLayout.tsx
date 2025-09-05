import { ReactNode } from 'react';
import Head from 'next/head';
import SiteHeader from './SiteHeader';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function MainLayout({ 
  children, 
  title = 'Send His Word Ministries',
  description = 'A digital ministry platform for worship, prayer, and community engagement',
  className = '' 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Global navbar */}
      <SiteHeader />

      <main className={`flex-grow ${className}`}>
        {children}
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Send His Word Ministries</h3>
              <p className="text-gray-400">Connecting hearts to God's word</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Contact Us</a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Send His Word Ministries. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
