import { useState, useEffect } from 'react';
import client from '../api';

const STATUS_BADGES = {
  active: 'badge-success',
  paused: 'badge-warning',
  cancelled: 'badge-error',
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const res = await client.get('/admin/subscriptions', { params });
      setSubscriptions(res.data.data);
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const totalVolume = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.volumePerDayLiters || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>Subscriptions</h2>
        <p>{subscriptions.length} subscriptions • {totalVolume}L daily from active</p>
      </div>

      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading...</p>
        ) : subscriptions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>No subscriptions found</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Qty / Day</th>
                <th>Volume / Day</th>
                <th>Slot</th>
                <th>Status</th>
                <th>Skip Dates</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.user?.name || '—'}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{sub.user?.phone}</div>
                  </td>
                  <td>{sub.product?.name || '—'}</td>
                  <td style={{ fontWeight: 700 }}>{sub.quantityPerDay}</td>
                  <td style={{ fontWeight: 700, color: '#1B5E20' }}>{sub.volumePerDayLiters}L</td>
                  <td style={{ fontSize: 12 }}>{sub.deliverySlot}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGES[sub.status] || 'badge-neutral'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#999' }}>
                    {sub.skipDates?.length > 0 ? `${sub.skipDates.length} dates` : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: '#999' }}>
                    {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
