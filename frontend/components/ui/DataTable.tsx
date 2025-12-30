'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Input } from './Input';
import { Skeleton } from './Skeleton';

// Column definition
export interface Column<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  cell?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

// Sort state
export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

// Filter state
export interface FilterState {
  [key: string]: string;
}

// Pagination state
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// DataTable props
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  // Sorting
  sortable?: boolean;
  sortState?: SortState;
  onSort?: (state: SortState) => void;
  // Filtering
  filterable?: boolean;
  filterState?: FilterState;
  onFilter?: (state: FilterState) => void;
  globalSearch?: boolean;
  searchPlaceholder?: string;
  // Pagination
  pagination?: PaginationState;
  onPaginationChange?: (state: PaginationState) => void;
  pageSizeOptions?: number[];
  // Selection
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  getRowId?: (row: T) => string;
  // Actions
  actions?: React.ReactNode;
  onExport?: () => void;
  // Row actions
  rowActions?: (row: T) => React.ReactNode;
  // Appearance
  className?: string;
  emptyMessage?: string;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  sortable = true,
  sortState,
  onSort,
  filterable = false,
  filterState,
  onFilter,
  globalSearch = true,
  searchPlaceholder = 'Search...',
  pagination,
  onPaginationChange,
  pageSizeOptions = [10, 25, 50, 100],
  selectable = false,
  selectedRows,
  onSelectionChange,
  getRowId = (row: T) => (row as { id?: string }).id || String(row),
  actions,
  onExport,
  rowActions,
  className,
  emptyMessage = 'No data available',
  stickyHeader = true,
  striped = false,
  hoverable = true,
  compact = false,
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState>({ column: null, direction: null });
  const [internalFilter, setInternalFilter] = useState<FilterState>({});
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Use internal or controlled state
  const currentSort = sortState ?? internalSort;
  const currentFilter = filterState ?? internalFilter;

  // Handle sort
  const handleSort = useCallback((columnId: string) => {
    const newState: SortState = {
      column: columnId,
      direction:
        currentSort.column === columnId
          ? currentSort.direction === 'asc'
            ? 'desc'
            : currentSort.direction === 'desc'
            ? null
            : 'asc'
          : 'asc',
    };

    if (newState.direction === null) {
      newState.column = null;
    }

    if (onSort) {
      onSort(newState);
    } else {
      setInternalSort(newState);
    }
  }, [currentSort, onSort]);

  // Handle filter
  const handleFilter = useCallback((columnId: string, value: string) => {
    const newState = { ...currentFilter, [columnId]: value };

    if (onFilter) {
      onFilter(newState);
    } else {
      setInternalFilter(newState);
    }
  }, [currentFilter, onFilter]);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    const allIds = new Set(data.map(getRowId));
    const allSelected = selectedRows?.size === data.length;

    onSelectionChange(allSelected ? new Set() : allIds);
  }, [data, getRowId, onSelectionChange, selectedRows]);

  const handleSelectRow = useCallback((id: string) => {
    if (!onSelectionChange || !selectedRows) return;

    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }

    onSelectionChange(newSelected);
  }, [onSelectionChange, selectedRows]);

  // Process data (sort, filter)
  const processedData = useMemo(() => {
    let result = [...data];

    // Global search
    if (globalSearchTerm.trim()) {
      const term = globalSearchTerm.toLowerCase();
      result = result.filter((row) => {
        return columns.some((col) => {
          const value = col.accessorKey ? row[col.accessorKey] : col.accessorFn?.(row);
          return String(value).toLowerCase().includes(term);
        });
      });
    }

    // Column filters
    Object.entries(currentFilter).forEach(([columnId, filterValue]) => {
      if (!filterValue.trim()) return;

      const column = columns.find((c) => c.id === columnId);
      if (!column) return;

      const term = filterValue.toLowerCase();
      result = result.filter((row) => {
        const value = column.accessorKey ? row[column.accessorKey] : column.accessorFn?.(row);
        return String(value).toLowerCase().includes(term);
      });
    });

    // Sorting
    if (currentSort.column && currentSort.direction) {
      const column = columns.find((c) => c.id === currentSort.column);
      if (column) {
        result.sort((a, b) => {
          const aValue = column.accessorKey ? a[column.accessorKey] : column.accessorFn?.(a);
          const bValue = column.accessorKey ? b[column.accessorKey] : column.accessorFn?.(b);

          const aStr = String(aValue ?? '');
          const bStr = String(bValue ?? '');

          const comparison = aStr.localeCompare(bStr, undefined, { numeric: true });
          return currentSort.direction === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, globalSearchTerm, currentFilter, currentSort, columns]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;

    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return processedData.slice(start, end);
  }, [processedData, pagination]);

  const totalPages = pagination
    ? Math.ceil(processedData.length / pagination.pageSize)
    : 1;

  // Render sort icon
  const renderSortIcon = (columnId: string) => {
    if (currentSort.column !== columnId) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-500" />;
    }
    return currentSort.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-purple-400" />
    ) : (
      <ChevronDown className="h-4 w-4 text-purple-400" />
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {globalSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          )}

          {filterable && (
            <Button
              variant={showFilters ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          {onExport && (
            <Button variant="ghost" size="sm" onClick={onExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Column Filters */}
      {filterable && showFilters && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          {columns
            .filter((col) => col.filterable !== false)
            .map((col) => (
              <div key={col.id} className="min-w-[150px]">
                <label className="mb-1 block text-xs text-gray-400">{col.header}</label>
                <input
                  type="text"
                  value={currentFilter[col.id] || ''}
                  onChange={(e) => handleFilter(col.id, e.target.value)}
                  placeholder={`Filter ${col.header.toLowerCase()}...`}
                  className="h-8 w-full rounded border border-gray-700 bg-gray-800 px-2 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onFilter) {
                onFilter({});
              } else {
                setInternalFilter({});
              }
            }}
            className="self-end"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full">
          <thead
            className={cn(
              'border-b border-gray-800 bg-gray-900',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows?.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'px-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400',
                    compact ? 'py-2' : 'py-3',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sticky && 'sticky left-0 bg-gray-900',
                    sortable && column.sortable !== false && 'cursor-pointer select-none hover:text-white'
                  )}
                  style={{ width: column.width }}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && renderSortIcon(column.id)}
                  </div>
                </th>
              ))}
              {rowActions && <th className="w-10 px-3 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className="px-3 py-3">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-3">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              paginatedData.map((row, rowIndex) => {
                const rowId = getRowId(row);
                const isSelected = selectedRows?.has(rowId);

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      striped && rowIndex % 2 === 1 && 'bg-gray-900/50',
                      hoverable && 'hover:bg-gray-800/50',
                      isSelected && 'bg-purple-900/20'
                    )}
                  >
                    {selectable && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => {
                      const value = column.accessorKey
                        ? row[column.accessorKey]
                        : column.accessorFn?.(row);
                      const cellContent = column.cell ? column.cell(value, row) : value;

                      return (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 text-sm text-gray-300',
                            compact ? 'py-2' : 'py-3',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right',
                            column.sticky && 'sticky left-0 bg-gray-900'
                          )}
                        >
                          {cellContent as React.ReactNode}
                        </td>
                      );
                    })}
                    {rowActions && (
                      <td className="px-3 py-3">
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && onPaginationChange && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Show</span>
            <select
              value={pagination.pageSize}
              onChange={(e) =>
                onPaginationChange({
                  ...pagination,
                  pageSize: Number(e.target.value),
                  page: 1,
                })
              }
              className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-white focus:border-purple-500 focus:outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              of {processedData.length} {processedData.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPaginationChange({ ...pagination, page: 1 })}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPaginationChange({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-3 text-sm text-gray-400">
              Page {pagination.page} of {totalPages}
            </span>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPaginationChange({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPaginationChange({ ...pagination, page: totalPages })}
              disabled={pagination.page >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Status Cell helper
interface StatusCellProps {
  status: string;
  variant?: 'dot' | 'badge';
}

export const StatusCell = memo(function StatusCell({ status, variant = 'dot' }: StatusCellProps) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    completed: 'bg-green-500',
    success: 'bg-green-500',
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    running: 'bg-blue-500',
    failed: 'bg-red-500',
    error: 'bg-red-500',
    cancelled: 'bg-gray-500',
    inactive: 'bg-gray-500',
  };

  const color = statusColors[status.toLowerCase()] || 'bg-gray-500';

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
          color.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-400')
        )}
      >
        {status}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2 w-2 rounded-full', color)} />
      <span className="capitalize">{status}</span>
    </div>
  );
});

// Actions dropdown helper
interface RowActionsProps {
  children: React.ReactNode;
}

export const RowActions = memo(function RowActions({ children }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
            {children}
          </div>
        </>
      )}
    </div>
  );
});

// Action item for dropdown
interface RowActionItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  destructive?: boolean;
}

export const RowActionItem = memo(function RowActionItem({
  onClick,
  icon,
  children,
  destructive = false,
}: RowActionItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
        destructive
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-gray-300 hover:bg-gray-800'
      )}
    >
      {icon}
      {children}
    </button>
  );
});
