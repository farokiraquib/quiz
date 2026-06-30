import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Hexagon,
  CheckCircle2,
  ChevronRight,
  Sparkles
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

/* ── Pricing Card ── */
function PricingCard({ title, duration, price, description, features, highlighted = false, delay = 0, onSelectPlan }) {
  return (
    <AnimatedSection delay={delay} className="flex h-full">
      <div className={`relative flex flex-col w-full rounded-2xl p-8 border-2 transition-all duration-300 ${
        highlighted 
          ? 'bg-[#1b3a2a] border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.15)] md:-translate-y-4 md:scale-105' 
          : 'bg-[#163022] border-white/20 hover:border-white/40'
      }`}>
        {highlighted && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-[#163022] font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg">
            <Sparkles className="w-3 h-3" /> Best Value
          </div>
        )}
        
        <div className="mb-6">
          <h3 className={`text-xl font-black font-serif uppercase tracking-tight ${highlighted ? 'text-yellow-300' : 'text-white'}`}>
            {title}
          </h3>
          {duration && <p className="text-white/60 text-sm font-semibold mt-1">{duration}</p>}
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black font-serif text-white">{price}</span>
          </div>
        </div>
        
        <p className="text-white/80 font-medium text-sm mb-8 min-h-[40px]">
          {description}
        </p>
        
        <ul className="space-y-4 mb-8 flex-1">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm font-medium text-white/90">
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${highlighted ? 'text-yellow-400' : 'text-white/40'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        {price === '₹0' ? (
          <Link
            to="/signup"
            className={`w-full text-center font-bold text-lg px-6 py-4 rounded-xl transition-all ${
              highlighted
                ? 'bg-[#fcd34d] text-[#163022] hover:bg-[#fde68a] shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none'
                : 'bg-white/10 text-white hover:bg-white/20 border-2 border-white/20'
            }`}
          >
            Get Started
          </Link>
        ) : (
          <button
            onClick={() => onSelectPlan && onSelectPlan()}
            className={`w-full text-center font-bold text-lg px-6 py-4 rounded-xl transition-all ${
              highlighted
                ? 'bg-[#fcd34d] text-[#163022] hover:bg-[#fde68a] shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none'
                : 'bg-white/10 text-white hover:bg-white/20 border-2 border-white/20'
            }`}
          >
            Choose Plan
          </button>
        )}
      </div>
    </AnimatedSection>
  );
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function Pricing() {
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check if there's an intended plan after login
    const intendedPlan = localStorage.getItem('intended_plan');
    const token = localStorage.getItem('livequizz_token');
    if (intendedPlan && token) {
      localStorage.removeItem('intended_plan');
      setTimeout(() => {
        handlePayment(intendedPlan);
      }, 500);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePayment = async (planKey) => {
    const token = localStorage.getItem('livequizz_token');
    const user = JSON.parse(localStorage.getItem('livequizz_user') || '{}');
    if (!token) {
      localStorage.setItem('intended_plan', planKey);
      navigate('/signup');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch(`${SERVER_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planKey })
      });
      const data = await res.json();

      if (!data.success) {
        alert('Failed to create order: ' + (data.error || 'Unknown error'));
        return;
      }

      const options = {
        key: 'rzp_test_So7egikyu7MjeY',
        amount: data.amount,
        currency: data.currency,
        name: 'LiveQuizz',
        description: `Upgrade to ${planKey}`,
        order_id: data.order_id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${SERVER_URL}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planKey
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert('Payment successful! Your plan has been upgraded.');
              navigate('/dashboard');
            } else {
              alert('Payment verification failed.');
            }
          } catch (err) {
            alert('Error verifying payment.');
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: '#163022'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (err) {
      alert('Error initiating payment.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            <Link to="/#features" className="hover:text-yellow-200 transition-colors">Why LiveQuizz?</Link>
            <Link to="/#how-it-works" className="hover:text-yellow-200 transition-colors">How it Works</Link>
            <Link to="/pricing" className="text-yellow-200 transition-colors">Pricing</Link>
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

      {/* ── Pricing Header ── */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-gradient-to-b from-white/[0.08] to-transparent blur-3xl pointer-events-none rounded-full z-0" />
        
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <AnimatedSection delay={0}>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6 font-serif">
              Simple pricing for <br />
              <span className="text-yellow-300 font-['Zeyada',cursive] font-normal tracking-wide text-6xl md:text-8xl block mt-2">
                every educator.
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={100}>
            <p className="text-xl text-white/90 max-w-2xl mx-auto font-medium">
              Whether you're testing it with one class or rolling it out across your entire institute, we have a plan that fits.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="pb-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            <PricingCard 
              title="The Starter"
              duration="Free Forever"
              price="₹0"
              description="Perfect for testing the platform with a single class."
              delay={0}
              features={[
                "Up to 50 students per quiz",
                "Maximum 2 quizzes per month",
                "Live real-time leaderboard"
              ]}
            />
            
            <PricingCard 
              title="Semester Pass"
              duration="6 Months"
              price="₹1,499"
              description="Perfect for short crash courses or a single academic term."
              delay={100}
              onSelectPlan={() => handlePayment('SEMESTER_PASS')}
              features={[
                "Up to 150 students per quiz",
                "Unlimited quizzes",
                "Downloadable CSV gradebook exports"
              ]}
            />
            
            <PricingCard 
              title="The Annual Pro"
              duration="12 Months"
              price="₹1,999"
              description="Perfect for full-time independent teachers wanting year-round access."
              highlighted={true}
              delay={200}
              onSelectPlan={() => handlePayment('ANNUAL_PRO')}
              features={[
                "Up to 150 students per quiz",
                "Unlimited quizzes",
                "Downloadable CSV gradebook exports",
                "Carryover quiz data between semesters"
              ]}
            />
            
            <PricingCard 
              title="The Institute"
              duration="12 Months"
              price="₹11,999"
              description="Perfect for coaching centers and private schools."
              delay={300}
              onSelectPlan={() => handlePayment('INSTITUTE')}
              features={[
                "10 Teacher Accounts included",
                "Up to 500 students per quiz (Run Mega Tests)",
                "Custom Institute Branding (Your Logo)",
                "Master Analytics Dashboard for the Owner"
              ]}
            />

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
              <li><Link to="/#features" className="hover:text-yellow-300 transition-colors">How it works</Link></li>
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
