const STORAGE_KEY = 'walletlens:last-address';

export function getPersistedAddress() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
}

export function persistAddress(address) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, address);
}

export function clearPersistedAddress() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
