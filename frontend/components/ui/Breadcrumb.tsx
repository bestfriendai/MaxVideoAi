'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  separator?: React.ReactNode;
  maxItems?: number;
  className?: string;
}

// Route to label mapping for automatic breadcrumbs
const routeLabels: Record<string, string> = {
  app: 'Generate',
  dashboard: 'Dashboard',
  jobs: 'Jobs',
  library: 'Library',
  settings: 'Settings',
  billing: 'Billing',
  image: 'Image',
  video: 'Video',
  admin: 'Admin',
  team: 'Team',
  templates: 'Templates',
  analytics: 'Analytics',
  moderation: 'Moderation',
  users: 'Users',
  transactions: 'Transactions',
  engines: 'Engines',
  playlists: 'Playlists',
  'audit-log': 'Audit Log',
  legal: 'Legal',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  takedown: 'Takedown Request',
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip route groups (segments starting with parentheses)
    if (segment.startsWith('(') && segment.endsWith(')')) {
      continue;
    }

    // Check if it's a dynamic segment (e.g., [id])
    if (segment.startsWith('[') && segment.endsWith(']')) {
      continue;
    }

    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

export const Breadcrumb = memo(function Breadcrumb({
  items,
  showHome = true,
  separator,
  maxItems = 4,
  className,
}: BreadcrumbProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const generatedItems = items || generateBreadcrumbs(pathname ?? '/');

    if (generatedItems.length <= maxItems) {
      return generatedItems;
    }

    // Show first item, ellipsis, and last (maxItems - 2) items
    const firstItem = generatedItems[0];
    const lastItems = generatedItems.slice(-(maxItems - 2));

    return [
      firstItem,
      { label: '...', href: undefined },
      ...lastItems,
    ];
  }, [items, pathname, maxItems]);

  const separatorElement = separator || (
    <ChevronRight className="h-4 w-4 text-gray-600" aria-hidden="true" />
  );

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        {showHome && (
          <>
            <li>
              <Link
                href="/dashboard"
                className="flex items-center text-gray-400 hover:text-white transition-colors"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
            <li aria-hidden="true" className="flex items-center">
              {separatorElement}
            </li>
          </>
        )}

        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = item.icon;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'flex items-center gap-1.5',
                      isLast ? 'font-medium text-white' : 'text-gray-500'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="flex items-center">
                  {separatorElement}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
});

// Page Header with Breadcrumb
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader = memo(function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <Breadcrumb items={breadcrumbs} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-gray-400">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});

// Section Header for in-page sections
interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader = memo(function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && (
          <p className="text-sm text-gray-400">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
});
