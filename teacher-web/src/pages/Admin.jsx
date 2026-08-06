import { useState, useEffect } from 'react';
import { Hexagon, Plus, CheckCircle2, XCircle, Users, Clock, Settings, Activity } from 'lucide-react';
import { SERVER_URL } from '../socket';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('promos'); // 'promos', 'live', 'history'

  // Data states
  const [promos, setPromos] = useState([]);
  const [liveRooms, setLiveRooms] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]);
  
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

  const fetchLiveRooms = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/live-rooms`, {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (data.success) {
        setLiveRooms(data.liveRooms);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoomHistory = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/room-history`, {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();
      if (data.success) {
        setRoomHistory(data.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetchPromos(password);
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'promos') fetchPromos(password);
      if (activeTab === 'live') fetchLiveRooms();
      if (activeTab === 'history') fetchRoomHistory();
    }
  }, [activeTab, isAuthenticated]);

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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <Hexagon className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-black font-serif tracking-tight">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-2 bg-[#1b3a2a] p-1.5 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('promos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-colors ${
                activeTab === 'promos' ? 'bg-yellow-400 text-[#163022]' : 'text-white/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" /> Promos
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-colors ${
                activeTab === 'live' ? 'bg-yellow-400 text-[#163022]' : 'text-white/60 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" /> Live Rooms
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-colors ${
                activeTab === 'history' ? 'bg-yellow-400 text-[#163022]' : 'text-white/60 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" /> Room History
            </button>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8">{error}</div>}

        {/* PROMOS TAB */}
        {activeTab === 'promos' && (
          <>
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

            <div className="bg-[#1b3a2a] border border-white/10 rounded-xl overflow-hidden shadow-xl overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
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
                          className="text-sm font-bold text-white/60 hover:text-white"
                        >
                          {promo.active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* LIVE ROOMS TAB */}
        {activeTab === 'live' && (
          <div className="bg-[#1b3a2a] border border-white/10 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <h2 className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Active Rooms ({liveRooms.length})
              </h2>
              <button 
                onClick={fetchLiveRooms}
                className="text-sm text-white/60 hover:text-white"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#12261a] border-b border-white/10">
                    <th className="p-4 font-semibold text-white/60 text-sm">Room Code</th>
                    <th className="p-4 font-semibold text-white/60 text-sm">Host Info</th>
                    <th className="p-4 font-semibold text-white/60 text-sm">Status</th>
                    <th className="p-4 font-semibold text-white/60 text-sm">Students ({liveRooms.reduce((acc, r) => acc + (r.players?.length || 0), 0)})</th>
                  </tr>
                </thead>
                <tbody>
                  {liveRooms.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-white/40">No live rooms currently.</td>
                    </tr>
                  ) : liveRooms.map(room => (
                    <tr key={room.code} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-black tracking-widest text-yellow-400">{room.code}</td>
                      <td className="p-4">
                        {room.teacher ? (
                          <div>
                            <div className="font-bold">{room.teacher.name}</div>
                            <div className="text-xs text-white/50">{room.teacher.email}</div>
                            <span className="inline-block mt-1 text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-white/70">
                              {room.teacher.plan}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/40 italic">Unknown/Anonymous</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center text-xs font-semibold bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full uppercase">
                          {room.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {room.players && room.players.length > 0 ? (
                            room.players.map((p, i) => (
                              <span key={i} className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-white/60 truncate max-w-[80px]">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-white/30">No students yet</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ROOM HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-[#1b3a2a] border border-white/10 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <h2 className="font-bold">Recent Completed Rooms</h2>
              <button 
                onClick={fetchRoomHistory}
                className="text-sm text-white/60 hover:text-white"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#12261a] border-b border-white/10">
                    <th className="p-4 font-semibold text-white/60 text-sm">Date</th>
                    <th className="p-4 font-semibold text-white/60 text-sm">Room Code</th>
                    <th className="p-4 font-semibold text-white/60 text-sm">Host</th>
                    <th className="p-4 font-semibold text-white/60 text-sm">Total Players</th>
                  </tr>
                </thead>
                <tbody>
                  {roomHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-white/40">No room history found.</td>
                    </tr>
                  ) : roomHistory.map(history => (
                    <tr key={history.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-white/70">
                        {new Date(history.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold tracking-wider">{history.roomCode}</td>
                      <td className="p-4">
                        {history.teacher ? (
                          <div>
                            <div className="font-bold">{history.teacher.name}</div>
                            <span className="text-xs text-white/50">{history.teacher.email}</span>
                          </div>
                        ) : (
                          <span className="text-white/40 italic">Unknown</span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-bold">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-white/40" />
                          {history.totalPlayers}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
