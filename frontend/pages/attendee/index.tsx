import React from 'react';
import { withAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/layout/PortalLayout';
import { UserRole } from '@/types/user';

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V12H9v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V10z"
    />
  </svg>
);
const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v14H6.5A2.5 2.5 0 0 1 4 18.5V4.5z"
    />
  </svg>
);
const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 21.364 4.318 12.682a4.5 4.5 0 0 1 0-6.364z"
    />
  </svg>
);

function AttendeeHome() {
  const navItems = [
    { name: 'Dashboard', href: '/attendee', icon: HomeIcon, roles: [UserRole.ATTENDEE] },
    { name: 'Notices', href: '/attendee/notices', icon: BookIcon, roles: [UserRole.ATTENDEE] },
    { name: 'Giving', href: '/attendee/giving', icon: HeartIcon, roles: [UserRole.ATTENDEE] },
  ];

  return (
    <PortalLayout userRole={UserRole.ATTENDEE} navItems={navItems} title="Attendee Portal">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Welcome</h1>
        <p className="text-gray-600">
          This is your personal dashboard. From here you can manage your notices, read devotions,
          and view your giving history.
        </p>
      </div>
    </PortalLayout>
  );
}

export default withAuth(AttendeeHome, [UserRole.ATTENDEE, UserRole.MINISTER, UserRole.ADMIN]);
