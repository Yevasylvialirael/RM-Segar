import React, { useState, useMemo, useEffect } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { MENU_ITEMS, MenuItem } from './constants';

interface CartItem extends MenuItem {
  quantity: number;
  option?: 'Es' | 'Panas';
  note?: string;
}

interface Order {
  id: string;
  date: string;
  items: CartItem[];
  totalItems: number;
  orderType: 'Makan di Tempat' | 'Bungkus';
}

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

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [user, setUser] = useState<{ phone: string } | null>(null);
  const [loginPhone, setLoginPhone] = useState('62');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'login' | 'forgot' | 'verify'>('login');
  const [resetToken, setResetToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [optionModalItem, setOptionModalItem] = useState<MenuItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<'Es' | 'Panas'>('Es');
  const [noteModalItem, setNoteModalItem] = useState<{ id: string, option?: 'Es' | 'Panas', note: string } | null>(null);
  const [orderType, setOrderType] = useState<'Makan di Tempat' | 'Bungkus'>('Makan di Tempat');
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
  const [apiKeySelected, setApiKeySelected] = useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const touchStartRef = React.useRef(0);
  const mouseStartRef = React.useRef<number>(-1);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setApiKeySelected(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setApiKeySelected(true);
      } catch (err) {
        console.error("Error opening key selector:", err);
      }
    }
  };

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
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsAIThinking(true);

    try {
      const menuList = MENU_ITEMS.map(item => `- ${item.name} (${item.category}): ${item.description}`).join('\n');
      
      const apiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY;

      if (!apiKey && (window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        if (!selected) {
          await handleOpenSelectKey();
          // After opening, we proceed as the key should be injected
        }
      }

      // Create a fresh AI instance to ensure we have the latest environment variables
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (process.env as any).API_KEY });

      // Filter history: 
      // 1. Skip the initial model greeting (Gemini history must start with user)
      // 2. Skip any previous error messages to avoid polluting the context
      const history = chatMessages
        .filter((msg, index) => {
          if (index === 0 && msg.role === 'model') return false;
          if (msg.text.includes("Ups, koki AI kami sedang sibuk")) return false;
          return true;
        })
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      const systemInstruction = `Anda adalah asisten kuliner RM Segar, sebuah restoran Chinese Food khas Kalimantan Barat. 
      Tugas Anda adalah membantu pelanggan memilih menu yang tepat berdasarkan keinginan mereka.
      
      Berikut adalah daftar menu kami:
      ${menuList}
      
      Aturan:
      1. Selalu bersikap ramah, sopan, dan menggunakan bahasa Indonesia yang santai.
      2. Jika pelanggan bingung, tanyakan preferensi mereka (misal: suka pedas? ingin nasi atau mie? ingin minuman segar?).
      3. Berikan rekomendasi yang spesifik dari daftar menu di atas.
      4. Jelaskan mengapa menu tersebut cocok untuk mereka.
      5. Jangan merekomendasikan menu yang tidak ada di daftar.
      6. Ingatkan pelanggan bahwa menu kami mengandung bahan yang tidak halal jika mereka bertanya tentang kehalalan.`;

      const chat = genAI.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: systemInstruction,
        },
        history: history
      });

      const responseStream = await chat.sendMessageStream({
        message: message
      });
      
      let fullText = "";
      setChatMessages(prev => [...prev, { role: 'model', text: "" }]);
      
      for await (const chunk of responseStream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setChatMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = { 
                ...newMessages[newMessages.length - 1], 
                text: fullText 
              };
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Ups, koki AI kami sedang sibuk menyiapkan pesanan. Coba lagi nanti ya!" }]);
    } finally {
      setIsAIThinking(false);
    }
  };

  const startAIChat = () => {
    setIsChatOpen(true);
    if (chatMessages.length === 0) {
      setChatMessages([{ 
        role: 'model', 
        text: "Halo! Saya Koki AI RM Segar. Bingung mau makan apa hari ini? Beritahu saya apa yang Anda suka, dan saya akan carikan menu yang paling pas buat Anda! 🐼🍜" 
      }]);
    }
  };

  // Load cart, favorites, user and orders from localStorage on mount
  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    const savedCart = localStorage.getItem('rm_segar_cart');
    const savedFavs = localStorage.getItem('rm_segar_favs');
    const savedUser = localStorage.getItem('rm_segar_user');
    const savedOrders = localStorage.getItem('rm_segar_orders');
    const savedHistory = localStorage.getItem('rm_segar_search_history');
    const savedTours = localStorage.getItem('rm_segar_completed_tours');
    
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    if (savedTours) setCompletedTours(JSON.parse(savedTours));
  }, [isLoading]);

  // Trigger tours on tab change or initial load
  useEffect(() => {
    if (isLoading) return;

    const triggerTour = (context: 'home' | 'search' | 'heart' | 'profile' | 'about') => {
      if (!completedTours[context]) {
        const timer = setTimeout(() => {
          setActiveTour(context);
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
      const step = onboardingSteps[activeTour][tourStep];
      if (!step || step.position === 'center') {
        setSpotlightRect({ x: window.innerWidth / 2, y: window.innerHeight / 2, width: 0, height: 0, rx: 0 });
        return;
      }

      const element = document.getElementById(step.elementId);
      if (element) {
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait for scroll to finish before measuring
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setSpotlightRect({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            rx: step.rx || 20
          });
        }, 300);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [activeTour, tourStep]);

  // Pull to refresh logic using native touch events to avoid blocking scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        touchStartRef.current = e.touches[0].clientY;
      } else {
        touchStartRef.current = -1;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartRef.current === -1 || window.scrollY > 0) return;

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
    localStorage.setItem('rm_segar_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('rm_segar_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    if (user) localStorage.setItem('rm_segar_user', JSON.stringify(user));
    else localStorage.removeItem('rm_segar_user');
  }, [user]);

  const categories = useMemo(() => {
    return [
      { name: 'Semua', icon: <Utensils size={20} /> },
      { name: 'Bakmie', icon: <Utensils size={20} /> },
      { name: 'Kwetiao', icon: <Utensils size={20} /> },
      { name: 'Capcai', icon: <Utensils size={20} /> },
      { name: 'Nasi', icon: <Utensils size={20} /> },
      { name: 'Minuman', icon: <Coffee size={20} /> },
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

  const addToCart = (item: MenuItem, option?: 'Es' | 'Panas') => {
    if (item.hasOptions && !option) {
      setOptionModalItem(item);
      setSelectedOption('Es');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.option === option);
      if (existing) {
        return prev.map(i => (i.id === item.id && i.option === option) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, option }];
    });
    setOptionModalItem(null);
  };

  const removeFromCart = (id: string, option?: 'Es' | 'Panas') => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id && i.option === option);
      if (existing && existing.quantity > 1) {
        return prev.map(i => (i.id === id && i.option === option) ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => !(i.id === id && i.option === option));
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const clearItemFromCart = (id: string, option?: 'Es' | 'Panas') => {
    setCart(prev => prev.filter(i => !(i.id === id && i.option === option)));
  };

  const handleLogin = () => {
    if (loginMode === 'login') {
      if (loginPhone.length >= 10 && loginPassword.length >= 4) {
        setUser({ phone: loginPhone });
        setLoginPhone('');
        setLoginPassword('');
      }
    } else if (loginMode === 'forgot') {
      if (loginPhone.length >= 10) {
        const token = Math.floor(1000 + Math.random() * 9000).toString();
        setResetToken(token);
        const message = `Halo! Token pemulihan kata sandi RM Segar Anda adalah: *${token}*`;
        window.open(`https://wa.me/${loginPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        setLoginMode('verify');
        alert(`Token simulasi dikirim ke WA: ${token}`);
      }
    } else if (loginMode === 'verify') {
      if (inputToken === resetToken) {
        setUser({ phone: loginPhone });
        setLoginMode('login');
        setLoginPhone('');
        setInputToken('');
        setResetToken('');
      } else {
        alert('Token tidak valid!');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginMode('login');
    setLoginPhone('62');
    setShowOrderHistory(false);
    setShowAbout(false);
    setActiveTab('home');
  };

  const handleTabChange = (tab: string) => {
    if (activeTab === 'search' && tab === 'home' && searchQuery.trim()) {
      setSearchHistory(prev => {
        const newHistory = [searchQuery.trim(), ...prev.filter(h => h !== searchQuery.trim())].slice(0, 5);
        return newHistory;
      });
      setSearchQuery('');
    }
    setActiveTab(tab);
    setShowOrderHistory(false);
    setShowAbout(false);
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
    const steps = onboardingSteps[activeTour];
    if (tourStep + 1 < steps.length) {
      setTourStep(tourStep + 1);
    } else {
      completeTour();
    }
  };

  const onboardingSteps: Record<string, any[]> = {
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

  const renderOnboarding = () => {
    if (!activeTour || !spotlightRect) return null;
    const steps = onboardingSteps[activeTour];
    const step = steps[tourStep];
    
    const isTop = spotlightRect.y > window.innerHeight / 2;

    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none">
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
            className="absolute border-4 border-orange-500 z-[101] pointer-events-none"
          >
            <motion.div 
              animate={{ opacity: [0, 0.5, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-orange-500/30 rounded-[inherit]"
            />
          </motion.div>
        )}

        <div className="absolute top-8 right-8 z-[105] pointer-events-auto">
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
            top: isTop ? spotlightRect.y - 20 : spotlightRect.y + spotlightRect.height + 20,
            y: isTop ? '-100%' : '0%',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute left-6 right-6 bg-white rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center z-[105] pointer-events-auto"
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

  const updateNote = (id: string, option: 'Es' | 'Panas' | undefined, note: string) => {
    setCart(prev => prev.map(item => 
      (item.id === id && item.option === option) ? { ...item, note } : item
    ));
    setNoteModalItem(null);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const sendToWhatsApp = () => {
    const phoneNumber = "+6281258394293";
    const orderDetails = cart.map(item => {
      let detail = `- ${item.name}${item.option ? ` (${item.option})` : ''} (${item.quantity}x)`;
      if (item.note) detail += `%0A  *Catatan: ${item.note}*`;
      return detail;
    }).join('%0A');
    const message = `Halo RM Segar,%0A%0ASaya ingin memesan (${orderType}):%0A${orderDetails}%0A%0ATerima kasih!`;
    
    // Save to history
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: new Date().toLocaleString('id-ID'),
      items: [...cart],
      totalItems: totalItems,
      orderType: orderType
    };
    setOrders(prev => [newOrder, ...prev]);
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setCart([]);
    setOrderType('Makan di Tempat');
    setIsCartOpen(false);
  };

  const renderHome = () => (
    <motion.div 
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
            
            <button 
              onClick={startAIChat}
              className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all"
            >
              <MessageSquare size={18} />
              Mulai Chat Rekomendasi
            </button>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full -ml-12 -mb-12 blur-2xl" />
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 overflow-x-auto no-scrollbar flex gap-4 md:gap-0 md:justify-between py-4" id="tour-categories">
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

  const renderSearch = () => (
    <motion.div 
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

  const renderFavorites = () => (
    <motion.div 
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

  const renderProfile = () => (
    <motion.div 
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
                            <p className="text-[10px] text-orange-500 italic">Catatan: {item.note}</p>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-stone-50 flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-400 uppercase">Total Item</span>
                    <span className="text-stone-900 font-bold">{order.totalItems} Menu</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-50 space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">Lokasi Kami</h3>
                  <p className="text-sm text-stone-500 leading-relaxed mb-4">
                    Terletak strategis di Sambas, Kalimantan Barat untuk melayani pecinta Chinese Food.
                  </p>
                  <div className="w-full h-48 rounded-2xl overflow-hidden border border-stone-100 shadow-inner">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src="https://maps.google.com/maps?q=Rumah%20Makan%20Segar%20Sambas%20Kalimantan%20Barat&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    />
                  </div>
                </div>
              </div>

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
            <div className="w-24 h-24 rounded-3xl bg-orange-500 shadow-xl shadow-orange-200 flex items-center justify-center text-white">
              <MainLogo size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-900">{user ? 'RM Segar' : 'Tamu'}</h2>
              <p className="text-stone-500 font-bold">{user ? user.phone : 'Belum Masuk'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <button 
              onClick={() => {
                setCompletedTours({});
                localStorage.removeItem('rm_segar_completed_tours');
                handleTabChange('home');
                setActiveTour('home');
                setTourStep(0);
              }}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-stone-50"
              id="tour-guide-button"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <span className="font-bold text-stone-700">Panduan Penggunaan</span>
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
        <div className="relative" id="tour-search-bar">
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
      </header>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'heart' && renderFavorites()}
        {activeTab === 'profile' && renderProfile()}
      </AnimatePresence>

      </motion.div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <nav className="w-full max-w-5xl bg-white border-t border-stone-100 px-8 py-4 flex justify-between items-center rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pointer-events-auto">
          <button 
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-orange-500' : 'text-stone-400'}`}
          >
            <Home size={24} />
            <span className="text-[10px] font-bold">Beranda</span>
          </button>
          <button 
            onClick={() => handleTabChange('search')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'search' ? 'text-orange-500' : 'text-stone-400'}`}
          >
            <Search size={24} />
            <span className="text-[10px] font-bold">Cari</span>
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative -top-8 w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-orange-200 border-4 border-white transition-transform active:scale-90"
          >
            <ShoppingBag size={28} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-stone-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {totalItems}
              </span>
            )}
          </button>
          <button 
            onClick={() => handleTabChange('heart')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'heart' ? 'text-orange-500' : 'text-stone-400'}`}
          >
            <Heart size={24} />
            <span className="text-[10px] font-bold">Favorit</span>
          </button>
          <button 
            onClick={() => handleTabChange('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-orange-500' : 'text-stone-400'}`}
          >
            <User size={24} />
            <span className="text-[10px] font-bold">Profil</span>
          </button>
        </nav>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl h-[85vh] bg-white rounded-t-[40px] shadow-2xl z-50 flex flex-col"
            >
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mt-4 mb-6" />
              
              <div className="px-8 flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-stone-900">Pesanan Anda</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto px-8 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-6 text-stone-300">
                      <ShoppingBag size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 mb-2">Keranjang Kosong</h3>
                    <p className="text-stone-400">Pilih menu lezat kami untuk memulai pesanan.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={`${item.id}-${item.option || 'none'}`} className="relative overflow-hidden rounded-3xl group">
                      {/* Swipe Background (Delete Button) */}
                      <button 
                        onClick={() => clearItemFromCart(item.id, item.option)}
                        className="absolute inset-0 bg-red-500 flex items-center justify-end px-8 text-white active:bg-red-600 transition-colors"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Trash2 size={24} />
                          <span className="text-[10px] font-bold uppercase">Hapus</span>
                        </div>
                      </button>

                      {/* Item Content */}
                      <motion.div 
                        drag="x"
                        dragConstraints={{ left: -100, right: 0 }}
                        dragElastic={0.1}
                        className="relative bg-white flex gap-4 items-center p-2 cursor-grab active:cursor-grabbing"
                      >
                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                          <MenuIcon item={item} size={28} />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-stone-900">{item.name}</h4>
                              <p className="text-xs text-stone-400 mb-2">{item.category}</p>
                            </div>
                            {item.option && (
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${
                                item.option === 'Es' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-orange-600 text-white'
                              }`}>
                                {item.option === 'Es' ? <Star size={10} fill="currentColor" /> : <Coffee size={10} />}
                                {item.option}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-stone-100 rounded-xl px-2 py-1">
                              <button 
                                onClick={() => removeFromCart(item.id, item.option)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-bold text-stone-900">{item.quantity}</span>
                              <button 
                                onClick={() => addToCart(item, item.option)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <button 
                              onClick={() => setNoteModalItem({ id: item.id, option: item.option, note: item.note || '' })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                                item.note 
                                  ? 'bg-orange-500 text-white shadow-sm' 
                                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                              }`}
                            >
                              <Settings size={12} />
                              {item.note ? 'Edit Catatan' : 'Tambah Catatan'}
                            </button>
                          </div>
                          {item.note && (
                            <div className="mt-2 p-2 bg-orange-50 rounded-xl border border-orange-100">
                              <p className="text-[10px] text-orange-600 font-medium italic">"{item.note}"</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-white border-t border-stone-100">
                  <div className="mb-6">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Pilihan Penyajian</p>
                    <div className="flex p-1 bg-stone-100 rounded-2xl">
                      <button 
                        onClick={() => setOrderType('Makan di Tempat')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                          orderType === 'Makan di Tempat' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'
                        }`}
                      >
                        Makan di Tempat
                      </button>
                      <button 
                        onClick={() => setOrderType('Bungkus')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                          orderType === 'Bungkus' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'
                        }`}
                      >
                        Bungkus
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-stone-500">
                      <span>Total Item</span>
                      <span className="font-bold text-stone-900">{totalItems} Menu</span>
                    </div>
                    <div className="h-px bg-stone-100 my-4" />
                    <div className="flex justify-between text-xl font-bold text-stone-900">
                      <span>Total Pesanan</span>
                      <span>{totalItems} Item</span>
                    </div>
                  </div>
                  <button 
                    onClick={sendToWhatsApp}
                    className="w-full py-5 bg-orange-500 text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200"
                  >
                    Konfirmasi Pesanan
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl h-[90vh] bg-[#F8F9FB] rounded-t-[40px] shadow-2xl z-[80] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-white px-8 pt-6 pb-4 flex items-center justify-between border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 leading-tight">Koki AI RM Segar</h2>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Online</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-orange-500 text-white rounded-tr-none' 
                        : 'bg-white text-stone-700 rounded-tl-none border border-stone-100'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                
                {isAIThinking && !chatMessages[chatMessages.length - 1]?.text && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-stone-100 shadow-sm flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                    </div>
                  </div>
                )}

                {/* Quick Suggestions - Moved inside scroll area to prevent cutting off */}
                {chatMessages.length === 1 && !isAIThinking && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {["Rekomendasi mie", "Menu nasi favorit", "Minuman segar", "Menu paling pedas"].map(suggestion => (
                      <button 
                        key={suggestion}
                        onClick={() => handleSendMessage(undefined, suggestion)}
                        className="px-4 py-2 bg-white border border-stone-100 rounded-full text-xs font-bold text-stone-600 shadow-sm active:scale-95 transition-all hover:border-orange-200 hover:bg-orange-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white p-6 pb-10 border-t border-stone-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                {(!process.env.GEMINI_API_KEY && !(process.env as any).API_KEY && !apiKeySelected && (window as any).aistudio) ? (
                  <div className="flex flex-col items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-xs text-orange-800 text-center font-medium">
                      Hubungkan API Key untuk mulai mengobrol dengan Koki AI di link publik ini.
                    </p>
                    <button 
                      onClick={handleOpenSelectKey}
                      className="px-6 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-orange-600 transition-all"
                    >
                      Hubungkan AI
                    </button>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-orange-400 underline"
                    >
                      Pelajari tentang Billing
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Tanya koki AI..."
                      className="flex-grow bg-stone-50 border-none rounded-2xl py-4 px-6 pr-14 text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || isAIThinking}
                      className="absolute right-2 w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 disabled:opacity-50 transition-all active:scale-90"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Note Modal */}
      <AnimatePresence>
        {noteModalItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteModalItem(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[32px] shadow-2xl z-[70] overflow-hidden"
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

                <div className="flex gap-3">
                  <button 
                    onClick={() => setNoteModalItem(null)}
                    className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-bold text-sm"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => updateNote(noteModalItem.id, noteModalItem.option, noteModalItem.note)}
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

      {/* Option Selection Modal */}
      <AnimatePresence>
        {optionModalItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOptionModalItem(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[32px] shadow-2xl z-[60] overflow-hidden"
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

                <button 
                  onClick={() => addToCart(optionModalItem, selectedOption)}
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
      </div>
    </div>
  );
}
