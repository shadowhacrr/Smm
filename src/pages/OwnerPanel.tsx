import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  LogOut, Users, UserPlus, Trash2, Package, Star,
  MessageSquare, AlertCircle, CheckCircle,
  Clock, Eye, EyeOff, RefreshCw, Crown, Settings,
  BarChart3, Activity
} from 'lucide-react';

interface Admin {
  id: string;
  username: string;
  paymentMethod: string;
  accountNumber: string;
  accountName: string;
  uniqueLink: string;
  createdAt: string;
  stats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalEarnings: number;
  };
}

interface Order {
  id: string;
  adminId: string;
  adminUsername: string;
  tiktokUsername: string;
  service: string;
  quantity: number;
  price: number;
  status: string;
  createdAt: string;
}

interface Review {
  id: string;
  orderId: string;
  adminId: string;
  adminUsername: string;
  tiktokUsername: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Complaint {
  id: string;
  name: string;
  whatsapp: string;
  message: string;
  createdAt: string;
}

interface Stats {
  overview: {
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    completedOrders: number;
    totalRevenue: number;
  };
  adminStats: {
    id: string;
    username: string;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalEarnings: number;
  }[];
  recentReviews: Review[];
  recentComplaints: Complaint[];
}

const API_URL = '';

export default function OwnerPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const [pricing, setPricing] = useState({
    followers: { base: 300, unit: 100 },
    likes: { base: 200, unit: 100 },
    comments: { base: 500, unit: 50 },
    shares: { base: 150, unit: 100 },
  });

  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+923001234567');

  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('owner_auth');
    if (saved) {
      try {
        const auth = JSON.parse(saved);
        if (auth.username && auth.password) {
          setUsername(auth.username);
          setPassword(auth.password);
          setLoggedIn(true);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 15000);
      return () => clearInterval(interval);
    }
  }, [loggedIn]);

  const getAuthHeaders = () => ({ username, password });

  const fetchAllData = async () => {
    await Promise.all([fetchAdmins(), fetchOrders(), fetchReviews(), fetchComplaints(), fetchStats(), fetchPricing()]);
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/api/owner/admins`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setAdmins(data);
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/owner/orders`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {}
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/owner/reviews`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setReviews(data);
    } catch (e) {}
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${API_URL}/api/owner/complaints`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setComplaints(data);
    } catch (e) {}
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/owner/stats`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch (e) {}
  };

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pricing`);
      const data = await res.json();
      if (!data.error) setPricing(data);
    } catch (e) {}
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setLoggedIn(true);
        localStorage.setItem('owner_auth', JSON.stringify({ username, password }));
        toast.success('Welcome, Owner');
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch (e) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem('owner_auth');
    toast.success('Logged out');
  };

  const handleAddAdmin = async () => {
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      toast.error('Fill all fields');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/owner/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ username: newAdminUsername, password: newAdminPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin added!');
        setNewAdminUsername('');
        setNewAdminPassword('');
        setShowAddDialog(false);
        fetchAdmins();
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    if (!confirm('Are you sure? This will delete the admin and their data.')) return;
    try {
      const res = await fetch(`${API_URL}/api/owner/admins/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin removed');
        fetchAdmins();
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleUpdatePricing = async () => {
    try {
      const res = await fetch(`${API_URL}/api/owner/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ pricing }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pricing updated');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Enter new password');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/owner/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed!');
        setPassword(newPassword);
        localStorage.setItem('owner_auth', JSON.stringify({ username, password: newPassword }));
        setNewPassword('');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      toast.error('Enter new username');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/owner/change-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ newUsername }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Username changed!');
        setUsername(newUsername);
        localStorage.setItem('owner_auth', JSON.stringify({ username: newUsername, password }));
        setNewUsername('');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleUpdateWhatsApp = async () => {
    try {
      const res = await fetch(`${API_URL}/api/owner/whatsapp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ whatsappNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('WhatsApp number updated');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="border-yellow-500 text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'paid': return <Badge variant="outline" className="border-blue-500 text-blue-400"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case 'completed': return <Badge variant="outline" className="border-green-500 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'rejected': return <Badge variant="outline" className="border-red-500 text-red-400"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff0050]/10 via-black to-[#00f2ea]/10" />
        </div>
        <Card className="w-full max-w-md glass border-white/10 relative z-10">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-[#ff0050] flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Owner Panel</h2>
              <p className="text-muted-foreground text-sm">Full system access</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Username</label>
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter owner username"
                  className="bg-white/5 border-white/10 text-white h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="bg-white/5 border-white/10 text-white h-12 pr-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-white">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleLogin} disabled={loading} className="w-full h-12 bg-gradient-to-r from-yellow-500 to-[#ff0050] text-white font-bold text-lg">
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 glass-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-[#ff0050] flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Owner Panel</h1>
              <p className="text-xs text-muted-foreground">shadow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={fetchAllData} className="text-muted-foreground hover:text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#ff0050] data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-[#ff0050] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Admins
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#ff0050] data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-[#ff0050] data-[state=active]:text-white">
              <Star className="w-4 h-4 mr-2" /> Reviews
            </TabsTrigger>
            <TabsTrigger value="complaints" className="data-[state=active]:bg-[#ff0050] data-[state=active]:text-white">
              <AlertCircle className="w-4 h-4 mr-2" /> Complaints
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#ff0050] data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="glass border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{stats?.overview?.totalOrders || 0}</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats?.overview?.pendingOrders || 0}</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-blue-400">{stats?.overview?.paidOrders || 0}</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.overview?.completedOrders || 0}</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-[#00f2ea]">{stats?.overview?.totalRevenue || 0} PKR</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#00f2ea]" /> Live Admin Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="text-left p-3">Admin</th>
                        <th className="text-center p-3">Total</th>
                        <th className="text-center p-3">Pending</th>
                        <th className="text-center p-3">Completed</th>
                        <th className="text-right p-3">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.adminStats?.map((admin) => (
                        <tr key={admin.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 font-semibold text-white">{admin.username}</td>
                          <td className="text-center p-3">{admin.totalOrders}</td>
                          <td className="text-center p-3 text-yellow-400">{admin.pendingOrders}</td>
                          <td className="text-center p-3 text-green-400">{admin.completedOrders}</td>
                          <td className="text-right p-3 text-[#00f2ea]">{admin.totalEarnings} PKR</td>
                        </tr>
                      ))}
                      {(!stats?.adminStats || stats.adminStats.length === 0) && (
                        <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No admins yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats?.recentReviews?.length ? stats.recentReviews.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">via {r.adminUsername}</span>
                      </div>
                      <p className="text-sm text-white">{r.comment}</p>
                    </div>
                  )) : <p className="text-muted-foreground text-sm">No reviews yet</p>}
                </CardContent>
              </Card>
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Recent Complaints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats?.recentComplaints?.length ? stats.recentComplaints.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.whatsapp}</p>
                      <p className="text-sm text-white mt-1">{c.message}</p>
                    </div>
                  )) : <p className="text-muted-foreground text-sm">No complaints yet</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admins */}
          <TabsContent value="admins" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Admin Management</h3>
              <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-[#ff0050] to-[#ff4081] text-white">
                <UserPlus className="w-4 h-4 mr-2" /> Add Admin
              </Button>
            </div>

            {admins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No admins yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {admins.map((admin) => (
                  <Card key={admin.id} className="glass border-white/10">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff0050] to-[#00f2ea] flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{admin.username}</p>
                            <p className="text-xs text-muted-foreground">ID: {admin.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveAdmin(admin.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-white/5">
                          <p className="text-muted-foreground text-xs">Total Orders</p>
                          <p className="text-white font-semibold">{admin.stats?.totalOrders || 0}</p>
                        </div>
                        <div className="p-2 rounded bg-white/5">
                          <p className="text-muted-foreground text-xs">Completed</p>
                          <p className="text-green-400 font-semibold">{admin.stats?.completedOrders || 0}</p>
                        </div>
                        <div className="p-2 rounded bg-white/5">
                          <p className="text-muted-foreground text-xs">Pending</p>
                          <p className="text-yellow-400 font-semibold">{admin.stats?.pendingOrders || 0}</p>
                        </div>
                        <div className="p-2 rounded bg-white/5">
                          <p className="text-muted-foreground text-xs">Earnings</p>
                          <p className="text-[#00f2ea] font-semibold">{admin.stats?.totalEarnings || 0} PKR</p>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-black/50 border border-white/10">
                        <p className="text-xs text-muted-foreground mb-1">Unique Link</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs text-[#00f2ea] truncate">{admin.uniqueLink}</code>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { navigator.clipboard.writeText(admin.uniqueLink); toast.success('Copied!'); }}
                            className="border-white/20 text-white hover:bg-white/10 h-7 text-xs"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Payment: {admin.paymentMethod || 'Not set'} | {admin.accountNumber || 'No number'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="space-y-4">
            <h3 className="text-lg font-bold text-white">All Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-muted-foreground">
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Admin</th>
                    <th className="text-left p-3">TikTok</th>
                    <th className="text-left p-3">Service</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-[#00f2ea]">{order.id.slice(0, 8)}</td>
                      <td className="p-3 text-white">{order.adminUsername}</td>
                      <td className="p-3 text-white">@{order.tiktokUsername}</td>
                      <td className="p-3 text-muted-foreground">{order.service}</td>
                      <td className="p-3 text-center">{order.quantity}</td>
                      <td className="p-3 text-right text-[#ff0050]">{order.price} PKR</td>
                      <td className="p-3">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="space-y-4">
            <h3 className="text-lg font-bold text-white">All Reviews</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <Card key={review.id} className="glass border-white/10">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                        ))}
                      </div>
                      <Badge variant="outline" className="text-xs">via {review.adminUsername}</Badge>
                    </div>
                    <p className="text-sm text-white">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">Order: {review.tiktokUsername}</p>
                  </CardContent>
                </Card>
              ))}
              {reviews.length === 0 && (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No reviews yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Complaints */}
          <TabsContent value="complaints" className="space-y-4">
            <h3 className="text-lg font-bold text-white">Complaints</h3>
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <Card key={complaint.id} className="glass border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{complaint.name}</p>
                        <p className="text-sm text-[#00f2ea]">{complaint.whatsapp}</p>
                        <p className="text-sm text-white mt-2">{complaint.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(complaint.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {complaints.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No complaints yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base">Pricing Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(pricing).map(([service, p]) => (
                    <div key={service} className="space-y-2">
                      <label className="text-sm text-white capitalize">{service}</label>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Base Price ({p.unit} units)</p>
                          <Input 
                            type="number" 
                            value={p.base}
                            onChange={(e) => setPricing({ ...pricing, [service]: { ...p, base: parseInt(e.target.value) || 0 } })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div className="w-24">
                          <p className="text-xs text-muted-foreground">Unit</p>
                          <Input 
                            type="number" 
                            value={p.unit}
                            onChange={(e) => setPricing({ ...pricing, [service]: { ...p, unit: parseInt(e.target.value) || 1 } })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button onClick={handleUpdatePricing} className="w-full bg-gradient-to-r from-[#ff0050] to-[#ff4081] text-white font-bold">
                    Update Pricing
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-base">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Change Username</label>
                    <div className="flex gap-2">
                      <Input 
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="New username"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Button onClick={handleChangeUsername} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        Change
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Change Password</label>
                    <div className="flex gap-2">
                      <Input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Button onClick={handleChangePassword} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        Change
                      </Button>
                    </div>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">WhatsApp Support Number</label>
                    <div className="flex gap-2">
                      <Input 
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+923001234567"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Button onClick={handleUpdateWhatsApp} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Username</label>
              <Input 
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-white/5 border-white/10 text-white h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Password</label>
              <Input 
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-white/5 border-white/10 text-white h-12"
              />
            </div>
            <Button onClick={handleAddAdmin} className="w-full h-12 bg-gradient-to-r from-[#ff0050] to-[#ff4081] text-white font-bold">
              Add Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
