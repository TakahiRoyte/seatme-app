import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant, Table } from '../types/restaurant';
import { formatTime } from '../lib/availabilityUtils';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
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
            id: t.id,
            type: t.type,
            capacity: t.capacity,
            status: t.status === 'available' ? 'available' : 'occupied',
            occupiedSince: t.occupiedSince?.toDate() || null,
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
      alert(t('tableManagement.capacityError'));
      return;
    }

    const idExists = restaurant.tables.some(
      (table) => table.id.toLowerCase() === trimmedId.toLowerCase()
    );
    if (idExists) {
      alert(t('tableManagement.idExists'));
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
      alert(t('tableManagement.capacityError'));
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
          <p>{t('tableManagement.restaurantNotFound')}</p>
          <Link to="/staff" className="btn btn-primary">
            {t('tableManagement.backToDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="table-management">
      <div className="container">
        <Link to="/staff" className="back-link">
          ← {t('tableManagement.backToDashboard')}
        </Link>

        <h1 className="page-title">{restaurant.name} - {t('tableManagement.pageTitle')}</h1>

        {/* Summary Section - Moved to top */}
        <div className="summary-section">
          <div className="summary-card">
            <div className="summary-label">{t('common.available')}</div>
            <div className="summary-value available">
              {restaurant.tables.filter(t => t.status === 'available').length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('common.occupied')}</div>
            <div className="summary-value occupied">
              {restaurant.tables.filter(t => t.status === 'occupied').length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('common.total')}</div>
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
            {t('tableManagement.addTable')}
          </button>
        </div>

        <div className="table-list">
          <div className="table-header">
            <span className="col-seat">{t('tableManagement.seat')}</span>
            <span className="col-capacity">{t('common.capacity')}</span>
            <span className="col-status">{t('common.status')}</span>
            <span className="col-time">{t('tableManagement.time')}</span>
            <span className="col-actions">{t('common.actions')}</span>
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
              </span>
              
              <span className="col-capacity">{table.capacity}</span>
              
              <div className="col-status status-buttons">
                <button
                  className={`status-btn ${table.status === 'available' ? 'active available' : ''}`}
                  onClick={() => handleStatusChange(table.id, 'available')}
                >
                  🟢 {t('common.available')}
                </button>
                <button
                  className={`status-btn ${table.status === 'occupied' ? 'active occupied' : ''}`}
                  onClick={() => handleStatusChange(table.id, 'occupied')}
                >
                  🔴 {t('common.occupied')}
                </button>
              </div>
              
              <span className="col-time">
                {table.status === 'occupied' && table.occupiedSince && table.occupiedSince instanceof Date && (
                  <span className="time-info">{t('tableManagement.since', { time: formatTime(table.occupiedSince) })}</span>
                )}
                {table.status === 'available' && <span className="time-info">—</span>}
              </span>

              <div className="col-actions">
                <div className="action-buttons">
                  <button
                    type="button"
                    className="edit-table-btn"
                    onClick={() => setEditingDetailsTable(table)}
                    title={t('tableManagement.editSeatNameCapacity')}
                  >
                    ✏️ {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className="remove-table-btn"
                    onClick={() => handleRemoveTable(table.id)}
                    title={t('tableManagement.removeTable')}
                  >
                    🗑️ {t('common.remove')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

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

export interface GroupAvailability {
  icon: '🟢' | '🟡' | '🔴';
  statusKey: string;
}

function TableDetailsModal({ table, onSave, onClose }: TableDetailsModalProps) {
  const { t } = useTranslation();
  const [idValue, setIdValue] = useState(table.id);
  const [capacityValue, setCapacityValue] = useState(table.capacity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(table.id, idValue, capacityValue);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t('tableManagement.editTable')}</h2>

        <form onSubmit={handleSubmit} className="edit-table-form">
          <div className="form-group">
            <label className="form-label">{t('tableManagement.seatName')}</label>
            <input
              type="text"
              className="form-input"
              value={idValue}
              onChange={(e) => setIdValue(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('common.capacity')}</label>
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
              {t('common.saveChanges')}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t('common.cancel')}
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
  const { t } = useTranslation();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t('tableManagement.addTable')}</h2>

        <form className="add-table-form" onSubmit={onSubmit}>
          <div className="table-form-grid">
            <div className="form-group">
              <label className="form-label">{t('tableManagement.seat')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('tableManagement.tableIdPlaceholder')}
                value={newTableId}
                onChange={(e) => setNewTableId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('tableManagement.type')}</label>
              <select
                className="form-input"
                value={newTableType}
                onChange={(e) => setNewTableType(e.target.value as Table['type'])}
              >
                <option value="table">{t('common.table')}</option>
                <option value="counter">{t('common.counter')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('common.capacity')}</label>
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
              {t('tableManagement.addTable')}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
