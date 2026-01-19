import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant } from '../types/restaurant';
import './RestaurantDetail.css';

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Real-time listener for single restaurant
    const unsubscribe = onSnapshot(doc(db, 'restaurants', id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setRestaurant({
          id: doc.id,
          name: data.name,
          status: data.status,
          waitTime: data.waitTime,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          info: data.info,
          order: data.order,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Walk-in Welcome';
      case 'busy':
        return 'Few Seats Available';
      case 'full':
        return 'Full / Waitlist';
      default:
        return 'Unknown';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="restaurant-detail">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="restaurant-detail">
        <div className="container">
          <p>Restaurant not found</p>
          <Link to="/" className="btn btn-primary">
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-detail">
      <div className="container">
        <Link to="/" className="back-link">
          ← Back to List
        </Link>

        <div className="detail-card card">
          <h1 className="detail-title">{restaurant.name}</h1>
          <p className="last-updated">Last updated: {formatTime(restaurant.lastUpdated)}</p>

          <div className="status-section">
            <span className={`status-dot ${restaurant.status}`}></span>
            <span className="status-text">{getStatusText(restaurant.status)}</span>
          </div>

          <div className="wait-time-section">
            <div className="wait-time-label">ESTIMATED WAIT</div>
            <div className="wait-time-display">{restaurant.waitTime}</div>
          </div>
        </div>

        <div className="info-card card">
          <h2 className="info-title">Restaurant Info</h2>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Seat Type</span>
              <span className="info-value">{restaurant.info.seatType}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Smoking</span>
              <span className="info-value">{restaurant.info.smoking}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Parking</span>
              <span className="info-value">{restaurant.info.parking}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
