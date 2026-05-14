import { useState, useEffect } from 'react';
import client from '../api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
    type: 'milk',
    category: '',
    isSubscriptionAllowed: true,
    farmSource: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await client.get('/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setForm({ ...product });
    } else {
      setEditingProduct(null);
      setForm({
        name: '',
        description: '',
        price: '',
        unit: '',
        type: 'milk',
        category: '',
        isSubscriptionAllowed: true,
        farmSource: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await client.put(`/products/${editingProduct._id}`, form);
      } else {
        await client.post('/products', form);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Product Management</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>+ Add Product</button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#999' }}>Loading...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Type</th>
                <th>Sub Allowed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{p.unit}</div>
                  </td>
                  <td>{p.category}</td>
                  <td style={{ fontWeight: 600 }}>₹{p.price}</td>
                  <td><span className="badge badge-neutral">{p.type}</span></td>
                  <td>{p.isSubscriptionAllowed ? '✅ Yes' : '❌ No'}</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => openModal(p)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <h3>{editingProduct ? 'Edit' : 'Add'} Product</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="row" style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Unit (e.g. 1L, 200g)</label>
                  <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
                </div>
              </div>
              <div className="row" style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="milk">Milk</option>
                    <option value="mushroom">Mushroom</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Category</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input 
                  type="checkbox" 
                  checked={form.isSubscriptionAllowed} 
                  onChange={(e) => setForm({ ...form, isSubscriptionAllowed: e.target.checked })}
                  id="sub-allowed"
                />
                <label htmlFor="sub-allowed" style={{ marginBottom: 0 }}>Allow Subscriptions</label>
              </div>
              <div className="form-group">
                <label>Farm Source</label>
                <input type="text" value={form.farmSource} onChange={(e) => setForm({ ...form, farmSource: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
