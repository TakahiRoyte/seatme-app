import { Table, GroupAvailability, GroupSizeRange } from '../types/restaurant';

/**
 * Calculate availability status for each group size range
 * based on available tables
 */
export function calculateGroupAvailability(
  tables: Table[]
): Record<GroupSizeRange, GroupAvailability> {
  const availableTables = tables.filter((t) => t.status === 'available');

  const freeingSoonTables = tables.filter((t) => {
    if (t.status === 'available') return false;

    if (t.status === 'occupied' && t.occupiedSince instanceof Date) {
      // Consider an occupied table freeing soon if occupied for less than 30 minutes
      return minutesSince(t.occupiedSince) <= 30;
    }

    return false;
  });

  return {
    '1-2': getAvailabilityStatus(availableTables, freeingSoonTables, tables, 2),
    '3-4': getAvailabilityStatus(availableTables, freeingSoonTables, tables, 4),
    '5-6': getAvailabilityStatus(availableTables, freeingSoonTables, tables, 6),
    '7+': getAvailabilityStatus(availableTables, freeingSoonTables, tables, 7),
  };
}

/**
 * Determine availability status for a specific group size
 */
function getAvailabilityStatus(
  availableTables: Table[],
  freeingSoonTables: Table[],
  allTables: Table[],
  minCapacity: number
): GroupAvailability {
  const suitableAvailable = availableTables.filter(t => t.capacity >= minCapacity);
  const suitableFreeingSoon = freeingSoonTables.filter(t => t.capacity >= minCapacity);
  const suitableTotal = allTables.filter(t => t.capacity >= minCapacity).length;

  const availableCount = suitableAvailable.length;
  const soonCount = suitableFreeingSoon.length;
  const capacityRatio = suitableTotal === 0 ? 0 : availableCount / suitableTotal;

  // Adaptive thresholds: >=50% of suitable seats free => Available
  if (capacityRatio >= 0.5 || availableCount >= 2) {
    return {
      icon: '🟢',
      text: `Available (${availableCount} fit)`,
      wait: null,
    };
  }

  // Limited when some are free or freeing soon
  if (availableCount >= 1 || soonCount >= 1) {
    const wait = availableCount >= 1 ? '5-15 min' : '10-20 min';
    return {
      icon: '🟡',
      text: availableCount >= 1 ? 'Limited' : 'Freeing soon',
      wait,
    };
  }

  return {
    icon: '🔴',
    text: 'Unlikely',
    wait: '20+ min',
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

function minutesSince(date: Date): number {
  const diffMs = Date.now() - date.getTime();
  return diffMs / 60000;
}
