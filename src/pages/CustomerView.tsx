import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant } from '../types/restaurant';
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
          status: data.status,
          waitTime: data.waitTime,
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Seats Available';
      case 'busy':
        return 'Few Seats Left';
      case 'full':
        return 'Full / Waitlist';
      default:
        return 'Unknown';
    }
  };

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
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            to={`/restaurant/${restaurant.id}`}
            className="restaurant-card card"
          >
            <div className="restaurant-header">
              <div className="restaurant-info">
                <span className={`status-dot ${restaurant.status}`}></span>
                <div>
                  <h2 className="restaurant-name">{restaurant.name}</h2>
                  <p className="restaurant-status">{getStatusText(restaurant.status)}</p>
                </div>
              </div>
              <div className="wait-time">
                <div className="wait-time-value">{restaurant.waitTime}</div>
                <div className="wait-time-label">waitTime</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <footer className="footer">
        <Link to="/staff" className="staff-link">
          Staff Access →
        </Link>
      </footer>
    </div>
  );
}
