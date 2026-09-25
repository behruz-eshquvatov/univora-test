import { useState, useEffect } from 'react';
import {
  adminUserApi,
  type AdminUserListItem,
  type AdminUserDetail,
  type AdminUsersStats,
} from '../../lib/api/adminUser';
import {
  Search,
  Lock,
  Unlock,
  Eye,
  Loader2,
  AlertTriangle,
  UserCheck,
  UserX,
  Shield,
  Crown,
  X,
  Phone,
  Send,
  Smartphone,
} from 'lucide-react';

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [stats, setStats] = useState<AdminUsersStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');

  // Selected User Detail Drawer
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Block Modal State
  const [blockingUser, setBlockingUser] = useState<AdminUserListItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [submittingBlock, setSubmittingBlock] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, tierFilter]);

  const fetchUsers = async (searchQuery = search) => {
    setLoading(true);
    try {
      const res = await adminUserApi.getUsers({
        search: searchQuery || undefined,
        role: (roleFilter as any) || undefined,
        tier: (tierFilter as any) || undefined,
      });
      setUsers(res.results);
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleOpenDetail = async (user: AdminUserListItem) => {
    setLoadingDetail(true);
    try {
      const detail = await adminUserApi.getUserDetail(user.id);
      setSelectedUserDetail(detail);
    } catch (err) {
      alert('Foydalanuvchi tafsilotlarini yuklab bo\'lmadi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!blockingUser) return;
    setSubmittingBlock(true);
    try {
      await adminUserApi.blockUser(blockingUser.id, blockReason);
      setBlockingUser(null);
      setBlockReason('');
      fetchUsers();
      if (selectedUserDetail?.id === blockingUser.id) {
        setSelectedUserDetail(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Bloklashda xatolik yuz berdi');
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleConfirmUnblock = async (user: AdminUserListItem) => {
    if (!confirm(`${user.full_name || user.email} foydalanuvchisini blokdan chiqarishni tasdiqlaysizmi?`)) return;
    try {
      await adminUserApi.unblockUser(user.id);
      fetchUsers();
      if (selectedUserDetail?.id === user.id) {
        setSelectedUserDetail(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Blokdan chiqarishda xatolik');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami foydalanuvchilar</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Talabalar</p>
            <p className="text-2xl font-black text-violet-600 mt-1">{stats.students}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PRO Obuna</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.pro}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mentorlar</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.mentors}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bloklangan</p>
            <p className="text-2xl font-black text-rose-500 mt-1">{stats.blocked}</p>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Search & Filters Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Foydalanuvchilar ro'yxati</h2>

          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Qidirish (Email, Ism)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 w-56"
              />
            </form>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
            >
              <option value="">Barcha rollar</option>
              <option value="student">Talaba</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
            >
              <option value="">Barcha tariflar</option>
              <option value="pro">PRO</option>
              <option value="free">Bepul (Free)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-2" />
            <p className="text-slate-500 font-bold text-sm">Yuklanmoqda...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Foydalanuvchi</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">XP</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4">Ro'yxatdan o'tgan</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0">
                          {u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {u.full_name || 'Ism kiritilmagan'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold capitalize">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-violet-600">{u.xp_total} XP</td>
                    <td className="p-4">
                      {u.is_blocked ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-600 border border-rose-200 inline-flex items-center gap-1">
                          <UserX className="w-3 h-3" /> Bloklangan
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200 inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Faol
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(u)}
                          className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                          title="Karta va tafsilotlar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {u.is_blocked ? (
                          <button
                            onClick={() => handleConfirmUnblock(u)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Blokni ochish"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setBlockingUser(u);
                              setBlockReason('');
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Bloklash"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Drawer Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <h3 className="font-extrabold text-lg text-slate-900">Foydalanuvchi kartasi</h3>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Header profile */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-violet-100 text-violet-600 font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  {selectedUserDetail.full_name
                    ? selectedUserDetail.full_name[0].toUpperCase()
                    : selectedUserDetail.email[0].toUpperCase()}
                </div>
                <h4 className="font-extrabold text-xl text-slate-900">
                  {selectedUserDetail.full_name || 'Ismsiz'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">{selectedUserDetail.email}</p>
              </div>

              {/* Subscription Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 mb-6">
                <div className="flex items-center gap-2 text-violet-700 font-extrabold text-xs uppercase tracking-wider mb-2">
                  <Crown className="w-4 h-4" />
                  <span>Obuna holati</span>
                </div>
                {selectedUserDetail.subscription ? (
                  <div>
                    <p className="font-black text-lg text-slate-800">
                      {selectedUserDetail.subscription.plan}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tugash muddati: {new Date(selectedUserDetail.subscription.expires_at).toLocaleDateString()} ({selectedUserDetail.subscription.days_left} kun qoldi)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-600">Faol obuna mavjud emas (Free tier)</p>
                )}
              </div>

              {/* Personal Details */}
              <div className="space-y-3 text-sm font-medium">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Telefon:</span>
                  <span className="font-bold text-slate-700">{selectedUserDetail.phone_number || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Telegram:</span>
                  <span className="font-bold text-violet-600">{selectedUserDetail.telegram_username || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Yo'nalish / Viloyat:</span>
                  <span className="font-bold text-slate-700">{selectedUserDetail.target_major || '-'} / {selectedUserDetail.region || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Testlar soni:</span>
                  <span className="font-bold text-slate-700">{selectedUserDetail.sessions_finished} / {selectedUserDetail.sessions_total}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400">Qurilmalar soni:</span>
                  <span className="font-bold text-slate-700">{selectedUserDetail.devices_count} ta</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              {selectedUserDetail.is_blocked ? (
                <button
                  onClick={() => handleConfirmUnblock(selectedUserDetail)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Blokdan chiqarish
                </button>
              ) : (
                <button
                  onClick={() => {
                    setBlockingUser(selectedUserDetail);
                    setBlockReason('');
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Foydalanuvchini bloklash
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block Reason Modal */}
      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Foydalanuvchini bloklash</h3>
            <p className="text-xs text-slate-500 mb-4">
              {blockingUser.full_name || blockingUser.email} uchun bloklash sababini kiriting:
            </p>

            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Masalan: Qoidalarni buzish, to'lov bekori..."
              className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 mb-6"
            ></textarea>

            <div className="flex gap-3">
              <button
                onClick={() => setBlockingUser(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmBlock}
                disabled={submittingBlock}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {submittingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Bloklash</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
