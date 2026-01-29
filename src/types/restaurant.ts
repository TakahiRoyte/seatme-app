export interface Table {
  id: string;              // "T1", "T2", "C1", etc.
  type: 'table' | 'counter';
  capacity: number;        // 1, 2, 4, 6, etc.
  status: 'available' | 'occupied';
  occupiedSince?: Date | null;
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
  statusKey: string;
  statusParams?: Record<string, any>;
  waitKey?: string;
}

export type GroupSizeRange = '1-2' | '3-4' | '5-6' | '7+';
