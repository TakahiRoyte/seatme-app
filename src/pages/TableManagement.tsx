import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant, Table } from '../types/restaurant';
import { formatTime } from '../lib/availabilityUtils';
import './TableManagement.css';

const cleanTableForSave = (table: Table) => {
  const cleanTable: any = {
    id: table.id,
    type: table.type,
    capacity: table.capacity,
    status: table.status,
  };

  if (table.occupiedSince) {
    cleanTable.occupiedSince = table.occupiedSince;
  }

  if (table.reservationWindow) {
    cleanTable.reservationWindow = table.reservationWindow;
  }

  return cleanTable;
};

const reorderTables = (tables: Table[], fromId: string, toId: string) => {
  const fromIndex = tables.findIndex((t) => t.id === fromId);
  const toIndex = tables.findIndex((t) => t.id === toId);

  if (fromIndex === -1 || toIndex === -1) return tables;

  const updated = [...tables];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);

  return updated;
};

export default function TableManagement() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservationTable, setReservationTable] = useState<Table | null>(null);
  const [editingDetailsTable, setEditingDetailsTable] = useState<Table | null>(null);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableId, setNewTableId] = useState('');
  const [newTableType, setNewTableType] = useState<Table['type']>('table');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

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

  const handleStatusChange = async (tableId: string, newStatus: Table['status']) => {
    if (!restaurant) return;

    const updatedTables = restaurant.tables.map((table) => {
      if (table.id === tableId) {
        return cleanTableForSave({
          ...table,
          status: newStatus,
          occupiedSince: newStatus === 'occupied' ? (Timestamp.now() as unknown as Date) : null,
          reservationWindow: newStatus === 'reserved' ? table.reservationWindow || null : null,
        });
      }

      return cleanTableForSave(table);
    });

    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        tables: updatedTables,
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating table status:', error);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    const trimmedId = newTableId.trim();
    if (!trimmedId) return;

    const parsedCapacity = Number(newTableCapacity);
    if (!parsedCapacity || parsedCapacity < 1) {
      alert('Capacity must be at least 1.');
      return;
    }

    const idExists = restaurant.tables.some(
      (table) => table.id.toLowerCase() === trimmedId.toLowerCase()
    );
    if (idExists) {
      alert('Table ID already exists.');
      return;
    }

    const newTable: Table = {
      id: trimmedId,
      type: newTableType,
      capacity: parsedCapacity,
      status: 'available',
    };

    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        tables: [...restaurant.tables.map(cleanTableForSave), cleanTableForSave(newTable)],
        lastUpdated: Timestamp.now(),
      });
      setNewTableId('');
      setNewTableCapacity(4);
      setNewTableType('table');
      setShowAddTableModal(false);
    } catch (error) {
      console.error('Error adding table:', error);
    }
  };

  const handleRemoveTable = async (tableId: string) => {
    if (!restaurant) return;

    const updatedTables = restaurant.tables
      .filter((table) => table.id !== tableId)
      .map(cleanTableForSave);

    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        tables: updatedTables,
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error removing table:', error);
    }
  };

  const handleSaveTableDetails = async (
    originalId: string,
    updatedId: string,
    updatedCapacity: number
  ) => {
    if (!restaurant) return;

    const trimmedId = updatedId.trim();
    if (!trimmedId) return;

    if (!updatedCapacity || updatedCapacity < 1) {
      alert('Capacity must be at least 1.');
      return;
    }

    const idExists = restaurant.tables.some(
      (table) => table.id.toLowerCase() === trimmedId.toLowerCase() && table.id !== originalId
    );
    if (idExists) {
      alert('Table ID already exists.');
      return;
    }

    const updatedTables = restaurant.tables.map((table) =>
      table.id === originalId
        ? cleanTableForSave({ ...table, id: trimmedId, capacity: updatedCapacity })
        : cleanTableForSave(table)
    );

    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        tables: updatedTables,
        lastUpdated: Timestamp.now(),
      });
      setEditingDetailsTable(null);
    } catch (error) {
      console.error('Error updating table details:', error);
    }
  };

  const handleDragStart = (tableId: string) => {
    setDraggingId(tableId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!restaurant || !draggingId || draggingId === targetId) return;

    const reordered = reorderTables(restaurant.tables, draggingId, targetId);
    setRestaurant({ ...restaurant, tables: reordered });
    setDragOverId(targetId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (targetId: string) => {
    if (!restaurant || !draggingId) return;

    const reordered = reorderTables(restaurant.tables, draggingId, targetId);
    setDragOverId(null);
    setDraggingId(null);
    setRestaurant({ ...restaurant, tables: reordered });

    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        tables: reordered.map(cleanTableForSave),
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error reordering tables:', error);
    }
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    setDraggingId(null);
  };

  if (loading) {
    return (
      <div className="table-management">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="table-management">
        <div className="container">
          <p>Restaurant not found</p>
          <Link to="/staff" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="table-management">
      <div className="container">
        <Link to="/staff" className="back-link">
          ← Back to Dashboard
        </Link>

        <h1 className="page-title">{restaurant.name} - Table Management</h1>

        {/* Summary Section - Moved to top */}
        <div className="summary-section">
          <div className="summary-card">
            <div className="summary-label">Available</div>
            <div className="summary-value available">
              {restaurant.tables.filter(t => t.status === 'available').length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Occupied</div>
            <div className="summary-value occupied">
              {restaurant.tables.filter(t => t.status === 'occupied').length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Reserved</div>
            <div className="summary-value reserved">
              {restaurant.tables.filter(t => t.status === 'reserved').length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total</div>
            <div className="summary-value total">
              {restaurant.tables.length}
            </div>
          </div>
        </div>

        <div className="table-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddTableModal(true)}
          >
            Add Table
          </button>
        </div>

        <div className="table-list">
          <div className="table-header">
            <span className="col-seat">Seat</span>
            <span className="col-capacity">Capacity</span>
            <span className="col-status">Status</span>
            <span className="col-time">Time</span>
            <span className="col-actions">Actions</span>
          </div>

          {restaurant.tables.map((table) => {
            const rowClasses = [
              'table-row',
              'card',
              'draggable-row',
              draggingId === table.id ? 'dragging' : '',
              dragOverId === table.id ? 'drag-over' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={table.id}
                className={rowClasses}
                draggable
                onDragStart={() => handleDragStart(table.id)}
                onDragOver={(e) => handleDragOver(e, table.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(table.id);
                }}
                onDragEnd={handleDragEnd}
              >
              <span className="col-seat table-id">
                <span className={`table-type-icon ${table.type}`}>
                  {table.type === 'table' ? '🍽️' : '🪑'}
                </span>
                {table.id}
                <span 
                  className="edit-table-icon" 
                  onClick={() => setEditingDetailsTable(table)}
                  title="Edit table"
                >
                  ✏️
                </span>
              </span>
              
              <span className="col-capacity">{table.capacity}</span>
              
              <div className="col-status status-buttons">
                <button
                  className={`status-btn ${table.status === 'available' ? 'active available' : ''}`}
                  onClick={() => handleStatusChange(table.id, 'available')}
                >
                  🟢 Available
                </button>
                <button
                  className={`status-btn ${table.status === 'occupied' ? 'active occupied' : ''}`}
                  onClick={() => handleStatusChange(table.id, 'occupied')}
                >
                  🔴 Occupied
                </button>
                <button
                  className={`status-btn ${table.status === 'reserved' ? 'active reserved' : ''}`}
                  onClick={() => setReservationTable(table)}
                >
                  🟡 Reserved
                </button>
              </div>
              
              <span className="col-time">
                {table.status === 'occupied' && table.occupiedSince && table.occupiedSince instanceof Date && (
                  <span className="time-info">since {formatTime(table.occupiedSince)}</span>
                )}
                {table.status === 'reserved' && table.reservationWindow && (
                  <span className="time-info">
                    {table.reservationWindow.start}–{table.reservationWindow.end}
                  </span>
                )}
                {table.status === 'available' && <span className="time-info">—</span>}
              </span>

              <div className="col-actions">
                <div className="action-buttons">
                  <button
                    type="button"
                    className="edit-table-btn"
                    onClick={() => setEditingDetailsTable(table)}
                    title="Edit seat name and capacity"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    className="remove-table-btn"
                    onClick={() => handleRemoveTable(table.id)}
                    title="Remove table"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {reservationTable && (
        <ReservationModal
          table={reservationTable}
          restaurantId={restaurant.id}
          onClose={() => setReservationTable(null)}
        />
      )}

      {editingDetailsTable && (
        <TableDetailsModal
          table={editingDetailsTable}
          onSave={handleSaveTableDetails}
          onClose={() => setEditingDetailsTable(null)}
        />
      )}

      {showAddTableModal && (
        <AddTableModal
          newTableId={newTableId}
          newTableType={newTableType}
          newTableCapacity={newTableCapacity}
          setNewTableId={setNewTableId}
          setNewTableType={setNewTableType}
          setNewTableCapacity={setNewTableCapacity}
          onSubmit={handleAddTable}
          onClose={() => setShowAddTableModal(false)}
        />
      )}
    </div>
  );
}

interface TableDetailsModalProps {
  table: Table;
  onSave: (originalId: string, updatedId: string, updatedCapacity: number) => void;
  onClose: () => void;
}

function TableDetailsModal({ table, onSave, onClose }: TableDetailsModalProps) {
  const [idValue, setIdValue] = useState(table.id);
  const [capacityValue, setCapacityValue] = useState(table.capacity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(table.id, idValue, capacityValue);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Table</h2>

        <form onSubmit={handleSubmit} className="edit-table-form">
          <div className="form-group">
            <label className="form-label">Seat Name</label>
            <input
              type="text"
              className="form-input"
              value={idValue}
              onChange={(e) => setIdValue(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={capacityValue}
              onChange={(e) => setCapacityValue(Number(e.target.value))}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddTableModalProps {
  newTableId: string;
  newTableType: Table['type'];
  newTableCapacity: number;
  setNewTableId: (value: string) => void;
  setNewTableType: (value: Table['type']) => void;
  setNewTableCapacity: (value: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function AddTableModal({
  newTableId,
  newTableType,
  newTableCapacity,
  setNewTableId,
  setNewTableType,
  setNewTableCapacity,
  onSubmit,
  onClose,
}: AddTableModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Table</h2>

        <form className="add-table-form" onSubmit={onSubmit}>
          <div className="table-form-grid">
            <div className="form-group">
              <label className="form-label">Table ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. T5"
                value={newTableId}
                onChange={(e) => setNewTableId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={newTableType}
                onChange={(e) => setNewTableType(e.target.value as Table['type'])}
              >
                <option value="table">Table</option>
                <option value="counter">Counter</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Capacity</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">
              Add Table
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reservation Modal Component
interface ReservationModalProps {
  table: Table;
  restaurantId: string;
  onClose: () => void;
}

function ReservationModal({ table, restaurantId, onClose }: ReservationModalProps) {
  const [startTime, setStartTime] = useState(table.reservationWindow?.start || '19:00');
  const [endTime, setEndTime] = useState(table.reservationWindow?.end || '21:00');

  const handleSave = async () => {
    try {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const restaurantDoc = await onSnapshot(restaurantRef, (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        const updatedTables = data.tables.map((t: any) => {
          if (t.id === table.id) {
            const reservedTable: Table = {
              id: t.id,
              type: t.type,
              capacity: t.capacity,
              status: 'reserved',
              reservationWindow: { start: startTime, end: endTime },
            };

            return cleanTableForSave(reservedTable);
          }

          const existingTable: Table = {
            id: t.id,
            type: t.type,
            capacity: t.capacity,
            status: t.status,
            occupiedSince: t.occupiedSince || null,
            reservationWindow: t.reservationWindow || null,
          };

          return cleanTableForSave(existingTable);
        });

        updateDoc(restaurantRef, {
          tables: updatedTables,
          lastUpdated: Timestamp.now(),
        });
      });

      restaurantDoc();
      onClose();
    } catch (error) {
      console.error('Error setting reservation:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal reservation-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Set Reservation - {table.id}</h2>

        <div className="form-group">
          <label className="form-label">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="modal-actions">
          <button onClick={handleSave} className="btn btn-primary">
            Set Reservation
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
