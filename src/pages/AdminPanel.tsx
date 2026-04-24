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
  LogOut, Users, Heart, MessageCircle, Share2, CheckCircle,
  Clock, AlertCircle, DollarSign, Package,
  MessageSquare, Send, Smartphone, CreditCard, User, Lock,
  Eye, EyeOff, RefreshCw, Wallet
} from 'lucide-react';

interface Order {
  id: string;
  tiktokUsername: string;
  service: string;
  quantity: number;
  price: number;
  status: string;
  transactionId: string;
  screenshot: string;
  createdAt: string;
  adminId: string;
}

interface Message {
  id: string;
  orderId: string;
  sender: string;
  content: string;
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  completedOrders: number;
  totalEarnings: number;
}

const API_URL = '';

const services: Record<string, { label: string; icon: any }> = {
  followers: { label: 'Followers', icon: Users },
  likes: { label: 'Likes', icon: Heart },
  comments: { label: 'Comments', icon: MessageCircle },
  shares: { label: 'Shares', icon: Share2 },
};

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('jazzcash');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_auth');
    if (saved) {
      try {
        const auth = JSON.parse(saved);
        if (auth.id && auth.password) {
          setAdmin(auth);
          setLoggedIn(true);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (loggedIn && admin) {
      fetchOrders();
      fetchStats();
      fetchProfile();
      const interval = setInterval(() => {
        fetchOrders();
        fetchStats();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [loggedIn, admin]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/profile`, {
        headers: { adminid: admin.id, adminpassword: admin.password },
      });
      const data = await res.json();
      if (!data.error) {
        setPaymentMethod(data.paymentMethod || 'jazzcash');
        setAccountNumber(data.accountNumber || '');
        setAccountName(data.accountName || '');
      }
    } catch (e) {}
  };

  const fetchOrders = async () => {
    if (!admin) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { adminid: admin.id, adminpassword: admin.password },
      });
      const data = await res.json();
      setOrders(data);
    } catch (e) {}
  };

  const fetchStats = async () => {
    if (!admin) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { adminid: admin.id, adminpassword: admin.password },
      });
      const data = await res.json();
      setStats(data);
    } catch (e) {}
  };

  const fetchMessages = async (orderId: string) => {
    if (!admin) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/messages/${orderId}`, {
        headers: { adminid: admin.id, adminpassword: admin.password },
      });
      const data = await res.json();
      setMessages(data);
    } catch (e) {}
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setAdmin(data.admin);
        setLoggedIn(true);
        localStorage.setItem('admin_auth', JSON.stringify({ id: data.admin.id, password, username: data.admin.username }));
        toast.success('Welcome back, ' + data.admin.username);
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
    setAdmin(null);
    localStorage.removeItem('admin_auth');
    toast.success('Logged out');
  };

  const handleConfirmPayment = async (orderId: string) => {
    if (!admin) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/confirm-payment`, {
        method: 'PUT',
        headers: { adminid: admin.id, adminpassword: admin.password },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment confirmed');
        fetchOrders();
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleComplete = async (orderId: string) => {
    if (!admin) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: { adminid: admin.id, adminpassword: admin.password },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order completed!');
        fetchOrders();
        fetchStats();
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleReject = async (orderId: string) => {
    if (!admin) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/reject`, {
        method: 'PUT',
        headers: { adminid: admin.id, adminpassword: admin.password },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order rejected');
        fetchOrders();
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedOrder || !admin) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          adminid: admin.id,
          adminpassword: admin.password,
        },
        body: JSON.stringify({ orderId: selectedOrder.id, content: messageContent }),
      });
      const data = await res.json();
      if (data.success) {
        setMessageContent('');
        fetchMessages(selectedOrder.id);
        toast.success('Message sent');
      }
    } catch (e) {
      toast.error('Failed to send');
    }
  };

  const handleUpdateProfile = async () => {
    if (!admin) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          adminid: admin.id,
          adminpassword: admin.password,
        },
        body: JSON.stringify({ paymentMethod, accountNumber, accountName }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment info updated');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const openMessages = (order: Order) => {
    setSelectedOrder(order);
    fetchMessages(order.id);
    setShowMessageDialog(true);
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff0050] to-[#00f2ea] flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Admin Login</h2>
              <p className="text-muted-foreground text-sm">Access your dashboard</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Username</label>
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
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
              <Button onClick={handleLogin} disabled={loading} className="w-full h-12 bg-gradient-to-r from-[#ff0050] to-[#ff4081] text-white font-bold text-lg">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff0050] to-[#00f2ea] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">{admin?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalOrders || 0}</p>
                </div>
                <Package className="w-8 h-8 text-[#ff0050] opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats?.pendingOrders || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.completedOrders || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="text-2xl font-bold text-[#00f2ea]">{stats?.totalEarnings || 0} PKR</p>
                </div>
                <DollarSign className="w-8 h-8 text-[#00f2ea] opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#ff0050] data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#ff0050] data-[state=active]:text-white">
              <Smartphone className="w-4 h-4 mr-2" /> Payment Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Orders</h3>
              <Button variant="outline" size="sm" onClick={() => { fetchOrders(); fetchStats(); }} className="border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
            
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="glass border-white/10 hover:border-white/20 transition-all">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#00f2ea]">{order.id}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-white font-semibold">@{order.tiktokUsername}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {(() => { const Icon = services[order.service]?.icon || Package; return <Icon className="w-4 h-4" />; })()}
                              {services[order.service]?.label || order.service}
                            </span>
                            <span>{order.quantity.toLocaleString()} qty</span>
                            <span className="text-[#ff0050] font-semibold">{order.price} PKR</span>
                          </div>
                          {order.transactionId && (
                            <p className="text-xs text-muted-foreground">TxID: {order.transactionId}</p>
                          )}
                          {order.screenshot && (
                            <img src={order.screenshot} alt="Payment" className="w-32 h-20 object-cover rounded border border-white/10 mt-2" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.status === 'pending' && (
                            <Button size="sm" onClick={() => handleConfirmPayment(order.id)} className="bg-blue-500 hover:bg-blue-600 text-white">
                              <CheckCircle className="w-4 h-4 mr-1" /> Confirm
                            </Button>
                          )}
                          {order.status === 'paid' && (
                            <Button size="sm" onClick={() => handleComplete(order.id)} className="bg-green-500 hover:bg-green-600 text-white">
                              <CheckCircle className="w-4 h-4 mr-1" /> Complete
                            </Button>
                          )}
                          {(order.status === 'pending' || order.status === 'paid') && (
                            <Button size="sm" variant="outline" onClick={() => handleReject(order.id)} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                              <AlertCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openMessages(order)} className="border-white/20 text-white hover:bg-white/10">
                            <MessageSquare className="w-4 h-4 mr-1" /> Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#00f2ea]" /> Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Payment Method</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentMethod('jazzcash')}
                      className={`flex-1 p-3 rounded-lg border text-center transition-all ${paymentMethod === 'jazzcash' ? 'border-[#ff0050] bg-[#ff0050]/10 text-white' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}
                    >
                      <Smartphone className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">JazzCash</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('easypaisa')}
                      className={`flex-1 p-3 rounded-lg border text-center transition-all ${paymentMethod === 'easypaisa' ? 'border-[#00f2ea] bg-[#00f2ea]/10 text-white' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">EasyPaisa</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Account Number</label>
                  <Input 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="bg-white/5 border-white/10 text-white h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Account Name</label>
                  <Input 
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Full Name"
                    className="bg-white/5 border-white/10 text-white h-12"
                  />
                </div>
                <Button onClick={handleUpdateProfile} className="w-full h-12 bg-gradient-to-r from-[#00f2ea] to-[#00d4ff] text-black font-bold">
                  Save Payment Info
                </Button>

                <Separator className="bg-white/10" />

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-muted-foreground mb-2">Your Unique Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded bg-black/50 text-[#00f2ea] text-xs overflow-x-auto">
                      {window.location.origin}/?ref={admin?.id}
                    </code>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${admin?.id}`); toast.success('Copied!'); }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Share this link with users. All orders from this link will come to you.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="glass border-white/10 text-white max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">Messages - Order {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[400px] p-2">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`p-3 rounded-lg ${msg.sender === 'admin' ? 'bg-[#ff0050]/20 ml-8' : 'bg-white/5 mr-8'}`}>
                  <p className="text-sm text-white">{msg.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t border-white/10">
            <Input 
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type a message..."
              className="bg-white/5 border-white/10 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} className="bg-[#ff0050] hover:bg-[#ff0050]/80 text-white">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
