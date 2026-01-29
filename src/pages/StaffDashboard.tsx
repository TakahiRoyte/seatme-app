import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant } from '../types/restaurant';
import { getOverallStatus } from '../lib/availabilityUtils';
import { useTranslation } from 'react-i18next';
import './StaffDashboard.css';

export default function StaffDashboard() {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantName.trim()) return;

    try {
      await addDoc(collection(db, 'restaurants'), {
        name: newRestaurantName,
        tables: [
          { id: 'T1', type: 'table', capacity: 4, status: 'available' },
          { id: 'T2', type: 'table', capacity: 4, status: 'available' },
          { id: 'C1', type: 'counter', capacity: 1, status: 'available' },
          { id: 'C2', type: 'counter', capacity: 1, status: 'available' },
        ],
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
          ← {t('staffDashboard.backToViewer')}
        </Link>

        <h1 className="dashboard-title">{t('staffDashboard.title')}</h1>

        <div className="add-restaurant-card card">
          <h2 className="section-title">{t('staffDashboard.addNewRestaurant')}</h2>
          <form onSubmit={handleAddRestaurant} className="add-form">
            <input
              type="text"
              placeholder={t('staffDashboard.restaurantNamePlaceholder')}
              value={newRestaurantName}
              onChange={(e) => setNewRestaurantName(e.target.value)}
              className="restaurant-input"
            />
            <button type="submit" className="btn btn-primary">
              {t('common.add')}
            </button>
          </form>
        </div>

        <div className="restaurant-list card">
          <div className="restaurant-table-header">
            <span className="col-name">{t('common.restaurant')}</span>
            <span className="col-status">{t('common.status')}</span>
            <span className="col-available">{t('common.available')}</span>
            <span className="col-occupied">{t('common.occupied')}</span>
            <span className="col-total">{t('common.total')}</span>
            <span className="col-actions">{t('common.actions')}</span>
          </div>

          <div className="restaurant-rows">
            {restaurants.map((restaurant) => {
              const overallStatus = getOverallStatus(restaurant.tables);
              const availableCount = restaurant.tables.filter(t => t.status === 'available').length;
              const occupiedCount = restaurant.tables.filter(t => t.status === 'occupied').length;
              const totalCount = restaurant.tables.length;

              return (
                <div key={restaurant.id} className="restaurant-table-row">
                  <div className="col-name">
                    <span className={`status-dot ${overallStatus.icon === '🟢' ? 'open' : overallStatus.icon === '🟡' ? 'busy' : 'full'}`}></span>
                    <span className="restaurant-name-text">{restaurant.name}</span>
                  </div>
                  
                  <div className="col-status">
                    <span className="status-badge">
                      {overallStatus.icon} {t(`availability.${overallStatus.statusKey}`)}
                    </span>
                  </div>

                  <div className="col-available">
                    <span className="count-badge available">{availableCount}</span>
                  </div>

                  <div className="col-occupied">
                    <span className="count-badge occupied">{occupiedCount}</span>
                  </div>

                  <div className="col-total">
                    <span className="count-badge total">{totalCount}</span>
                  </div>

                  <div className="col-actions">
                    <Link
                      to={`/staff/restaurant/${restaurant.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      {t('staffDashboard.manage')} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
