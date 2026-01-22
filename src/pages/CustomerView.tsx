import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant, GroupSizeRange } from '../types/restaurant';
import { calculateGroupAvailability, getOverallStatus } from '../lib/availabilityUtils';
import './CustomerView.css';

export default function CustomerView() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for restaurants
    const q = query(collection(db, 'restaurants'), orderBy('order'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const restaurantData: Restaurant[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        restaurantData.push({
          id: doc.id,
          name: data.name,
          tables: data.tables.map((t: any) => ({
            ...t,
            status: t.status === 'available' ? 'available' : 'occupied',
            occupiedSince: t.occupiedSince?.toDate(),
          })),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          info: data.info,
          order: data.order,
        });
      });
      setRestaurants(restaurantData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="customer-view">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="customer-view">
      <header className="header">
        <h1 className="title">SeatMe</h1>
        <p className="subtitle">Real-time Seat Availability</p>
      </header>

      <div className="restaurant-list">
        {restaurants.map((restaurant) => {
          const groupAvailability = calculateGroupAvailability(restaurant.tables);
          const overallStatus = getOverallStatus(restaurant.tables);

          return (
            <Link
              key={restaurant.id}
              to={`/restaurant/${restaurant.id}`}
              className="restaurant-card card"
            >
              <div className="restaurant-header">
                <div className="restaurant-info">
                  <span className={`status-dot ${overallStatus.icon === '🟢' ? 'open' : overallStatus.icon === '🟡' ? 'busy' : 'full'}`}></span>
                  <h2 className="restaurant-name">{restaurant.name}</h2>
                </div>
              </div>

              <div className="group-availability">
                {(Object.keys(groupAvailability) as GroupSizeRange[]).map((groupSize) => {
                  const availability = groupAvailability[groupSize];
                  return (
                    <div key={groupSize} className="group-row">
                      <span className="group-size">Group {groupSize}:</span>
                      <span className="availability-status">
                        <span className="status-icon">{availability.icon}</span>
                        <span className="status-text">{availability.text}</span>
                        {availability.wait && (
                          <span className="wait-time">({availability.wait})</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>

      <footer className="footer">
        <Link to="/staff" className="staff-link">
          Staff Access →
        </Link>
      </footer>
    </div>
  );
}
