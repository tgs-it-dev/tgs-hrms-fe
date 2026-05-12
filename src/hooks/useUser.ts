import { useUserStore } from '../store/userStore';
import type { UserContextType } from '../types/context';

/** Drop-in replacement for the old context-based useUser. Reads from Zustand. */
export const useUser = (): UserContextType => useUserStore();
