"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function BondPurchaseDialog({ children, onDismiss, saving }: {
  children: ReactNode;
  onDismiss: () => void;
  saving: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    // Start at the heading rather than scrolling down to the first form control.
    dialog.querySelector<HTMLElement>("#purchase-dialog-title")?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog ref={ref} aria-labelledby="purchase-dialog-title"
      className="bond-scrollbar fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-outline/15 bg-[var(--md-sys-color-surface-container-lowest)] p-0 text-on-surface shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onDismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || saving) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onDismiss();
      }}>
      {children}
    </dialog>
  );
}
