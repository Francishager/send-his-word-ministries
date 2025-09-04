import { ReactNode } from 'react';
import PortalLayout from '../PortalLayout';
import { 
  HomeIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon,
  HeartIcon,
  BellIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { UserRole } from '@/types/user';

interface AttendeePortalProps {
  children: ReactNode;
  title?: string;
}

export default function AttendeePortal({ children, title = 'Attendee Dashboard' }: AttendeePortalProps) {
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Live Service', href: '/live', icon: ClockIcon },
    { name: 'Events', href: '/events', icon: CalendarIcon },
    { name: 'Prayer Requests', href: '/prayer-requests', icon: HeartIcon },
    { name: 'Community Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Sermons', href: '/sermons', icon: BookOpenIcon },
    { name: 'Small Groups', href: '/groups', icon: UserGroupIcon },
    { name: 'Notifications', href: '/notifications', icon: BellIcon },
    { name: 'My Profile', href: '/profile', icon: UserCircleIcon },
  ];

  return (
    <PortalLayout 
      userRole={UserRole.ATTENDEE} 
      navItems={navItems} 
      title={title}
    >
      {/* Header with welcome message */}
      <div className="pb-5 border-b border-gray-200">
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
              Welcome back, [User]!
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Here's what's happening in your ministry today.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CalendarIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
              View Calendar
            </button>
            <button
              type="button"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ClockIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Join Live Service
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-6">
        {children}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Upcoming Events', value: '3', icon: CalendarIcon, change: '+2 from last month' },
          { name: 'Prayer Requests', value: '5', icon: HeartIcon, change: '+3 from last week' },
          { name: 'Unread Messages', value: '2', icon: ChatBubbleLeftRightIcon, change: 'New' },
          { name: 'Community Members', value: '247', icon: UserGroupIcon, change: '+12 this month' },
        ].map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
