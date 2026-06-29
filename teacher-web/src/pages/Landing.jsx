import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Users,
  BarChart3,
  Smartphone,
  PenLine,
  Share2,
  Play,
  Star,
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Heart,
  CheckCircle2,
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
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

/* ── Animated Section wrapper ── */
function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-10'
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
      <div className="group relative h-full">
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
        <div className="relative h-full landing-glass-card rounded-2xl p-6 md:p-8 transition-all duration-500 group-hover:border-white/20 group-hover:translate-y-[-4px] group-hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.06)]">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500">
            <Icon className="w-6 h-6 text-white/80" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-3 tracking-tight">{title}</h3>
          <p className="text-white/50 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </AnimatedSection>
  );
}

/* ── Step Card ── */
function StepCard({ number, icon: Icon, title, description, delay }) {
  return (
    <AnimatedSection delay={delay} className="relative">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-xl scale-150" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-white/90" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-black text-sm font-bold flex items-center justify-center shadow-lg">
            {number}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>
    </AnimatedSection>
  );
}

/* ── Testimonial Card ── */
function TestimonialCard({ quote, name, role, delay }) {
  return (
    <AnimatedSection delay={delay}>
      <div className="landing-glass-card rounded-2xl p-6 md:p-8 h-full flex flex-col">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
          ))}
        </div>
        <p className="text-white/70 text-sm leading-relaxed flex-1 italic">"{quote}"</p>
        <div className="mt-5 pt-5 border-t border-white/5">
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-white/40 text-xs mt-0.5">{role}</p>
        </div>
      </div>
    </AnimatedSection>
  );
}

/* ── Floating particles (decorative) ── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/[0.03]"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `landing-float ${Math.random() * 10 + 15}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════════════════════ */
export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50
            ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight">LiveQuizz</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm text-white/60 hover:text-white transition-colors duration-200 px-4 py-2"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-black px-5 py-2.5 rounded-xl hover:bg-white/90 hover:scale-[0.98] active:scale-[0.96] transition-all duration-200"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[120px]"
            style={{
              background: 'radial-gradient(circle, white, transparent)',
              top: '10%',
              left: '50%',
              transform: `translate(-50%, ${scrollY * 0.1}px)`,
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[100px]"
            style={{
              background: 'radial-gradient(circle, #818cf8, transparent)',
              bottom: '10%',
              right: '10%',
              transform: `translateY(${scrollY * -0.05}px)`,
            }}
          />
        </div>
        <FloatingParticles />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-8 animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Loved by 10,000+ teachers worldwide
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            Make Learning
            <br />
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                Unforgettable
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-white/10 to-transparent rounded-full" />
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            Create fun quizzes in minutes, share a code with your students,
            and watch them compete in real time. It's the easiest way to make
            every lesson exciting.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <Link
              to="/signup"
              className="group inline-flex items-center gap-3 bg-white text-black font-semibold text-base sm:text-lg px-8 py-4 rounded-2xl hover:bg-white/90 hover:scale-[0.98] active:scale-[0.96] transition-all duration-200 shadow-[0_0_60px_-15px_rgba(255,255,255,0.2)]"
            >
              Start Teaching — It's Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white font-medium text-sm sm:text-base px-6 py-4 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
            >
              <Play className="w-4 h-4" />
              See How It Works
            </a>
          </div>

          {/* Social proof avatars */}
          <div
            className="mt-12 flex items-center justify-center gap-3 animate-fade-in-up"
            style={{ animationDelay: '500ms' }}
          >
            <div className="flex -space-x-2">
              {['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map(
                (bg, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full ${bg} border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold text-white`}
                  >
                    {['SM', 'JD', 'AR', 'KM', 'LP'][i]}
                  </div>
                )
              )}
            </div>
            <p className="text-xs text-white/40">
              <span className="text-white/70 font-semibold">4.9/5</span> from 2,000+ reviews
            </p>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">Why Teachers Love It</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Everything You Need to
              <br />
              <span className="text-white/60">Engage Your Classroom</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              No complicated setup. No training required. Just create, share, and teach.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <FeatureCard
              icon={Zap}
              title="Create Quizzes in Minutes"
              description="Type your questions, add answer choices, and your quiz is ready. It's as simple as making a grocery list."
              delay={0}
            />
            <FeatureCard
              icon={Users}
              title="Students Join Instantly"
              description="Share a short code with your class. Students type it on any device — no downloads, no accounts needed."
              delay={100}
            />
            <FeatureCard
              icon={BarChart3}
              title="Live Results & Leaderboards"
              description="Watch answers come in live. See a leaderboard after each question. Students love the friendly competition!"
              delay={200}
            />
            <FeatureCard
              icon={Smartphone}
              title="Works on Any Device"
              description="Phones, tablets, laptops, Chromebooks — if it has a browser, your students can play. No app required."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="relative py-24 sm:py-32 px-4 sm:px-6">
        {/* Subtle background accent */}
        <div className="absolute inset-0">
          <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.02] blur-[100px] bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">Simple as 1-2-3</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Up and Running
              <br />
              <span className="text-white/60">in Under 5 Minutes</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Connector lines (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10" />

            <StepCard
              number={1}
              icon={PenLine}
              title="Create Your Quiz"
              description="Type your questions and answer choices. Choose how much time students get. That's it — no templates needed!"
              delay={0}
            />
            <StepCard
              number={2}
              icon={Share2}
              title="Share the Code"
              description="Tell your class the short code that appears on screen. They open any browser and enter it — instant connection."
              delay={150}
            />
            <StepCard
              number={3}
              icon={Play}
              title="Play & Learn Together"
              description="Start the quiz and watch the magic. Students answer on their devices while you control the pace on yours."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ── Stats / Social Proof Bar ── */}
      <section className="py-16 px-4 sm:px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { value: '10K+', label: 'Teachers' },
              { value: '500K+', label: 'Quizzes Created' },
              { value: '2M+', label: 'Students Played' },
              { value: '4.9/5', label: 'Average Rating' },
            ].map((stat, i) => (
              <AnimatedSection key={i} delay={i * 100} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/40">{stat.label}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">Loved by Educators</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Hear from Teachers
              <br />
              <span className="text-white/60">Like You</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <TestimonialCard
              quote="My students used to groan at review days. Now they literally cheer when I pull up LiveQuizz. The live leaderboard makes every lesson feel like a game show!"
              name="Sarah Mitchell"
              role="5th Grade Teacher, Austin TX"
              delay={0}
            />
            <TestimonialCard
              quote="I'm not tech-savvy at all, and I had my first quiz running in under 3 minutes. The kids just type in a code — no downloads, no sign-ups. So refreshing."
              name="James Donovan"
              role="High School History, Seattle WA"
              delay={100}
            />
            <TestimonialCard
              quote="I use LiveQuizz for vocabulary review every Friday. Student engagement went up 80%. The best part? It works on every device my students have."
              name="Priya Kapoor"
              role="ESL Teacher, Chicago IL"
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[600px] h-[400px] rounded-full opacity-[0.04] blur-[120px] bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <div className="landing-glass-card rounded-3xl p-10 sm:p-16 border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8 text-white/80" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Ready to Transform
                <br />
                Your Classroom?
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Join thousands of teachers who are making learning fun, interactive, and unforgettable. It takes just 60 seconds to get started.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-3 bg-white text-black font-semibold px-8 py-4 rounded-2xl hover:bg-white/90 hover:scale-[0.98] active:scale-[0.96] transition-all duration-200 shadow-[0_0_60px_-15px_rgba(255,255,255,0.2)]"
                >
                  Create Your First Quiz
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/30">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Free forever
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> No credit card
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready in 60 seconds
                </span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-sm font-bold">LiveQuizz</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <a href="#how-it-works" className="hover:text-white/60 transition-colors">How It Works</a>
              <Link to="/login" className="hover:text-white/60 transition-colors">Log In</Link>
              <Link to="/signup" className="hover:text-white/60 transition-colors">Sign Up</Link>
            </div>
            <p className="text-xs text-white/20 flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for teachers everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
