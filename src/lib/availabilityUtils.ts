import { Table, GroupAvailability, GroupSizeRange } from '../types/restaurant';

/**
 * Calculate availability status for each group size range
 * based on available tables
 */
export function calculateGroupAvailability(
  tables: Table[]
): Record<GroupSizeRange, GroupAvailability> {
  const availableTables = tables.filter(t => t.status === 'available');

  return {
    '1-2': getAvailabilityStatus(availableTables, 2),
    '3-4': getAvailabilityStatus(availableTables, 4),
    '5-6': getAvailabilityStatus(availableTables, 6),
    '7+': getAvailabilityStatus(availableTables, 7),
  };
}

/**
 * Determine availability status for a specific group size
 * 
 * Logic:
 * - 3+ suitable tables = 🟢 Available
 * - 1-2 suitable tables = 🟡 Limited (5-15 min wait)
 * - 0 suitable tables = 🔴 Unlikely (15+ min wait)
 */
function getAvailabilityStatus(
  availableTables: Table[],
  minCapacity: number
): GroupAvailability {
  const suitableTables = availableTables.filter(t => t.capacity >= minCapacity);
  const count = suitableTables.length;

  if (count >= 3) {
    return {
      icon: '🟢',
      text: 'Available',
      wait: null,
    };
  }

  if (count >= 1) {
    return {
      icon: '🟡',
      text: 'Limited',
      wait: '5-15 min',
    };
  }

  return {
    icon: '🔴',
    text: 'Unlikely',
    wait: '15+ min',
  };
}

/**
 * Get overall restaurant status based on all tables
 * Used for fallback display when group breakdown isn't shown
 */
export function getOverallStatus(tables: Table[]): {
  icon: '🟢' | '🟡' | '🔴';
  text: string;
} {
  const availableCount = tables.filter(t => t.status === 'available').length;
  const totalCount = tables.length;
  const availableRatio = availableCount / totalCount;

  if (availableRatio >= 0.6) {
    return { icon: '🟢', text: 'Seats Available' };
  }

  if (availableRatio >= 0.2) {
    return { icon: '🟡', text: 'Few Seats Left' };
  }

  return { icon: '🔴', text: 'Full / Waitlist' };
}

/**
 * Format time for display (e.g., "18:20")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Check if a reservation is currently active
 */
export function isReservationActive(reservationWindow?: {
  start: string;
  end: string;
}): boolean {
  if (!reservationWindow) return false;

  const now = new Date();
  const currentTime = formatTime(now);

  return currentTime >= reservationWindow.start && currentTime <= reservationWindow.end;
}
