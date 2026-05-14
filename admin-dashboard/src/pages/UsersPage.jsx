import { useState, useEffect } from 'react';
import client from '../api';

const ROLE_BADGES = {
  customer: 'badge-info',
  admin: 'badge-success',
  delivery: 'badge-warning',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter) params.role = filter;
      const res = await client.get('/admin/users', { params });
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      (u.name?.toLowerCase() || '').includes(s) ||
      (u.phone || '').includes(s) ||
      (u.email?.toLowerCase() || '').includes(s)
    );
  });

  return (
    <div>
      <div className="page-header">
        <h2>Users</h2>
        <p>{total} registered users</p>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 36 }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 200 }}>
          <option value="">All Roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
          <option value="delivery">Delivery Partners</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>No users found</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th>Wallet</th>
                <th>Addresses</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td style={{ fontWeight: 600 }}>{user.name || '—'}</td>
                  <td>{user.phone}</td>
                  <td style={{ fontSize: 13, color: '#666' }}>{user.email || '—'}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGES[user.role] || 'badge-neutral'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{user.walletBalance || 0}</td>
                  <td style={{ fontSize: 12, color: '#999' }}>
                    {user.addresses?.length || 0} saved
                  </td>
                  <td style={{ fontSize: 12, color: '#999' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
