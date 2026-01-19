export interface Restaurant {
  id: string;
  name: string;
  status: 'open' | 'busy' | 'full';
  waitTime: string;
  lastUpdated: Date;
  info: {
    seatType: string;
    smoking: string;
    parking: string;
  };
  order: number;
}
