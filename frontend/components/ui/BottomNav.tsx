'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Video,
  Image,
  FolderOpen,
  Clock,
  Menu,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const defaultNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/app', label: 'Video', icon: Video },
  { href: '/app/image', label: 'Image', icon: Image },
  { href: '/app/library', label: 'Library', icon: FolderOpen },
  { href: '/jobs', label: 'Jobs', icon: Clock },
];

interface BottomNavProps {
  items?: NavItem[];
  showLabels?: boolean;
  className?: string;
}

export const BottomNav = memo(function BottomNav({
  items = defaultNavItems,
  showLabels = true,
  className,
}: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '/app') {
      return pathname === '/app' || pathname.startsWith('/app/video');
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'border-t border-gray-800 bg-gray-900/95 backdrop-blur-lg',
        'safe-area-pb',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 py-2 transition-colors',
                active ? 'text-purple-400' : 'text-gray-400 hover:text-gray-300'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-purple-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-medium text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              {showLabels && (
                <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

// Floating Action Button for mobile
interface FABProps {
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  label?: string;
  className?: string;
}

export const FloatingActionButton = memo(function FloatingActionButton({
  onClick,
  href,
  icon: Icon = Plus,
  label = 'Create',
  className,
}: FABProps) {
  const buttonClasses = cn(
    'fixed bottom-20 right-4 z-50 lg:hidden',
    'flex items-center gap-2 rounded-full bg-purple-600 px-4 py-3',
    'text-white shadow-lg shadow-purple-500/25',
    'transition-transform hover:scale-105 active:scale-95',
    className
  );

  const content = (
    <>
      <Icon className="h-5 w-5" />
      <span className="text-sm font-semibold">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={buttonClasses}>
      {content}
    </button>
  );
});

// Mobile Header with Hamburger Menu
interface MobileHeaderProps {
  title?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const MobileHeader = memo(function MobileHeader({
  title,
  onMenuClick,
  actions,
  className,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center justify-between lg:hidden',
        'border-b border-gray-800 bg-gray-900/95 backdrop-blur-lg px-4 py-3',
        'safe-area-pt',
        className
      )}
    >
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {title && (
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      )}

      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  );
});

// Tab Bar for in-page navigation
interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const TabBar = memo(function TabBar({
  tabs,
  activeTab,
  onTabChange,
  variant = 'pills',
  className,
}: TabBarProps) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto scrollbar-hide',
        variant === 'underline' && 'border-b border-gray-800',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors',
              variant === 'pills' && [
                'rounded-lg',
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              ],
              variant === 'underline' && [
                'border-b-2 -mb-px',
                isActive
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white',
              ]
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-700 px-1.5 text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
