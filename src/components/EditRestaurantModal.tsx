import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant } from '../types/restaurant';
import './EditRestaurantModal.css';

interface EditRestaurantModalProps {
  restaurant: Restaurant;
  onClose: () => void;
}

export default function EditRestaurantModal({ restaurant, onClose }: EditRestaurantModalProps) {
  const [name, setName] = useState(restaurant.name);
  const [status, setStatus] = useState(restaurant.status);
  const [waitTime, setWaitTime] = useState(restaurant.waitTime);
  const [seatType, setSeatType] = useState(restaurant.info.seatType);
  const [smoking, setSmoking] = useState(restaurant.info.smoking);
  const [parking, setParking] = useState(restaurant.info.parking);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        name,
        status,
        waitTime,
        info: {
          seatType,
          smoking,
          parking,
        },
        lastUpdated: Timestamp.now(),
      });
      onClose();
    } catch (error) {
      console.error('Error updating restaurant:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button onClick={onClose} className="back-link">
            ← Back to Dashboard
          </button>
        </div>

        <h2 className="modal-title">Edit: {restaurant.name}</h2>

        <div className="edit-section">
          <h3 className="edit-section-title">Edit Restaurant</h3>

          <div className="form-group">
            <label className="form-label">Restaurant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Current Status</label>
            <div className="status-selector">
              <button
                className={`status-circle ${status === 'open' ? 'selected' : ''} open`}
                onClick={() => setStatus('open')}
                aria-label="Open"
              />
              <button
                className={`status-circle ${status === 'busy' ? 'selected' : ''} busy`}
                onClick={() => setStatus('busy')}
                aria-label="Busy"
              />
              <button
                className={`status-circle ${status === 'full' ? 'selected' : ''} full`}
                onClick={() => setStatus('full')}
                aria-label="Full"
              />
            </div>
            <p className="status-selected">
              Selected: <strong>{status.charAt(0).toUpperCase() + status.slice(1)}</strong>
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Wait Time Display</label>
            <input
              type="text"
              value={waitTime}
              onChange={(e) => setWaitTime(e.target.value)}
              className="form-input"
              placeholder="e.g., 0-10 min"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Seat Type</label>
            <input
              type="text"
              value={seatType}
              onChange={(e) => setSeatType(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Smoking</label>
            <input
              type="text"
              value={smoking}
              onChange={(e) => setSmoking(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parking</label>
            <input
              type="text"
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
