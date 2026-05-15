import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import client from '../api';

const SettingsPage = () => {
  const [configs, setConfigs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await client.get('/config');
      setConfigs(res.data.data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    setSaving(true);
    try {
      await client.put(`/config/${key}`, { value });
      toast.success('Settings updated');
      fetchConfigs();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      {/* Delivery Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🚚 Delivery Parameters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Order Value (₹)</label>
            <input 
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={configs.delivery_settings.minOrderValue}
              onChange={(e) => setConfigs({
                ...configs,
                delivery_settings: { ...configs.delivery_settings, minOrderValue: e.target.value }
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Free Delivery Threshold (₹)</label>
            <input 
              type="number"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={configs.delivery_settings.freeDeliveryThreshold}
              onChange={(e) => setConfigs({
                ...configs,
                delivery_settings: { ...configs.delivery_settings, freeDeliveryThreshold: e.target.value }
              })}
            />
          </div>
        </div>
        <button 
          onClick={() => handleUpdate('delivery_settings', configs.delivery_settings)}
          disabled={saving}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Delivery Settings'}
        </button>
      </div>

      {/* Payment Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          💳 Payment Gateways
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input 
              type="checkbox"
              checked={configs.payment_settings.razorpayEnabled}
              onChange={(e) => setConfigs({
                ...configs,
                payment_settings: { ...configs.payment_settings, razorpayEnabled: e.target.checked }
              })}
            />
            <span>Enable Razorpay (Online Payments)</span>
          </label>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox"
              checked={configs.payment_settings.codEnabled}
              onChange={(e) => setConfigs({
                ...configs,
                payment_settings: { ...configs.payment_settings, codEnabled: e.target.checked }
              })}
            />
            <span>Enable Cash on Delivery</span>
          </label>
          <label className="flex items-center gap-3">
            <input 
              type="checkbox"
              checked={configs.payment_settings.walletEnabled}
              onChange={(e) => setConfigs({
                ...configs,
                payment_settings: { ...configs.payment_settings, walletEnabled: e.target.checked }
              })}
            />
            <span>Enable Wallet System</span>
          </label>
        </div>
        <button 
          onClick={() => handleUpdate('payment_settings', configs.payment_settings)}
          disabled={saving}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Payment Settings'}
        </button>
      </div>

      {/* Contact Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📞 Support & Contact
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Support Phone</label>
            <input 
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={configs.contact_settings.supportPhone}
              onChange={(e) => setConfigs({
                ...configs,
                contact_settings: { ...configs.contact_settings, supportPhone: e.target.value }
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Support Email</label>
            <input 
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={configs.contact_settings.supportEmail}
              onChange={(e) => setConfigs({
                ...configs,
                contact_settings: { ...configs.contact_settings, supportEmail: e.target.value }
              })}
            />
          </div>
        </div>
        <button 
          onClick={() => handleUpdate('contact_settings', configs.contact_settings)}
          disabled={saving}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Contact Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
