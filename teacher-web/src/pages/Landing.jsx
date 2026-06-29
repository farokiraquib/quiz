import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  BarChart3,
  Smartphone,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Hexagon,
  Triangle,
  Circle,
  Square,
  Activity,
  Layers,
  Shield,
  Clock
} from 'lucide-react';

/* ── Scroll-triggered fade-in hook ── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isVisible];
}

/* ── Animated Section wrapper ── */
function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Feature Card (Professional) ── */
function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <AnimatedSection delay={delay}>
      <div className="group relative h-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
        {/* Subtle top gradient line on hover */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
          <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-white/60 leading-relaxed">{description}</p>
      </div>
    </AnimatedSection>
  );
}

/* ── Metric Card ── */
function MetricCard({ value, label, delay }) {
  return (
    <AnimatedSection delay={delay} className="relative group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      <div className="p-8 border-l border-white/10">
        <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">{value}</div>
        <div className="text-sm font-medium text-white/50 uppercase tracking-widest">{label}</div>
      </div>
    </AnimatedSection>
  );
}

/* ════════════════════════════════════════════════════════
   LANDING PAGE (Professional / High-Conversion)
   ════════════════════════════════════════════════════════ */
export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans">
      
      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrollY > 20
            ? 'bg-[#050505]/90 backdrop-blur-md border-white/10 py-3'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-white/70 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Hexagon className="w-4 h-4 text-black fill-black" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LiveQuizz<span className="text-white/40">.io</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#enterprise" className="hover:text-white transition-colors">Enterprise</a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-lg hover:bg-white/90 hover:scale-[0.98] transition-all duration-200"
            >
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background Subtle Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-white/[0.08] to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <AnimatedSection delay={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 mb-8 hover:bg-white/10 transition-colors cursor-pointer">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LiveQuizz Enterprise is now available <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1] mb-6">
              The platform for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
                interactive learning.
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
              Create engaging assessments, capture real-time analytics, and drive student success with professional-grade tools built for modern educators.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-semibold text-base px-8 py-4 rounded-xl hover:bg-white/90 hover:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              >
                Start building for free
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white bg-white/5 font-medium text-base px-8 py-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
              >
                Request demo
              </a>
            </div>
            <p className="mt-4 text-xs text-white/40 font-medium">No credit card required • 14-day Enterprise trial</p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Social Proof / Trusted By ── */}
      <section className="border-y border-white/5 bg-white/[0.02] py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-white/40 tracking-widest uppercase mb-8">
            Trusted by forward-thinking institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              { icon: Triangle, name: "Acme Edu" },
              { icon: Circle, name: "Global Learn" },
              { icon: Hexagon, name: "Nexus Academy" },
              { icon: Square, name: "Pinnacle" },
              { icon: Activity, name: "Quantum" }
            ].map((company, i) => (
              <div key={i} className="flex items-center gap-2 group cursor-default">
                <company.icon className="w-6 h-6 group-hover:text-white transition-colors" />
                <span className="text-lg font-bold tracking-tight group-hover:text-white transition-colors">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Value / Features ── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Everything you need to <br />
              <span className="text-white/50">run a modern classroom.</span>
            </h2>
            <p className="text-xl text-white/50 font-medium leading-relaxed">
              LiveQuizz provides a comprehensive suite of tools designed to maximize engagement and provide actionable insights instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Instant Deployment"
              description="Launch a session in seconds. Students join instantly via a robust low-latency connection without needing to download apps or create accounts."
              delay={0}
            />
            <FeatureCard
              icon={BarChart3}
              title="Real-time Analytics"
              description="Monitor performance as it happens. Our analytics engine processes responses instantly to show you exactly where students are struggling."
              delay={100}
            />
            <FeatureCard
              icon={Smartphone}
              title="Cross-platform Native"
              description="Perfect rendering on any device. From interactive whiteboards to smartphones, the experience is flawlessly optimized."
              delay={200}
            />
            <FeatureCard
              icon={Layers}
              title="Seamless Integration"
              description="Export grades directly to your LMS. LiveQuizz integrates with tools you already use, eliminating manual data entry."
              delay={300}
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Grade Security"
              description="SOC2 compliant infrastructure ensures your student data is protected with best-in-class encryption and privacy controls."
              delay={400}
            />
            <FeatureCard
              icon={Clock}
              title="Asynchronous Modes"
              description="Assign quizzes as homework. Students complete tasks on their own time while you still receive comprehensive analytics."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ── Metrics Section ── */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard value="99.9%" label="Uptime SLA" delay={0} />
            <MetricCard value="50M+" label="Questions Answered" delay={100} />
            <MetricCard value="< 50ms" label="Average Latency" delay={200} />
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-3xl p-10 md:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to upgrade your teaching?</h2>
              <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto font-medium">
                Join thousands of educators leveraging LiveQuizz to create high-performing, interactive learning environments.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-8 py-4 rounded-xl hover:bg-white/90 hover:scale-[0.98] transition-all"
                >
                  Get started for free
                </Link>
                <Link
                  to="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/20 transition-all border border-white/5"
                >
                  Contact Sales
                </Link>
              </div>
              <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-8 text-sm text-white/40 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free 14-day trial</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancel anytime</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 24/7 Support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-16 px-6 bg-[#000]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <Hexagon className="w-5 h-5 text-white fill-white" />
              <span className="text-lg font-bold tracking-tight">LiveQuizz</span>
            </Link>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed font-medium">
              The professional standard for interactive learning, real-time analytics, and student engagement.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-3 text-sm text-white/50 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-3 text-sm text-white/50 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3 text-sm text-white/50 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-white/40">
          <p>© {new Date().getFullYear()} LiveQuizz Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
