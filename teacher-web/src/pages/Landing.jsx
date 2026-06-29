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
      <div className="group relative h-full bg-[#050505] border border-white/10 p-8 hover:border-white/30 transition-all duration-300">
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
    <AnimatedSection delay={delay} className="relative group bg-[#050505] border border-white/10">
      <div className="p-10 text-center">
        <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">{value}</div>
        <div className="text-sm font-medium text-white/50 tracking-wide">{label}</div>
      </div>
    </AnimatedSection>
  );
}

/* ════════════════════════════════════════════════════════
   LANDING PAGE (Professional + Teacher-Friendly + Grid)
   ════════════════════════════════════════════════════════ */
export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans relative">
      
      {/* ── Global Grid Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center">
        <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]"></div>
      </div>

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-white/70 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10">
              <Hexagon className="w-4 h-4 text-black fill-black" />
            </div>
            <span className="text-lg font-semibold tracking-tight relative z-10">LiveQuizz</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60 relative z-10">
            <a href="#features" className="hover:text-white transition-colors">Why LiveQuizz?</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <Link
              to="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-lg hover:bg-white/90 hover:scale-[0.98] transition-all duration-200 shadow-sm"
            >
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden border-b border-white/10">
        {/* Background Subtle Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-white/[0.05] to-transparent blur-3xl pointer-events-none rounded-full z-0" />
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <AnimatedSection delay={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#050505] border border-white/20 text-xs font-medium text-white/80 mb-8 hover:bg-white/5 transition-colors cursor-pointer">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Loved by teachers around the world <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1] mb-6">
              Make your classroom <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50">
                come alive.
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
              Create fun quizzes, see who needs help instantly, and save hours of grading. 
              The easiest way to turn any lesson into an interactive experience.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-semibold text-base px-8 py-4 rounded-xl hover:bg-white/90 hover:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              >
                Create your first quiz
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white bg-[#050505] font-medium text-base px-8 py-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all"
              >
                See how it works
              </a>
            </div>
            <p className="mt-6 text-sm text-white/40 font-medium">Free forever for teachers • No training required</p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Social Proof / Trusted By ── */}
      <section className="border-b border-white/10 bg-[#050505]/50 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-white/40 tracking-widest uppercase mb-8">
            Used in classrooms at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              { icon: Triangle, name: "Lincoln High" },
              { icon: Circle, name: "Oakridge Elem" },
              { icon: Hexagon, name: "Riverdale" },
              { icon: Square, name: "Westside Academy" },
              { icon: Activity, name: "Pioneer Middle" }
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
      <section id="features" className="py-32 px-6 relative z-10 border-b border-white/10 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Spend less time prepping. <br />
              <span className="text-white/50">Spend more time teaching.</span>
            </h2>
            <p className="text-xl text-white/50 font-medium leading-relaxed">
              We built LiveQuizz to solve real classroom problems without the tech headaches. It's simple, fast, and students love it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10 bg-white/5">
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
      <section className="py-24 border-b border-white/10 relative z-10 bg-[#050505]/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 bg-white/5">
            <MetricCard value="100%" label="Free for Teachers" delay={0} />
            <MetricCard value="50M+" label="Questions Answered" delay={100} />
            <MetricCard value="0" label="Training Required" delay={200} />
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="py-32 px-6 relative z-10 bg-[#050505]">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#050505] border border-white/20 rounded-none p-10 md:p-20 text-center relative overflow-hidden shadow-[20px_20px_0px_rgba(255,255,255,0.05)]">
            {/* Inner grid for the card */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">Ready to make learning fun?</h2>
              <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto font-medium">
                Join thousands of educators who are transforming their classrooms into engaging, interactive learning environments.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-8 py-4 rounded-xl hover:bg-white/90 hover:scale-[0.98] transition-all"
                >
                  Start your free account
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-all border border-white/20"
                >
                  Log In
                </Link>
              </div>
              <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-10 text-sm text-white/50 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Always Free</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited Students</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Downloads</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-16 px-6 bg-[#000] relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <Hexagon className="w-5 h-5 text-white fill-white" />
              <span className="text-lg font-bold tracking-tight">LiveQuizz</span>
            </Link>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed font-medium">
              The easiest way to create interactive quizzes and engage every student in your classroom.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-3 text-sm text-white/50 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Teacher Guide</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-3 text-sm text-white/50 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3 text-sm text-white/50 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-white/40">
          <p>© {new Date().getFullYear()} LiveQuizz Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Facebook Group</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
