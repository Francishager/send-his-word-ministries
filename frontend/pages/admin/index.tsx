import React from 'react';
import { withAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/layout/PortalLayout';
import { UserRole } from '@/types/user';

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>
);
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-6 8l-4-4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7z"/></svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87M16 3.13a4 4 0 0 1 0 7.75M8 3.13a4 4 0 1 0 0 7.75M12 14a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z"/></svg>
);
const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 11V3m4 18V3m-8 10v8M3 21h18"/></svg>
);
const CampaignIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
);

function AdminHome() {
  const navItems = [
    { name: 'Services', href: '/admin/services', icon: CalendarIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Moderation', href: '/admin/moderation', icon: ChatIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Users & Roles', href: '/admin/users', icon: UsersIcon, roles: [UserRole.ADMIN] },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
    { name: 'Campaigns', href: '/admin/campaigns', icon: CampaignIcon, roles: [UserRole.MINISTER, UserRole.ADMIN] },
  ];

  return (
    <PortalLayout userRole={UserRole.ADMIN} navItems={navItems} title="Minister / Admin Portal">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Welcome to the Ministry Console</h1>
        <p className="text-gray-600">Manage services, moderate chat & prayer, view analytics, and oversee donation campaigns.</p>
      </div>
    </PortalLayout>
  );
}

export default withAuth(AdminHome, [UserRole.MINISTER, UserRole.ADMIN]);
