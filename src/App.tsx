import React, { useEffect, useRef, useState } from 'react';
import { 
  Truck, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Phone, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  Menu, 
  X,
  ArrowRight,
  CheckCircle2,
  HardHat,
  Hammer,
  PaintBucket,
  Wrench,
  ClipboardList,
  Plus,
  Trash2,
  Send,
  Calendar as CalendarIcon,
  Camera
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from './lib/utils';
import { getChatResponse, getConversationSummary, scanListWithAI } from './services/geminiService';

gsap.registerPlugin(ScrollTrigger);

const REVIEWS = [
  { name: "Ednaldo materiais de construção", text: "Excelentes profissionais, gentis e prestativos. Foram humanos e me emprestaram uma ferramenta para usar em casa na boa-fé. Ganhou nossa confiança!", rating: 5 },
  { name: "Marli Cruz", text: "Melhor loja do bairro, ótimos preços e excelente atendimento! Recomendo com certeza!", rating: 5 },
  { name: "Maria Cristina", text: "A loja fica perto de onde moro e os preços são bons e principalmente a qualidade no atendimento.", rating: 5 },
  { name: "Ana Lucia Brito", text: "Muito bom atendimento o rapaz entende de tudo até pra ajudar e tirar as dúvidas sobre material.", rating: 5 },
  { name: "Eduarda", text: "Atendimento excelente, loja bastante organizada e com muita variedade, estão de parabéns 👏🏼", rating: 5 },
  { name: "Helio Lury", text: "O melhor atendimento. Agora sempre que eu precisar ja sei onde irei comprar. Obrigado!", rating: 5 }
];

const PARTNERS = [
  "Votorantim", "Suvinil", "Tigre", "Amanco", "Deca", "Coral", "Bosch", "Makita", "Gerdau"
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cep, setCep] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    distance: number;
    fee: number;
    isFree: boolean;
  } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // Start at March 2026 as per current context
  const [chatOpen, setChatOpen] = useState(false);
  const [budgetChatOpen, setBudgetChatOpen] = useState(false);
  const [budgetItems, setBudgetItems] = useState<string[]>([]);
  const [budgetItemInput, setBudgetItemInput] = useState('');
  
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Olá! Sou o assistente virtual da Ednaldo. Como posso ajudar na sua obra hoje?' },
    { role: 'model', text: 'Posso tirar dúvidas sobre misturas de areia, colas para azulejos grandes ou prazos de entrega.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64 = await toBase64(file);
      const items = await scanListWithAI(base64);
      
      if (items && items.length > 0) {
        setBudgetItems(prev => [...prev, ...items]);
        alert(`${items.length} itens identificados e adicionados à lista!`);
      } else {
        alert('Não conseguimos identificar itens na imagem. Tente uma foto mais nítida.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await getChatResponse(userMessage, history);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);

    // Check if we should show the WhatsApp button
    const lowerResponse = response.toLowerCase();
    const lowerInput = userMessage.toLowerCase();
    const needsBudget = lowerResponse.includes('whatsapp') || 
                        lowerResponse.includes('orçamento') || 
                        lowerResponse.includes('estoque') ||
                        lowerResponse.includes('comprar') ||
                        lowerResponse.includes('ednaldo tem') ||
                        lowerInput.includes('preço') ||
                        lowerInput.includes('quanto custa') ||
                        lowerInput.includes('tem aí');

    if (needsBudget) {
      const summary = await getConversationSummary([...history, { role: 'model', parts: [{ text: response }] }]);
      const waMessage = `Tenho interesse em: "${summary}"`;
      const waUrl = `https://wa.me/5521998187716?text=${encodeURIComponent(waMessage)}`;
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `\n\n[Clique aqui para chamar no WhatsApp](${waUrl})` 
      }]);
    }
  };

  const addBudgetItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!budgetItemInput.trim()) return;
    setBudgetItems(prev => [...prev, budgetItemInput.trim()]);
    setBudgetItemInput('');
  };

  const removeBudgetItem = (index: number) => {
    setBudgetItems(prev => prev.filter((_, i) => i !== index));
  };

  const sendBudgetToWhatsApp = () => {
    if (budgetItems.length === 0) return;
    const message = `Olá! Gostaria de um orçamento para os seguintes itens:\n\n${budgetItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5521998187716?text=${encodedMessage}`, '_blank');
  };
  
  const heroRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Entrance
    const ctx = gsap.context(() => {
      gsap.from('.hero-title', {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.2
      });
      
      gsap.from('.hero-sub', {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.6,
        ease: 'power3.out'
      });
      
      gsap.from('.hero-cta', {
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        delay: 1,
        ease: 'back.out(1.7)'
      });

      // Scroll Reveals
      const sections = ['.reveal-section'];
      sections.forEach((section) => {
        gsap.from(section, {
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none'
          },
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power3.out'
        });
      });

      // Bento Grid Items
      gsap.from('.bento-item', {
        scrollTrigger: {
          trigger: '.bento-grid',
          start: 'top 70%'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out'
      });
    });

    return () => ctx.revert();
  }, []);

  const STORE_COORDS = { lat: -22.9258, lng: -43.2384 };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user wants to use geolocation or just CEP
    if (!cep && !navigator.geolocation) {
      alert('Por favor, digite um CEP ou permita o acesso à sua localização.');
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);

    const processResult = (distance: number) => {
      setIsSimulating(false);
      const isFree = distance <= 4;
      const fee = isFree ? 0 : 20;
      
      setSimulationResult({ distance, fee, isFree });
    };

    // If CEP is provided, simulate a distance (since we don't have a geocoder)
    if (cep) {
      setTimeout(() => {
        // Random distance between 1 and 10km for simulation
        const simulatedDistance = Math.random() * 9 + 1;
        processResult(simulatedDistance);
      }, 2000);
    } else {
      // Use real geolocation
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const dist = calculateDistance(
            STORE_COORDS.lat, 
            STORE_COORDS.lng, 
            position.coords.latitude, 
            position.coords.longitude
          );
          processResult(dist);
        },
        () => {
          setIsSimulating(false);
          alert('Não foi possível obter sua localização. Por favor, digite seu CEP.');
        }
      );
    }
  };

  const today = new Date();
  const HOLIDAYS_2026: Record<string, string> = {
    '0-1': 'Confraternização Universal',
    '1-17': 'Carnaval',
    '3-3': 'Sexta-feira Santa',
    '3-21': 'Tiradentes',
    '4-1': 'Dia do Trabalho',
    '5-4': 'Corpus Christi',
    '8-7': 'Independência do Brasil',
    '9-12': 'Nossa Senhora Aparecida',
    '10-2': 'Finados',
    '10-15': 'Proclamação da República',
    '10-20': 'Dia da Consciência Negra',
    '11-25': 'Natal'
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(year, currentDate.getMonth());
  const startDay = getFirstDayOfMonth(year, currentDate.getMonth());

  const hasBridgeHoliday = () => {
    const month = currentDate.getMonth();
    if (year !== 2026) return false;
    
    // Check if any holiday in this month falls on Tuesday (2) or Thursday (4)
    return Object.keys(HOLIDAYS_2026).some(key => {
      const [m, d] = key.split('-').map(Number);
      if (m !== month) return false;
      const dayOfWeek = new Date(2026, m, d).getDay();
      return dayOfWeek === 2 || dayOfWeek === 4;
    });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long' });
  };

  const formattedDate = `${getDayName(today).charAt(0).toUpperCase() + getDayName(today).slice(1)}, ${today.getDate().toString().padStart(2, '0')} de ${getMonthName(today).charAt(0).toUpperCase() + getMonthName(today).slice(1)}`;

  const isSunday = today.getDay() === 0;
  const statusText = isSunday ? 'Domingos: Fechado' : `Hoje: Aberto até 18:30`;

  return (
    <div className="min-h-screen selection:bg-brand-accent selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center">
              <HardHat className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-display font-bold tracking-tighter uppercase">
              Ednaldo <span className="text-brand-accent">materiais de</span> construção
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
            <a href="#inicio" className="hover:text-brand-accent transition-colors">Início</a>
            <a href="#diferenciais" className="hover:text-brand-accent transition-colors">Diferenciais</a>
            <a href="#calendario" className="hover:text-brand-accent transition-colors">Horários</a>
            <a href="#sobre" className="hover:text-brand-accent transition-colors">Sobre</a>
            <a href="#depoimentos" className="hover:text-brand-accent transition-colors">Depoimentos</a>
          </nav>

          <div className="hidden md:block">
            <button className="bg-brand-accent hover:bg-brand-accent/90 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95">
              Falar com Especialista
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden glass absolute top-20 left-0 w-full p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
            <a href="#inicio" onClick={() => setIsMenuOpen(false)}>Início</a>
            <a href="#diferenciais" onClick={() => setIsMenuOpen(false)}>Diferenciais</a>
            <a href="#calendario" onClick={() => setIsMenuOpen(false)}>Horários</a>
            <a href="#sobre" onClick={() => setIsMenuOpen(false)}>Sobre</a>
            <a href="#depoimentos" onClick={() => setIsMenuOpen(false)}>Depoimentos</a>
            <button className="bg-brand-accent text-white px-6 py-3 rounded-full font-bold">
              Falar com Especialista
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section id="inicio" ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop" 
              alt="Construção de Luxo" 
              className="w-full h-full object-cover scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/80 via-brand-bg/60 to-brand-bg"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-transparent to-brand-bg/40"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-pulse">
              <span className="w-2 h-2 bg-brand-accent rounded-full"></span>
              <span className="text-xs font-bold uppercase tracking-widest">Melhor atendimento do Rio de Janeiro</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-display font-bold leading-[0.9] tracking-tighter mb-8">
              <div className="overflow-hidden">
                <span className="hero-title block">DO BÁSICO AO</span>
              </div>
              <div className="overflow-hidden">
                <span className="hero-title block text-brand-accent italic">ACABAMENTO</span>
              </div>
            </h1>

            <p className="hero-sub text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              Material de qualidade, preço justo e a entrega mais rápida da região. Transformamos sua obra em um projeto de excelência.
            </p>

            <div className="hero-cta flex flex-col md:flex-row items-center justify-center gap-4">
              <button className="group bg-brand-accent text-white px-10 py-5 rounded-full text-lg font-bold flex items-center gap-3 hover:shadow-[0_0_30px_rgba(242,125,38,0.4)] transition-all">
                Ver Catálogo Completo
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="glass px-10 py-5 rounded-full text-lg font-bold hover:bg-white/10 transition-all">
                Simular Entrega
              </button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
          </div>
        </section>

        {/* Authority Bar (Marquee) */}
        <div className="py-12 border-y border-white/5 bg-brand-card/50 marquee-container">
          <div className="marquee-content flex items-center gap-20">
            {[...PARTNERS, ...PARTNERS].map((partner, i) => (
              <span key={i} className="text-2xl md:text-4xl font-display font-black text-white/10 uppercase tracking-tighter">
                {partner}
              </span>
            ))}
          </div>
        </div>

        {/* Differentials (Bento Grid) */}
        <section id="diferenciais" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-6xl font-bold leading-none mb-6">
                POR QUE SOMOS <br />
                <span className="text-brand-accent italic">REFERÊNCIA?</span>
              </h2>
              <p className="text-white/50 text-lg">
                Combinamos tecnologia de ponta com o atendimento humano que você merece.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-xs text-white/40 uppercase tracking-widest">Satisfação</div>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="text-right">
                <div className="text-3xl font-bold">+10k</div>
                <div className="text-xs text-white/40 uppercase tracking-widest">Obras Atendidas</div>
              </div>
            </div>
          </div>

          <div className="bento-grid">
            {/* Delivery Simulator Card */}
            <div className="bento-item col-span-1 md:col-span-2 row-span-1 glass rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-2xl flex items-center justify-center mb-6">
                  <Truck className="text-brand-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Simulador de Entrega</h3>
                <p className="text-white/50 text-sm mb-6 max-w-xs">
                  Entregas de <span className="text-brand-accent font-bold">QUALQUER PORTE</span>. Grátis até 4km em qualquer direção! Taxa de R$ 20 após esse limite.
                </p>
                
                <form onSubmit={handleSimulate} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Seu CEP" 
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-accent/50 flex-1"
                  />
                  <button className="bg-brand-accent text-white px-4 py-2 rounded-xl text-sm font-bold">
                    {isSimulating ? 'Calculando...' : 'Simular'}
                  </button>
                </form>
              </div>

              {/* Map & RJ Photo Background */}
              <div className="absolute bottom-0 right-0 w-1/2 h-full opacity-60 group-hover:opacity-80 transition-opacity overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1000&auto=format&fit=crop" 
                  alt="Cristo Redentor de longe - Rio de Janeiro" 
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-transparent to-transparent z-10"></div>
                
                {simulationResult && !isSimulating && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 animate-in fade-in zoom-in duration-500 text-center w-full max-w-[200px]">
                       <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Resultado</div>
                       <div className={cn(
                         "text-lg font-black mb-1",
                         simulationResult.isFree ? "text-emerald-400" : "text-brand-accent"
                       )}>
                         {simulationResult.isFree ? 'FRETE GRÁTIS' : `FRETE R$ ${simulationResult.fee.toFixed(0)}`}
                       </div>
                       <div className="text-xs text-white/80">
                         Distância: <span className="font-bold">{simulationResult.distance.toFixed(1)} km</span>
                       </div>
                       <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-white/40 leading-tight">
                         Qualquer porte atendido • Entrega 24h
                       </div>
                       <button 
                        onClick={() => setSimulationResult(null)}
                        className="mt-3 text-[9px] text-white/60 hover:text-white underline"
                       >
                        Nova Simulação
                       </button>
                    </div>
                  </div>
                )}

                {isSimulating && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative">
                      <div className="w-6 h-6 bg-brand-accent rounded-full animate-ping"></div>
                      <Truck className="absolute top-0 left-0 text-brand-accent w-6 h-6" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Chat Card */}
            <div className="bento-item col-span-1 md:col-span-2 row-span-1 glass rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative group">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Especialista 24h</h3>
                <p className="text-white/50 text-sm mb-6 max-w-xs">
                  Dúvidas sobre misturas ou materiais? Nosso chat treinado responde tudo instantaneamente.
                </p>
                <button 
                  onClick={() => setChatOpen(true)}
                  className="inline-flex items-center gap-2 text-emerald-500 font-bold hover:gap-3 transition-all"
                >
                  Iniciar Conversa <ChevronRight size={18} />
                </button>
              </div>
              
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full"></div>
            </div>

            {/* Quality Card */}
            <div className="bento-item col-span-1 md:col-span-1 row-span-1 glass rounded-3xl p-8 flex flex-col justify-between">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Qualidade Premium</h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  Trabalhamos apenas com as melhores marcas do mercado nacional e internacional.
                </p>
              </div>
            </div>

            {/* Service Card */}
            <div className="bento-item col-span-1 md:col-span-1 row-span-1 glass rounded-3xl p-8 flex flex-col justify-between">
              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Star className="text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Melhor do Bairro</h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  Eleita a melhor loja do Andaraí pelo atendimento e agilidade.
                </p>
              </div>
            </div>

            {/* Fast Delivery Card */}
            <div className="bento-item col-span-1 md:col-span-2 row-span-1 glass rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="text-brand-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Entrega em 24h</h3>
                <p className="text-white/50 text-sm max-w-xs">
                  Para itens em estoque, garantimos a entrega no dia seguinte. Sua obra não para.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] font-black italic">24H</div>
              </div>
            </div>
          </div>
        </section>

        {/* Calendar Section */}
        <section id="calendario" className="py-32 px-6 max-w-7xl mx-auto reveal-section">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                ESTAMOS <br />
                <span className="text-brand-accent italic">DISPONÍVEIS</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                Confira nosso calendário de funcionamento para Março de 2026. <br/>
                <span className="text-brand-accent font-bold">Domingos e Feriados:</span> Não funcionamos para garantir o descanso de nossa equipe de elite.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 glass p-4 rounded-2xl">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <div className={cn("w-2 h-2 bg-emerald-500 rounded-full", !isSunday && "animate-pulse")}></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{statusText}</p>
                    <p className="text-xs text-white/40 uppercase tracking-widest">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 glass p-4 rounded-2xl border-red-500/20">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <X className="text-red-500" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Domingos: Fechado</p>
                    <p className="text-xs text-white/40 uppercase tracking-widest">Recarregando as energias</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="text-brand-accent" />
                    <span className="text-2xl font-display font-bold uppercase tracking-tighter capitalize">
                      {monthName} {year}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={prevMonth}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <ChevronLeft className="text-white/60" size={14} />
                    </button>
                    <button 
                      onClick={nextMonth}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <ChevronRight className="text-white/60" size={14} />
                    </button>
                  </div>
                </div>
                <span className="text-xs text-white/40 uppercase tracking-widest font-bold hidden sm:block">Calendário Oficial</span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                  <div key={i} className={cn("text-[10px] font-bold opacity-30", i === 0 && "text-red-500")}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {/* Empty slots for previous month days */}
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayOfWeek = (day - 1 + startDay) % 7;
                  const isSun = dayOfWeek === 0;
                  const holidayKey = `${currentDate.getMonth()}-${day}`;
                  const holidayName = HOLIDAYS_2026[holidayKey];
                  const isHoliday = !!holidayName;
                  const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
                  
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all relative group",
                        (isSun || isHoliday) ? "bg-red-500/10 text-red-500 cursor-not-allowed" : "bg-white/5 text-white/60",
                        isToday && "bg-brand-accent text-white shadow-[0_0_20px_rgba(242,125,38,0.4)] scale-110 z-10"
                      )}
                    >
                      <span>{day}</span>
                      {(isSun || isHoliday) && (
                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                          <div className="bg-red-500 text-[8px] text-white px-1.5 py-0.5 rounded-sm uppercase whitespace-nowrap shadow-lg">
                            {holidayName || 'Fechado'}
                          </div>
                        </div>
                      )}
                      {isToday && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasBridgeHoliday() && (
                <div className="mt-8 p-4 glass border-brand-accent/20 rounded-2xl animate-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-accent/20 rounded-full flex items-center justify-center">
                      <Phone className="text-brand-accent" size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Aviso de Feriado</p>
                      <p className="text-xs text-white/80">
                        Possibilidade de enforcamento. <span className="font-bold">Em caso de urgência nos chame aqui:</span>
                      </p>
                      <a 
                        href="https://wa.me/5521969645513" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-accent font-bold text-sm hover:underline flex items-center gap-1 mt-1"
                      >
                        <MessageSquare size={14} /> 21 96964-5513
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Background Decoration */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* About / Services */}
        <section id="sobre" className="py-32 bg-brand-card/30 reveal-section">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop" 
                  alt="Nossa Loja" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 glass p-8 rounded-3xl max-w-xs hidden md:block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-brand-accent rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-white" />
                  </div>
                  <span className="font-bold">Compromisso Real</span>
                </div>
                <p className="text-sm text-white/60">
                  "Viemos para oferecer material de qualidade e bom preço, seguido com ótimo atendimento."
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                DO <span className="text-brand-accent italic">BÁSICO</span> AO <br />
                <span className="text-brand-accent italic">ACABAMENTO</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                Somos uma empresa familiar que entende a importância do seu sonho. Na Ednaldo materiais de construção, você não é apenas um cliente, é um parceiro. Oferecemos consultoria técnica gratuita para garantir que você leve exatamente o que sua obra precisa.
              </p>
              
              <div className="mb-12 p-6 glass rounded-2xl border-brand-accent/20">
                <div className="flex items-center gap-3 mb-4">
                  <HardHat className="text-brand-accent" />
                  <h4 className="font-bold uppercase tracking-widest text-sm">Obras de Referência</h4>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  Orgulhamo-nos de ter fornecido materiais para grandes projetos locais, como as obras do <span className="text-white font-bold">Hospital de Referência Andaraí</span>, diversas <span className="text-white font-bold">creches, colégios e igrejas</span> nos arredores. Nossa qualidade está presente em cada canto do bairro.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-3">
                  <Hammer className="text-brand-accent" />
                  <h4 className="font-bold">Estrutural</h4>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Cimento, Areia, Ferro</p>
                </div>
                <div className="flex flex-col gap-3">
                  <PaintBucket className="text-brand-accent" />
                  <h4 className="font-bold">Acabamento</h4>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Tintas, Pisos, Louças</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Wrench className="text-brand-accent" />
                  <h4 className="font-bold">Ferramentas</h4>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Elétricas e Manuais</p>
                </div>
                <div className="flex flex-col gap-3">
                  <ShieldCheck className="text-brand-accent" />
                  <h4 className="font-bold">Hidráulica</h4>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Tubos e Conexões</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="depoimentos" className="py-32 px-6 max-w-7xl mx-auto reveal-section">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">QUEM COMPRA, <span className="text-brand-accent italic">CONFIA</span></h2>
            <p className="text-white/50">Confira o que nossos clientes amigos dizem sobre nós.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map((review, i) => (
              <div key={i} className="glass p-8 rounded-3xl flex flex-col justify-between hover:bg-white/10 transition-all group">
                <div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-brand-accent text-brand-accent" />
                    ))}
                  </div>
                  <p className="text-white/80 italic mb-8 leading-relaxed">
                    "{review.text}"
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-accent/20 rounded-full flex items-center justify-center font-bold text-brand-accent">
                    {review.name[0]}
                  </div>
                  <span className="font-bold text-sm uppercase tracking-widest">{review.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto glass rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-bold mb-8 leading-none">
                PRONTO PARA <br />
                <span className="text-brand-accent italic">CONSTRUIR?</span>
              </h2>
              <p className="text-white/60 text-lg mb-12 max-w-xl mx-auto">
                Não perca tempo e dinheiro. Fale com quem entende e garanta o melhor preço do Rio de Janeiro.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <a 
                  href="https://wa.me/5521998187716" 
                  target="_blank" 
                  className="bg-brand-accent text-white px-12 py-6 rounded-full text-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform"
                >
                  Chamar no WhatsApp
                </a>
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs text-white/40 uppercase tracking-widest">Ou ligue agora</span>
                  <span className="text-xl font-bold">(21) 99818-7716</span>
                </div>
              </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(242,125,38,0.2)_0%,transparent_70%)]"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-brand-card">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                <HardHat className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-display font-bold tracking-tighter uppercase">
                Ednaldo <span className="text-brand-accent">materiais de</span> construção
              </span>
            </div>
            <p className="text-white/40 max-w-sm mb-8">
              Sua parceira de confiança no Andaraí. Do básico ao acabamento, oferecemos o melhor para sua obra.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors cursor-pointer">
                <Star size={18} />
              </div>
              <div className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors cursor-pointer">
                <MapPin size={18} />
              </div>
              <div className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-brand-accent transition-colors cursor-pointer">
                <Phone size={18} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-8 uppercase tracking-widest text-sm">Localização</h4>
            <ul className="flex flex-col gap-4 text-white/40 text-sm">
              <li className="flex gap-3">
                <MapPin className="text-brand-accent shrink-0" size={18} />
                R. Leopoldo, 106 - Andaraí, Rio de Janeiro - RJ, 20541-170
              </li>
              <li className="flex gap-3">
                <Clock className="text-brand-accent shrink-0" size={18} />
                Seg - Sex: 08:00 - 18:30 <br />
                Sáb: 08:00 - 14:00
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-8 uppercase tracking-widest text-sm">Contato</h4>
            <ul className="flex flex-col gap-4 text-white/40 text-sm">
              <li className="flex gap-3">
                <Phone className="text-brand-accent shrink-0" size={18} />
                (21) 99818-7716
              </li>
              <li className="flex gap-3">
                <MessageSquare className="text-brand-accent shrink-0" size={18} />
                WhatsApp 24h
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/20 text-xs uppercase tracking-[0.3em]">
            © 2026 EDNALDO MATERIAIS DE CONSTRUÇÃO. TODOS OS DIREITOS RESERVADOS.
          </p>
          <div className="flex gap-8 text-white/20 text-[10px] uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
          </div>
        </div>
      </footer>

      {/* Floating Buttons Container */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[100]">
        {/* Budget Chat Button */}
        {!budgetChatOpen && (
          <button 
            onClick={() => {
              setBudgetChatOpen(true);
              setChatOpen(false);
            }}
            className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_10px_30px_rgba(37,99,235,0.4)] flex flex-col items-center justify-center hover:scale-110 transition-transform group relative"
          >
            <ClipboardList size={24} />
            <span className="text-[8px] font-bold uppercase mt-1">Orçamento</span>
            {budgetItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-brand-bg rounded-full flex items-center justify-center text-[10px] font-bold">
                {budgetItems.length}
              </span>
            )}
          </button>
        )}

        {/* Expert Chat Button */}
        {!chatOpen && (
          <button 
            onClick={() => {
              setChatOpen(true);
              setBudgetChatOpen(false);
            }}
            className="w-16 h-16 bg-brand-accent text-white rounded-full shadow-[0_10px_30px_rgba(242,125,38,0.4)] flex flex-col items-center justify-center hover:scale-110 transition-transform group relative"
          >
            <MessageSquare size={24} />
            <span className="text-[8px] font-bold uppercase mt-1">Dúvidas</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-brand-bg rounded-full"></span>
          </button>
        )}
      </div>

      {/* Budget Chat Modal */}
      {budgetChatOpen && (
        <div className="fixed bottom-8 right-8 w-80 md:w-96 glass rounded-3xl overflow-hidden shadow-2xl z-[110] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-blue-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ClipboardList className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Lista de Orçamento</h4>
                <span className="text-[10px] text-white/60 uppercase tracking-widest">Monte seu pedido</span>
              </div>
            </div>
            <button onClick={() => setBudgetChatOpen(false)} className="text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          {/* Scanner Pro Obra Section */}
          <div className="p-4 bg-blue-500/10 border-b border-white/5">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(242,125,38,0.3)] disabled:opacity-50"
            >
              {isScanning ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-5 h-5" />
              )}
              {isScanning ? 'Analisando...' : 'Scanner Pro Obra 🚀'}
            </button>
            <p className="text-[10px] text-white/40 mt-2 text-center uppercase tracking-widest font-bold">
              Não precisa digitar, só enviar a foto da lista de obras! 📸
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleScan}
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="h-64 p-6 overflow-y-auto flex flex-col gap-3 bg-brand-card/80">
            {budgetItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <ClipboardList size={48} className="mb-4" />
                <p className="text-sm">Sua lista está vazia.<br/>Adicione os materiais que precisa.</p>
              </div>
            ) : (
              budgetItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl group animate-in slide-in-from-right-2 duration-200">
                  <span className="text-sm text-white/80">{item}</span>
                  <button 
                    onClick={() => removeBudgetItem(i)}
                    className="text-white/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-brand-card flex flex-col gap-3">
            <form onSubmit={addBudgetItem} className="relative">
              <input 
                type="text" 
                value={budgetItemInput}
                onChange={(e) => setBudgetItemInput(e.target.value)}
                placeholder="Ex: 10 sacos de cimento..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:scale-110 transition-transform"
              >
                <Plus size={24} />
              </button>
            </form>

            <button 
              onClick={sendBudgetToWhatsApp}
              disabled={budgetItems.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Send size={18} />
              Enviar para WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Mock AI Chat Modal */}
      {chatOpen && (
        <div className="fixed bottom-8 right-8 w-80 md:w-96 glass rounded-3xl overflow-hidden shadow-2xl z-[110] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-brand-accent p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Especialista Ednaldo</h4>
                <span className="text-[10px] text-white/60 uppercase tracking-widest">Online Agora</span>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="h-80 p-6 overflow-y-auto flex flex-col gap-4 bg-brand-card/80">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "rounded-2xl p-4 text-sm max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-pre-wrap",
                  msg.role === 'user' 
                    ? "bg-brand-accent text-white self-end rounded-tr-none" 
                    : "bg-white/5 text-white/80 self-start rounded-tl-none"
                )}
              >
                {msg.text.includes('https://wa.me/') ? (
                  <div>
                    {msg.text.split('\n\n')[0] && <p className="mb-3">{msg.text.split('\n\n')[0]}</p>}
                    <a 
                      href={msg.text.match(/https:\/\/wa\.me\/[^\)]+/)?.[0]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-2 px-4 rounded-xl font-bold transition-all text-xs w-full no-underline"
                    >
                      <MessageSquare size={16} />
                      Chamar no WhatsApp
                    </a>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {isTyping && (
              <div className="bg-white/5 text-white/40 self-start rounded-2xl rounded-tl-none p-4 text-xs italic animate-pulse">
                Especialista está digitando...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-white/5 bg-brand-card flex flex-col gap-3">
            <button 
              onClick={async () => {
                const history = messages.map(m => ({
                  role: m.role,
                  parts: [{ text: m.text }]
                }));
                const summary = await getConversationSummary(history);
                const waMessage = `Tenho interesse em: "${summary}"`;
                window.open(`https://wa.me/5521998187716?text=${encodeURIComponent(waMessage)}`, '_blank');
              }}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 rounded-xl font-bold transition-all text-xs w-full"
            >
              <MessageSquare size={16} />
              Enviar Interesse para WhatsApp
            </button>
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pergunte qualquer coisa..." 
                disabled={isTyping}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-accent/50 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-accent disabled:opacity-30"
              >
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
