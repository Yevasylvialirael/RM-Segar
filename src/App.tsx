import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Search, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  Utensils, 
  Coffee, 
  Home,
  Heart,
  User,
  Star,
  ArrowRight,
  ChevronLeft,
  Settings,
  LogOut,
  History,
  Trash2,
  Check,
  Soup,
  GlassWater,
  Zap,
  Sparkles,
  Bot,
  Send,
  MessageCircle,
  MessageSquare,
  QrCode,
  CreditCard,
  Banknote,
  Wallet,
  Share2,
  MoreHorizontal,
  Mic,
  SendHorizontal,
  Calendar,
  Clock,
  Edit3,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { MENU_ITEMS, MenuItem } from './constants';
import { QRScanner } from './components/QRScanner';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  setDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  where 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';

interface CartItem extends MenuItem {
  quantity: number;
  option?: 'Es' | 'Panas';
  sweetness?: 'Manis' | 'Tawar' | 'Sedikit Gula';
  note?: string;
}

interface Order {
  id: string;
  date: string;
  items: CartItem[];
  totalItems: number;
  orderType: 'Makan di Tempat' | 'Bungkus' | 'Jadwalkan';
  paymentMethod: 'Tunai' | 'Transfer';
  note?: string;
  schedule?: {
    type: 'Jam' | 'Hari';
    date?: string;
    time?: string;
    dayOfWeek?: string;
    dayOfMonth?: number;
  }
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  attendees: number;
  note: string;
  status: 'Akan Datang' | 'Selesai' | 'Dibatalkan';
  orderType?: 'Makan di Tempat' | 'Bungkus';
  items?: CartItem[];
}

const LocationSection = () => {
  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-50 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900">Lokasi Kami</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Jl. Keramat No.173, Pendawan, Kec. Sambas,<br />
                Kabupaten Sambas, Kalimantan Barat
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900">Jam Operasional</h3>
              <p className="text-sm text-stone-500">Buka Setiap Hari</p>
              <p className="text-xl font-black text-orange-500 tracking-tight">06:00 - 18:00</p>
            </div>
          </div>

          <div className="pt-2">
            <a 
              href="https://maps.google.com/?q=Rumah+Makan+Segar+Jl.+Keramat+No.173+Sambas" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              <span>Petunjuk Arah</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className="w-full lg:w-[400px] h-64 rounded-[32px] overflow-hidden border border-stone-100 shadow-inner relative bg-stone-50">
          <iframe
            src="https://www.google.com/maps?q=Rumah+Makan+Segar+Sambas+Jl.+Keramat&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Lokasi Rumah Makan Segar"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

const MenuIcon = ({ item, size = 32, className = "" }: { item: MenuItem, size?: number, className?: string }) => {
  const getIcon = () => {
    if (item.category === 'Minuman') {
      if (item.id === 'kopi' || item.id === 'teh') return <Coffee size={size} className={className} />;
      if (item.id === 'extra-joss') return <Zap size={size} className={className} />;
      return <GlassWater size={size} className={className} />;
    }
    if (item.name.toLowerCase().includes('kuah') || item.category === 'Capcai') {
      return <Soup size={size} className={className} />;
    }
    return <Utensils size={size} className={className} />;
  };

  const getBgColor = () => {
    if (item.category === 'Minuman') return 'bg-blue-50 text-blue-500';
    if (item.category === 'Bakmie') return 'bg-orange-50 text-orange-500';
    if (item.category === 'Kwetiao') return 'bg-red-50 text-red-500';
    if (item.category === 'Capcai') return 'bg-green-50 text-green-600';
    if (item.category === 'Nasi') return 'bg-yellow-50 text-yellow-600';
    return 'bg-stone-50 text-stone-500';
  };

  return (
    <div className={`w-full h-full flex items-center justify-center ${getBgColor()}`}>
      {getIcon()}
    </div>
  );
};

const MainLogo = ({ size = 64, className = "" }: { size?: number, className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Stylized Bowl Logo matching user image */}
      <div className="relative">
        <Soup size={size} strokeWidth={2.5} />
        {/* Decorative "+" symbols from the image */}
        <div className="absolute -top-2 -right-2 text-red-500 font-bold text-xs">+</div>
        <div className="absolute -bottom-2 -left-2 text-red-500 font-bold text-xs">+</div>
        <div className="absolute top-1/2 -left-4 text-red-500 font-bold text-xs">+</div>
      </div>
    </div>
  );
};

// Onboarding Configuration
const ONBOARDING_STEPS: Record<string, any[]> = {
  home: [
    {
      title: "Selamat Datang!",
      description: "Nikmati kemudahan memesan Chinese Food khas Kalimantan Barat langsung dari genggamanmu.",
      position: "center",
      button: "Mulai Tur"
    },
    {
      title: "Koki AI RM Segar",
      description: "Bingung mau makan apa? Ngobrol dengan AI kami untuk mendapatkan rekomendasi menu terbaik.",
      position: "target",
      elementId: "tour-ai-chat",
      rx: 32,
      button: "Lanjut"
    },
    {
      title: "Cari Menu",
      description: "Gunakan kotak pencarian ini untuk menemukan menu favoritmu dengan cepat.",
      position: "target",
      elementId: "tour-search-bar",
      rx: 20,
      button: "Lanjut"
    },
    {
      title: "Pilih Kategori",
      description: "Geser dan pilih kategori untuk melihat menu yang lebih spesifik.",
      position: "target",
      elementId: "tour-categories",
      rx: 0,
      button: "Selesai"
    }
  ],
  search: [
    {
      title: "Pencarian Menu",
      description: "Ketik nama menu yang Anda cari di sini untuk menemukannya secara instan.",
      position: "target",
      elementId: "tour-search-bar",
      rx: 20,
      button: "Lanjut"
    },
    {
      title: "Riwayat Pencarian",
      description: "Pencarian terakhir Anda akan muncul di sini agar mudah diakses kembali.",
      position: "target",
      elementId: "tour-search-history",
      rx: 24,
      button: "Selesai"
    }
  ],
  heart: [
    {
      title: "Menu Favorit",
      description: "Semua menu yang Anda tandai sebagai favorit akan muncul di halaman ini.",
      position: "center",
      button: "Selesai"
    }
  ],
  profile: [
    {
      title: "Profil Anda",
      description: "Kelola akun Anda dan lihat riwayat pesanan yang pernah Anda buat.",
      position: "target",
      elementId: "tour-profile-info",
      rx: 32,
      button: "Lanjut"
    },
    {
      title: "Riwayat Pesanan",
      description: "Lihat daftar pesanan yang pernah Anda buat sebelumnya di sini.",
      position: "target",
      elementId: "tour-order-history",
      rx: 20,
      button: "Lanjut"
    },
    {
      title: "Tentang RM Segar",
      description: "Klik di sini untuk mengetahui lebih lanjut tentang sejarah dan visi kami.",
      position: "target",
      elementId: "tour-about-button",
      rx: 20,
      button: "Lanjut"
    },
    {
      title: "Panduan Penggunaan",
      description: "Jika Anda ingin melihat panduan ini lagi di masa mendatang, Anda bisa menekan tombol ini.",
      position: "target",
      elementId: "tour-guide-button",
      rx: 20,
      button: "Selesai"
    }
  ],
  about: [
    {
      title: "Tentang Kami",
      description: "Pelajari lebih dalam mengenai RM Segar, cita rasa autentik yang kami tawarkan.",
      position: "center",
      button: "Selesai"
    }
  ]
};

export default function App() {
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [prevActiveTab, setPrevActiveTab] = useState('home');
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showReservations, setShowReservations] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleType, setScheduleType] = useState<'Jam' | 'Hari'>('Jam');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleHeadcount, setScheduleHeadcount] = useState(2);
  const [scheduleNote, setScheduleNote] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollLeft = categoryScrollRef.current.scrollWidth;
    }
  }, []);
  const [showAbout, setShowAbout] = useState(false);
  const [user, setUser] = useState<{ id: string, phone: string, displayName?: string, photoURL?: string } | null>(null);
  const [loginPhone, setLoginPhone] = useState('62');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'login' | 'forgot' | 'verify'>('login');
  const [resetToken, setResetToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [optionModalItem, setOptionModalItem] = useState<MenuItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<'Es' | 'Panas'>('Es');
  const [selectedSweetness, setSelectedSweetness] = useState<'Manis' | 'Tawar' | 'Sedikit Gula'>('Manis');
  const [noteModalItem, setNoteModalItem] = useState<{ id: string, option?: 'Es' | 'Panas', sweetness?: 'Manis' | 'Tawar' | 'Sedikit Gula', note: string } | null>(null);
  const [orderType, setOrderType] = useState<'Makan di Tempat' | 'Bungkus'>('Makan di Tempat');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (showSuccess) {
      scrollToTop();
    }
  }, [showSuccess]);

  const [isLoading, setIsLoading] = useState(true);

  const scrollToTop = () => {
    if (isChatOpen) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabChange = (tab: string) => {
    // Clear any pending cart open timeout
    if (cartTimeoutRef.current) {
      clearTimeout(cartTimeoutRef.current);
      cartTimeoutRef.current = null;
    }

    // Ensure cart drawer closes when navigating to other main tabs
    if (tab !== 'cart') {
      setIsCartOpen(false);
    }

    // Reset any active tour when changing tabs
    setActiveTour(null);
    setTourStep(0);
    
    if (tab === 'home') {
      scrollToTop();
    }
    
    // Save search history if leaving search view
    if (activeTab === 'search' && tab !== 'search' && searchQuery.trim()) {
      setSearchHistory(prev => {
        const newHistory = [searchQuery.trim(), ...prev.filter(h => h !== searchQuery.trim())].slice(0, 5);
        return newHistory;
      });
      if (tab === 'home') setSearchQuery('');
    }
    
    // Store current tab if it's a main view tab
    if (tab !== 'cart') {
      setPrevActiveTab(tab);
    } else {
      // If switching TO cart tab, keep the current tab as background
      setPrevActiveTab(activeTab === 'cart' ? prevActiveTab : activeTab);
    }
    
    setActiveTab(tab);
    setShowOrderHistory(false);
    setShowReservations(false);
    setShowAbout(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setLoginMode('login');
      setLoginPhone('62');
      setShowOrderHistory(false);
      setShowAbout(false);
      setActiveTab('home');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleScanSuccess = useCallback((decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.type === 'rm_segar_order' && data.items) {
        const newItems = data.items.map((i: any) => {
          const menu = MENU_ITEMS.find(m => m.id === i.id);
          if (menu) return { ...menu, quantity: i.q, option: i.o };
          return null;
        }).filter(Boolean);
        
        if (newItems.length > 0) {
          setCart(prev => {
            const merged = [...prev];
            newItems.forEach((newItem: any) => {
              const existingIdx = merged.findIndex(curr => curr.id === newItem.id && curr.option === newItem.option);
              if (existingIdx !== -1) {
                merged[existingIdx].quantity += newItem.quantity;
              } else {
                merged.push(newItem as CartItem);
              }
            });
            return merged;
          });
          setIsCartOpen(true);
          setShowScanner(false);
          // Auto-scroll to cart or notify user
        }
      }
    } catch (e) {
      console.error("Invalid QR Code content", e);
    }
  }, [setCart, setIsCartOpen, setShowScanner]);
  useEffect(() => {
    const savedCart = localStorage.getItem('rm_segar_cart');
    const savedFavorites = localStorage.getItem('rm_segar_favorites');

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('rm_segar_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('rm_segar_favorites', JSON.stringify(favorites));
  }, [favorites]);
  
  // Onboarding State
  const [activeTour, setActiveTour] = useState<'home' | 'search' | 'heart' | 'profile' | 'about' | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [completedTours, setCompletedTours] = useState<Record<string, boolean>>({});
  const [spotlightRect, setSpotlightRect] = useState<{ x: number, y: number, width: number, height: number, rx: number } | null>(null);
  
  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [pandaMood, setPandaMood] = useState<'idle' | 'thinking' | 'happy'>('idle');
  const [apiKeyMatched, setApiKeyMatched] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setApiKeyMatched(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setApiKeyMatched(true);
        // Retry last message if possible or just show success
        setChatMessages(prev => [...prev, { role: 'model', text: "Mantap! AI sudah terhubung. Ada yang bisa saya bantu sekarang? 🐼" }]);
      } catch (err) {
        console.error("Error opening key selector:", err);
      }
    }
  };
  // Firebase Auth sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          phone: firebaseUser.phoneNumber || 'Via Google',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined
        });
        
        // Sync Profile to Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        setDoc(userRef, {
          userId: firebaseUser.uid,
          phone: firebaseUser.phoneNumber || 'Via Google',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'users'));

      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firestore Data Sync
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setReservations([]);
      return;
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const ordersUnsub = onSnapshot(ordersQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setOrders(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const resQuery = query(
      collection(db, 'reservations'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const resUnsub = onSnapshot(resQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reservation));
      setReservations(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reservations'));

    return () => {
      ordersUnsub();
      resUnsub();
    };
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const mouseStartRef = React.useRef<number>(-1);
  const touchStartRef = React.useRef(0);

  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = (e: any) => {
      const target = e.target;
      if (target.scrollTop !== undefined) {
        setScrollY(target.scrollTop);
        setIsScrolling(true);
        const timer = setTimeout(() => setIsScrolling(false), 500);
        return () => clearTimeout(timer);
      }
    };
    
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = async (e?: React.FormEvent, initialPrompt?: string) => {
    if (e) e.preventDefault();
    const message = initialPrompt || chatInput;
    if (!message.trim() || isAIThinking) return;

    const newUserMessage = { role: 'user' as const, text: message };
    const updatedMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsAIThinking(true);
    setPandaMood('thinking');

    try {
      const menuListString = MENU_ITEMS.map(item => `- ${item.name} (${item.category}): ${item.description}`).join('\n');
      const history = chatMessages.slice(-11).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history,
          menuList: menuListString,
          cart: JSON.stringify(cart.map(i => `${i.name} (${i.quantity}x)${i.option ? ' ['+i.option+']' : ''}${i.sweetness ? ' ['+i.sweetness+']' : ''}`)),
          isGuest: !user
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi Master Panda');
      }

      const resData = await response.json();
      let fullText = resData.text || "";
      let currentCart = [...cart];
      let pendingWaUrl = "";

      if (resData.functionCalls && resData.functionCalls.length > 0) {
        const addedItems: string[] = [];
        for (const call of resData.functionCalls) {
          const args: any = call.args || {};
          if (call.name === 'add_item_to_cart') {
            let item = MENU_ITEMS.find(m => m.id === args.itemId);
            if (!item && args.itemId) {
              const searchTerm = args.itemId.toString().toLowerCase().replace(/\s+/g, '');
              item = MENU_ITEMS.find(m => m.name.toLowerCase().replace(/\s+/g, '').includes(searchTerm));
            }
            if (item) {
              const qty = Math.max(1, Number(args.quantity) || 1);
              const opt = args.option as 'Es' | 'Panas' | undefined;
              const swt = args.sweetness as 'Manis' | 'Tawar' | 'Sedikit Gula' | undefined;
              
              const idx = currentCart.findIndex(i => i.id === item!.id && i.option === opt && i.sweetness === swt);
              if (idx !== -1) {
                currentCart[idx] = { ...currentCart[idx], quantity: currentCart[idx].quantity + qty };
              } else {
                currentCart.push({ ...item, quantity: qty, option: opt, sweetness: swt, note: args.note });
              }
              setCart([...currentCart]);
              
              let desc = `${item.name} (${qty}x)`;
              const details = [];
              if (opt) details.push(opt);
              if (swt) details.push(swt);
              if (args.note) details.push(args.note);
              if (details.length > 0) desc += ` [${details.join(', ')}]`;
              addedItems.push(desc);
            }
          }
          if (call.name === 'finalize_order') {
            const adminPhone = "6281258394293";
            const orderId = Math.random().toString(36).substring(2, 6).toUpperCase();
            
            const orderDetails = currentCart.map(i => {
              let line = `- ${i.name} (${i.quantity}x)`;
              const details = [];
              if (i.option) details.push(i.option);
              if (i.sweetness) details.push(i.sweetness);
              if (i.note) details.push(i.note);
              if (details.length > 0) line += ` [${details.join(', ')}]`;
              return line;
            }).join('\n');
            
            const message = `*RM SEGAR - PESANAN BARU #${orderId}*\n\n${orderDetails}\n\n*Detail:*\n${args.headcount ? `- Orang: ${args.headcount}\n` : ''}- Tipe: ${args.orderType}\n- Bayar: ${args.paymentMethod}\n- Pesan: ${args.overallNote || '-'}`;
            pendingWaUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
            const orderData: Order = {
              id: orderId,
              date: new Date().toLocaleDateString(),
              items: [...currentCart],
              totalItems: currentCart.reduce((s, i) => s + i.quantity, 0),
              orderType: args.orderType as any,
              paymentMethod: args.paymentMethod as any,
              note: args.overallNote
            };
            
            // Persistent Backend Save
            if (user) {
              const orderRef = doc(db, 'orders', orderId);
              setDoc(orderRef, {
                ...orderData,
                userId: user.id,
                status: 'Pending',
                createdAt: serverTimestamp()
              }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'orders'));
            }

            setOrders(prev => [orderData, ...prev]);
            setCart([]);
            currentCart = [];
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fullText += `\n\n✅ *PESANAN SIAP!*\n\nSilakan klik tombol **Kirim ke WhatsApp** di bawah ini untuk mengirimkan pesanan Kakak langsung ke Admin RM Segar agar segera diproses. 🎋`;
            fullText += `\n\n[WA_LINK: ${pendingWaUrl}|Kirim Pesanan ke WhatsApp]`;
          }
          if (call.name === 'book_table') {
            const adminPhone = "6281258394293";
            const resId = Math.random().toString(36).substring(2, 6).toUpperCase();
            
            let foodDetails = "";
            if (currentCart.length > 0) {
              foodDetails = "\n\n*Pesanan Makanan (Pre-order):*\n" + 
                currentCart.map(i => {
                  let line = `- ${i.name} (${i.quantity}x)`;
                  const details = [];
                  if (i.option) details.push(i.option);
                  if (i.sweetness) details.push(i.sweetness);
                  if (i.note) details.push(i.note);
                  if (details.length > 0) line += ` [${details.join(', ')}]`;
                  return line;
                }).join('\n');
            }

            const message = `*RM SEGAR - RESERVASI & PRE-ORDER*\n\nID: #${resId}\nNama: ${args.name}\nTanggal: ${args.date}\nJam: ${args.time}\nOrang: ${args.headcount} orang\nCatatan: ${args.note || '-'}${foodDetails}`;
            
            pendingWaUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
            const resData: Reservation = {
              id: resId,
              date: args.date,
              time: args.time,
              attendees: args.headcount,
              note: args.note || '',
              status: 'Akan Datang'
            };

            // Persistent Backend Save
            if (user) {
              const resRef = doc(db, 'reservations', resId);
              setDoc(resRef, {
                ...resData,
                userId: user.id,
                createdAt: serverTimestamp()
              }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'reservations'));
            }

            setReservations(prev => [resData, ...prev]);
            
            // Clear cart if pre-order was included
            if (currentCart.length > 0) {
              setCart([]);
              currentCart = [];
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fullText += `\n\n✅ *RESERVASI BERHASIL!*\n\nSilakan ketuk tombol di bawah untuk mengirim konfirmasi reservasi Kakak ke Admin via WhatsApp. 🎋`;
            fullText += `\n\n[WA_LINK: ${pendingWaUrl}|Kirim Reservasi ke WhatsApp]`;
          }
          if (call.name === 'clear_cart') {
            setCart([]);
            currentCart = [];
            fullText += "\n\nKeranjang sudah saya kosongkan ya! 🎋";
          }
          if (call.name === 'remove_item_from_cart') {
            const idToRemove = args.itemId;
            currentCart = currentCart.filter(i => i.id !== idToRemove);
            setCart([...currentCart]);
            fullText += `\n\nOke, item tersebut sudah saya hapus dari keranjang. 🎋`;
          }
        }
        if (addedItems.length > 0) {
          const itemList = addedItems.join(", ");
          if (!fullText.includes("keranjang")) {
            fullText += `\n\nOke Kak, ${itemList} sudah saya masukkan ke keranjang! Ada tambahan lagi menunya, atau sudah cukup? 🐼🎋`;
          }
        }
      }

      let finalResponse = fullText.trim();
      if (!finalResponse || finalResponse === "🎋") {
        finalResponse = "Sudah saya catat pesanan Kakak! Ada lagi yang mau ditambah atau mau langsung kirim ke WhatsApp Admin? 🐼🎋";
      }
      setChatMessages(prev => [...prev, { role: 'model', text: finalResponse }]);
      
      if (pendingWaUrl) {
         try {
           const link = document.createElement('a');
           link.href = pendingWaUrl;
           link.target = '_blank';
           link.rel = 'noopener noreferrer';
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
         } catch (e) {
           console.error("Auto-redirect blocked or failed:", e);
         }
      }
      setPandaMood('happy');
      setTimeout(() => setPandaMood('idle'), 3000);

    } catch (error: any) {
      console.error("AI Error:", error);
      
      let errorMsg = error.message || "";
      
      // Deteksi error key atau auth agar muncul tombol 'Hubungkan'
      if (!errorMsg || errorMsg.includes("API key") || errorMsg.includes("unauthorized") || errorMsg.includes("401") || errorMsg.includes("not found")) {
        errorMsg = "Master Panda belum bisa masak nih karena Kakak belum Hubungkan AI! 🐼\n\n" +
                   "Silakan klik tombol di bawah untuk menyambungkan Kunci API Kakak (gratis kok!). 🎋";
      } else if (errorMsg === "Failed to fetch" || errorMsg.includes("network")) {
        errorMsg = "Master Panda lagi ada kendala koneksi nih! 🐼\n\n" +
                   "Tunggu sebentar ya, atau coba refresh halamannya. Pastikan koneksi internet aman! 🎋";
      }
      
      setChatMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
      setPandaMood('idle');
    } finally {
      setIsAIThinking(false);
    }
  };



  const startAIChat = () => {
    setIsChatOpen(true);
    if (chatMessages.length === 0) {
      const greeting = user 
        ? "Halo! Saya Master Panda, Koki AI RM Segar. Ada yang bisa saya bantu hari ini? 🐼 [OPSI: Pesan Makanan|Reservasi Meja]"
        : "Halo! Saya Master Panda, Koki AI RM Segar. Silakan mampir atau login untuk akses fitur reservasi ya! Ada yang ingin ditanyakan seputar menu kami hari ini? 🐼🎋";
      
      setChatMessages([{ 
        role: 'model', 
        text: greeting
      }]);
    }
  };

  // Load items from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('rm_segar_cart');
    const savedFavs = localStorage.getItem('rm_segar_favs');
    const savedUser = localStorage.getItem('rm_segar_user');
    const savedHistory = localStorage.getItem('rm_segar_search_history');
    const savedTours = localStorage.getItem('rm_segar_completed_tours');
    const savedHighScore = localStorage.getItem('rm_segar_game_highscore');
    
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    // User and data are now managed via Firebase Auth & Firestore
    // Orders and Reservations are now synced via Firebase onSnapshot
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    if (savedTours) setCompletedTours(JSON.parse(savedTours));
    if (savedHighScore) setHighScore(parseInt(savedHighScore));

    // Finish loading
    setIsLoading(false);
  }, []);

  // Trigger tours on tab change or initial load
  useEffect(() => {
    if (isLoading) return;

    const triggerTour = (context: string) => {
      if (ONBOARDING_STEPS[context] && !completedTours[context]) {
        const timer = setTimeout(() => {
          setActiveTour(context as any);
          setTourStep(0);
        }, 600);
        return () => clearTimeout(timer);
      }
    };

    if (showAbout) {
      triggerTour('about');
    } else {
      triggerTour(activeTab as any);
    }
  }, [activeTab, showAbout, isLoading, completedTours]);

  // Update spotlight position dynamically
  useEffect(() => {
    if (!activeTour) {
      setSpotlightRect(null);
      return;
    }

    const updatePosition = () => {
      const steps = ONBOARDING_STEPS[activeTour];
      if (!steps) return;
      
      const step = steps[tourStep];
      if (!step || step.position === 'center') {
        setSpotlightRect({ x: window.innerWidth / 2, y: window.innerHeight / 2, width: 0, height: 0, rx: 0 });
        return;
      }

      const element = document.getElementById(step.elementId);
      if (element) {
        // Use instant scroll for accurate initial measurement
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        
        const rect = element.getBoundingClientRect();
        setSpotlightRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          rx: step.rx || 20
        });

        // Re-check after a short delay in case of layout shifts or images loading
        setTimeout(() => {
          const updatedRect = element.getBoundingClientRect();
          setSpotlightRect({
            x: updatedRect.left,
            y: updatedRect.top,
            width: updatedRect.width,
            height: updatedRect.height,
            rx: step.rx || 20
          });
        }, 100);
      }
    };

    // Small delay to let the tab change render first if needed
    const timeoutId = setTimeout(updatePosition, 50);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // Deep scroll tracking
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [activeTour, tourStep, activeTab]);

  // Pull to refresh logic using native touch events to avoid blocking scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && e.touches && e.touches[0]) {
        touchStartRef.current = e.touches[0].clientY;
      } else {
        touchStartRef.current = -1;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartRef.current === -1 || window.scrollY > 0 || !e.touches || !e.touches[0]) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartRef.current;

      if (diff > 0) {
        // We are pulling down at the top
        if (e.cancelable) e.preventDefault();
        setPullY(diff * 0.5); // Apply resistance
      } else {
        setPullY(0);
      }
    };

    const handleTouchEnd = () => {
      if (pullY > 140) {
        setIsRefreshing(true);
        setTimeout(() => {
          setIsRefreshing(false);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setPullY(0);
          }, 1500);
        }, 2000);
      } else {
        setPullY(0);
      }
      touchStartRef.current = -1;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Mouse events for Laptop/Tablet (Non-touch/Cursor users)
    const handleMouseDown = (e: MouseEvent) => {
      if (window.scrollY <= 0) {
        mouseStartRef.current = e.clientY;
      } else {
        mouseStartRef.current = -1;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseStartRef.current === -1 || window.scrollY > 0) return;
      const currentY = e.clientY;
      const diff = currentY - mouseStartRef.current;
      if (diff > 0) {
        setPullY(diff * 0.5);
      } else {
        setPullY(0);
      }
    };

    const handleMouseUp = () => {
      if (mouseStartRef.current !== -1) {
        if (pullY > 140) {
          setIsRefreshing(true);
          setTimeout(() => {
            setIsRefreshing(false);
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              setPullY(0);
            }, 1500);
          }, 2000);
        } else {
          setPullY(0);
        }
        mouseStartRef.current = -1;
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pullY]);

  // Save cart, favorites, user and orders to localStorage on change
  useEffect(() => {
    localStorage.setItem('rm_segar_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('rm_segar_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('rm_segar_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    if (user) localStorage.setItem('rm_segar_user', JSON.stringify(user));
    else localStorage.removeItem('rm_segar_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('rm_segar_game_highscore', highScore.toString());
  }, [highScore]);

  const clearChat = () => {
    const greeting = user 
      ? "Halo! Saya Master Panda, Koki AI RM Segar. Ada yang bisa saya bantu hari ini? 🐼 [OPSI: Pesan Makanan|Reservasi Meja]"
      : "Halo! Saya Master Panda, Koki AI RM Segar. Silakan mampir atau login untuk akses fitur reservasi ya! Ada yang ingin ditanyakan seputar menu kami hari ini? 🐼🎋";

    setChatMessages([{ 
      role: 'model', 
      text: greeting
    }]);
    localStorage.removeItem('rm_segar_chat_history');
  };

  const categories = useMemo(() => {
    return [
      { name: 'Minuman', icon: <Coffee size={20} /> },
      { name: 'Nasi', icon: <Utensils size={20} /> },
      { name: 'Capcai', icon: <Utensils size={20} /> },
      { name: 'Kwetiao', icon: <Utensils size={20} /> },
      { name: 'Bakmie', icon: <Utensils size={20} /> },
      { name: 'Semua', icon: <Utensils size={20} /> },
    ];
  }, []);

  const categoryItems = useMemo(() => {
    if (activeCategory === 'Semua') return MENU_ITEMS;
    return MENU_ITEMS.filter(item => item.category === activeCategory);
  }, [activeCategory]);

  const searchItems = useMemo(() => {
    if (!searchQuery) return [];
    return MENU_ITEMS.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const favoriteItems = useMemo(() => {
    return MENU_ITEMS.filter(item => favorites.includes(item.id));
  }, [favorites]);

  const popularItems = useMemo(() => {
    return MENU_ITEMS.slice(0, 4);
  }, []);

  const addToCart = (item: MenuItem, option?: 'Es' | 'Panas', sweetness?: 'Manis' | 'Tawar' | 'Sedikit Gula') => {
    if (item.hasOptions && (!option || !sweetness)) {
      setOptionModalItem(item);
      setSelectedOption('Es');
      setSelectedSweetness('Manis');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.option === option && i.sweetness === sweetness);
      if (existing) {
        return prev.map(i => (i.id === item.id && i.option === option && i.sweetness === sweetness) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, option, sweetness }];
    });
    setOptionModalItem(null);
  };

  const removeFromCart = (id: string, option?: 'Es' | 'Panas', sweetness?: 'Manis' | 'Tawar' | 'Sedikit Gula') => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id && i.option === option && i.sweetness === sweetness);
      if (existing && existing.quantity > 1) {
        return prev.map(i => (i.id === id && i.option === option && i.sweetness === sweetness) ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => !(i.id === id && i.option === option && i.sweetness === sweetness));
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const clearItemFromCart = (id: string, option?: 'Es' | 'Panas', sweetness?: 'Manis' | 'Tawar' | 'Sedikit Gula') => {
    setCart(prev => prev.filter(i => !(i.id === id && i.option === option && i.sweetness === sweetness)));
  };

  const toggleItemOption = (id: string, currentOption?: 'Es' | 'Panas', sweetness?: 'Manis' | 'Tawar' | 'Sedikit Gula') => {
    if (!currentOption) return;
    const newOption = currentOption === 'Es' ? 'Panas' : 'Es';
    setCart(prev => {
      const itemToToggle = prev.find(i => i.id === id && i.option === currentOption && i.sweetness === sweetness);
      if (!itemToToggle) return prev;

      // Special case: if we toggle, we might collide with an existing item of the same ID but different option
      const existingWithNewOption = prev.find(i => i.id === id && i.option === newOption && i.sweetness === sweetness);
      if (existingWithNewOption) {
        return prev.map(item => {
          if (item.id === id && item.option === newOption && item.sweetness === sweetness) {
            return { ...item, quantity: item.quantity + itemToToggle.quantity };
          }
          return item;
        }).filter(item => !(item.id === id && item.option === currentOption && item.sweetness === sweetness));
      }
      
      return prev.map(item => 
        (item.id === id && item.option === currentOption && item.sweetness === sweetness) ? { ...item, option: newOption } : item
      );
    });
  };

  const handleLogin = () => {
    if (loginMode === 'login') {
      if (loginPhone.length >= 10 && loginPassword.length >= 4) {
        setUser({ id: loginPhone, phone: loginPhone });
        setLoginPhone('');
        setLoginPassword('');
      }
    } else if (loginMode === 'forgot') {
      if (loginPhone.length >= 10) {
        const token = Math.floor(1000 + Math.random() * 9000).toString();
        setResetToken(token);
        const message = `Halo! Token pemulihan kata sandi RM Segar Anda adalah: *${token}*`;
        const waUrl = `https://wa.me/${loginPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        const link = document.createElement('a');
        link.href = waUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setLoginMode('verify');
        alert(`Token simulasi dikirim ke WA: ${token}`);
      }
    } else if (loginMode === 'verify') {
      if (inputToken === resetToken) {
        setUser({ id: loginPhone, phone: loginPhone });
        setLoginMode('login');
        setLoginPhone('');
        setInputToken('');
        setResetToken('');
      } else {
        alert('Token tidak valid!');
      }
    }
  };

  const navRef = useRef<HTMLDivElement>(null);

  const handleNavPan = (_: any, info: any) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const x = info.point.x - rect.left;
    const width = rect.width;
    
    // Divide into 5 equal zones for each tab
    const tabIndex = Math.max(0, Math.min(Math.floor((x / width) * 5), 4));
    const tabIds = ['home', 'search', 'cart', 'heart', 'profile'] as const;
    const targetTab = tabIds[tabIndex];

    if (targetTab === 'cart') {
      if (!isCartOpen && activeTab !== 'cart') {
        handleTabChange('cart');
        if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
        cartTimeoutRef.current = setTimeout(() => {
          setIsCartOpen(true);
          cartTimeoutRef.current = null;
        }, 650);
      }
    } else {
      if (isCartOpen) {
        setIsCartOpen(false);
      }
      if (activeTab !== targetTab) {
        handleTabChange(targetTab);
      }
    }
  };

  const completeTour = () => {
    if (!activeTour) return;
    const newCompleted = { ...completedTours, [activeTour]: true };
    setCompletedTours(newCompleted);
    localStorage.setItem('rm_segar_completed_tours', JSON.stringify(newCompleted));
    setActiveTour(null);
    setTourStep(0);
  };

  const nextTourStep = () => {
    if (!activeTour) return;
    const steps = ONBOARDING_STEPS[activeTour];
    if (tourStep + 1 < steps.length) {
      setTourStep(tourStep + 1);
    } else {
      completeTour();
    }
  };

  const renderOnboarding = () => {
    if (!activeTour || !spotlightRect) return null;
    const steps = ONBOARDING_STEPS[activeTour];
    const step = steps[tourStep];
    
    const isTop = spotlightRect.y > window.innerHeight / 2;

    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center pointer-events-none">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <motion.rect
                animate={{
                  x: spotlightRect.x,
                  y: spotlightRect.y,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                  rx: spotlightRect.rx,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                fill="black"
              />
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.73)" mask="url(#spotlight-mask)" className="pointer-events-auto" />
        </svg>

        {step.position !== 'center' && (
          <motion.div
            animate={{
              top: spotlightRect.y,
              left: spotlightRect.x,
              width: spotlightRect.width,
              height: spotlightRect.height,
              borderRadius: spotlightRect.rx,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute border-4 border-orange-500 z-[1001] pointer-events-none"
          >
            <motion.div 
              animate={{ opacity: [0, 0.5, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-orange-500/30 rounded-[inherit]"
            />
          </motion.div>
        )}

        <div className="absolute top-8 right-8 z-[1005] pointer-events-auto">
          <button 
            onClick={completeTour}
            className="text-white/70 text-sm font-bold hover:text-white"
          >
            Lewati
          </button>
        </div>

        <motion.div
          layout
          animate={{
            top: isTop ? Math.max(80, spotlightRect.y - 20) : Math.min(window.innerHeight - 80, spotlightRect.y + spotlightRect.height + 20),
            y: isTop ? '-100%' : '0%',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute left-6 right-6 bg-white rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center z-[1005] pointer-events-auto"
        >
          {step.position !== 'center' && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 20 }}
              className={`absolute w-0.5 bg-orange-500/30 ${isTop ? 'top-full' : 'bottom-full'} left-1/2 -translate-x-1/2`}
            />
          )}

          <motion.div 
            layout
            className={`absolute w-4 h-4 bg-white rotate-45 ${isTop ? 'top-full -mt-2' : 'bottom-full -mb-2'} left-1/2 -translate-x-1/2`} 
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTour}-${tourStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              <h2 className="text-xl font-bold text-stone-900 mb-2 tracking-tight">
                {step.title}
              </h2>
              
              <p className="text-stone-500 text-sm leading-relaxed mb-6">
                {step.description}
              </p>

              <div className="flex items-center justify-between w-full">
                <div className="flex gap-1.5">
                  {steps.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-300 ${idx === tourStep ? 'w-4 bg-orange-500' : 'w-1 bg-stone-200'}`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextTourStep}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                >
                  {step.button}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  const updateNote = (id: string, option: 'Es' | 'Panas' | undefined, sweetness: 'Manis' | 'Tawar' | 'Sedikit Gula' | undefined, note: string) => {
    setCart(prev => prev.map(item => 
      (item.id === id && item.option === option && item.sweetness === sweetness) ? { ...item, note } : item
    ));
    setNoteModalItem(null);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const sendToWhatsApp = () => {
    const phoneNumber = "6281258394293";
    const orderId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const orderDetails = cart.map(item => {
      let detail = `- ${item.name} (${item.quantity}x)`;
      const details = [];
      if (item.option) details.push(item.option);
      if (item.sweetness) details.push(item.sweetness);
      if (item.note) details.push(item.note);
      if (details.length > 0) detail += ` [${details.join(', ')}]`;
      return detail;
    }).join('\n');

    const messageContent = `*RM SEGAR - PESANAN BARU #${orderId}*
 
 Saya memesan berikut:
 - Waktu: ${new Date().toLocaleString('id-ID')}
 
 *Daftar Menu:*
 ${orderDetails}
 
 - Jenis: ${orderType}
 - Pembayaran: ${paymentMethod}
 - Catatan: ${orderNote || '-'}
 
 Mohon bantuannya untuk segera diproses. Terima kasih! 🎋`;

    const message = encodeURIComponent(messageContent);
    
    // Save to history
    const newOrder: Order = {
      id: orderId,
      date: new Date().toLocaleString('id-ID'),
      items: [...cart],
      totalItems: totalItems,
      orderType: orderType,
      paymentMethod: paymentMethod,
      note: orderNote || undefined
    };
    setOrders(prev => [newOrder, ...prev]);
    
    const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCart([]);
    setIsCartOpen(false);
  };

  const sendScheduleToWhatsApp = () => {
    const phoneNumber = "6281258394293";
    const scheduleId = Math.random().toString(36).substring(2, 6).toUpperCase();

    const orderDetails = cart.length > 0 ? cart.map(item => {
      let detail = `- ${item.name} (${item.quantity}x)`;
      const details = [];
      if (item.option) details.push(item.option);
      if (item.sweetness) details.push(item.sweetness);
      if (item.note) details.push(item.note);
      if (details.length > 0) detail += ` [${details.join(', ')}]`;
      return detail;
    }).join('\n') : "_Hanya Reservasi Meja_";
    
    let scheduleInfo = '';
    if (scheduleType === 'Jam') {
      scheduleInfo = `nanti jam ${scheduleTime || '--:--'}`;
    } else {
      scheduleInfo = `hari/tanggal ${scheduleDate || 'Hari Ini'} jam ${scheduleTime || '--:--'}`;
    }

    const messageContent = `*RM SEGAR - RESERVASI & JADWAL #${scheduleId}*
 
 Saya ingin memesan/reservasi untuk:
 - Waktu: ${scheduleInfo}
${orderType === 'Makan di Tempat' ? ` - Untuk: ${scheduleHeadcount} orang\n` : ''}
 *Pesanan:*
 ${orderDetails}
 
 - Jenis: ${orderType === 'Makan di Tempat' ? 'Dine In' : 'Bungkus'}
 - Pembayaran: ${paymentMethod}
 - Catatan: ${scheduleNote || '-'}
 
 Mohon konfirmasinya. Terima kasih! 🎋`;

    const message = encodeURIComponent(messageContent);
    
    // Save to order history if has items
    if (cart.length > 0) {
      const newOrder: Order = {
        id: scheduleId,
        date: new Date().toLocaleString('id-ID'),
        items: [...cart],
        totalItems: totalItems,
        orderType: orderType,
        paymentMethod: paymentMethod,
        note: scheduleNote || undefined,
        schedule: {
          type: scheduleType,
          date: scheduleDate,
          time: scheduleTime
        }
      };
      setOrders(prev => [newOrder, ...prev]);
    }

    // Always save to reservations
    const newRes: Reservation = {
      id: scheduleId,
      date: scheduleDate || "Hari Ini",
      time: scheduleTime || "12:00",
      attendees: scheduleHeadcount,
      note: scheduleNote || (cart.length > 0 ? "Pesanan Terjadwal" : "Reservasi Meja"),
      status: 'Akan Datang',
      orderType: orderType === 'Makan di Tempat' ? 'Makan di Tempat' : 'Bungkus',
      items: cart.length > 0 ? [...cart] : undefined
    };
    setReservations(prev => [newRes, ...prev]);
    
    const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCart([]);
    setIsCartOpen(false);
    setActiveTab(prevActiveTab);
    setIsScheduling(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const renderHome = (key: string) => (
    <motion.div 
      key={key}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* AI Recommendation Section */}
      <section className="px-6" id="tour-ai-chat">
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold">Bingung mau makan apa?</h3>
                <p className="text-stone-400 text-xs">Ngobrol dengan Koki AI RM Segar!</p>
              </div>
            </div>
            
            <div 
              onClick={startAIChat}
              className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-all border-dashed"
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                <Utensils size={16} />
              </div>
              <span className="text-white/60 text-sm font-medium">Tanya Master Panda apa saja...</span>
              <div className="ml-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full -ml-12 -mb-12 blur-2xl" />
        </div>
      </section>

      {/* Categories */}
      <section ref={categoryScrollRef} className="px-6 overflow-x-auto no-scrollbar flex gap-4 md:gap-0 md:justify-between py-4" id="tour-categories">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`flex flex-col items-center gap-2 min-w-[70px] md:min-w-[100px] transition-all ${
              activeCategory === cat.name ? 'scale-105' : 'opacity-60'
            }`}
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-colors ${
              activeCategory === cat.name ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-stone-600'
            }`}>
              {cat.icon}
            </div>
            <span className={`text-xs md:text-sm font-bold ${activeCategory === cat.name ? 'text-stone-900' : 'text-stone-500'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </section>

      {/* Popular Section */}
      <section className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-stone-900">Paling Populer</h2>
          <button 
            onClick={() => setActiveCategory('Semua')}
            className="text-orange-500 text-sm font-bold"
          >
            Lihat Semua
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {popularItems.map((item) => (
            <motion.div 
              key={item.id}
              whileTap={{ scale: 0.95 }}
              className="min-w-[240px] bg-white rounded-3xl p-4 shadow-sm border border-stone-50"
            >
              <div className="relative h-32 rounded-2xl overflow-hidden mb-4">
                <MenuIcon item={item} size={48} />
                <button 
                  onClick={() => toggleFavorite(item.id)}
                  className={`absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full transition-colors ${
                    favorites.includes(item.id) ? 'text-orange-500' : 'text-stone-400'
                  }`}
                >
                  <Heart size={16} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-stone-900 leading-tight">{item.name}</h3>
                <div className="flex items-center gap-1 text-orange-500">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs font-bold">4.8</span>
                </div>
              </div>
              <p className="text-xs text-stone-400 mb-4 line-clamp-1">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-stone-400">Otentik Kalbar</span>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-8 h-8 bg-stone-900 text-white rounded-xl flex items-center justify-center hover:bg-orange-500 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Menu List */}
      <section className="px-6">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Menu {activeCategory}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryItems.map((item) => (
            <motion.div 
              layout
              key={item.id}
              className="bg-white p-3 rounded-3xl flex gap-4 shadow-sm border border-stone-50 h-full"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <MenuIcon item={item} size={32} />
              </div>
              <div className="flex-grow flex flex-col justify-center py-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-900 mb-1">{item.name}</h3>
                  <button onClick={() => toggleFavorite(item.id)} className={favorites.includes(item.id) ? 'text-orange-500' : 'text-stone-300'}>
                    <Heart size={16} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className="text-xs text-stone-400 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex justify-end items-center mt-auto">
                  <button 
                    onClick={() => addToCart(item)}
                    className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold hover:bg-orange-500 hover:text-white transition-all"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      
    </motion.div>
  );

  const renderSearch = (key: string) => (
    <motion.div 
      key={key}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="px-6 space-y-6"
    >
      <div className="flex items-center gap-4 mb-2" id="tour-search-page-input">
        <button onClick={() => handleTabChange('home')} className="p-2 bg-white rounded-full shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">Pencarian</h2>
      </div>
      
      {searchQuery ? (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">Hasil pencarian untuk "{searchQuery}"</p>
          {searchItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchItems.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-3xl flex gap-4 shadow-sm border border-stone-50">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                    <MenuIcon item={item} size={28} />
                  </div>
                  <div className="flex-grow flex flex-col justify-center">
                    <h3 className="font-bold text-stone-900">{item.name}</h3>
                    <p className="text-xs text-stone-400 mb-2">{item.category}</p>
                    <button 
                      onClick={() => addToCart(item)}
                      className="w-fit px-4 py-1.5 bg-orange-500 text-white rounded-full text-xs font-bold"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Search size={48} className="mx-auto text-stone-200 mb-4" />
              <p className="text-stone-500">Menu tidak ditemukan</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6" id="tour-search-history">
          {searchHistory.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-stone-900">Riwayat Pencarian</h3>
                <button 
                  onClick={() => setSearchHistory([])}
                  className="text-xs text-stone-400 font-bold hover:text-orange-500"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSearchQuery(term)}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-stone-600 border border-stone-100 shadow-sm group hover:border-orange-200 transition-all"
                  >
                    <History size={14} className="text-stone-300 group-hover:text-orange-500 transition-colors" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-bold text-stone-900">Pencarian Populer</h3>
            <div className="flex flex-wrap gap-2">
              {['Bakmie Kering', 'Kwetiao Goreng', 'Kaifon', 'Es Jeruk Nipis'].map(term => (
                <button 
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-4 py-2 bg-white rounded-full text-sm text-stone-600 border border-stone-100 shadow-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderFavorites = (key: string) => (
    <motion.div 
      key={key}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="px-6 space-y-6"
    >
      <h2 className="text-2xl font-bold text-stone-900">Menu Favorit</h2>
      {favoriteItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteItems.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-3xl flex gap-4 shadow-sm border border-stone-50 h-full">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <MenuIcon item={item} size={32} />
              </div>
              <div className="flex-grow flex flex-col justify-center">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-900">{item.name}</h3>
                  <button onClick={() => toggleFavorite(item.id)} className="text-orange-500">
                    <Heart size={18} fill="currentColor" />
                  </button>
                </div>
                <p className="text-xs text-stone-400 mb-3">{item.category}</p>
                <button 
                  onClick={() => addToCart(item)}
                  className="w-full py-2 bg-stone-900 text-white rounded-xl text-xs font-bold mt-auto"
                >
                  Tambah ke Keranjang
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Heart size={48} className="mx-auto text-stone-200 mb-4" />
          <h3 className="text-lg font-bold text-stone-900 mb-2">Belum Ada Favorit</h3>
          <p className="text-stone-400">Klik ikon hati pada menu untuk menyimpannya di sini.</p>
          <button 
            onClick={() => setActiveTab('home')}
            className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold"
          >
            Cari Menu
          </button>
        </div>
      )}
    </motion.div>
  );

  const renderGame = () => {
    return (
      <AnimatePresence>
        {isGameOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-stone-900 flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-md h-full flex flex-col gap-6">
              <div className="flex justify-between items-center text-white">
                <div>
                  <h2 className="text-xl font-black italic tracking-tighter">PANDA NOODLE</h2>
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Catch the Goodies! 🍜</p>
                </div>
                <button 
                  onClick={() => setIsGameOpen(false)}
                  className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Game Area */}
              <div className="flex-grow bg-white rounded-[40px] relative overflow-hidden shadow-2xl border-4 border-white/10">
                <PandaNoodleGame 
                  isGameOpen={isGameOpen}
                  setIsGameOpen={setIsGameOpen}
                  onGameOver={(score) => {
                    if (score > highScore) setHighScore(score);
                  }} 
                />
              </div>

              <div className="flex justify-between items-center px-4 py-2">
                <div className="text-center">
                  <p className="text-[10px] text-stone-500 font-bold uppercase">High Score</p>
                  <p className="text-xl font-black text-white">{highScore}</p>
                </div>
                <div className="w-px h-8 bg-stone-800" />
                <div className="text-center">
                  <p className="text-[10px] text-stone-500 font-bold uppercase">Tips</p>
                  <p className="text-[10px] text-stone-400 font-medium">Geser panda untuk menangkap mie! 🥢</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const handleCancelReservation = (id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    
    const phoneNumber = "6281258394293";
    const message = `Halo RM Segar,%0A%0ASaya ingin *MEMBATALKAN* reservasi berikut:%0A- ID: ${res.id}%0A- Waktu: ${res.date} jam ${res.time}%0A- Untuk: ${res.attendees} orang%0A%0AMohon konfirmasinya. Terima kasih.`;
    
    const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setReservations(prev => prev.filter(r => r.id !== id));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const renderReservations = (isCompact = false) => {
    const upcomingReservations = reservations.filter(r => r.status === 'Akan Datang');
    
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className={`space-y-8 ${isCompact ? 'pb-10' : 'px-6 pb-32'}`}
      >
        {!isCompact && (
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Jadwal & Reservasi</h2>
            <button 
              onClick={() => setIsScheduling(true)}
              className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[28px] border border-stone-50 shadow-sm">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Akan Datang</p>
            <p className="text-3xl font-black text-stone-900">{upcomingReservations.length}</p>
          </div>
          <div className="bg-orange-50 p-5 rounded-[28px] border border-orange-100 shadow-sm">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Total Jadwal</p>
            <p className="text-3xl font-black text-orange-600">{reservations.length}</p>
          </div>
        </div>

        {/* Reservation List */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-stone-400 uppercase tracking-wider px-2">Daftar Jadwal Anda</h3>
          
          {reservations.length === 0 ? (
            <div className="py-16 bg-white rounded-[32px] border border-dashed border-stone-200 flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mb-6">
                <Calendar size={40} />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Belum Ada Jadwal</h3>
              <p className="text-sm text-stone-400 leading-relaxed">Pesan meja atau jadwalkan makanan favorit Anda untuk jam, hari, atau bulan tertentu.</p>
              <button 
                onClick={() => setIsScheduling(true)}
                className="mt-8 px-8 py-3 bg-stone-900 text-white rounded-2xl font-bold text-sm"
              >
                Buat Jadwal Baru
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map(res => (
                <div key={res.id} className="relative overflow-hidden rounded-[32px] group">
                  {/* Delete Action Background */}
                  <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-8">
                    <button 
                      onClick={() => handleCancelReservation(res.id)}
                      className="flex flex-col items-center gap-1 text-white animate-pulse"
                    >
                      <Trash2 size={24} />
                      <span className="text-[10px] font-black uppercase">Hapus</span>
                    </button>
                  </div>

                  {/* Swipeable Card */}
                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -80) {
                        // Optional: trigger delete immediately or just leave it open
                      }
                    }}
                    className="bg-white p-5 rounded-[32px] border border-stone-50 shadow-sm flex items-center gap-4 relative z-10 cursor-grab active:cursor-grabbing"
                  >
                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-[20px] flex items-center justify-center flex-shrink-0">
                      <Clock size={28} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-stone-900">{res.orderType || 'Makan di Tempat'}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                          res.status === 'Akan Datang' ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{res.date} • {res.time}</p>
                      <div className="flex items-center gap-3 mt-2">
                         <div className="flex items-center gap-1 text-[10px] text-stone-400 font-bold">
                           <User size={12} />
                           {res.attendees} Orang
                         </div>
                         {res.items && res.items.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                              <ShoppingBag size={12} />
                              {res.items.length} Menu
                            </div>
                         )}
                         {res.note && (
                           <div className="flex flex-col gap-1 mt-2">
                             <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold italic">
                               <MessageSquare size={12} />
                               {res.note.length > 20 ? 'Ada Catatan' : res.note}
                             </div>
                             {res.note.length > 20 && (
                               <p className="text-[9px] text-stone-400 italic line-clamp-1 ml-4">"{res.note}"</p>
                             )}
                           </div>
                         )}
                      </div>
                      {res.items && res.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-50 flex flex-wrap gap-1.5">
                          {res.items.map((item, idx) => (
                            <span key={idx} className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 ${
                              item.option ? (item.option === 'Es' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-600') : 'bg-stone-50 text-stone-500'
                            }`}>
                              {item.name} x{item.quantity}
                              {item.option && <span className="opacity-60">• {item.option}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Master Panda Help Overlay */}
        <div className="bg-stone-900 p-6 rounded-[32px] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <Bot className="text-stone-900" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tanya Master Panda</p>
                <h4 className="text-sm font-bold text-white">Butuh Bantuan Reservasi?</h4>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              "Halo! Master Panda siap bantu kamu menjadwalkan makan malam romantis atau kumpul keluarga besar. Tanya saja ke saya!"
            </p>
            <button 
              onClick={() => {
                handleSendMessage(undefined, "Bantu saya booking");
                startAIChat();
              }}
              className="w-full py-3 bg-white/10 hover:bg-white text-white hover:text-stone-900 rounded-xl text-xs font-bold transition-all border border-white/5"
            >
              Hubungi Master Panda
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSchedulingModal = () => (
    <AnimatePresence>
      {isScheduling && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsScheduling(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setIsScheduling(false);
              }
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl h-[90vh] bg-white rounded-t-[48px] shadow-2xl z-[120] flex flex-col"
          >
            <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mt-4 mb-6" />
            
            <div className="px-8 flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">Buat Jadwal</h2>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pesanan & Reservasi</p>
              </div>
              <button 
                onClick={() => setIsScheduling(false)}
                className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto px-8 space-y-6 no-scrollbar pb-10">
              {/* Choice Section */}
              <div className="bg-stone-900 rounded-[32px] p-6 text-white shadow-xl shadow-stone-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Bot className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Pilih Cara</h3>
                    <p className="text-[10px] text-white/60">Tanya AI atau Isi Sendiri</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      handleSendMessage(undefined, "Bantu saya buat reservasi!");
                      startAIChat();
                      setIsScheduling(false);
                    }}
                    className="py-3 bg-white text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} />
                    Tanya AI
                  </button>
                  <button 
                    className="py-3 bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/20 active:bg-white active:text-stone-900 transition-all font-sans"
                    onClick={() => {}} // Already on this page
                  >
                    <Edit3 size={14} />
                    Isi Sendiri
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Jenis Pesanan</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setOrderType('Makan di Tempat')}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                      orderType === 'Makan di Tempat' ? 'bg-stone-900 border-stone-900 text-white' : 'bg-stone-50 border-stone-50 text-stone-400'
                    }`}
                  >
                    Dine In
                  </button>
                  <button 
                    onClick={() => setOrderType('Bungkus')}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                      orderType === 'Bungkus' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-stone-50 border-stone-50 text-stone-400'
                    }`}
                  >
                    Bungkus
                  </button>
                </div>
              </div>

              {/* Type Selection */}
              <div className="space-y-4">
                <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Jenis Penjadwalan</p>
                <div className="grid grid-cols-2 gap-2 bg-stone-50 p-1.5 rounded-[24px]">
                  {['Jam', 'Hari'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setScheduleType(type as any)}
                      className={`py-3 rounded-2xl text-xs font-black transition-all ${
                        scheduleType === type ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Form based on Type */}
              <div className="space-y-6">
                {scheduleType === 'Jam' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="block">
                      <span className="text-xs font-black text-stone-400 uppercase tracking-widest px-2 mb-2 block">Pilih Jam (Hari Ini)</span>
                      <input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-stone-900 font-bold focus:ring-2 focus:ring-orange-500/20"
                      />
                    </label>
                  </div>
                )}

                {scheduleType === 'Hari' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="block">
                      <span className="text-xs font-black text-stone-400 uppercase tracking-widest px-2 mb-2 block">Pilih Tanggal</span>
                      <input 
                        type="date" 
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-stone-900 font-bold focus:ring-2 focus:ring-orange-500/20"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-black text-stone-400 uppercase tracking-widest px-2 mb-2 block">Pilih Waktu</span>
                      <input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-stone-900 font-bold focus:ring-2 focus:ring-orange-500/20"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Detail Pesanan</p>
                <div className={`${orderType === 'Makan di Tempat' ? 'grid grid-cols-2' : 'block'} gap-4`}>
                  {orderType === 'Makan di Tempat' && (
                    <div className="bg-stone-50 p-4 rounded-[28px] animate-in fade-in zoom-in duration-300">
                      <p className="text-[10px] font-black text-stone-400 uppercase mb-2">Jumlah Orang</p>
                      <div className="flex items-center justify-between">
                         <button 
                           type="button"
                           onClick={() => setScheduleHeadcount(Math.max(1, scheduleHeadcount - 1))}
                           className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-stone-900"
                         >
                           <Minus size={14} />
                         </button>
                         <span className="text-xl font-black text-stone-900">{scheduleHeadcount}</span>
                         <button 
                           type="button"
                           onClick={() => setScheduleHeadcount(scheduleHeadcount + 1)}
                           className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-stone-900"
                         >
                           <Plus size={14} />
                         </button>
                      </div>
                    </div>
                  )}
                  <div className={`bg-stone-50 p-4 rounded-[28px] border-2 transition-all ${
                    orderType === 'Makan di Tempat' ? 'border-stone-900/10' : 'border-orange-500/20'
                  }`}>
                    <p className="text-[10px] font-black text-stone-400 uppercase mb-2">Status</p>
                    <div className="flex items-center gap-2 text-stone-900 font-bold">
                      {orderType === 'Makan di Tempat' ? (
                        <>
                          <Utensils size={18} className="text-stone-900" />
                          <span className="text-sm">Dine In</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} className="text-orange-500" />
                          <span className="text-sm">Bungkus</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

               <div className="space-y-4">
                <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Catatan Tambahan</p>
                <div className="bg-stone-50 p-6 rounded-[32px] border border-stone-100 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-stone-400 shadow-sm flex-shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <textarea 
                    placeholder="Ada permintaan khusus? Misalnya: 'Meja deket jendela' atau 'Rayain ultah'..."
                    value={scheduleNote}
                    onChange={(e) => setScheduleNote(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm text-stone-900 placeholder:text-stone-300 focus:ring-0 min-h-[80px] resize-none"
                  />
                </div>
              </div>

              {cart.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Menu yang Dipesan</p>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.option || 'none'}`} className="relative overflow-hidden rounded-3xl group">
                        {/* Swipe Background (Delete Button) */}
                        <div className="absolute inset-0 bg-red-500 flex items-center justify-end">
                          <button 
                            onClick={() => clearItemFromCart(item.id, item.option)}
                            className="h-full px-8 text-white active:bg-blue-600 transition-colors flex flex-col items-center justify-center gap-1 group/delete"
                          >
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-active/delete:scale-90 transition-transform">
                              <Trash2 size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Hapus</span>
                          </button>
                        </div>

                        {/* Item Content */}
                        <motion.div 
                          drag="x"
                          dragConstraints={{ left: -100, right: 0 }}
                          dragElastic={0.05}
                          className="relative bg-white flex gap-4 items-center p-4 cursor-grab active:cursor-grabbing border border-stone-100 rounded-[inherit] z-10"
                        >
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                            <MenuIcon item={item} size={24} />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-stone-900 leading-tight text-sm">{item.name}</h4>
                                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{item.category}</p>
                              </div>
                              <button 
                                onClick={() => setNoteModalItem({ id: item.id, option: item.option, note: item.note || '' })}
                                className={`p-1.5 rounded-lg transition-colors ${item.note ? 'text-orange-500 bg-orange-50' : 'text-stone-300 hover:text-orange-500 hover:bg-orange-50'}`}
                              >
                                <MessageSquare size={14} />
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2.5 bg-white px-2 py-1 rounded-xl border border-stone-100 shadow-sm">
                                <button 
                                  onClick={() => removeFromCart(item.id, item.option)}
                                  className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 active:bg-stone-100 border border-stone-100"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="font-black text-stone-900 text-[11px]">{item.quantity}</span>
                                <button 
                                  onClick={() => addToCart(item, item.option)}
                                  className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white active:bg-orange-600"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              {item.option && (
                                <button 
                                  onClick={() => toggleItemOption(item.id, item.option)}
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all active:scale-90 ${
                                  item.option === 'Es' ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                }`}>
                                  {item.option} 🔄
                                </button>
                              )}
                            </div>

                            {item.note && (
                              <div className="mt-2 p-2 bg-orange-50/50 rounded-xl border border-orange-100/50 flex items-start gap-2">
                                <MessageSquare size={10} className="text-orange-500 mt-0.5" />
                                <p className="text-[9px] text-orange-600 font-medium italic line-clamp-1">"{item.note}"</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    ))}
                    <div className="p-4 bg-stone-900 rounded-3xl flex justify-between items-center shadow-lg shadow-stone-100">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Pesanan</span>
                      <span className="text-sm font-black text-white">{totalItems} Menu</span>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-stone-200 flex flex-col items-center gap-4">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">QR untuk Reorder / Share</p>
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                        <QRCodeSVG 
                          value={JSON.stringify({ 
                            items: cart.map(i => ({ id: i.id, q: i.quantity, o: i.option })),
                            type: 'rm_segar_order'
                          })} 
                          size={120}
                        />
                      </div>
                      <p className="text-[9px] text-stone-400 text-center px-4 leading-normal">Pindai QR ini untuk menyalin keranjang belanja ke ponsel lain.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Metode Pembayaran</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('Tunai')}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'Tunai' ? 'bg-stone-900 border-stone-900 text-white shadow-xl shadow-stone-100' : 'bg-stone-50 border-stone-50 text-stone-400'
                    }`}
                  >
                    <span>💵</span>
                    Tunai
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('Transfer')}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'Transfer' ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-100' : 'bg-stone-50 border-stone-50 text-stone-400'
                    }`}
                  >
                    <span>🏦</span>
                    Transfer
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border-t border-stone-100 flex gap-4">
              <button 
                onClick={() => setIsScheduling(false)}
                className="px-8 py-5 bg-stone-100 text-stone-900 rounded-[28px] font-black text-sm"
              >
                Batal
              </button>
              <button 
                onClick={sendScheduleToWhatsApp}
                className="flex-grow py-5 bg-orange-500 text-white rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-orange-100 active:scale-95 transition-all"
              >
                Buat Jadwal
                <Check size={20} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
  const renderProfile = (key: string) => (
    <motion.div 
      key={key}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="px-6 space-y-8"
    >
      {showOrderHistory ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowOrderHistory(false)}
              className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-50 flex items-center justify-center text-stone-400"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-stone-900">Riwayat Pesanan</h2>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                <History size={40} />
              </div>
              <p className="text-stone-400 font-medium">Belum ada riwayat pesanan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-stone-50 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Order #{order.id}</p>
                      <p className="text-sm text-stone-500">{order.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase rounded-full">
                        Selesai
                      </span>
                      <span className="px-3 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-full">
                        {order.orderType}
                      </span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase rounded-full">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-600">
                            {item.name}
                            {item.option && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                                item.option === 'Es' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                              }`}>
                                {item.option}
                              </span>
                            )}
                          </span>
                          <span className="text-stone-400 font-bold">x{item.quantity}</span>
                        </div>
                        {item.note && (
                          <div className="pl-4 border-l-2 border-orange-100 mb-2">
                            <p className="text-[10px] text-orange-500 italic">Catatan Item: {item.note}</p>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                    {order.note && (
                      <div className="mt-4 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Catatan Pesanan</p>
                        <p className="text-xs text-stone-600 italic">"{order.note}"</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-stone-50 flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-400 uppercase">Total Item</span>
                    <span className="text-stone-900 font-bold">{order.totalItems} Menu</span>
                  </div>
                  
                  <div className="pt-4 border-t border-dashed border-stone-100 flex flex-col items-center gap-3">
                    <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Scan QR untuk Reorder</p>
                    <div className="p-2 bg-stone-50/50 rounded-xl">
                      <QRCodeSVG 
                        value={JSON.stringify({ 
                          items: order.items.map(i => ({ id: i.id, q: i.quantity, o: i.option })),
                          type: 'rm_segar_order',
                          id: order.id
                        })} 
                        size={80}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : showReservations ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowReservations(false)}
                className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-50 flex items-center justify-center text-stone-400"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-xl font-bold text-stone-900">Jadwal & Reservasi</h2>
            </div>
            <button 
              onClick={() => setIsScheduling(true)}
              className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 active:scale-95 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="bg-stone-50/50 p-2 rounded-[32px] overflow-hidden">
            {renderReservations(true)}
          </div>
        </div>
      ) : showAbout ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAbout(false)}
              className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-50 flex items-center justify-center text-stone-400"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-stone-900">Tentang RM Segar</h2>
          </div>

          <div className="space-y-6">
            <LocationSection />

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-50 space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Utensils size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">Resep Turun Temurun</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Menjaga cita rasa otentik dengan resep rahasia keluarga yang diwariskan dari generasi ke generasi.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">Bahan Segar & Berkualitas</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Kami menjamin setiap sayur dan daging yang kami gunakan selalu fresh setiap harinya.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-wider">Informasi Penting</span>
                </div>
                <p className="text-sm text-red-500 font-medium mt-1">
                  Menu kami mengandung bahan-bahan yang **Tidak Halal**.
                </p>
              </div>
            </div>

            <div className="pt-8 pb-2 text-center border-t border-stone-50">
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} RM Segar
              </p>
              <p className="text-[10px] text-stone-300 mt-1">
                valensiarainy73@gmail.com
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center text-center space-y-4" id="tour-profile-info">
            <div className="w-24 h-24 rounded-3xl bg-orange-500 shadow-xl shadow-orange-200 flex items-center justify-center text-white overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <MainLogo size={48} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-900">{user ? (user.displayName || 'Pecinta Bakmie') : 'Tamu'}</h2>
              <p className="text-stone-500 font-bold">{user ? user.phone : 'Belum Masuk'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              onClick={() => setIsGameOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div className="text-left">
                  <span className="font-bold block">Main Game Yuk! 🎮</span>
                  <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Sembari nunggu pesanan...</p>
                </div>
              </div>
              <ChevronRight size={20} />
            </button>

            <button 
              onClick={() => setShowOrderHistory(true)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-stone-50"
              id="tour-order-history"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <span className="font-bold text-stone-700">Riwayat Pesanan</span>
              </div>
              <ChevronRight size={20} className="text-stone-300" />
            </button>
            <button 
              onClick={() => setShowReservations(true)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-stone-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <span className="font-bold text-stone-700">Jadwal & Reservasi</span>
              </div>
              <ChevronRight size={20} className="text-stone-300" />
            </button>
            <button 
              onClick={() => setShowTutorial(true)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-stone-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                  <HelpCircle size={20} />
                </div>
                <span className="font-bold text-stone-700">Panduan Penggunaan</span>
              </div>
              <ChevronRight size={20} className="text-stone-300" />
            </button>
            <button 
              onClick={() => setShowAbout(true)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-stone-50"
              id="tour-about-button"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <span className="font-bold text-stone-700">Tentang RM Segar</span>
              </div>
              <ChevronRight size={20} className="text-stone-300" />
            </button>
            
            {user && (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-stone-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                    <LogOut size={20} />
                  </div>
                  <span className="font-bold text-stone-700">Keluar</span>
                </div>
                <ChevronRight size={20} className="text-stone-300" />
              </button>
            )}
          </div>
          
          {!user && (
            <div className="pt-4 space-y-6">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-50 space-y-6 max-w-2xl mx-auto w-full">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-stone-900">
                      {loginMode === 'login' ? 'Masuk Akun' : loginMode === 'forgot' ? 'Lupa Sandi' : 'Verifikasi Token'}
                    </h2>
                    <p className="text-stone-500 text-sm">
                      {loginMode === 'login' 
                        ? 'Masuk menggunakan nomor WA dan kata sandi' 
                        : loginMode === 'forgot' 
                          ? 'Masukkan nomor WA untuk menerima token' 
                          : 'Masukkan token 4-digit yang dikirim ke WA'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-stone-100 rounded-2xl shadow-sm hover:bg-stone-50 transition-all active:scale-95 text-stone-700 font-bold"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Masuk dengan Google
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-stone-100"></div>
                        <span className="flex-shrink mx-4 text-[10px] font-black text-stone-300 uppercase tracking-widest">Atau via WA</span>
                        <div className="flex-grow border-t border-stone-100"></div>
                    </div>

                    {loginMode !== 'verify' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase ml-1">Nomor WhatsApp</label>
                        <input 
                          type="tel" 
                          placeholder="Contoh: 62812XXXXXXXX"
                          value={loginPhone}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('62') || val === '') {
                              setLoginPhone(val);
                            } else if (!val.startsWith('62') && val.length > 0) {
                              setLoginPhone('62' + val.replace(/^0+/, ''));
                            }
                          }}
                          className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500/20 transition-all text-stone-900"
                        />
                      </div>
                    )}
                    
                    {loginMode === 'login' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-xs font-bold text-stone-400 uppercase">Kata Sandi</label>
                          <button 
                            onClick={() => setLoginMode('forgot')}
                            className="text-xs font-bold text-orange-500 hover:text-orange-600"
                          >
                            Lupa Sandi?
                          </button>
                        </div>
                        <input 
                          type="password" 
                          placeholder="Masukkan kata sandi"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500/20 transition-all text-stone-900"
                        />
                      </div>
                    )}

                    {loginMode === 'verify' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase ml-1">Token 4-Digit</label>
                        <input 
                          type="text" 
                          maxLength={4}
                          placeholder="XXXX"
                          value={inputToken}
                          onChange={(e) => setInputToken(e.target.value)}
                          className="w-full bg-stone-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500/20 transition-all text-stone-900 text-center text-2xl tracking-[0.5em] font-bold"
                        />
                      </div>
                    )}

                    <button 
                      onClick={handleLogin}
                      className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                    >
                      {loginMode === 'login' ? 'Masuk' : loginMode === 'forgot' ? 'Kirim Token' : 'Verifikasi'}
                    </button>

                    {loginMode !== 'login' && (
                      <button 
                        onClick={() => setLoginMode('login')}
                        className="w-full text-stone-400 text-sm font-bold hover:text-stone-600"
                      >
                        Kembali ke Login
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          <div className="pt-12 pb-4 text-center">
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} RM Segar
            </p>
            <p className="text-[10px] text-stone-300 mt-1">
              valensiarainy73@gmail.com
            </p>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-32 overflow-x-hidden relative flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <AnimatePresence>
          {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.8,
                ease: "easeOut"
              }}
              className="relative mb-8"
            >
              {/* Animated Logo Container */}
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 bg-orange-500 rounded-[40px] shadow-2xl shadow-orange-200 flex items-center justify-center text-white relative overflow-hidden"
              >
                <MainLogo size={64} />
                
                {/* Shine effect */}
                <motion.div 
                  animate={{ 
                    x: [-150, 150]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    repeatDelay: 0.5
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
              </motion.div>

              {/* Decorative particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: [0, (i % 2 === 0 ? 40 : -40) * Math.random()],
                    y: [0, (i < 3 ? 40 : -40) * Math.random()],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    delay: i * 0.2
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-orange-300 rounded-full"
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-3xl font-black text-stone-900 tracking-tighter mb-2">
                RUMAH MAKAN <span className="text-orange-500">SEGAR</span>
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-1 bg-orange-500 rounded-full" />
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.3em]">
                  Otentik Kalimantan Barat
                </p>
                <div className="w-8 h-1 bg-orange-500 rounded-full" />
              </div>
            </motion.div>

            {/* Loading Bar */}
            <div className="absolute bottom-12 left-12 right-12 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-full bg-orange-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pull to Refresh Panda Animation */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-0"
        style={{ height: 300 }}
      >
        <AnimatePresence>
          {(pullY > 20 || isRefreshing || showSuccess) && (
            <motion.div 
              initial={{ y: -100, opacity: 0, scale: 0.5 }}
              animate={{ 
                y: (isRefreshing || showSuccess) ? 30 : Math.max(0, pullY * 0.4 - 20),
                opacity: 1,
                scale: (isRefreshing || showSuccess) ? 1.1 : Math.min(1.1, 0.7 + pullY / 300)
              }}
              exit={{ y: -100, opacity: 0, scale: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-24 h-24 flex items-center justify-center">
                {showSuccess ? (
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-orange-500"
                  >
                    <Check size={32} className="text-orange-500 stroke-[4px]" />
                  </motion.div>
                ) : (
                  <div className="relative scale-90">
                    {/* Panda Cooking */}
                    <motion.div 
                      className="w-24 h-20 bg-white rounded-[40px_40px_30px_30px] border-4 border-stone-900 relative shadow-lg"
                      animate={isRefreshing ? {
                        y: [0, -5, 0],
                        rotate: [0, -1, 1, 0]
                      } : {}}
                      transition={{ repeat: Infinity, duration: 0.4 }}
                    >
                      {/* Ears */}
                      <div className="absolute -top-2 -left-1 w-8 h-8 bg-stone-900 rounded-full" />
                      <div className="absolute -top-2 -right-1 w-8 h-8 bg-stone-900 rounded-full" />
                      
                      {/* Eyes */}
                      <div className="absolute top-6 left-4 w-6 h-8 bg-stone-900 rounded-full rotate-[15deg] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full mb-2" />
                      </div>
                      <div className="absolute top-6 right-4 w-6 h-8 bg-stone-900 rounded-full -rotate-[15deg] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full mb-2" />
                      </div>
                      
                      {/* Nose */}
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-3 h-2 bg-stone-900 rounded-full" />
                    </motion.div>

                    {/* Frying Pan */}
                    <motion.div 
                      className="absolute -bottom-4 -right-8 w-16 h-6 bg-stone-800 rounded-full border-4 border-stone-900 z-10"
                      animate={isRefreshing ? {
                        rotate: [0, -15, 0],
                        y: [0, -10, 0]
                      } : {}}
                      transition={{ repeat: Infinity, duration: 0.3 }}
                    >
                      {/* Handle */}
                      <div className="absolute top-1/2 -right-8 w-8 h-2 bg-stone-900 rounded-full -translate-y-1/2" />
                      {/* Food in pan */}
                      {isRefreshing && (
                        <div className="absolute -top-4 left-4 right-4 flex gap-1">
                          {[1,2,3].map(i => (
                            <motion.div 
                              key={i}
                              animate={{ y: [0, -20, 0], x: [0, (i-2)*5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.1 }}
                              className="w-2 h-2 bg-orange-400 rounded-full"
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>

                    {/* Spatula */}
                    <motion.div 
                      className="absolute -bottom-4 -left-4 w-2 h-12 bg-stone-400 border-2 border-stone-900 rounded-full z-10 origin-bottom"
                      animate={isRefreshing ? {
                        rotate: [0, 30, 0],
                        x: [0, 5, 0]
                      } : {}}
                      transition={{ repeat: Infinity, duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        ref={containerRef}
        animate={{ 
          y: (isRefreshing || showSuccess) ? 140 : Math.max(0, pullY),
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className={`relative z-10 bg-[#F8F9FB] min-h-screen ${pullY > 0 ? 'select-none cursor-grabbing' : ''}`}
      >
        {/* Top Header */}
        <header className="px-6 pt-8 pb-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight leading-none">RM Segar</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.15em] leading-tight mt-1">
                Chinese Food Khas<br />Kalimantan Barat
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleTabChange('profile')}
            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-stone-100 flex items-center justify-center text-orange-500 transition-transform active:scale-95"
          >
            <MainLogo size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 items-center" id="tour-search-bar">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={20} className="text-stone-400" />
            </div>
            <input 
              type="text" 
              placeholder="Cari menu favoritmu..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'search') setActiveTab('search');
              }}
              onFocus={() => setActiveTab('search')}
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-orange-500/20 transition-all text-stone-900 placeholder:text-stone-400"
            />
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-stone-900 active:scale-95 transition-transform"
          >
            <QrCode size={24} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {(activeTab === 'home' || (activeTab === 'cart' && prevActiveTab === 'home')) && renderHome('home-view')}
        {(activeTab === 'search' || (activeTab === 'cart' && prevActiveTab === 'search')) && renderSearch('search-view')}
        {(activeTab === 'heart' || (activeTab === 'cart' && prevActiveTab === 'heart')) && renderFavorites('favorites-view')}
        {(activeTab === 'profile' || (activeTab === 'cart' && prevActiveTab === 'profile')) && renderProfile('profile-view')}
      </AnimatePresence>

      </motion.div>

      {/* Bottom Navigation */}
      {!isChatOpen && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center z-[100] pointer-events-none">
          <div className="w-full max-w-5xl relative pointer-events-auto">
            <motion.nav 
              ref={navRef}
              onPan={handleNavPan}
              className="bg-white/60 backdrop-blur-xl border-t border-white/20 px-6 pt-3 pb-5 flex justify-between items-center rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative touch-none"
            >
              {[
                { id: 'home', icon: Home, label: 'Menu' },
                { id: 'search', icon: Search, label: 'Cari' },
                { id: 'cart', icon: ShoppingBag, label: 'Keranjang' },
                { id: 'heart', icon: Heart, label: 'Favorit' },
                { id: 'profile', icon: User, label: 'Profil' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'cart') {
                        // Already handled by checking current activeTab
                        if (activeTab !== 'cart') {
                          handleTabChange('cart');
                          if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
                          cartTimeoutRef.current = setTimeout(() => {
                            setIsCartOpen(true);
                            cartTimeoutRef.current = null;
                          }, 650);
                        } else if (!isCartOpen) {
                          // Handle case where it was closed but tab still active (should not happen normally)
                          setIsCartOpen(true);
                        }
                      } else {
                        handleTabChange(tab.id as any);
                      }
                    }}
                    className="relative flex-1 flex flex-col items-center justify-center outline-none transition-all duration-300 group h-12"
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-selection-aura"
                          className="absolute -top-10 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-[0_15px_30px_rgba(249,115,22,0.4)] z-20"
                          transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                        >
                          <Icon size={28} className="text-white" />
                          {tab.id === 'cart' && totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-stone-900 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                              {totalItems}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className={`relative z-10 flex flex-col items-center transition-all duration-300 ${isActive ? 'opacity-0 scale-50' : 'opacity-100 translate-y-0'}`}>
                      <Icon 
                        size={20} 
                        className={`mb-0.5 ${isActive ? 'text-orange-500' : 'text-stone-400 group-hover:text-stone-600'}`} 
                      />
                      <span className={`text-[9px] font-bold ${isActive ? 'text-orange-500' : 'text-stone-400'}`}>
                        {tab.label}
                      </span>
                      {tab.id === 'cart' && totalItems > 0 && !isActive && (
                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                          {totalItems}
                        </span>
                      )}
                    </div>

                    {/* Label removed as per request */}
                  </button>
                );
              })}
            </motion.nav>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCartOpen(false);
                setActiveTab(prevActiveTab);
              }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] pointer-events-auto"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsCartOpen(false);
                  setActiveTab(prevActiveTab);
                }
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl h-[90vh] bg-white rounded-t-[40px] shadow-2xl z-[200] flex flex-col"
            >
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mt-4 mb-6 flex-shrink-0" />
              
              <div className="px-8 flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Pesanan Anda</h2>
                <button 
                  onClick={() => {
                  setIsCartOpen(false);
                  setActiveTab(prevActiveTab);
                }}
                  className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 active:bg-stone-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto px-8 space-y-8 no-scrollbar pb-10">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6 text-stone-300">
                      <ShoppingBag size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 mb-2">Keranjang Kosong</h3>
                    <p className="text-stone-400">Pilih menu lezat kami untuk memulai pesanan.</p>
                  </div>
                ) : (
                  <>
                      <AnimatePresence initial={false}>
                        <div className="space-y-4">
                          {cart.map((item) => (
                            <motion.div 
                              key={`${item.id}-${item.option || 'none'}-${item.sweetness || 'none'}`}
                              layout
                              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                              exit={{ opacity: 0, height: 0, marginBottom: 0, x: -100 }}
                              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                              className="relative overflow-visible rounded-3xl group"
                            >
                              {/* Swipe Background (Delete Button) */}
                              <div className="absolute inset-y-0 right-0 w-[110px] bg-red-500 rounded-r-3xl flex items-center justify-center overflow-hidden">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearItemFromCart(item.id, item.option, item.sweetness);
                                  }}
                                  className="w-full h-full text-white flex flex-col items-center justify-center gap-1 active:bg-red-600 transition-colors"
                                >
                                  <Trash2 size={24} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Hapus</span>
                                </button>
                              </div>

                              {/* Item Content */}
                              <motion.div 
                                drag="x"
                                dragConstraints={{ left: -110, right: 0 }}
                                dragElastic={0.02}
                                dragSnapToOrigin={false}
                                className="relative bg-white flex gap-4 items-center p-4 cursor-grab active:cursor-grabbing border border-stone-100 rounded-[inherit] shadow-sm z-10"
                                whileTap={{ x: -5, cursor: 'grabbing' }}
                              >
                                <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                                  <MenuIcon item={item} size={24} />
                                </div>
                                
                                <div className="flex-grow min-w-0">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-stone-900 leading-tight truncate">{item.name}</h4>
                                    <button 
                                      onClick={() => clearItemFromCart(item.id, item.option, item.sweetness)}
                                      className="text-stone-300 hover:text-red-500 transition-colors p-1"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{item.category}</p>
                                    {item.option && (
                                      <span className="text-[10px] border border-orange-100 text-orange-500 px-1.5 rounded-md font-black uppercase tracking-tighter">
                                        {item.option}
                                      </span>
                                    )}
                                    {item.sweetness && (
                                      <span className="text-[10px] border border-blue-100 text-blue-500 px-1.5 rounded-md font-black uppercase tracking-tighter">
                                        {item.sweetness}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-3 bg-stone-50 p-1 rounded-xl border border-stone-100">
                                      <button 
                                        onClick={() => removeFromCart(item.id, item.option, item.sweetness)}
                                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-stone-400 active:bg-stone-100 border border-stone-100 shadow-sm"
                                      >
                                        <Minus size={14} />
                                      </button>
                                      <span className="font-black text-stone-900 text-sm w-4 text-center">{item.quantity}</span>
                                      <button 
                                        onClick={() => addToCart(item, item.option, item.sweetness)}
                                        className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white active:bg-orange-600 shadow-sm"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>

                                    <button 
                                      onClick={() => setNoteModalItem({ id: item.id, option: item.option, sweetness: item.sweetness, note: item.note || '' })}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                                        item.note ? 'text-orange-600 bg-orange-50' : 'text-stone-400 bg-stone-50 hover:bg-stone-100'
                                      }`}
                                    >
                                      <MessageSquare size={12} />
                                      {item.note ? 'Lihat Catatan' : 'Tambah Catatan'}
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>

                    <div className="space-y-4 px-2 border-t border-stone-100 pt-8">
                      <div className="flex justify-between items-center text-stone-500">
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Rincian Pesanan</span>
                        <span className="font-black text-stone-900">{totalItems} Menu</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Metode Makan</p>
                      <div className="grid grid-cols-2 gap-3 p-1.5 bg-stone-50 rounded-[24px]">
                        <button 
                          onClick={() => setOrderType('Makan di Tempat')}
                          className={`py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
                            orderType === 'Makan di Tempat' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400'
                          }`}
                        >
                          Dine In
                        </button>
                        <button 
                          onClick={() => setOrderType('Bungkus')}
                          className={`py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
                            orderType === 'Bungkus' ? 'bg-orange-500 text-white shadow-lg' : 'text-stone-400'
                          }`}
                        >
                          Bungkus
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Metode Pembayaran</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setPaymentMethod('Tunai')}
                          className={`py-4 px-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                            paymentMethod === 'Tunai' ? 'bg-stone-900 border-stone-900 text-white shadow-xl shadow-stone-100' : 'bg-white border-stone-100 text-stone-400'
                          }`}
                        >
                          <Banknote size={24} />
                          Tunai
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('Transfer')}
                          className={`py-4 px-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                            paymentMethod === 'Transfer' ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-100' : 'bg-white border-stone-100 text-stone-400'
                          }`}
                        >
                          <CreditCard size={24} />
                          Transfer
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Catatan Tambahan</p>
                      <div className="bg-stone-50 p-6 rounded-[32px] border border-stone-100 flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-stone-400 shadow-sm flex-shrink-0">
                          <MessageSquare size={20} />
                        </div>
                        <textarea 
                          placeholder="Contoh: Meja di depan, rayain ultah, dll..."
                          value={orderNote}
                          onChange={(e) => setOrderNote(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-sm text-stone-900 placeholder:text-stone-300 focus:ring-0 min-h-[80px] resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 space-y-4">
                      <button 
                        onClick={sendToWhatsApp}
                        className="group w-full bg-[#25D366] text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-green-100 active:scale-[0.97] hover:scale-[1.02] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <MessageCircle size={20} fill="currentColor" className="text-white/40" />
                          <span>Checkout via WhatsApp</span>
                        </div>
                      </button>

                      <div className="relative flex items-center justify-center py-2 opacity-50">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-stone-100/50"></div>
                        </div>
                        <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em] text-stone-300 bg-transparent px-4 mx-auto w-fit">
                          Atau
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setIsCartOpen(false);
                          setActiveTab(prevActiveTab);
                          setIsScheduling(true);
                        }}
                        className="w-full bg-stone-50 text-stone-900 py-4 rounded-[24px] font-bold text-xs flex items-center justify-center gap-3 border border-stone-100 active:bg-stone-100 transition-all font-sans"
                      >
                        <Calendar size={18} className="text-orange-500" />
                        Jadwalkan untuk Nanti
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* AI Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsChatOpen(false);
                }
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl h-[92vh] bg-[#FDFEFE] rounded-t-[48px] shadow-2xl z-[80] flex flex-col overflow-hidden"
            >
              {/* Minimal Header */}
              <div className="flex-shrink-0 px-8 py-6 flex items-center justify-between bg-white border-b border-stone-50 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="group relative">
                    <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center text-white overflow-hidden shadow-lg border-2 border-white ring-1 ring-stone-100 transition-transform group-hover:scale-105">
                      <div className="w-full h-full bg-white rounded-full flex flex-col items-center justify-center p-1">
                         <div className="w-3 h-3 bg-stone-900 rounded-full" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900 tracking-tight">Master Panda</h2>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Culinary Butler</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setShowOrderHistory(true);
                      setActiveTab('profile');
                      setIsChatOpen(false);
                    }}
                    className="w-10 h-10 bg-stone-50 hover:bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 transition-colors shadow-sm"
                    title="Riwayat Pesanan"
                  >
                    <History size={20} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={clearChat}
                    className="w-10 h-10 bg-stone-50 hover:bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 transition-colors shadow-sm"
                    title="Hapus Percakapan"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => {
                      setIsChatOpen(false);
                      setPandaMood('idle');
                    }}
                    className="w-12 h-12 bg-stone-50 hover:bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 transition-colors shadow-sm"
                  >
                    <X size={24} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Chat Container */}
              <div ref={scrollRef} className="flex-grow overflow-y-auto px-8 pt-4 pb-32 space-y-6 no-scrollbar bg-white/50 backdrop-blur-sm relative">
                {chatMessages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-center px-10 pb-20 opacity-40">
                      <Bot size={48} className="text-stone-200 mb-6" />
                      <p className="text-sm font-medium text-stone-400">Sapa Master Panda untuk memulai obrolan kulinermu 🎋</p>
                   </div>
                )}

                {chatMessages.map((msg, idx) => {
                  const isAdminNotified = msg.text.includes('[NOTIFIKASI_ADMIN: AKTIF]');
                  let workingText = msg.text.replace('[NOTIFIKASI_ADMIN: AKTIF]', '');
                  
                  // Extract options if [OPSI: A|B] exists
                  const optionsMatch = workingText.match(/\[OPSI:\s*(.*?)\]/);
                  const options = optionsMatch ? optionsMatch[1].split('|').map(o => o.trim()) : [];
                  let textWithWa = workingText.replace(/\[OPSI:\s*.*?\]/, '').trim();
                  
                  // Extract WA_LINK if exists
                  const waMatch = textWithWa.match(/\[WA_LINK:\s*(.*?)\|(.*?)\]/);
                  const waLink = waMatch ? { url: waMatch[1], label: waMatch[2] } : null;
                  let intermediateText = textWithWa.replace(/\[WA_LINK:\s*.*?\]/, '').trim();

                  // Extract QR_CODE if exists
                  const qrMatch = intermediateText.match(/\[QR_CODE:\s*(.*?)\]/);
                  let qrData = null;
                  try {
                    if (qrMatch) qrData = JSON.parse(qrMatch[1]);
                  } catch (e) {
                    // Silently fail if not valid JSON
                  }
                  const cleanText = intermediateText.replace(/\[QR_CODE:\s*.*?\]/, '').trim();
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[88%] px-6 py-4 rounded-[28px] text-[15px] leading-[1.6] shadow-sm tracking-tight ${
                        msg.role === 'user' 
                          ? 'bg-stone-900 text-white rounded-tr-none' 
                          : 'bg-white text-stone-700 rounded-tl-none border border-stone-50'
                      }`}>
                        {cleanText.split(/(\[MENU_ITEM:.*?\])/g).map((part, pIdx) => {
                          const menuMatch = part.match(/\[MENU_ITEM:\s*(.*?)\|(.*?)\]/);
                          if (menuMatch) {
                            const [_, mId, mName] = menuMatch;
                            return (
                              <div key={pIdx} className="my-3 p-4 bg-stone-50/80 border border-stone-100 rounded-2xl flex items-center gap-4 group">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                                  <Utensils size={18} />
                                </div>
                                <div className="flex-grow">
                                  <p className="text-sm font-black text-stone-900 leading-none">{mName}</p>
                                  <p className="text-[10px] text-stone-400 mt-1 uppercase font-bold tracking-wider">Ketuk untuk pesan</p>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleSendMessage(undefined, `Saya mau pesan ${mName}`)}
                                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-orange-500 transition-colors shadow-lg shadow-stone-900/10 active:scale-95"
                                  >
                                    Pesan
                                  </button>
                                  <button 
                                    onClick={() => handleSendMessage(undefined, `Beri catatan untuk ${mName}`)}
                                    className="p-2 bg-white border border-stone-200 text-stone-500 rounded-xl hover:text-stone-900 hover:border-stone-900 transition-all active:scale-95"
                                    title="Tambah Catatan"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          return part;
                        })}

                        {qrData && (
                          <div className="mt-4 p-5 bg-white rounded-2xl border border-stone-100 flex flex-col items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-900 mb-1">
                              <QrCode size={20} />
                            </div>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">QR Kode Pesanan</p>
                            <div className="p-2 bg-white border border-stone-50 rounded-xl">
                              <QRCodeSVG 
                                value={JSON.stringify({ ...qrData, type: 'rm_segar_order' })} 
                                size={140} 
                              />
                            </div>
                            <button 
                              onClick={() => {
                                if (qrData.items) {
                                  const newItems = qrData.items.map((i: any) => {
                                    const menu = MENU_ITEMS.find(m => m.id === i.id);
                                    if (menu) return { ...menu, quantity: i.q, option: i.o };
                                    return null;
                                  }).filter(Boolean);
                                  setCart(newItems as any);
                                  setIsCartOpen(true);
                                  setIsChatOpen(false);
                                }
                              }}
                              className="w-full py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest mt-2 active:scale-95 transition-transform"
                            >
                              Reorder Pesanan Ini
                            </button>
                          </div>
                        )}

                        {waLink && (
                          <div className="mt-4 pt-4 border-t border-stone-100">
                            <a 
                              href={waLink.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => {
                                // Explicit scroll to top animation
                                setTimeout(() => {
                                  scrollToTop();
                                  // Also scroll main container to top
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                  containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                }, 500);
                              }}
                              className="w-full flex items-center justify-center gap-3 py-5 bg-[#25D366] text-white rounded-2xl text-sm font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-xl shadow-green-500/10 active:scale-95"
                            >
                              <MessageCircle size={20} fill="currentColor" className="text-white/20" />
                              {waLink.label}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Render Options if any */}
                      {options.length > 0 && msg.role === 'model' && user && (
                        <div className="mt-3 flex flex-wrap gap-2 max-w-[90%]">
                          {options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => handleSendMessage(undefined, opt)}
                              className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-xs font-black text-stone-600 shadow-sm active:scale-95 transition-all hover:bg-stone-900 hover:text-white"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Connect AI Button for errors */}
                      {msg.role === 'model' && (msg.text.includes("Kunci API") || msg.text.includes("Settings -> Secrets") || msg.text.includes("Hubungkan AI")) && (
                        <div className="mt-4 p-4 bg-stone-900 rounded-2xl shadow-xl space-y-3">
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] text-center">
                            Akses AI Terputus 🎋
                          </p>
                          <button 
                            onClick={handleOpenSelectKey}
                            className="w-full py-3 bg-orange-500 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            HUBUNGKAN MASTER PANDA
                          </button>
                          <p className="text-[9px] text-stone-500 text-center italic">
                            *Hanya perlu satu klik jika Kakak sudah punya key
                          </p>
                        </div>
                      )}

                      {isAdminNotified && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-2 flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-xl border border-green-200 shadow-sm"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Terkirim ke Admin</span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
                
                {isAIThinking && (chatMessages[chatMessages.length - 1]?.role === 'user' || !chatMessages[chatMessages.length - 1]?.text) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white px-6 py-4 rounded-3xl rounded-tl-none border border-stone-50 shadow-sm flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-orange-400 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-orange-400 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-orange-400 rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Floating Premium Input Box */}
              <div className="absolute inset-x-0 bottom-0 p-6 pt-2 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
                <div className="max-w-xl mx-auto pointer-events-auto">
                    <form onSubmit={handleSendMessage} className="relative flex items-center group">
                        <div className="absolute left-5 text-stone-300 group-focus-within:text-orange-500 transition-colors">
                            <Utensils size={20} />
                        </div>
                        <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Tanya apapun ke Master Panda..."
                        className="w-full bg-white border border-stone-100 rounded-[32px] py-6 pl-14 pr-20 text-[15px] text-stone-900 placeholder:text-stone-300 shadow-xl focus:ring-4 focus:ring-stone-100/50 transition-all outline-none"
                        />
                        <button 
                        type="submit"
                        disabled={!chatInput.trim() || isAIThinking}
                        className="absolute right-3 w-14 h-14 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-xl disabled:opacity-30 transition-all active:scale-90 hover:bg-orange-500"
                        >
                        <ArrowRight size={24} strokeWidth={2.5} />
                        </button>
                    </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Scheduling Modal */}
      {renderSchedulingModal()}

      {/* Note Modal */}
      <AnimatePresence>
        {noteModalItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteModalItem(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[32px] shadow-2xl z-[200] overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-stone-900">Catatan Pesanan</h3>
                  <p className="text-stone-500 text-sm">Tambahkan permintaan khusus untuk menu ini</p>
                </div>

                <div className="space-y-2">
                  <textarea 
                    autoFocus
                    value={noteModalItem.note}
                    onChange={(e) => setNoteModalItem({ ...noteModalItem, note: e.target.value })}
                    placeholder="Contoh: Tidak pakai sayur, pedas sedang, dll..."
                    className="w-full bg-stone-50 border-none rounded-2xl p-4 text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 transition-all min-h-[120px] resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setNoteModalItem(null)}
                    className="flex-1 py-4 bg-stone-100 text-stone-900 rounded-2xl font-bold text-sm"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => updateNote(noteModalItem.id, noteModalItem.option, noteModalItem.sweetness, noteModalItem.note)}
                    className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-100"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Waiting Game Modal */}
      {renderGame()}

      {/* Option Selection Modal */}
      <AnimatePresence>
        {optionModalItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOptionModalItem(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[32px] shadow-2xl z-[210] overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-stone-900">Pilih Opsi</h3>
                  <p className="text-stone-500 text-sm">Silakan pilih penyajian untuk {optionModalItem.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setSelectedOption('Es')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${
                      selectedOption === 'Es' 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-stone-100 bg-stone-50 text-stone-400'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      selectedOption === 'Es' ? 'bg-blue-500 text-white' : 'bg-stone-200 text-stone-400'
                    }`}>
                      <Star size={24} />
                    </div>
                    <span className="font-bold">Es</span>
                  </button>
                  <button 
                    onClick={() => setSelectedOption('Panas')}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${
                      selectedOption === 'Panas' 
                        ? 'border-red-500 bg-red-50 text-red-600' 
                        : 'border-stone-100 bg-stone-50 text-stone-400'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      selectedOption === 'Panas' ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-400'
                    }`}>
                      <Coffee size={24} />
                    </div>
                    <span className="font-bold">Panas</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-center text-xs font-bold text-stone-400 uppercase tracking-widest">Tingkat Kemanisan</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Manis', 'Tawar', 'Sedikit Gula'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSweetness(s as any)}
                        className={`py-3 rounded-2xl text-xs font-bold border-2 transition-all ${
                          selectedSweetness === s
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-stone-100 bg-stone-50 text-stone-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => addToCart(optionModalItem, selectedOption, selectedSweetness)}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-100"
                >
                  Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {activeTour && renderOnboarding()}
      </AnimatePresence>
        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTutorial(false)}
                className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[300]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.8 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100 || info.velocity.y > 500) {
                    setShowTutorial(false);
                  }
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl h-[85vh] bg-white rounded-t-[40px] shadow-2xl z-[300] flex flex-col overflow-hidden"
              >
                <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mt-4 mb-6 flex-shrink-0" />
                
                <div className="px-8 pb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight">Panduan Fitur</h2>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">Sederhana, Cepat, Lezat</p>
                  </div>
                  <button 
                    onClick={() => setShowTutorial(false)}
                    className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 active:bg-stone-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto px-8 pb-10 space-y-6 no-scrollbar">
                  {[
                    { icon: <MessageCircle />, color: 'bg-yellow-50 text-yellow-600', title: "Chat Master Panda 🐼", desc: "Ngobrol dengan AI untuk cari menu, reservasi meja, atau pesan via suara & teks secara instan." },
                    { icon: <ShoppingBag />, color: 'bg-orange-50 text-orange-500', title: "Cara Pesan Menu", desc: "Pilih hidangan favoritmu, lalu tekan tombol '+' untuk memasukkannya ke keranjang belanja." },
                    { icon: <MessageSquare />, color: 'bg-blue-50 text-blue-500', title: "Kustomisasi & Note", desc: "Butuh tanpa micin atau ekstra sambal? Klik ikon balon chat di setiap item dalam keranjangmu." },
                    { icon: <RefreshCw />, color: 'bg-purple-50 text-purple-500', title: "Es atau Panas?", desc: "Khusus minuman, kamu bisa menukar pilihan 'Es' atau 'Panas' fleksibel langsung di keranjang." },
                    { icon: <Calendar />, color: 'bg-green-50 text-green-500', title: "Reservasi & Jadwal", desc: "Gunakan fitur 'Jadwalkan' untuk booking meja atau memesan makanan untuk waktu yang akan datang." },
                    { icon: <Trash2 />, color: 'bg-red-50 text-red-500', title: "Swipe untuk Hapus", desc: "Salah pilih? Geser (Swipe) menu ke kiri di dalam keranjang, lalu tekan ikon tong sampah Merah." },
                    { icon: <Send />, color: 'bg-[#25D366]/10 text-[#25D366]', title: "Checkout WhatsApp", desc: "Pesananmu akan dikirim langsung ke WhatsApp Admin agar segera diproses & dikirim." },
                    { icon: <QrCode />, color: 'bg-stone-100 text-stone-900', title: "Scan QR Meja", desc: "Pindai kode QR digital di meja untuk akses cepat ke menu tanpa perlu mengunduh aplikasi." },
                    { icon: <Gamepad2 />, color: 'bg-indigo-50 text-indigo-500', title: "Game Selagi Menunggu", desc: "Bosan menunggu? Mainkan game 'Panda Noodle' di tab profil untuk skor tertinggi!" },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex gap-5 group items-start">
                      <div className={`w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:rotate-12`}>
                        {feature.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-stone-900 leading-none">{feature.title}</h4>
                        <p className="text-sm text-stone-500 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  ))}

                  <div className="bg-stone-900 p-8 rounded-[32px] text-white mt-8 space-y-4 shadow-xl shadow-stone-200">
                    <h4 className="text-lg font-black tracking-tight">Butuh bantuan lebih?</h4>
                    <p className="text-stone-400 text-sm leading-relaxed">Pahami fitur RM Segar dalam hitungan detik dengan panduan interaktif kami.</p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          setShowTutorial(false);
                          setCompletedTours({});
                          localStorage.removeItem('rm_segar_completed_tours');
                          handleTabChange('home');
                          setActiveTour('home');
                          setTourStep(0);
                        }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <Sparkles size={20} />
                        Mulai Panduan Interaktif
                      </button>
                      <button 
                        onClick={() => setShowTutorial(false)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl active:scale-95 transition-all"
                      >
                        Saya Mengerti
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
          {showScanner && (
            <QRScanner 
              onScanSuccess={handleScanSuccess}
              onClose={() => setShowScanner(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: 'noodle' | 'bomb';
  speed: number;
}

const PandaNoodleGame = ({ 
  isGameOpen, 
  setIsGameOpen, 
  onGameOver 
}: { 
  isGameOpen: boolean;
  setIsGameOpen: (open: boolean) => void;
  onGameOver: (score: number) => void 
}) => {
  const [score, setScore] = useState(0);
  const [pandaX, setPandaX] = useState(50);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [lives, setLives] = useState(3);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const objectsRef = useRef<GameObject[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const pandaXRef = useRef(50);

  const prevPandaXRef = useRef(50);
  const [tilt, setTilt] = useState(0);
  const [isHit, setIsHit] = useState(false);
  const [feedback, setFeedback] = useState<{ x: number, text: string } | null>(null);

  const [isCatching, setIsCatching] = useState(false);

  const startGame = () => {
    scoreRef.current = 0;
    livesRef.current = 3;
    objectsRef.current = [];
    lastSpawnRef.current = performance.now();
    setScore(0);
    setLives(3);
    setObjects([]);
    setGameState('playing');
    setIsHit(false);
    setIsCatching(false);
  };

  const animate = useCallback((time: number) => {
    if (gameState !== 'playing') return;

    const spawnRate = Math.max(300, 1000 - (scoreRef.current * 8));
    if (time - lastSpawnRef.current > spawnRate) {
      const newObj: GameObject = {
        id: Math.random(),
        x: Math.random() * 80 + 10,
        y: -10,
        type: Math.random() > 0.15 ? 'noodle' : 'bomb',
        speed: 0.6 + Math.random() * 0.3 + (scoreRef.current / 120)
      };
      // Add a hidden property to track movement delta for better collision
      (newObj as any).prevY = -10;
      objectsRef.current.push(newObj);
      lastSpawnRef.current = time;
    }

    const updatedObjects: GameObject[] = [];
    let livesChanged = false;
    let scoreChanged = false;
    let currentlyCatching = false;

    // Pixel-aware hitbox width
    const containerWidth = gameRef.current?.getBoundingClientRect().width || 400;
    const pandaWidthPercent = (110 / containerWidth) * 100; // Visual width is roughly 96-110px

    for (const obj of objectsRef.current) {
      const oldY = obj.y;
      obj.y += obj.speed * 1.4; 

      const horizontalDist = Math.abs(obj.x - pandaXRef.current);
      const isNoodle = obj.type === 'noodle';
      const hitLimit = isNoodle ? (pandaWidthPercent / 2) + 4 : (pandaWidthPercent / 2) - 3;
      
      // Robust Collision: Check if object is in range OR if it crossed the catch line this frame
      const catchLine = 88;
      const hitRange = obj.y >= 80 && obj.y <= 95;
      const crossedLine = oldY < catchLine && obj.y >= catchLine;
      
      const hitPanda = (hitRange || crossedLine) && horizontalDist < hitLimit;

      if (hitPanda) {
        if (isNoodle) {
          scoreRef.current += 1;
          scoreChanged = true;
          setFeedback({ x: obj.x, text: '+1' });
          currentlyCatching = true;
        } else {
          livesRef.current -= 1;
          livesChanged = true;
          setIsHit(true);
          setFeedback({ x: obj.x, text: '💣' });
          setTimeout(() => setIsHit(false), 200);
        }
        continue;
      }

      if (obj.y > 110) {
        if (isNoodle) {
          livesRef.current -= 1;
          livesChanged = true;
          setIsHit(true);
          setFeedback({ x: obj.x, text: 'MISS' });
          setTimeout(() => setIsHit(false), 200);
        }
        continue;
      }

      updatedObjects.push(obj);
    }

    if (currentlyCatching) {
      setIsCatching(true);
      setTimeout(() => setIsCatching(false), 150);
    }

    objectsRef.current = updatedObjects;
    setObjects([...updatedObjects]);

    if (scoreChanged) setScore(scoreRef.current);
    if (livesChanged) {
      setLives(livesRef.current);
      if (livesRef.current <= 0) {
        setGameState('over');
        onGameOver(scoreRef.current);
        return;
      }
    }

    const velocity = pandaXRef.current - prevPandaXRef.current;
    setTilt(velocity * 1.8);
    prevPandaXRef.current = pandaXRef.current;

    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, onGameOver]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 800);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, animate]);

  const handleMove = useCallback((clientX: number) => {
    if (gameState !== 'playing' || !gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(10, Math.min(90, x));
    pandaXRef.current = clampedX;
    setPandaX(clampedX);
  }, [gameState]);

  useEffect(() => {
    const container = gameRef.current;
    if (!container) return;

    const handleTouch = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      if (e.cancelable) e.preventDefault();
      if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX);
    };

    container.addEventListener('touchmove', handleTouch, { passive: false });
    container.addEventListener('touchstart', handleTouch, { passive: false });

    return () => {
      container.removeEventListener('touchmove', handleTouch);
      container.removeEventListener('touchstart', handleTouch);
    };
  }, [gameState, handleMove]);

  return (
    <div 
      ref={gameRef}
      className={`w-full h-full relative cursor-none select-none bg-stone-50 overflow-hidden touch-none transition-colors duration-150 ${isHit ? 'bg-red-50/50 animate-shake' : ''}`}
      onMouseMove={(e) => handleMove(e.clientX)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }} 
      />

      {gameState === 'idle' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-white/40 backdrop-blur-md">
          <div className="w-24 h-24 bg-orange-500 rounded-[32px] flex items-center justify-center text-white mb-6 shadow-xl">
             <Bot size={48} />
          </div>
          <h3 className="text-2xl font-black text-stone-900 mb-2 tracking-tighter leading-none text-center uppercase">SIAP<br />MENYANTAP?</h3>
          <p className="text-stone-500 text-xs px-12 mb-8 font-medium">Tangkap mie 🍜 sebanyak mungkin.<br/>Hindari BOMB 💣 dan jangan biarkan mie jatuh!</p>
          <button 
            onClick={startGame}
            className="mb-4 px-10 py-4 bg-stone-900 text-white rounded-3xl font-black shadow-lg active:scale-95 transition-all"
          >
            MULAI BERMAIN
          </button>
          <button 
            onClick={() => setIsGameOpen(false)}
            className="text-stone-400 text-[10px] font-black uppercase tracking-widest hover:text-stone-600 transition-colors"
          >
            Kembali ke Profil
          </button>
        </div>
      )}

      {gameState === 'over' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-white/60 backdrop-blur-lg">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Game Over</p>
          <h3 className="text-4xl font-black text-stone-900 mb-6">SKOR: {score}</h3>
          <div className="flex flex-col gap-3 w-full items-center">
            <button 
              onClick={startGame}
              className="w-full max-w-[200px] py-4 bg-orange-500 text-white rounded-3xl font-black shadow-lg shadow-orange-100 active:scale-95 transition-all"
            >
              MAINKAN LAGI
            </button>
            <button 
              onClick={() => setIsGameOpen(false)}
              className="w-full max-w-[200px] py-4 bg-stone-900 text-white rounded-3xl font-black shadow-lg active:scale-95 transition-all"
            >
              TUTUP GAME
            </button>
          </div>
          <p className="text-xs text-stone-400 font-bold mt-8">Hebat! Sembari nunggu, panda kita satu ini makin kenyang.</p>
        </div>
      )}

      {/* Game UI */}
      {gameState === 'playing' && (
        <>
          <div className="absolute top-6 left-6 z-10">
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none">Score</p>
            <p className="text-3xl font-black text-stone-900 leading-none mt-1">{score}</p>
          </div>
          <div className="absolute top-6 right-6 z-10 flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                size={20} 
                className={i < lives ? "text-red-500 fill-current" : "text-stone-200"} 
              />
            ))}
          </div>
        </>
      )}

      {/* Falling Objects */}
      {objects.map(obj => (
        <div
          key={obj.id}
          className="absolute text-5xl pointer-events-none transition-none"
          style={{ 
            left: `${obj.x}%`, 
            top: `${obj.y}%`, 
            transform: 'translate(-50%, -50%)',
            willChange: 'top' 
          }}
        >
          {obj.type === 'noodle' ? '🍜' : '💣'}
        </div>
      ))}

      {/* Feedback Text */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={Date.now()}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -100 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-40 text-2xl font-black pointer-events-none z-30"
            style={{ 
              left: `${feedback.x}%`,
              color: feedback.text === '+1' ? '#f97316' : '#ef4444',
              transform: 'translateX(-50%)' 
            }}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panda Character */}
      <div 
        className="absolute bottom-10 -translate-x-1/2 pointer-events-none transition-none"
        style={{ 
          left: `${pandaX}%`,
          transform: `translateX(-50%) rotate(${tilt}deg)`,
          willChange: 'left, transform'
        }}
      >
        <div className={`relative w-24 h-18 bg-white border-[5px] border-stone-800 rounded-[36px] shadow-2xl transition-transform duration-75 ${isCatching ? 'scale-110' : 'scale-100'}`}>
          {/* Ears */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-stone-900 rounded-full" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-stone-900 rounded-full" />
          {/* Eyes */}
          <div className="absolute top-4 left-5 w-5 h-7 bg-stone-900 rounded-[40%] flex items-center justify-center">
            <div className={`w-2 h-2 bg-white rounded-full mb-3 transition-all ${isCatching ? 'scale-125 translate-y-1' : ''}`} />
          </div>
          <div className="absolute top-4 right-5 w-5 h-7 bg-stone-900 rounded-[40%] flex items-center justify-center">
            <div className={`w-2 h-2 bg-white rounded-full mb-3 transition-all ${isCatching ? 'scale-125 translate-y-1' : ''}`} />
          </div>
          {/* Nose */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-stone-900 rounded-full" />
          {/* Mouth Area */}
          <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full transition-all duration-100 ${isCatching ? 'w-10 h-6 bg-stone-900' : 'w-10 h-1 bg-stone-100 opacity-50'}`} />
        </div>
      </div>
    </div>
  );
};
