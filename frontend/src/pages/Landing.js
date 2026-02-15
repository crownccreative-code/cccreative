import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Zap, 
  Menu, 
  X, 
  Languages, 
  Search, 
  MousePointerClick, 
  Repeat, 
  ArrowUpRight,
  ChevronRight,
  Cpu,
  Trophy,
  Users,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TRANSLATIONS = {
  EN: {
    nav: ['The Start', 'The Fix', 'The All-In', 'Make Your Move'],
    status: 'SYSTEM STATUS: GRANDMASTER READY',
    headline: ['Unlock Your Business', 'AI Superpower'],
    heroSub: 'We combine old-school strategy with new-school AI. We make your apps work together so you can win the game while you sleep.',
    heroCta: 'Start Your Winning Move',
    bentoTitle: 'Your Strategic Playbook',
    bentoSubtitle: 'The Tools to Win',
    services: [
      { label: 'AUTO-PILOT', title: 'Work Less, Win More', desc: 'We connect your favorite apps so they talk to each other automatically. Your business runs itself so you can focus on the big picture.' },
      { label: 'PRO LANDING', title: 'Look Like a King', desc: 'Clean, fast websites that make people trust you. We build pages that turn visitors into fans.' },
      { label: 'BE SEEN', title: 'Be Found First', desc: 'We put you at the top of Google and Yelp. When people search for help, they find you before anyone else.' },
      { label: 'PRIVATE TEAM', title: 'A Staff Always Ready', desc: 'Get your own team that works for you every hour of every day. It is like having a private staff that never stops helping you win.' }
    ],
    tiersHead: 'Pick Your Strategy',
    tiersSub: 'Every king needs a plan',
    tiers: [
      { name: 'The Opening', hook: 'Find the Gaps', val: 'We find where your business is losing money and fix the basics.', features: ['Web Audit', 'Social Setup', 'Simple Tracking'], cta: 'Start Here' },
      { name: 'The Mid-Game', hook: 'Power Up', val: 'A total redesign of your online home with smart AI tools to help you grow.', features: ['Smart Landing Page', 'Google & Yelp Boost', '24/7 Support Staff'], cta: 'Upgrade Now' },
      { name: 'The End-Game', hook: 'Total Dominance', val: 'Full automation. We build a business that works for you, not the other way around.', features: ['Full AI Systems', 'Private 24/7 Team', 'Infinite Support'], cta: 'Go All-In' }
    ],
    formTitle: 'CONNECTION FORM',
    formQ1: '01. How many people visit your business or website each week?',
    formQ2: '02. How many people work on your team?',
    formQ3: '03. What is one big thing you want to change or fix right now?',
    formQ4: '04. How much money does your business make every year?',
    formQ4Opts: ['$50,000+', '$25,000 - $50,000', '$10,000 - $25,000', 'Under $10,000'],
    formBtn: 'Initialize Connection',
    footer: ['Safety Protocol', 'Legal_Notice', 'Strategy: Active']
  },
  ES: {
    nav: ['El Inicio', 'La Solución', 'Todo-En-Uno', 'Haz Tu Jugada'],
    status: 'ESTADO: LISTO PARA GANAR',
    headline: ['Desbloquea tu Negocio', 'Superpoder de IA'],
    heroSub: 'Combinamos estrategia clásica con IA moderna. Hacemos que tus aplicaciones trabajen juntas para ganar el juego mientras duermes.',
    heroCta: 'Empieza tu Jugada Ganadora',
    bentoTitle: 'Tu Libro de Estrategia',
    bentoSubtitle: 'Herramientas para Ganar',
    services: [
      { label: 'PILOTO AUTO', title: 'Trabaja Menos, Gana Más', desc: 'Conectamos tus aplicaciones favoritas para que hablen entre ellas automáticamente. Tu negocio funciona solo.' },
      { label: 'PÁGINAS PRO', title: 'Luce como un Rey', desc: 'Webs limpias y rápidas que generan confianza. Creamos páginas que convierten visitas en clientes felices.' },
      { label: 'HAZTE VER', title: 'Sé el Primero', desc: 'Te ponemos arriba en Google y Yelp. Cuando la gente busca ayuda, te encuentran a ti primero.' },
      { label: 'EQUIPO PRIVADO', title: 'Personal Siempre Listo', desc: 'Consigue tu propio equipo que trabaja para ti todas las horas de cada día. Es como tener personal privado que nunca deja de ayudarte a ganar.' }
    ],
    tiersHead: 'Elige tu Estrategia',
    tiersSub: 'Todo rey necesita un plan',
    tiers: [
      { name: 'La Apertura', hook: 'Encuentra Huecos', val: 'Encontramos dónde pierdes dinero y arreglamos lo básico de tu negocio.', features: ['Auditoría Web', 'Setup Social', 'Rastreo Simple'], cta: 'Empezar Aquí' },
      { name: 'Medio Juego', hook: 'Sube de Nivel', val: 'Rediseño total de tu casa online con herramientas IA para crecer rápido.', features: ['Landing Page Smart', 'Impulso Google/Yelp', 'Equipo de Apoyo 24/7'], cta: 'Mejorar Ahora' },
      { name: 'Juego Final', hook: 'Dominio Total', val: 'Automatización completa. Creamos un negocio que trabaja para ti, no al revés.', features: ['Sistemas IA Totales', 'Equipo Privado 24/7', 'Soporte Infinito'], cta: 'Ir por Todo' }
    ],
    formTitle: 'FORMULARIO DE CONEXIÓN',
    formQ1: '01. ¿Cuánta gente visita tu negocio o web por semana?',
    formQ2: '02. ¿Cuánta gente trabaja en tu equipo?',
    formQ3: '03. ¿Qué es lo más importante que quieres cambiar ahora?',
    formQ4: '04. ¿Cuánto dinero gana tu negocio cada año?',
    formQ4Opts: ['Más de $50,000', '$25,000 - $50,000', '$10,000 - $25,000', 'Menos de $10,000'],
    formBtn: 'Inicializar Conexión',
    footer: ['Protocolo Seguridad', 'Aviso_Legal', 'Estrategia: Activa']
  }
};

const PlayCard = ({ span, icon, title, label, desc, id }) => (
  <div className={`${span} group relative overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1`}>
    {/* Card Background - Visible Gray Box */}
    <div 
      className="absolute inset-0 rounded-xl"
      style={{ 
        backgroundColor: '#121212',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)'
      }}
    ></div>
    <div 
      className="absolute inset-0 rounded-xl group-hover:border-blue-500/60 transition-colors duration-300"
      style={{ border: '1px solid #2a2a2a' }}
    ></div>
    
    {/* Content */}
    <div className="relative z-10 p-7 flex flex-col h-full min-h-[220px]">
      <div className="flex justify-between items-start mb-5">
        <div 
          className="p-3 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300"
          style={{ backgroundColor: '#1c1c1c', border: '1px solid #333' }}
        >
          {icon}
        </div>
        <span className="font-mono text-[9px] tracking-widest" style={{ color: '#555' }}>{id}</span>
      </div>
      <span className="text-blue-400 font-mono text-[10px] tracking-[0.25em] uppercase mb-2 block">{label}</span>
      <h3 className="text-lg font-bold mb-3 tracking-tight uppercase text-white group-hover:text-blue-100 transition-colors">{title}</h3>
      <p className="text-sm leading-relaxed flex-1" style={{ color: '#888' }}>{desc}</p>
      <div 
        className="mt-5 pt-4 flex items-center gap-2 text-[10px] font-mono group-hover:text-blue-400 cursor-pointer transition-colors tracking-widest uppercase"
        style={{ borderTop: '1px solid #222', color: '#555' }}
      >
        LEARN MORE <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  </div>
);

export default function Landing() {
  const [lang, setLang] = useState('EN');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F7] font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Visual Foundation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[100px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all ${scrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-8'}`} style={{ transitionDuration: '500ms' }}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="relative">
               <Crown className="w-6 h-6 text-[#D4AF37] relative z-10" />
               <div className="absolute inset-0 bg-yellow-500/20 blur-lg rounded-full animate-pulse"></div>
            </div>
            <span className="text-lg font-bold tracking-[0.2em] uppercase">
              Crown <span className="text-blue-500">Collective</span>
            </span>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {/* Language Toggle */}
            <button onClick={() => setLang(l => l === 'EN' ? 'ES' : 'EN')} className="flex items-center gap-2 px-3 py-1.5 md:px-4 border border-white/10 rounded-full text-[10px] font-mono tracking-widest bg-white/5 hover:border-blue-500/50 transition-colors" data-testid="language-toggle">
              <Languages className="w-3 h-3 text-blue-400" />
              <span className={lang === 'EN' ? 'text-blue-400 font-bold' : ''}>EN</span>
              <span className="opacity-10 text-white">|</span>
              <span className={lang === 'ES' ? 'text-blue-400 font-bold' : ''}>ES</span>
            </button>

            {/* Inquire Button - Desktop Nav */}
            <a 
              href="https://forms.gle/oLKR3vLosFSWkywF9"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm shadow-lg shadow-yellow-500/20"
              data-testid="nav-inquire-btn"
            >
              <ArrowUpRight className="w-3 h-3" />
              Inquire
            </a>

            {/* Auth/Portal Button */}
            {user ? (
              <Link 
                to={user.role === 'admin' ? '/admin' : '/portal'}
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm shadow-lg shadow-blue-600/20"
                data-testid="portal-btn"
              >
                <LogIn className="w-3 h-3" />
                {user.role === 'admin' ? 'Admin' : 'Portal'}
              </Link>
            ) : (
              <Link 
                to="/login"
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 border border-white/20 hover:border-blue-500/50 text-white text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm"
                data-testid="login-btn"
              >
                <LogIn className="w-3 h-3" />
                Login
              </Link>
            )}

            {/* Mobile Menu */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2.5 rounded-full border transition-colors ${menuOpen ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30'}`}
                data-testid="mobile-menu-btn"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {menuOpen && (
                <div className="absolute top-full right-0 mt-4 w-64 bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden animate-fadeIn">
                  <div className="flex flex-col gap-2">
                    {t.nav.slice(0, 3).map((item, idx) => (
                      <a 
                        key={idx} 
                        href={`#${idx === 0 ? 'start' : idx === 1 ? 'fix' : 'all-in'}`} 
                        onClick={() => setMenuOpen(false)}
                        className="flex justify-between items-center px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/5 transition-colors group"
                      >
                        {item}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                    <div className="sm:hidden mt-4 pt-4 border-t border-white/5">
                      {user ? (
                        <Link to={user.role === 'admin' ? '/admin' : '/portal'} onClick={() => setMenuOpen(false)} className="block w-full py-4 text-center bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                          Go to {user.role === 'admin' ? 'Admin' : 'Portal'}
                        </Link>
                      ) : (
                        <Link to="/login" onClick={() => setMenuOpen(false)} className="block w-full py-4 text-center bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                          Login
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 md:pt-64 md:pb-56 px-6 text-left">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center gap-20">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/5 border border-blue-500/20 text-[9px] font-mono uppercase tracking-[0.4em] text-blue-400 mb-8">
              <Cpu className="w-3 h-3" style={{ animation: 'spin 3s linear infinite' }} />
              {t.status}
            </div>
            
            <h1 className="text-6xl md:text-[7rem] font-black tracking-tighter mb-8 leading-[0.85] uppercase text-white">
              {t.headline[0]} <br />
              <span 
                className="relative inline-block"
                style={{
                  background: 'linear-gradient(90deg, #60A5FA, #93C5FD, #D4AF37)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 40px rgba(212, 175, 55, 0.4))',
                  textShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(212, 175, 55, 0.3)'
                }}
              >
                {t.headline[1]}
              </span>
            </h1>
            
            <p className="max-w-lg text-slate-400 text-lg md:text-xl font-light mb-12 leading-relaxed">
              {t.heroSub}
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <a href="#inquiry" className="px-12 py-5 bg-[#D4AF37] text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white transition-colors shadow-2xl shadow-yellow-500/10 w-full sm:w-auto text-center" data-testid="hero-cta-btn">
                {t.heroCta}
              </a>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-full border border-blue-500/20">
                  <Trophy className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest italic">CHECKMATE_MODE: ON</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex justify-center relative">
            <div className="absolute inset-0 bg-blue-600/10 blur-[80px] rounded-full"></div>
            <div className="absolute inset-0 bg-yellow-500/5 blur-[100px] rounded-full translate-y-10"></div>
            <img 
              src="https://customer-assets.emergentagent.com/job_crown-services/artifacts/05u4v7po_ccc%20design.jpg"
              alt="Crown Collective Creative - Chess King with AI circuits"
              className="relative z-10 w-full max-w-md object-contain"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3)) drop-shadow(0 0 60px rgba(212, 175, 55, 0.2))'
              }}
            />
          </div>
        </div>
      </section>

      {/* Bento Playbook */}
      <section id="start" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 text-left">
            <span className="font-mono text-blue-500 text-[10px] uppercase tracking-[0.5em] mb-4 block">{t.bentoSubtitle}</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">{t.bentoTitle}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <PlayCard 
              span=""
              icon={<Repeat className="w-6 h-6 text-blue-400" />}
              label={t.services[0].label}
              title={t.services[0].title}
              desc={t.services[0].desc}
              id="STRAT_01"
            />
            <PlayCard 
              span=""
              icon={<MousePointerClick className="w-6 h-6 text-[#D4AF37]" />}
              label={t.services[1].label}
              title={t.services[1].title}
              desc={t.services[1].desc}
              id="STRAT_02"
            />
            <PlayCard 
              span=""
              icon={<Search className="w-6 h-6 text-blue-400" />}
              label={t.services[2].label}
              title={t.services[2].title}
              desc={t.services[2].desc}
              id="STRAT_03"
            />
            <PlayCard 
              span=""
              icon={<Users className="w-6 h-6 text-[#D4AF37]" />}
              label={t.services[3].label}
              title={t.services[3].title}
              desc={t.services[3].desc}
              id="STRAT_04"
            />
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section id="fix" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-left mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase">{t.tiersHead}</h2>
            <p className="text-slate-500 font-mono text-[10px] tracking-[0.6em] uppercase">{t.tiersSub}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {t.tiers.map((tier, idx) => (
              <div 
                key={idx} 
                className="relative overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                {/* Card Background - Dark Gray Box */}
                <div 
                  className="absolute inset-0 rounded-xl"
                  style={{ 
                    backgroundColor: idx === 1 ? '#0c1220' : '#121212',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.6)'
                  }}
                ></div>
                <div 
                  className="absolute inset-0 rounded-xl transition-colors duration-300"
                  style={{ 
                    border: idx === 1 ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid #2a2a2a'
                  }}
                ></div>
                
                {/* Recommended Badge */}
                {idx === 1 && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-lg">
                    Recommended
                  </div>
                )}
                
                {/* Content */}
                <div className="relative z-10 p-8 flex flex-col h-full min-h-[380px]">
                  <span className="text-xs font-mono text-blue-400 uppercase tracking-[0.4em] mb-3 block">{tier.name}</span>
                  <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter text-white">{tier.hook}</h3>
                  <p className="text-sm mb-8 leading-relaxed pl-4" style={{ color: '#888', borderLeft: '2px solid rgba(59, 130, 246, 0.3)' }}>{tier.val}</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest" style={{ color: '#999' }}>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>{f}
                      </li>
                    ))}
                  </ul>
                  <a 
                    href="#inquiry" 
                    className={`block w-full py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 rounded-lg ${
                      idx === 1 
                        ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30' 
                        : 'text-white hover:bg-white/10'
                    }`}
                    style={idx !== 1 ? { backgroundColor: '#1a1a1a', border: '1px solid #333' } : {}}
                  >
                    {tier.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connection Form */}
      <section id="inquiry" className="py-32 px-6 relative">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0A0A0A] border border-blue-500/20 p-12 md:p-20 rounded-[2rem] relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]">
            <div className="absolute top-0 right-0 p-8 text-[9px] font-mono text-blue-500/50 uppercase tracking-widest">SECURE_LINK: ACTIVE</div>
            
            <div className="mb-14 text-left">
                <Crown className="w-8 h-8 text-[#D4AF37] mb-6" />
                <h2 className="text-3xl font-bold tracking-tight uppercase">{t.formTitle}</h2>
            </div>
            
            <form className="space-y-12" onSubmit={(e) => { e.preventDefault(); navigate('/register'); }}>
              <div className="space-y-4 group text-left">
                <label className="text-[10px] font-mono text-slate-500 group-focus-within:text-blue-400 uppercase tracking-widest transition-colors">{t.formQ1}</label>
                <input type="text" placeholder="e.g. 500" className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-blue-500 transition-colors text-xl font-light placeholder:text-slate-800" data-testid="form-q1" />
              </div>

              <div className="space-y-4 group text-left">
                <label className="text-[10px] font-mono text-slate-500 group-focus-within:text-blue-400 uppercase tracking-widest transition-colors">{t.formQ2}</label>
                <input type="text" placeholder="e.g. 5" className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-blue-500 transition-colors text-xl font-light placeholder:text-slate-800" data-testid="form-q2" />
              </div>

              <div className="space-y-4 group text-left">
                <label className="text-[10px] font-mono text-slate-500 group-focus-within:text-blue-400 uppercase tracking-widest transition-colors">{t.formQ3}</label>
                <input type="text" placeholder="Fix my website..." className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-blue-500 transition-colors text-xl font-light placeholder:text-slate-800" data-testid="form-q3" />
              </div>

              <div className="space-y-4 text-left">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{t.formQ4}</label>
                <select className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-blue-500 transition-colors text-xl font-light text-slate-400 appearance-none" data-testid="form-q4">
                  {t.formQ4Opts.map((opt, i) => <option key={i} className="bg-[#0A0A0A]">{opt}</option>)}
                </select>
              </div>

              <div className="pt-8">
                <button type="submit" className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.4em] transition-colors flex items-center justify-center gap-4 group" data-testid="form-submit-btn">
                  {t.formBtn} 
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 bg-[#050505] text-left">
        <div className="max-w-7xl mx-auto flex flex-col items-start md:items-center gap-10">
          <div className="flex flex-col items-start md:items-center gap-4">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xs font-mono text-slate-600 tracking-[0.5em] uppercase">Crown Collective Creative Tech</span>
          </div>
          <div className="flex flex-wrap justify-start md:justify-center gap-12 text-[9px] font-mono uppercase tracking-[0.3em] text-slate-500">
            <a href="#" className="hover:text-blue-400 transition-colors">{t.footer[0]}</a>
            <a href="#" className="hover:text-blue-400 transition-colors">{t.footer[1]}</a>
            <span className="text-blue-500/40">{t.footer[2]}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
