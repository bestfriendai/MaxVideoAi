'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
  createContext,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  ArrowRight,
  Home,
  Video,
  Image,
  FolderOpen,
  Clock,
  Settings,
  CreditCard,
  HelpCircle,
  Keyboard,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Command types
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string[];
  category?: string;
  keywords?: string[];
  action?: () => void;
  href?: string;
  disabled?: boolean;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

// Default commands
const defaultCommands: CommandGroup[] = [
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      { id: 'home', label: 'Go to Dashboard', icon: Home, href: '/dashboard', shortcut: ['G', 'H'] },
      { id: 'generate-video', label: 'Generate Video', icon: Video, href: '/app', shortcut: ['G', 'V'] },
      { id: 'generate-image', label: 'Generate Image', icon: Image, href: '/app/image', shortcut: ['G', 'I'] },
      { id: 'library', label: 'Open Library', icon: FolderOpen, href: '/app/library', shortcut: ['G', 'L'] },
      { id: 'jobs', label: 'View Jobs', icon: Clock, href: '/jobs', shortcut: ['G', 'J'] },
      { id: 'settings', label: 'Open Settings', icon: Settings, href: '/settings', shortcut: ['G', 'S'] },
      { id: 'billing', label: 'Billing & Credits', icon: CreditCard, href: '/billing', shortcut: ['G', 'B'] },
    ],
  },
  {
    id: 'actions',
    label: 'Quick Actions',
    items: [
      { id: 'new-video', label: 'New Video Generation', icon: Plus, href: '/app', keywords: ['create', 'generate'] },
      { id: 'new-image', label: 'New Image Generation', icon: Sparkles, href: '/app/image', keywords: ['create', 'generate'] },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, shortcut: ['?'] },
      { id: 'help', label: 'Help & Documentation', icon: HelpCircle, href: '/docs' },
    ],
  },
];

// Context for global command palette state
interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  registerCommands: (commands: CommandGroup[]) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}

// Provider component
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customCommands, setCustomCommands] = useState<CommandGroup[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const registerCommands = useCallback((commands: CommandGroup[]) => {
    setCustomCommands(commands);
  }, []);

  // Global keyboard shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const allCommands = useMemo(() => {
    return [...defaultCommands, ...customCommands];
  }, [customCommands]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle, registerCommands }}>
      {children}
      <CommandPaletteModal
        isOpen={isOpen}
        onClose={close}
        commands={allCommands}
      />
    </CommandPaletteContext.Provider>
  );
}

// Modal component
interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandGroup[];
}

const CommandPaletteModal = memo(function CommandPaletteModal({
  isOpen,
  onClose,
  commands,
}: CommandPaletteModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();

    return commands
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const matchLabel = item.label.toLowerCase().includes(lowerQuery);
          const matchDescription = item.description?.toLowerCase().includes(lowerQuery);
          const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
          return matchLabel || matchDescription || matchKeywords;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [commands, query]);

  // Flatten items for keyboard navigation
  const flatItems = useMemo(() => {
    return filteredCommands.flatMap((group) => group.items);
  }, [filteredCommands]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const executeCommand = useCallback(
    (item: CommandItem) => {
      if (item.disabled) return;

      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }

      onClose();
    },
    [router, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatItems.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (flatItems[selectedIndex]) {
            executeCommand(flatItems[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose, executeCommand]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const selected = list.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2"
          >
            <div className="mx-4 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-gray-800 px-4">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent py-4 text-white placeholder:text-gray-500 focus:outline-none"
                />
                <kbd className="hidden rounded bg-gray-800 px-2 py-1 text-xs text-gray-400 sm:block">
                  ESC
                </kbd>
              </div>

              {/* Command List */}
              <div
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto p-2"
              >
                {filteredCommands.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No commands found
                  </div>
                ) : (
                  filteredCommands.map((group) => (
                    <div key={group.id} className="mb-4 last:mb-0">
                      <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                        {group.label}
                      </div>
                      {group.items.map((item) => {
                        const itemIndex = flatItems.indexOf(item);
                        const isSelected = itemIndex === selectedIndex;
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.id}
                            data-selected={isSelected}
                            onClick={() => executeCommand(item)}
                            onMouseEnter={() => setSelectedIndex(itemIndex)}
                            disabled={item.disabled}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                              isSelected ? 'bg-purple-600/20 text-white' : 'text-gray-300 hover:bg-gray-800',
                              item.disabled && 'cursor-not-allowed opacity-50'
                            )}
                          >
                            {Icon && (
                              <Icon className={cn('h-5 w-5', isSelected ? 'text-purple-400' : 'text-gray-500')} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{item.label}</div>
                              {item.description && (
                                <div className="truncate text-sm text-gray-500">{item.description}</div>
                              )}
                            </div>
                            {item.shortcut && (
                              <div className="flex items-center gap-1">
                                {item.shortcut.map((key, i) => (
                                  <kbd
                                    key={i}
                                    className="rounded bg-gray-800 px-1.5 py-0.5 text-xs font-medium text-gray-400"
                                  >
                                    {key}
                                  </kbd>
                                ))}
                              </div>
                            )}
                            {isSelected && (
                              <ArrowRight className="h-4 w-4 text-purple-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-800 px-4 py-2 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-gray-800 px-1">↑</kbd>
                    <kbd className="rounded bg-gray-800 px-1">↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-gray-800 px-1.5">↵</kbd>
                    Select
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Command className="h-3 w-3" />
                  <span>K to toggle</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
});

// Keyboard Shortcuts Help Modal
export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const shortcuts = [
    { category: 'Global', items: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ]},
    { category: 'Navigation', items: [
      { keys: ['G', 'H'], description: 'Go to Dashboard' },
      { keys: ['G', 'V'], description: 'Go to Video Generation' },
      { keys: ['G', 'I'], description: 'Go to Image Generation' },
      { keys: ['G', 'L'], description: 'Go to Library' },
      { keys: ['G', 'J'], description: 'Go to Jobs' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ]},
    { category: 'Generation', items: [
      { keys: ['⌘', 'Enter'], description: 'Start generation' },
      { keys: ['Esc'], description: 'Cancel / Close modal' },
    ]},
  ];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 mx-4 w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="space-y-6">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="mb-3 text-sm font-medium text-gray-400">{group.category}</h3>
              <div className="space-y-2">
                {group.items.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <React.Fragment key={j}>
                          <kbd className="rounded bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300">
                            {key}
                          </kbd>
                          {j < shortcut.keys.length - 1 && (
                            <span className="text-gray-600">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
