import { useState, useEffect } from 'react';
import { Hexagon, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { SERVER_URL } from '../socket';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [promos, setPromos] = useState([]);
  
  // New promo form state
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPromos = async (pass) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/promos`, {
        headers: { 'x-admin-password': pass }
      });
      const data = await res.json();
      if (data.success) {
        setPromos(data.promos);
        setIsAuthenticated(true);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetchPromos(password);
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/promos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({
          code,
          discountPercentage: parseInt(discountPercentage),
          maxUses: maxUses ? parseInt(maxUses) : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setPromos([data.promo, ...promos]);
        setCode('');
        setDiscountPercentage('');
        setMaxUses('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create promo code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePromo = async (id, currentStatus) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/promos/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ active: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setPromos(promos.map(p => p.id === id ? data.promo : p));
      }
    } catch (err) {
      alert('Failed to toggle promo');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#163022] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-[#1b3a2a] border border-[#12261a] p-8 rounded-xl max-w-md w-full text-center shadow-xl">
          <Hexagon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-6">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full bg-[#163022] border border-white/20 text-white rounded-lg px-4 py-3 mb-4 outline-none focus:border-yellow-400"
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-yellow-400 text-[#163022] font-bold py-3 rounded-lg hover:bg-yellow-300">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#163022] text-white p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Hexagon className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-black font-serif tracking-tight">Admin Dashboard</h1>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8">{error}</div>}

        <div className="bg-[#1b3a2a] border border-white/10 rounded-xl p-6 sm:p-8 mb-10 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-yellow-400" /> Create Promo Code
          </h2>
          <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-white/60 mb-2">Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. SAVE50"
                className="w-full bg-[#163022] border border-white/20 text-white rounded-lg px-4 py-2.5 outline-none focus:border-yellow-400 uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Discount %</label>
              <input
                type="number"
                min="1"
                max="100"
                value={discountPercentage}
                onChange={e => setDiscountPercentage(e.target.value)}
                placeholder="e.g. 100"
                className="w-full bg-[#163022] border border-white/20 text-white rounded-lg px-4 py-2.5 outline-none focus:border-yellow-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Max Uses (Optional)</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="w-full bg-[#163022] border border-white/20 text-white rounded-lg px-4 py-2.5 outline-none focus:border-yellow-400"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 text-[#163022] font-bold py-2.5 rounded-lg hover:bg-yellow-300 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Code'}
            </button>
          </form>
        </div>

        <div className="bg-[#1b3a2a] border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#12261a] border-b border-white/10">
                <th className="p-4 font-semibold text-white/60 text-sm">Code</th>
                <th className="p-4 font-semibold text-white/60 text-sm">Discount</th>
                <th className="p-4 font-semibold text-white/60 text-sm">Usage</th>
                <th className="p-4 font-semibold text-white/60 text-sm">Status</th>
                <th className="p-4 font-semibold text-white/60 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-white/40">No promo codes found.</td>
                </tr>
              ) : promos.map(promo => (
                <tr key={promo.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold tracking-wider">{promo.code}</td>
                  <td className="p-4 font-medium text-yellow-400">{promo.discountPercentage}% OFF</td>
                  <td className="p-4 text-sm text-white/70">
                    {promo.timesUsed} / {promo.maxUses === null ? '∞' : promo.maxUses}
                  </td>
                  <td className="p-4">
                    {promo.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleTogglePromo(promo.id, promo.active)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                        promo.active 
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                          : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      {promo.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
