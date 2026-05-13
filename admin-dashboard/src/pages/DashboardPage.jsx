import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import client from '../api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, predRes] = await Promise.all([
        client.get('/admin/stats'),
        client.get('/admin/demand-prediction'),
      ]);
      setStats(statsRes.data.data);
      setPrediction(predRes.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ fontSize: 18, color: '#999' }}>Loading dashboard...</p>
      </div>
    );
  }

  const inv = stats?.todayInventory;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of FarmFresh Direct operations</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F5E9' }}>👥</div>
          <div className="stat-info">
            <div className="label">Total Customers</div>
            <div className="value">{stats?.totalUsers || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E3F2FD' }}>📦</div>
          <div className="stat-info">
            <div className="label">Total Orders</div>
            <div className="value">{stats?.totalOrders || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FFF3E0' }}>🔁</div>
          <div className="stat-info">
            <div className="label">Active Subscriptions</div>
            <div className="value">{stats?.activeSubscriptions || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FCE4EC' }}>💰</div>
          <div className="stat-info">
            <div className="label">Monthly Revenue</div>
            <div className="value">₹{stats?.monthlyRevenue?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-section">
        <div className="chart-card">
          <h3>📈 Daily Revenue (Last 7 Days)</h3>
          {stats?.dailyRevenue?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #eee' }}
                />
                <Bar dataKey="revenue" fill="#2E7D32" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', paddingTop: 80 }}>No revenue data yet</p>
          )}
        </div>

        <div className="chart-card">
          <h3>🔮 Demand Prediction</h3>
          {prediction ? (
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <div style={{ fontSize: 14, color: '#999', marginBottom: 8 }}>Tomorrow's Predicted Demand</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: '#1B5E20' }}>
                {prediction.predictedDemandLiters}L
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>{prediction.subscriptionBaseLiters}L</div>
                  <div style={{ fontSize: 11, color: '#999' }}>Subscription Base</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>{prediction.avgDailyConsumptionLiters}L</div>
                  <div style={{ fontSize: 11, color: '#999' }}>Avg Daily</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>{prediction.daysOfData}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>Days Data</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <span className={`badge ${prediction.confidence === 'high' ? 'badge-success' : prediction.confidence === 'medium' ? 'badge-warning' : 'badge-error'}`}>
                  {prediction.confidence} confidence
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', paddingTop: 80 }}>Loading prediction...</p>
          )}
        </div>
      </div>

      {/* Today's Inventory Status */}
      {inv && (
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🏭 Today's Inventory</h3>
          <div className="inventory-status">
            <div className="inv-stat">
              <div className="num">{inv.totalMilkProcuredLiters}L</div>
              <div className="lbl">Total Procured</div>
            </div>
            <div className="inv-stat">
              <div className="num">{inv.allocatedToSubscriptionsLiters}L</div>
              <div className="lbl">Subscriptions</div>
            </div>
            <div className="inv-stat">
              <div className="num" style={{ color: inv.availableForInstantOrdersLiters > 0 ? '#2E7D32' : '#C62828' }}>
                {inv.availableForInstantOrdersLiters}L
              </div>
              <div className="lbl">Available Instant</div>
            </div>
            <div className="inv-stat">
              <div className="num">{inv.soldInstantLiters}L</div>
              <div className="lbl">Sold Instant</div>
            </div>
            <div className="inv-stat">
              <div className="num">{inv.totalMushroomPackets - inv.soldMushroomPackets}</div>
              <div className="lbl">Mushroom Pkts Left</div>
            </div>
            <div className="inv-stat">
              <div className="num" style={{ color: '#E65100' }}>{inv.wastageLiters}L</div>
              <div className="lbl">Wastage</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
