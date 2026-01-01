'use client';

import React, { memo } from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { QuadPreviewTile } from '@/components/QuadPreviewPanel';

export type WorkspaceCompareDrawerProps = {
  isOpen: boolean;
  entries: QuadPreviewTile[];
  onClose: () => void;
  onRemix: (tile: QuadPreviewTile) => void;
  onOpen: (tile: QuadPreviewTile) => void;
  onRemove?: (tile: QuadPreviewTile) => void;
};

function formatCurrency(amountCents?: number, currency = 'USD') {
  if (typeof amountCents !== 'number') return null;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountCents / 100);
  } catch {
    return `${currency} ${(amountCents / 100).toFixed(2)}`;
  }
}

export const WorkspaceCompareDrawer = memo(function WorkspaceCompareDrawer({
  isOpen,
  entries,
  onClose,
  onRemix,
  onOpen,
  onRemove,
}: WorkspaceCompareDrawerProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compare takes"
      description="Review multiple outputs side-by-side and remix any take."
      size="full"
    >
      {entries.length === 0 ? (
        <div className="rounded-card border border-border bg-white/80 p-4 text-sm text-text-secondary">
          No takes selected for comparison.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => {
            const priceLabel = formatCurrency(entry.priceCents, entry.currency ?? 'USD');
            return (
              <div key={entry.localKey} className="rounded-card border border-border bg-white/80 p-4">
                <div className="relative mb-3 overflow-hidden rounded-card border border-border bg-black/10">
                  <div className={clsx('relative w-full', entry.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]')}>
                    {entry.thumbUrl ? (
                      <Image
                        src={entry.thumbUrl}
                        alt="Preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted">
                        No preview available
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">{entry.engineLabel}</span>
                    <span>• {entry.durationSec}s</span>
                    <span>• {entry.aspectRatio}</span>
                    {priceLabel && <span>• {priceLabel}</span>}
                  </div>
                  <p className="line-clamp-3 text-sm text-text-secondary">{entry.prompt}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => onRemix(entry)}>
                      Remix
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onOpen(entry)}>
                      Open
                    </Button>
                    {onRemove ? (
                      <Button size="sm" variant="ghost" onClick={() => onRemove(entry)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
});
