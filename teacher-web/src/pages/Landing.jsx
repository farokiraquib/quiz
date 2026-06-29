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
  Heart,
  Shield,
  Home
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
      className={`transition-all duration-1000 ease-out relative z-10 ${
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

/* ── Feature Card ── */
function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <AnimatedSection delay={delay}>
      <div className="group relative h-full bg-[#1b3a2a] border border-white/20 p-8 hover:border-white/40 transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
          <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-white/80 leading-relaxed font-medium">{description}</p>
      </div>
    </AnimatedSection>
  );
}

/* ── Metric Card ── */
function MetricCard({ value, label, delay }) {
  return (
    <AnimatedSection delay={delay} className="relative group bg-[#1b3a2a] border border-white/20">
      <div className="p-10 text-center">
        <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 font-serif">{value}</div>
        <div className="text-sm font-semibold text-white/70 tracking-widest uppercase">{label}</div>
      </div>
    </AnimatedSection>
  );
}

/* ════════════════════════════════════════════════════════
   LANDING PAGE (Chalkboard / School Theme)
   ════════════════════════════════════════════════════════ */
export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#163022] text-white selection:bg-yellow-200 selection:text-black font-sans relative bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:32px_32px]">

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrollY > 20
            ? 'bg-[#163022]/90 backdrop-blur-md border-white/20 py-3'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#fcd34d] flex items-center justify-center shadow-[0_0_10px_rgba(252,211,77,0.3)] relative z-10 border-2 border-white/20">
              <Hexagon className="w-4 h-4 text-[#163022] fill-[#163022]" />
            </div>
            <span className="text-lg font-bold tracking-tight relative z-10 font-serif">LiveQuizz</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/80 relative z-10">
            <a href="#features" className="hover:text-yellow-200 transition-colors">Why LiveQuizz?</a>
            <a href="#how-it-works" className="hover:text-yellow-200 transition-colors">How it Works</a>
            <Link to="/pricing" className="hover:text-yellow-200 transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <Link
              to="/login"
              className="text-sm font-semibold text-white/90 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-bold bg-[#fcd34d] text-[#163022] px-5 py-2.5 rounded-lg hover:bg-[#fde68a] hover:scale-[0.98] transition-all duration-200 shadow-sm border border-[#f59e0b]"
            >
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-16 md:pt-48 md:pb-32 px-4 sm:px-6 overflow-hidden border-b border-white/20">
        {/* Subtle glow behind hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-gradient-to-b from-white/[0.08] to-transparent blur-3xl pointer-events-none rounded-full z-0" />
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <AnimatedSection delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1b3a2a] border border-white/30 text-xs font-bold text-white/90 mb-8 hover:bg-white/10 transition-colors cursor-pointer shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
              Loved by teachers around the world <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-6 font-serif">
              Make your classroom <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fde68a] to-[#f59e0b] font-['Zeyada',cursive] font-normal tracking-wide text-6xl sm:text-8xl md:text-9xl block sm:inline mt-2 sm:mt-0">
                come alive.
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <p className="text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
              Create fun quizzes, see who needs help instantly, and save hours of grading. 
              The easiest way to turn any lesson into an interactive experience.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#fcd34d] text-[#163022] font-bold text-lg px-8 py-4 rounded-xl hover:bg-[#fde68a] hover:scale-[0.98] transition-all shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none"
              >
                Create your first quiz
                <ChevronRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white bg-[#1b3a2a] font-bold text-lg px-8 py-4 rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all"
              >
                See how it works
              </a>
            </div>
            <p className="mt-8 text-sm text-white/70 font-semibold">Free forever for teachers • No training required</p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Social Proof / Trusted By ── */}
      <section className="border-b border-white/20 bg-[#12261a] py-12 relative z-10 overflow-hidden">
        <div className="w-full">
          <p className="text-center text-xs font-bold text-white/60 tracking-widest uppercase mb-8">
            Used in classrooms at
          </p>
          <div className="w-full relative flex [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)] overflow-hidden">
            <div className="animate-marquee flex gap-12 md:gap-24 w-max whitespace-nowrap px-6 md:px-12 text-white/70 font-serif items-center">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-12 md:gap-24">
                  <div className="flex items-center gap-2 group cursor-default">
                    <Triangle className="w-6 h-6 group-hover:text-yellow-300 transition-colors" />
                    <span className="text-xl font-bold tracking-tight group-hover:text-yellow-300 transition-colors">Lincoln High</span>
                  </div>
                  <div className="flex items-center gap-2 group cursor-default">
                    <Circle className="w-6 h-6 group-hover:text-yellow-300 transition-colors" />
                    <span className="text-xl font-bold tracking-tight group-hover:text-yellow-300 transition-colors">Oakridge Elem</span>
                  </div>
                  <div className="flex items-center gap-2 group cursor-default">
                    <Hexagon className="w-6 h-6 group-hover:text-yellow-300 transition-colors" />
                    <span className="text-xl font-bold tracking-tight group-hover:text-yellow-300 transition-colors">Riverdale</span>
                  </div>
                  <div className="flex items-center gap-2 group cursor-default">
                    <Square className="w-6 h-6 group-hover:text-yellow-300 transition-colors" />
                    <span className="text-xl font-bold tracking-tight group-hover:text-yellow-300 transition-colors">Westside Academy</span>
                  </div>
                  <div className="flex items-center gap-2 group cursor-default">
                    <Activity className="w-6 h-6 group-hover:text-yellow-300 transition-colors" />
                    <span className="text-xl font-bold tracking-tight group-hover:text-yellow-300 transition-colors">Pioneer Middle</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Value / Features ── */}
      <section id="features" className="py-20 md:py-32 px-4 md:px-6 relative z-10 border-b border-white/20 bg-[#163022]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-16">
            <h2 className="text-3xl md:text-6xl font-black tracking-tight mb-6 font-serif">
              Spend less time prepping. <br />
              <span className="text-yellow-300 font-['Zeyada',cursive] font-normal tracking-wide text-4xl md:text-7xl block mt-1 md:inline md:mt-0">Spend more time teaching.</span>
            </h2>
            <p className="text-xl text-white/90 font-medium leading-relaxed">
              We built LiveQuizz to solve real classroom problems without the tech headaches. It's simple, fast, and students love it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/20 bg-[#1b3a2a]">
            <FeatureCard
              icon={Zap}
              title="No Setup Required"
              description="Launch a quiz in seconds. Students join instantly with a simple short code—no apps to download or accounts to create."
              delay={0}
            />
            <FeatureCard
              icon={BarChart3}
              title="Instant Insights"
              description="See exactly who's struggling and who's excelling as they answer. Adjust your lesson on the fly based on live results."
              delay={100}
            />
            <FeatureCard
              icon={Smartphone}
              title="Works on Any Device"
              description="Whether your students have iPads, Chromebooks, or smartphones, LiveQuizz works perfectly on all of them."
              delay={200}
            />
            <FeatureCard
              icon={Heart}
              title="Saves You Time"
              description="Automatic grading means you never have to take a stack of papers home again. Spend your evenings relaxing."
              delay={300}
            />
            <FeatureCard
              icon={Shield}
              title="Safe & Private"
              description="Your students' data is kept completely private. We don't ask for personal information from your students."
              delay={400}
            />
            <FeatureCard
              icon={Home}
              title="Homework Mode"
              description="Assign quizzes for practice at home. Students complete them at their own pace, and you still get all the results."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ── Metrics Section ── */}
      <section className="py-24 border-b border-white/20 relative z-10 bg-[#12261a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/20 bg-[#1b3a2a]">
            <MetricCard value="100%" label="Free for Teachers" delay={0} />
            <MetricCard value="50M+" label="Questions Answered" delay={100} />
            <MetricCard value="0" label="Training Required" delay={200} />
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="py-20 md:py-32 px-4 md:px-6 relative z-10 bg-[#163022]">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#1b3a2a] border-4 border-[#12261a] rounded-xl p-8 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Inner grid for the card */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl mb-6 font-['Zeyada',cursive] font-normal tracking-wide text-yellow-300 leading-tight">Ready to make learning fun?</h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
                Join thousands of educators who are transforming their classrooms into engaging, interactive learning environments.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#fcd34d] text-[#163022] font-bold text-xl px-8 py-4 rounded-xl hover:bg-[#fde68a] transition-all shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none"
                >
                  Start your free account
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-white font-bold text-xl px-8 py-4 rounded-xl hover:bg-white/10 transition-all border-2 border-white/30"
                >
                  Log In
                </Link>
              </div>
              <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12 text-sm text-white/80 font-bold">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-yellow-300" /> Always Free</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-yellow-300" /> Unlimited Students</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-yellow-300" /> No Downloads</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/20 py-16 px-6 bg-[#0f2117] relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#fcd34d] flex items-center justify-center">
                <Hexagon className="w-5 h-5 text-[#163022] fill-[#163022]" />
              </div>
              <span className="text-2xl font-black tracking-tight font-serif text-white">LiveQuizz</span>
            </Link>
            <p className="text-base text-white/70 max-w-xs leading-relaxed font-medium">
              The easiest way to create interactive quizzes and engage every student in your classroom.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white uppercase tracking-wider text-sm">Product</h4>
            <ul className="space-y-3 text-sm text-white/70 font-medium">
              <li><a href="#how-it-works" className="hover:text-yellow-300 transition-colors">How it works</a></li>
              <li><Link to="/pricing" className="hover:text-yellow-300 transition-colors">Pricing</Link></li>
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Teacher Guide</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-3 text-sm text-white/70 font-medium">
              <li><a href="#" className="hover:text-yellow-300 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Contact Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white uppercase tracking-wider text-sm">Legal</h4>
            <ul className="space-y-3 text-sm text-white/70 font-medium">
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-yellow-300 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-white/50">
          <p>© {new Date().getFullYear()} LiveQuizz Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-yellow-300 transition-colors">Twitter</a>
            <a href="#" className="hover:text-yellow-300 transition-colors">Facebook Group</a>
            <a href="#" className="hover:text-yellow-300 transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
