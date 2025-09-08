import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { Calendar, Users, Settings, BarChart3, Video, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const dashboardItems = [
    {
      title: 'Live Services',
      description: 'Manage live streaming services',
      href: '/live',
      icon: Video,
      color: 'bg-red-500',
    },
    {
      title: 'Admin Services',
      description: 'Configure service schedules and streams',
      href: '/admin/services',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Testimonies',
      description: 'View and manage testimonies',
      href: '/testimony',
      icon: MessageSquare,
      color: 'bg-green-500',
    },
    {
      title: 'Donations',
      description: 'Donation management',
      href: '/donate',
      icon: BarChart3,
      color: 'bg-purple-500',
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      href: '/admin/users',
      icon: Users,
      color: 'bg-orange-500',
    },
    {
      title: 'Settings',
      description: 'System configuration',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-500',
    },
  ];

  return (
    <>
      <Head>
        <title>Dashboard - Send His Word Ministries</title>
        <meta name="description" content="Admin dashboard for Send His Word Ministries" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {session.user?.email}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/api/auth/signout"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Video className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Live Services
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Active
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {session.user?.role === 'admin' ? 'Admin' : 'User'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Testimonies
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          Available
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 p-3 rounded-md ${item.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
