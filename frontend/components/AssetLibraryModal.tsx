'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/I18nProvider';

export type UserAsset = {
  id: string;
  url: string;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  mime?: string | null;
  source?: string | null;
  createdAt?: string;
};

export type AssetLibrarySource = 'all' | 'upload' | 'generated';

export type AssetLibraryModalProps = {
  fieldLabel: string;
  assets: UserAsset[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (asset: UserAsset) => void;
  source: AssetLibrarySource;
  onSourceChange: (source: AssetLibrarySource) => void;
  onRefresh: (source?: AssetLibrarySource) => void;
  onDelete: (asset: UserAsset) => Promise<void> | void;
  deletingAssetId: string | null;
};

const DEFAULT_ASSET_LIBRARY_COPY = {
  title: 'Select reference image',
  refresh: 'Refresh',
  close: 'Close',
  fieldFallback: 'Reference image',
  empty: 'No saved images yet. Upload a reference image to see it here.',
  emptyUploads: 'No uploaded images yet. Upload a reference image to see it here.',
  emptyGenerated: 'No generated images saved yet. Save a generated image to see it here.',
  tabs: {
    all: 'All',
    upload: 'Uploaded',
    generated: 'Generated',
  },
};

export function AssetLibraryModal({
  fieldLabel,
  assets,
  isLoading,
  error,
  onClose,
  onSelect,
  source,
  onSourceChange,
  onRefresh,
  onDelete,
  deletingAssetId,
}: AssetLibraryModalProps) {
  const { t } = useI18n();
  const copy = t('workspace.generate.assetLibrary', DEFAULT_ASSET_LIBRARY_COPY) ?? DEFAULT_ASSET_LIBRARY_COPY;
  
  const emptyLabel =
    source === 'generated'
      ? (copy as typeof DEFAULT_ASSET_LIBRARY_COPY).emptyGenerated
      : source === 'upload'
        ? (copy as typeof DEFAULT_ASSET_LIBRARY_COPY).emptyUploads
        : copy.empty;
        
  const formatSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return null;
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
      <div className="absolute inset-0" role="presentation" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-[16px] border border-border bg-white p-6 shadow-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{copy.title}</h2>
            <p className="text-sm text-text-secondary">{fieldLabel}</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              className="rounded-input border border-border px-3 py-1.5 text-sm text-text-secondary transition hover:border-accentSoft/60 hover:bg-accentSoft/10"
              onClick={() => onRefresh(source)}
            >
              {copy.refresh}
            </button>
            <button
              type="button"
              className="rounded-input border border-border px-3 py-1.5 text-sm text-text-secondary transition hover:border-accentSoft/60 hover:bg-accentSoft/10"
              onClick={onClose}
            >
              {copy.close}
            </button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Library image filters"
          className="mt-4 flex w-full overflow-hidden rounded-full border border-border bg-white/70 text-xs font-semibold text-text-secondary"
        >
          <button
            type="button"
            role="tab"
            aria-selected={source === 'all'}
            onClick={() => onSourceChange('all')}
            className={`flex-1 px-4 py-2 transition ${source === 'all' ? 'bg-accent text-white' : 'hover:bg-white'}`}
          >
            {(copy as typeof DEFAULT_ASSET_LIBRARY_COPY).tabs.all}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={source === 'upload'}
            onClick={() => onSourceChange('upload')}
            className={`flex-1 px-4 py-2 transition ${source === 'upload' ? 'bg-accent text-white' : 'hover:bg-white'}`}
          >
            {(copy as typeof DEFAULT_ASSET_LIBRARY_COPY).tabs.upload}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={source === 'generated'}
            onClick={() => onSourceChange('generated')}
            className={`flex-1 px-4 py-2 transition ${source === 'generated' ? 'bg-accent text-white' : 'hover:bg-white'}`}
          >
            {(copy as typeof DEFAULT_ASSET_LIBRARY_COPY).tabs.generated}
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {error ? (
            <div className="rounded-input border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`asset-skeleton-${index}`} className="h-40 rounded-card border border-border bg-neutral-100" aria-hidden>
                  <div className="skeleton h-full w-full" />
                </div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="rounded-input border border-border bg-neutral-50 px-4 py-6 text-center text-sm text-text-secondary">
              {emptyLabel ?? copy.empty ?? 'No saved images yet. Upload a reference image to see it here.'}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {assets.map((asset) => {
                const dimensions = asset.width && asset.height ? `${asset.width}×${asset.height}` : null;
                const sizeLabel = formatSize(asset.size);
                const isDeleting = deletingAssetId === asset.id;
                return (
                  <div key={asset.id} className="overflow-hidden rounded-card border border-border/60 bg-white">
                    <div className="relative" style={{ aspectRatio: '16 / 9' }}>
                      <Image
                        src={asset.url}
                        alt="Reference"
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 400px, (min-width: 640px) 300px, 100vw"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border bg-white px-3 py-2 text-[12px] text-text-secondary">
                      <div className="flex flex-col gap-1">
                        {dimensions && <span>{dimensions}</span>}
                        {sizeLabel && <span>{sizeLabel}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={clsx(
                            'rounded-input border px-3 py-1 text-[12px] font-semibold uppercase tracking-micro transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300',
                            isDeleting
                              ? 'border-rose-200 bg-rose-100 text-rose-500 opacity-70'
                              : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                          )}
                          onClick={() => {
                            const result = onDelete(asset);
                            if (result && typeof result.then === 'function') {
                              void result.catch(() => {
                                // errors handled upstream
                              });
                            }
                          }}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                        <button
                          type="button"
                          className={clsx(
                            'rounded-input border border-accent bg-accent/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-micro text-accent transition',
                            isDeleting ? 'opacity-60' : 'hover:bg-accent/20'
                          )}
                          onClick={() => onSelect(asset)}
                          disabled={isDeleting}
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
