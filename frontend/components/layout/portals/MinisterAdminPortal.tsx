import { ReactNode } from 'react';
import PortalLayout from '../PortalLayout';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ClockIcon,
  MegaphoneIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@/types/user';

interface MinisterAdminPortalProps {
  children: ReactNode;
  title?: string;
}

export default function MinisterAdminPortal({
  children,
  title = 'Ministry Admin Dashboard',
}: MinisterAdminPortalProps) {
  const navItems = [
    // Dashboard & Overview
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },

    // Content Management
    { name: 'Live Stream', href: '/admin/live', icon: VideoCameraIcon },
    { name: 'Sermons', href: '/admin/sermons', icon: BookOpenIcon },
    { name: 'Events', href: '/admin/events', icon: CalendarIcon },
    { name: 'Announcements', href: '/admin/announcements', icon: MegaphoneIcon },

    // Community & Engagement
    { name: 'Members', href: '/admin/members', icon: UserGroupIcon },
    { name: 'Prayer Requests', href: '/admin/prayer-requests', icon: ChatBubbleLeftRightIcon },
    { name: 'Small Groups', href: '/admin/groups', icon: UserGroupIcon },

    // Communication
    { name: 'Messages', href: '/admin/messages', icon: EnvelopeIcon },
    { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },

    // Administration
    {
      name: 'User Management',
      href: '/admin/users',
      icon: ShieldCheckIcon,
      roles: [UserRole.ADMIN],
    },
    { name: 'Donations', href: '/admin/donations', icon: CurrencyDollarIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon },

    // User
    { name: 'My Profile', href: '/admin/profile', icon: UserCircleIcon },
  ];

  return (
    <PortalLayout userRole={UserRole.ADMIN} navItems={navItems} title={title}>
      {/* Header with quick actions */}
      <div className="pb-5 border-b border-gray-200">
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
              Ministry Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage your ministry and connect with your congregation.
            </p>
          </div>
          <div className="mt-4 flex flex-shrink-0 space-x-3 md:mt-0 md:ml-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <MegaphoneIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
              New Announcement
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <VideoCameraIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Go Live
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            name: 'Total Members',
            value: '1,234',
            icon: UserGroupIcon,
            change: '+12% from last month',
          },
          { name: 'Live Viewers', value: '247', icon: ClockIcon, change: 'Live Now', isLive: true },
          { name: 'Prayer Requests', value: '24', icon: ChatBubbleLeftRightIcon, change: '+5 new' },
          {
            name: "This Week's Giving",
            value: '$8,450',
            icon: CurrencyDollarIcon,
            change: '+24% from last week',
          },
        ].map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 rounded-md p-3 ${stat.isLive ? 'bg-red-500' : 'bg-indigo-500'}`}
                >
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
                <span
                  className={`text-sm ${stat.isLive ? 'text-red-600 font-medium' : 'text-gray-500'}`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="mt-8">{children}</div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {[
              {
                id: 1,
                user: 'John Doe',
                action: 'joined the ministry',
                time: '5 min ago',
                icon: UserGroupIcon,
              },
              {
                id: 2,
                user: 'Sarah Johnson',
                action: 'requested prayer',
                time: '1 hour ago',
                icon: ChatBubbleLeftRightIcon,
              },
              {
                id: 3,
                user: 'Michael Brown',
                action: 'donated $100',
                time: '2 hours ago',
                icon: CurrencyDollarIcon,
              },
              {
                id: 4,
                user: 'Emily Davis',
                action: 'registered for Sunday Service',
                time: '5 hours ago',
                icon: CalendarIcon,
              },
              {
                id: 5,
                user: 'Robert Wilson',
                action: 'sent a message',
                time: '1 day ago',
                icon: EnvelopeIcon,
              },
            ].map((activity) => (
              <li key={activity.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100">
                        <activity.icon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {activity.user}{' '}
                          <span className="text-gray-500 font-normal">{activity.action}</span>
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PortalLayout>
  );
}
