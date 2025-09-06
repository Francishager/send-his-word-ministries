import { ReactNode } from 'react';
import MainLayout from '../MainLayout';
import {
  HomeIcon,
  CalendarIcon,
  InformationCircleIcon,
  UserGroupIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

interface PublicPortalProps {
  children: ReactNode;
  title?: string;
}

export default function PublicPortal({ children, title }: PublicPortalProps) {
  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'About Us', href: '/about', icon: InformationCircleIcon },
    { name: 'Ministries', href: '/ministries', icon: UserGroupIcon },
    { name: 'Events', href: '/events', icon: CalendarIcon },
    { name: 'Sermons', href: '/sermons', icon: BookOpenIcon },
  ];

  return (
    <MainLayout title={title}>
      {/* Hero Section */}
      <div className="bg-indigo-700 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Welcome to Send His Word Ministries
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-indigo-100">
            Join us in worship, prayer, and community as we grow together in faith and service.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <a
              href="/register"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10"
            >
              Join Us
            </a>
            <a
              href="/live"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-10"
            >
              Watch Live
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">{children}</div>

      {/* Upcoming Events Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
            Upcoming Events
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((event) => (
              <div key={event} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <CalendarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5">
                      <p className="text-lg font-medium text-gray-900">Sunday Service</p>
                      <p className="text-sm text-gray-500">Every Sunday at 10:00 AM</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Join us for our weekly worship service with inspiring messages and fellowship.
                    </p>
                  </div>
                  <div className="mt-5">
                    <a
                      href="/events"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View all events <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
