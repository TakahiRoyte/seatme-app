export interface Table {
  id: string;              // "T1", "T2", "C1", etc.
  type: 'table' | 'counter';
  capacity: number;        // 1, 2, 4, 6, etc.
  status: 'available' | 'occupied' | 'reserved';
  occupiedSince?: Date | null;
  reservationWindow?: {
    start: string;         // "19:00"
    end: string;           // "21:00"
  } | null;
}

export interface Restaurant {
  id: string;
  name: string;
  tables: Table[];         // NEW: Array of tables
  lastUpdated: Date;
  info: {
    seatType: string;
    smoking: string;
    parking: string;
  };
  order: number;
}

export interface GroupAvailability {
  icon: '🟢' | '🟡' | '🔴';
  text: string;
  wait: string | null;
}

export type GroupSizeRange = '1-2' | '3-4' | '5-6' | '7+';

