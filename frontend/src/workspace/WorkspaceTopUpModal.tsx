'use client';

import React, { memo } from 'react';
import clsx from 'clsx';
import { CURRENCY_LOCALE } from '@/lib/intl';

export type WorkspaceTopUpModalState = {
  message: string;
  amountLabel?: string;
  shortfallCents?: number;
};

export type WorkspaceTopUpCopy = {
  title: string;
  presetsLabel: string;
  otherAmountLabel: string;
  minLabel: string;
  close: string;
  maybeLater: string;
  submit: string;
  submitting: string;
};

export type WorkspaceTopUpModalProps = {
  topUpModal: WorkspaceTopUpModalState | null;
  topUpAmount: number;
  topUpError: string | null;
  isTopUpLoading: boolean;
  currency: string;
  copy: WorkspaceTopUpCopy;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSelectPresetAmount: (value: number) => void;
  onCustomAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const WorkspaceTopUpModal = memo(function WorkspaceTopUpModal({
  topUpModal,
  topUpAmount,
  topUpError,
  isTopUpLoading,
  currency,
  copy,
  onClose,
  onSubmit,
  onSelectPresetAmount,
  onCustomAmountChange,
}: WorkspaceTopUpModalProps) {
  if (!topUpModal) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
      <div className="absolute inset-0" role="presentation" onClick={onClose} />
      <form
        className="relative z-10 w-full max-w-md rounded-[16px] border border-border bg-white p-6 shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-text-primary">Wallet balance too low</h2>
            <p className="mt-2 text-sm text-text-secondary">{topUpModal.message}</p>
            {topUpModal.amountLabel && (
              <p className="mt-2 text-sm font-medium text-text-primary">
                Suggested top-up: {topUpModal.amountLabel}
              </p>
            )}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-micro text-text-muted">{copy.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1000, 2500, 5000].map((value) => {
                  const formatted = (() => {
                    try {
                      return new Intl.NumberFormat(CURRENCY_LOCALE, { style: 'currency', currency }).format(value / 100);
                    } catch {
                      return `${currency} ${(value / 100).toFixed(2)}`;
                    }
                  })();
                  const isActive = topUpAmount === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onSelectPresetAmount(value)}
                      className={clsx(
                        'rounded-input border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-hairline bg-white text-text-secondary hover:border-accentSoft/50 hover:bg-accentSoft/10'
                      )}
                    >
                      {formatted}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <label htmlFor="custom-topup" className="text-xs font-semibold uppercase tracking-micro text-text-muted">
                  {copy.otherAmountLabel}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-text-secondary">
                      $
                    </span>
                    <input
                      id="custom-topup"
                      type="number"
                      min={10}
                      step={1}
                      value={Math.max(10, Math.round(topUpAmount / 100))}
                      onChange={onCustomAmountChange}
                      className="h-10 w-full rounded-input border border-border bg-white pl-6 pr-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <span className="text-xs text-text-muted">
                    {copy.minLabel.replace('{amount}', '$10')}
                  </span>
                </div>
              </div>
              {topUpError && <p className="mt-2 text-sm text-state-warning">{topUpError}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-hairline bg-white/80 p-2 text-text-muted transition hover:bg-accentSoft/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={copy.close}
          >
            {copy.close}
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-input border border-hairline px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-accentSoft/50 hover:bg-accentSoft/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copy.maybeLater}
          </button>
          <button
            type="submit"
            disabled={isTopUpLoading}
            className={clsx(
              'rounded-input border border-transparent bg-accent px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
              !isTopUpLoading && 'hover:brightness-105'
            )}
          >
            {isTopUpLoading ? copy.submitting : copy.submit}
          </button>
        </div>
      </form>
    </div>
  );
});
