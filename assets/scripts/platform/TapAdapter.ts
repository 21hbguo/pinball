export type TapCapability =
  | 'runtime'
  | 'login'
  | 'storage'
  | 'share'
  | 'leaderboard';

/**
 * Platform boundary.
 *
 * Gameplay code must never call global tap APIs directly. The exact TapTap
 * SDK calls are wired here after the AppID and target SDK version are fixed.
 */
export class TapAdapter {
  private get runtime(): Record<string, unknown> | null {
    const candidate = (globalThis as Record<string, unknown>).tap;
    return candidate && typeof candidate === 'object'
      ? (candidate as Record<string, unknown>)
      : null;
  }

  has(capability: TapCapability): boolean {
    const tap = this.runtime;

    if (capability === 'runtime') {
      return tap !== null;
    }

    if (!tap) {
      return false;
    }

    switch (capability) {
      case 'login':
        return typeof tap.login === 'function';
      case 'storage':
        return (
          typeof tap.setStorageSync === 'function' &&
          typeof tap.getStorageSync === 'function'
        );
      case 'share':
        return typeof tap.shareAppMessage === 'function';
      case 'leaderboard':
        return false;
      default:
        return false;
    }
  }

  saveLocal(key: string, value: unknown): void {
    const tap = this.runtime;
    const setStorageSync = tap?.setStorageSync;

    if (typeof setStorageSync === 'function') {
      setStorageSync.call(tap, key, value);
      return;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  loadLocal<T>(key: string, fallback: T): T {
    const tap = this.runtime;
    const getStorageSync = tap?.getStorageSync;

    if (typeof getStorageSync === 'function') {
      const value = getStorageSync.call(tap, key);
      return (value ?? fallback) as T;
    }

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    }

    return fallback;
  }
}
