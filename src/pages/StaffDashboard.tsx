import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant } from '../types/restaurant';
import EditRestaurantModal from '../components/EditRestaurantModal';
import './StaffDashboard.css';

export default function StaffDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [newRestaurantName, setNewRestaurantName] = useState('');

  useEffect(() => {
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

  const handleStatusChange = async (restaurantId: string, newStatus: 'open' | 'busy' | 'full') => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), {
        status: newStatus,
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantName.trim()) return;

    try {
      await addDoc(collection(db, 'restaurants'), {
        name: newRestaurantName,
        status: 'open',
        waitTime: '0-10 min',
        lastUpdated: Timestamp.now(),
        info: {
          seatType: 'Table / Counter',
          smoking: 'No Smoking',
          parking: 'Available (Public)',
        },
        order: restaurants.length,
      });
      setNewRestaurantName('');
    } catch (error) {
      console.error('Error adding restaurant:', error);
    }
  };

  if (loading) {
    return (
      <div className="staff-dashboard">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      <div className="container">
        <Link to="/" className="back-link">
          ← Back to Viewer
        </Link>

        <h1 className="dashboard-title">Staff Dashboard</h1>

        <div className="add-restaurant-card card">
          <h2 className="section-title">Add New Restaurant</h2>
          <form onSubmit={handleAddRestaurant} className="add-form">
            <input
              type="text"
              placeholder="Restaurant Name"
              value={newRestaurantName}
              onChange={(e) => setNewRestaurantName(e.target.value)}
              className="restaurant-input"
            />
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </form>
        </div>

        <div className="restaurant-list">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="restaurant-item card">
              <div className="restaurant-header">
                <span className={`status-dot ${restaurant.status}`}></span>
                <h3 className="restaurant-name">{restaurant.name}</h3>
                <button
                  onClick={() => setEditingRestaurant(restaurant)}
                  className="edit-button"
                >
                  Edit Details
                </button>
              </div>

              <div className="status-buttons">
                <button
                  className={`status-btn ${restaurant.status === 'open' ? 'active open' : ''}`}
                  onClick={() => handleStatusChange(restaurant.id, 'open')}
                >
                  Open
                </button>
                <button
                  className={`status-btn ${restaurant.status === 'busy' ? 'active busy' : ''}`}
                  onClick={() => handleStatusChange(restaurant.id, 'busy')}
                >
                  Busy
                </button>
                <button
                  className={`status-btn ${restaurant.status === 'full' ? 'active full' : ''}`}
                  onClick={() => handleStatusChange(restaurant.id, 'full')}
                >
                  Full
                </button>
              </div>

              <div className="quick-wait-time">
                <span className="wait-label">Quick Wait Time:</span>
                <span className="wait-value">{restaurant.waitTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingRestaurant && (
        <EditRestaurantModal
          restaurant={editingRestaurant}
          onClose={() => setEditingRestaurant(null)}
        />
      )}
    </div>
  );
}
