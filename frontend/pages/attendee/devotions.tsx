import React from 'react';
import { withAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/layout/PortalLayout';
import { UserRole } from '@/types/user';

const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 20l9-4V6l-9 4-9-4v10l9 4zM3 6l9 4 9-4"
    />
  </svg>
);
const NoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 20h9M12 4h9M4 8h16M4 16h16"
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

function DevotionsPage() {
  const navItems = [
    { name: 'Dashboard', href: '/attendee', icon: NoteIcon, roles: [UserRole.ATTENDEE] },
    {
      name: 'Devotions',
      href: '/attendee/devotions',
      icon: BookOpenIcon,
      roles: [UserRole.ATTENDEE],
    },
    { name: 'Bible', href: '/attendee/bible', icon: BookOpenIcon, roles: [UserRole.ATTENDEE] },
    { name: 'Giving', href: '/attendee/giving', icon: HeartIcon, roles: [UserRole.ATTENDEE] },
  ];

  return (
    <PortalLayout userRole={UserRole.ATTENDEE} navItems={navItems} title="Attendee Portal">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Devotions</h1>
        <p className="text-gray-600">Read today’s devotional and save your favorites.</p>
        <div className="rounded-md border p-4 bg-white">
          Coming soon: devotion feed & save interactions.
        </div>
      </div>
    </PortalLayout>
  );
}

export default withAuth(DevotionsPage, [UserRole.ATTENDEE, UserRole.MINISTER, UserRole.ADMIN]);
