import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant, GroupSizeRange } from '../types/restaurant';
import { calculateGroupAvailability, getOverallStatus } from '../lib/availabilityUtils';
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
          tables: data.tables.map((t: any) => ({
            ...t,
            occupiedSince: t.occupiedSince?.toDate(),
          })),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          info: data.info,
          order: data.order,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

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

  const groupAvailability = calculateGroupAvailability(restaurant.tables);
  const overallStatus = getOverallStatus(restaurant.tables);
  const availableCount = restaurant.tables.filter(t => t.status === 'available').length;
  const totalCount = restaurant.tables.length;

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
            <span className={`status-dot ${overallStatus.icon === '🟢' ? 'open' : overallStatus.icon === '🟡' ? 'busy' : 'full'}`}></span>
            <span className="status-text">{overallStatus.text}</span>
          </div>

          <div className="table-summary">
            <div className="summary-label">Available Tables</div>
            <div className="summary-value">{availableCount} / {totalCount}</div>
          </div>

          <div className="group-breakdown">
            <h3 className="breakdown-title">Availability by Group Size</h3>
            {(Object.keys(groupAvailability) as GroupSizeRange[]).map((groupSize) => {
              const availability = groupAvailability[groupSize];
              return (
                <div key={groupSize} className="group-detail-row">
                  <span className="group-label">Group {groupSize}</span>
                  <span className="group-status">
                    <span className="group-icon">{availability.icon}</span>
                    <span className="group-text">{availability.text}</span>
                    {availability.wait && (
                      <span className="group-wait">{availability.wait}</span>
                    )}
                  </span>
                </div>
              );
            })}
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
