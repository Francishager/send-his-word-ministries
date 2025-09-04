import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { UserRole } from '@/types/user';

interface PortalLayoutProps {
  children: ReactNode;
  userRole: UserRole;
  navItems: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: UserRole[];
  }>;
  title?: string;
}

export default function PortalLayout({ 
  children, 
  userRole, 
  navItems, 
  title = 'Send His Word Portal' 
}: PortalLayoutProps) {
  const router = useRouter();
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-indigo-800 text-white">
          <div className="flex items-center justify-center h-16 px-4 bg-indigo-900">
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <div className="flex flex-col flex-grow overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-900 text-white'
                        : 'text-indigo-100 hover:bg-indigo-700 hover:bg-opacity-75'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        isActive ? 'text-indigo-300' : 'text-indigo-200'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            {/* User profile section */}
            <div className="p-4 mt-auto">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {userRole} Portal
                  </p>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-xs font-medium text-indigo-200 hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0">
            <div className="absolute inset-0 bg-gray-600 opacity-75" />
          </div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-indigo-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <span className="sr-only">Close sidebar</span>
                {/* Close icon */}
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-white">{title}</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {filteredNavItems.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-900 text-white'
                          : 'text-indigo-100 hover:bg-indigo-700 hover:bg-opacity-75'
                      }`}
                    >
                      <item.icon
                        className={`mr-4 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-indigo-300' : 'text-indigo-200'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-indigo-700 p-4">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-white">
                    {userRole} Portal
                  </p>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-xs font-medium text-indigo-200 hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-14">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
            <div>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open sidebar</span>
                {/* Menu icon */}
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            <div className="text-lg font-medium text-gray-900">
              {title}
            </div>
            <div className="w-6"></div> {/* For balance */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
