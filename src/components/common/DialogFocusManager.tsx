import { useEffect } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isVisible = (el: HTMLElement) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;

/**
 * Keyboard support for every dialog built on the shared `.dbc-modal` panel:
 * focus moves into the dialog when it opens, Tab stays inside it, Escape
 * triggers the dialog's own close/cancel control (so existing close logic
 * runs unchanged), and focus returns to the element that opened it.
 * Mounted once in App; individual dialogs need no extra code.
 */
export function DialogFocusManager() {
  useEffect(() => {
    let active: HTMLElement | null = null;
    let opener: HTMLElement | null = null;

    const topDialog = () => {
      const dialogs = document.querySelectorAll<HTMLElement>('.dbc-modal');
      return dialogs.length ? dialogs[dialogs.length - 1] : null;
    };

    const sync = () => {
      const dialog = topDialog();
      if (dialog && dialog !== active) {
        if (!active) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        active = dialog;
        if (!dialog.contains(document.activeElement)) {
          if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
          const preferred = dialog.querySelector<HTMLElement>('[autofocus]');
          (preferred ?? dialog).focus({ preventScroll: true });
        }
      } else if (!dialog && active) {
        active = null;
        if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
        opener = null;
      }
    };

    const findClose = (dialog: HTMLElement) =>
      dialog.querySelector<HTMLElement>('.dbc-modal-close, [data-dialog-close]') ??
      Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])')).find((b) =>
        /^(cancel|close|dismiss|keep|back)\b/i.test((b.getAttribute('aria-label') || b.textContent || '').trim()),
      ) ??
      null;

    const onKeyDown = (e: KeyboardEvent) => {
      const dialog = active;
      if (!dialog || !document.contains(dialog) || e.defaultPrevented) return;

      if (e.key === 'Escape') {
        const close = findClose(dialog);
        if (close) {
          e.preventDefault();
          close.click();
        }
        return;
      }

      if (e.key === 'Tab') {
        const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
        if (!items.length) {
          e.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const current = document.activeElement;
        if (e.shiftKey && (current === first || current === dialog)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (current === last || !dialog.contains(current))) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', onKeyDown);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return null;
}
