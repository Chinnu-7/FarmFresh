import { useState, useEffect } from 'react';
import client from '../api';

const STATUS_BADGES = {
  placed: 'badge-info',
  packed: 'badge-warning',
  out_for_delivery: 'badge-warning',
  delivered: 'badge-success',
  cancelled: 'badge-error',
};

const STATUS_OPTIONS = ['placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter) params.status = filter;
      const res = await client.get('/admin/orders', { params });
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await client.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <div className="page-header">
        <h2>Orders</h2>
        <p>{total} total orders</p>
      </div>

      <div className="filter-bar">
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>No orders found</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>{order.orderNumber || order._id.slice(-6)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.user?.name || '—'}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{order.user?.phone}</div>
                  </td>
                  <td>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ fontSize: 13 }}>
                        {item.product?.name?.split(' - ')[0] || 'Product'} ×{item.quantity}
                      </div>
                    ))}
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{order.totalAmount}</td>
                  <td>
                    <span className={`badge ${order.type === 'instant' ? 'badge-info' : 'badge-neutral'}`}>
                      {order.type === 'subscription-fulfillment' ? 'Sub' : 'Instant'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${order.paymentStatus === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {order.paymentMethod?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGES[order.status] || 'badge-neutral'}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#999' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <select
                        value=""
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #ddd' }}
                      >
                        <option value="" disabled>Update</option>
                        {STATUS_OPTIONS
                          .filter((s) => STATUS_OPTIONS.indexOf(s) > STATUS_OPTIONS.indexOf(order.status))
                          .map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                          ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              ← Prev
            </button>
            <span style={{ padding: '10px 16px', fontSize: 14, color: '#666' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-outline" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
