import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import AnimatedBackground from '../components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Users, Heart, MessageCircle, Share2, Smartphone, 
  CheckCircle, Clock, AlertCircle, Star, MessageSquare, 
  Zap, Shield, TrendingUp, ChevronRight, Wallet, Camera
} from 'lucide-react';

interface Pricing {
  followers: { base: number; unit: number };
  likes: { base: number; unit: number };
  comments: { base: number; unit: number };
  shares: { base: number; unit: number };
}

interface Order {
  id: string;
  tiktokUsername: string;
  service: string;
  quantity: number;
  price: number;
  status: string;
  transactionId: string;
  createdAt: string;
  adminId: string;
}

interface AdminInfo {
  id: string;
  username: string;
  paymentMethod: string;
  accountNumber: string;
  accountName: string;
}

const services = [
  { id: 'followers', label: 'Followers', icon: Users, color: 'from-[#ff0050] to-[#ff4081]', desc: 'Real followers for your TikTok' },
  { id: 'likes', label: 'Likes', icon: Heart, color: 'from-[#00f2ea] to-[#00d4ff]', desc: 'Boost your video likes' },
  { id: 'comments', label: 'Comments', icon: MessageCircle, color: 'from-[#ff6b9d] to-[#ff0050]', desc: 'Engaging comments on videos' },
  { id: 'shares', label: 'Shares', icon: Share2, color: 'from-[#00d4ff] to-[#00f2ea]', desc: 'Increase video shares' },
];

const API_URL = '';

export default function UserSite() {
  const [searchParams] = useSearchParams();
  const refAdminId = searchParams.get('ref');

  const [step, setStep] = useState(1);
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [selectedService, setSelectedService] = useState('followers');
  const [quantity, setQuantity] = useState(100);
  const [price, setPrice] = useState(0);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('+923001234567');
  const [order, setOrder] = useState<Order | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [complaintName, setComplaintName] = useState('');
  const [complaintWhatsapp, setComplaintWhatsapp] = useState('');
  const [complaintMessage, setComplaintMessage] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [showTrackDialog, setShowTrackDialog] = useState(false);

  useEffect(() => {
    fetchPricing();
    fetchWhatsApp();
    if (refAdminId) fetchAdminInfo(refAdminId);
  }, [refAdminId]);

  useEffect(() => {
    if (pricing && selectedService) {
      calculatePrice();
    }
  }, [quantity, selectedService, pricing]);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pricing`);
      const data = await res.json();
      setPricing(data);
    } catch (e) {
      console.error('Failed to fetch pricing');
    }
  };

  const fetchWhatsApp = async () => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp`);
      const data = await res.json();
      if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
    } catch (e) {}
  };

  const fetchAdminInfo = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin-info/${id}`);
      const data = await res.json();
      if (!data.error) setAdminInfo(data);
    } catch (e) {}
  };

  const calculatePrice = () => {
    if (!pricing || !selectedService) return;
    const p = pricing[selectedService as keyof Pricing];
    if (!p) return;
    const calculated = Math.ceil((quantity / p.unit) * p.base);
    setPrice(calculated);
  };

  const handleCreateOrder = async () => {
    if (!tiktokUsername.trim()) {
      toast.error('Please enter your TikTok username');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiktokUsername: tiktokUsername.trim(),
          service: selectedService,
          quantity,
          price,
          adminId: refAdminId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setStep(3);
        toast.success('Order created! Please complete payment.');
      } else {
        toast.error(data.error || 'Failed to create order');
      }
    } catch (e) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/order/${order?.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, screenshot }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setStep(4);
        toast.success('Payment submitted! Admin will confirm shortly.');
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handleReviewSubmit = async () => {
    if (!order) return;
    try {
      const res = await fetch(`${API_URL}/api/user/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Review submitted!');
        setShowReviewDialog(false);
        setReviewComment('');
      }
    } catch (e) {
      toast.error('Failed to submit review');
    }
  };

  const handleComplaintSubmit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: complaintName, whatsapp: complaintWhatsapp, message: complaintMessage }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Complaint submitted to owner!');
        setShowComplaintDialog(false);
        setComplaintName('');
        setComplaintWhatsapp('');
        setComplaintMessage('');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  const handleTrackOrder = async () => {
    if (!orderIdInput.trim()) {
      toast.error('Enter order ID');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/user/order/${orderIdInput.trim()}`);
      const data = await res.json();
      if (!data.error) {
        setTrackedOrder(data);
        setShowTrackDialog(true);
      } else {
        toast.error('Order not found');
      }
    } catch (e) {
      toast.error('Failed to track');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
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

  const getServiceIcon = (serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return Users;
    return svc.icon;
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 glass-dark sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff0050] to-[#00f2ea] flex items-center justify-center animate-pulse-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">TikTok Boost Pro</h1>
              <p className="text-xs text-muted-foreground">Premium Growth Services</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowTrackDialog(true)} className="text-muted-foreground hover:text-white">
              <TrendingUp className="w-4 h-4 mr-1" /> Track Order
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open(`https://wa.me/${whatsappNumber.replace('+', '')}`, '_blank')} className="text-green-400 hover:text-green-300 hover:bg-green-400/10">
              <MessageSquare className="w-4 h-4 mr-1" /> Support
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        {step === 1 && (
          <div className="text-center mb-10 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Boost Your TikTok</span>
              <br />
              <span className="text-white">Like a Pro</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Get real followers, likes, comments & shares instantly. 
              Trusted by thousands of creators worldwide.
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00f2ea]" />
                <span className="text-sm">100% Safe</span>
              </div>
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#ff0050]" />
                <span className="text-sm">Instant Delivery</span>
              </div>
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#ff6b9d]" />
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s === step ? 'bg-gradient-to-r from-[#ff0050] to-[#00f2ea] text-white scale-110' : 
                s < step ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-white/5 text-muted-foreground border border-white/10'
              }`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`w-12 h-0.5 rounded ${s < step ? 'bg-green-500/50' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Username & Service */}
        {step === 1 && (
          <div className="animate-slide-up space-y-6">
            <Card className="glass border-white/10">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#ff0050]" /> TikTok Username
                  </label>
                  <Input 
                    placeholder="@username (without @)"
                    value={tiktokUsername}
                    onChange={(e) => setTiktokUsername(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground h-12 text-lg"
                  />
                  <p className="text-xs text-muted-foreground">Please enter exact username so we can deliver to the correct account</p>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Select Service</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {services.map((svc) => {
                      const Icon = svc.icon;
                      return (
                        <button
                          key={svc.id}
                          onClick={() => setSelectedService(svc.id)}
                          className={`relative p-4 rounded-xl border transition-all duration-300 text-left group ${
                            selectedService === svc.id 
                              ? 'border-[#ff0050]/50 bg-[#ff0050]/10 box-glow' 
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${svc.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="font-semibold text-white text-sm">{svc.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{svc.desc}</div>
                          {selectedService === svc.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#ff0050] flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Quantity</label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(10, quantity - (selectedService === 'comments' ? 10 : 50)))} className="border-white/20 text-white hover:bg-white/10">
                      -
                    </Button>
                    <Input 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(10, parseInt(e.target.value) || 0))}
                      className="text-center bg-white/5 border-white/10 text-white h-12 text-lg font-bold w-32"
                    />
                    <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + (selectedService === 'comments' ? 10 : 50))} className="border-white/20 text-white hover:bg-white/10">
                      +
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {[100, 500, 1000, 5000].map((q) => (
                      <button key={q} onClick={() => setQuantity(q)} className={`px-3 py-1 rounded-full text-xs border transition-all ${quantity === q ? 'border-[#ff0050] bg-[#ff0050]/20 text-white' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full h-12 bg-gradient-to-r from-[#ff0050] to-[#ff4081] hover:opacity-90 text-white font-bold text-lg btn-shine"
                >
                  Continue <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Pricing & Confirm */}
        {step === 2 && (
          <div className="animate-slide-up space-y-6">
            <Card className="glass border-white/10 box-glow">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-bold text-white text-center">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-muted-foreground">TikTok Username</span>
                    <span className="text-white font-semibold">@{tiktokUsername}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-muted-foreground">Service</span>
                    <span className="text-white font-semibold flex items-center gap-2">
                      {(() => { const Icon = getServiceIcon(selectedService); return <Icon className="w-4 h-4 text-[#ff0050]" />; })()}
                      {services.find(s => s.id === selectedService)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="text-white font-semibold">{quantity.toLocaleString()}</span>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-[#ff0050]/20 to-[#00f2ea]/20 border border-white/10">
                  <p className="text-sm text-muted-foreground mb-2">Total Price</p>
                  <div className="text-4xl font-bold text-white">{price} <span className="text-lg text-muted-foreground">PKR</span></div>
                  <p className="text-xs text-muted-foreground mt-2">No hidden fees • Instant start</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 border-white/20 text-white hover:bg-white/10">
                    Back
                  </Button>
                  <Button onClick={handleCreateOrder} disabled={loading} className="flex-1 h-12 bg-gradient-to-r from-[#ff0050] to-[#ff4081] hover:opacity-90 text-white font-bold btn-shine">
                    {loading ? 'Creating...' : 'Place Order'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && order && (
          <div className="animate-slide-up space-y-6">
            <Card className="glass border-white/10">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff0050] to-[#00f2ea] flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Complete Payment</h3>
                  <p className="text-muted-foreground text-sm mt-1">Order ID: <span className="text-[#00f2ea] font-mono">{order.id}</span></p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-3 text-white">
                    <Smartphone className="w-5 h-5 text-[#00f2ea]" />
                    <span className="font-semibold">Payment Method</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border text-center ${adminInfo?.paymentMethod === 'jazzcash' ? 'border-[#ff0050] bg-[#ff0050]/10' : 'border-white/10 bg-white/5'}`}>
                      <div className="font-bold text-white">JazzCash</div>
                      <div className="text-sm text-muted-foreground">{adminInfo?.accountNumber || 'Not set'}</div>
                      <div className="text-xs text-muted-foreground">{adminInfo?.accountName || ''}</div>
                    </div>
                    <div className={`p-3 rounded-lg border text-center ${adminInfo?.paymentMethod === 'easypaisa' ? 'border-[#00f2ea] bg-[#00f2ea]/10' : 'border-white/10 bg-white/5'}`}>
                      <div className="font-bold text-white">EasyPaisa</div>
                      <div className="text-sm text-muted-foreground">{adminInfo?.accountNumber || 'Not set'}</div>
                      <div className="text-xs text-muted-foreground">{adminInfo?.accountName || ''}</div>
                    </div>
                  </div>
                  {!adminInfo && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Admin payment details not configured yet. Please contact support.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Transaction ID</label>
                  <Input 
                    placeholder="Enter JazzCash/EasyPaisa Transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground h-12"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Payment Screenshot (Optional)</label>
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="bg-white/5 border-white/10 text-white file:text-white file:bg-transparent h-12"
                    />
                    <Camera className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  {screenshot && (
                    <div className="relative mt-2">
                      <img src={screenshot} alt="Screenshot" className="w-full max-h-48 object-contain rounded-lg border border-white/10" />
                      <button onClick={() => setScreenshot('')} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">×</button>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-[#ff0050]/10 border border-[#ff0050]/30 text-center">
                  <p className="text-sm text-white">Amount to Pay: <span className="font-bold text-[#ff0050]">{price} PKR</span></p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 border-white/20 text-white hover:bg-white/10">
                    Back
                  </Button>
                  <Button onClick={handlePaymentSubmit} disabled={loading} className="flex-1 h-12 bg-gradient-to-r from-[#00f2ea] to-[#00d4ff] hover:opacity-90 text-black font-bold btn-shine">
                    {loading ? 'Submitting...' : 'Submit Payment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Success & Tracking */}
        {step === 4 && order && (
          <div className="animate-slide-up space-y-6">
            <Card className="glass border-white/10">
              <CardContent className="p-6 space-y-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-[#00f2ea] flex items-center justify-center mx-auto animate-scale-in">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Order Placed Successfully!</h3>
                <p className="text-muted-foreground">Your order is now being processed by our team.</p>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="text-white font-mono">{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="text-white">{services.find(s => s.id === order.service)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="text-white">{order.quantity.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Save your Order ID to track status later!
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowReviewDialog(true)} className="flex-1 h-12 border-white/20 text-white hover:bg-white/10">
                    <Star className="w-4 h-4 mr-2" /> Leave Review
                  </Button>
                  <Button onClick={() => { setStep(1); setOrder(null); setTiktokUsername(''); setTransactionId(''); setScreenshot(''); }} className="flex-1 h-12 bg-gradient-to-r from-[#ff0050] to-[#ff4081] hover:opacity-90 text-white font-bold">
                    New Order
                  </Button>
                </div>

                <Button variant="ghost" onClick={() => setShowComplaintDialog(true)} className="text-muted-foreground hover:text-red-400">
                  <AlertCircle className="w-4 h-4 mr-2" /> Have an issue? File a complaint
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="glass border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                </button>
              ))}
            </div>
            <textarea 
              placeholder="Share your experience..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-muted-foreground resize-none"
            />
            <Button onClick={handleReviewSubmit} className="w-full bg-gradient-to-r from-[#ff0050] to-[#ff4081] text-white font-bold">
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
        <DialogContent className="glass border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">File a Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Your Name"
              value={complaintName}
              onChange={(e) => setComplaintName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
            <Input 
              placeholder="Your WhatsApp Number"
              value={complaintWhatsapp}
              onChange={(e) => setComplaintWhatsapp(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
            <textarea 
              placeholder="Describe your issue..."
              value={complaintMessage}
              onChange={(e) => setComplaintMessage(e.target.value)}
              className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-muted-foreground resize-none"
            />
            <Button onClick={handleComplaintSubmit} className="w-full bg-gradient-to-r from-red-500 to-[#ff0050] text-white font-bold">
              Submit Complaint
            </Button>
            <div className="text-center">
              <span className="text-muted-foreground text-sm">or </span>
              <button onClick={() => window.open(`https://wa.me/${whatsappNumber.replace('+', '')}`, '_blank')} className="text-green-400 hover:underline text-sm">
                Contact on WhatsApp
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Track Order Dialog */}
      <Dialog open={showTrackDialog} onOpenChange={setShowTrackDialog}>
        <DialogContent className="glass border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Track Your Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Enter Order ID"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
            <Button onClick={handleTrackOrder} className="w-full bg-gradient-to-r from-[#00f2ea] to-[#00d4ff] text-black font-bold">
              Track Order
            </Button>
            {trackedOrder && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 animate-scale-in">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="text-white font-mono text-xs">{trackedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(trackedOrder.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="text-white">{services.find(s => s.id === trackedOrder.service)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TikTok</span>
                  <span className="text-white">@{trackedOrder.tiktokUsername}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating WhatsApp */}
      <button 
        onClick={() => window.open(`https://wa.me/${whatsappNumber.replace('+', '')}`, '_blank')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-bounce-subtle"
      >
        <MessageSquare className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}
