import { useState, useEffect } from 'react';
import client from '../api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState(null);
  const [form, setForm] = useState({ totalMilkProcuredLiters: '', totalMushroomPackets: '', wastageLiters: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchInventory = async () => {
    try {
      const res = await client.get('/inventory/today');
      setInventory(res.data.data);
      setForm({
        totalMilkProcuredLiters: res.data.data.totalMilkProcuredLiters || '',
        totalMushroomPackets: res.data.data.totalMushroomPackets || '',
        wastageLiters: res.data.data.wastageLiters || '',
      });
    } catch (err) {
      console.error('Fetch inventory error:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await client.put('/inventory/today', {
        totalMilkProcuredLiters: Number(form.totalMilkProcuredLiters),
        totalMushroomPackets: Number(form.totalMushroomPackets),
        wastageLiters: Number(form.wastageLiters),
      });
      await fetchInventory();
      setMessage('✅ Inventory updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to update'));
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    try {
      const res = await client.post('/inventory/allocate');
      setMessage('✅ ' + res.data.message);
      await fetchInventory();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Allocation failed'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Inventory Management</h2>
        <p>Set today's milk procurement and track allocation</p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 14,
          fontWeight: 600,
          background: message.includes('✅') ? '#E8F5E9' : '#FFEBEE',
          color: message.includes('✅') ? '#2E7D32' : '#C62828',
        }}>
          {message}
        </div>
      )}

      {/* Update Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>📝 Update Daily Procurement</h3>
        <form onSubmit={handleUpdate}>
          <div className="inventory-form">
            <div className="form-group">
              <label>Milk Procured (Litres)</label>
              <input
                type="number"
                value={form.totalMilkProcuredLiters}
                onChange={(e) => setForm({ ...form, totalMilkProcuredLiters: e.target.value })}
                min="0"
                step="0.5"
                required
              />
            </div>
            <div className="form-group">
              <label>Mushroom Packets</label>
              <input
                type="number"
                value={form.totalMushroomPackets}
                onChange={(e) => setForm({ ...form, totalMushroomPackets: e.target.value })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Wastage (Litres)</label>
              <input
                type="number"
                value={form.wastageLiters}
                onChange={(e) => setForm({ ...form, wastageLiters: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Updating...' : '💾 Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Allocate Button */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔄 Subscription Allocation</h3>
          <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
            Recalculate how much milk is reserved for active subscriptions today
          </p>
        </div>
        <button className="btn btn-outline" onClick={handleAllocate}>
          Run Allocation
        </button>
      </div>

      {/* Current Status */}
      {inventory && (
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📊 Current Status</h3>
          <div className="inventory-status">
            <div className="inv-stat">
              <div className="num">{inventory.totalMilkProcuredLiters}L</div>
              <div className="lbl">Total Procured</div>
            </div>
            <div className="inv-stat">
              <div className="num">{inventory.allocatedToSubscriptionsLiters}L</div>
              <div className="lbl">For Subscriptions</div>
            </div>
            <div className="inv-stat">
              <div className="num" style={{ color: inventory.availableForInstantOrdersLiters > 0 ? '#2E7D32' : '#C62828' }}>
                {inventory.availableForInstantOrdersLiters}L
              </div>
              <div className="lbl">Available Instant</div>
            </div>
            <div className="inv-stat">
              <div className="num">{inventory.soldInstantLiters}L</div>
              <div className="lbl">Sold (Instant)</div>
            </div>
            <div className="inv-stat">
              <div className="num">{inventory.totalMushroomPackets}</div>
              <div className="lbl">Mushroom Packets</div>
            </div>
            <div className="inv-stat">
              <div className="num" style={{ color: '#E65100' }}>{inventory.wastageLiters}L</div>
              <div className="lbl">Wastage</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
