import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, Lock, Landmark, User, Calendar, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SimulatedCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const courseId = searchParams.get('courseId');
  const studentId = searchParams.get('studentId');
  const sessionId = searchParams.get('sessionId');
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Card state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Fetch course details
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) fetchCourse();
  }, [courseId, user]);

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    // Format card with spaces: 4242 4242 4242 4242
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(value);
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/29');
    setCardCvc('424');
    setCardName(user?.name || 'Jane Doe');
    setErrors({});
  };

  const validate = () => {
    const tempErrors = {};
    if (!cardName.trim()) tempErrors.cardName = 'Name on card is required';
    if (cardNumber.replace(/\s/g, '').length < 16) tempErrors.cardNumber = 'Enter a valid 16-digit card number';
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) tempErrors.cardExpiry = 'Enter expiry date as MM/YY';
    if (cardCvc.length < 3) tempErrors.cardCvc = 'Enter valid CVC';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/complete-simulated-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          studentId,
          sessionId
        })
      });
      
      if (response.ok) {
        setSuccess(true);
        // Simulate delay for success feedback
        setTimeout(() => {
          navigate(`/payment/success?session_id=${sessionId}`);
        }, 1500);
      } else {
        const err = await response.json();
        alert(err.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      alert('Network error during payment processing');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Securing checkout session...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border p-6 text-center shadow-sm">
          <p className="text-red-500 text-6xl mb-4">✕</p>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Session</h2>
          <p className="text-sm text-slate-500 mb-6">We could not load your checkout session. Please try again from the course page.</p>
          <button onClick={() => navigate('/courses')} className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition">Browse Courses</button>
        </div>
      </div>
    );
  }

  const adminFee = (course.price * 0.2).toFixed(2);
  const teacherEarnings = (course.price * 0.8).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Course Summary Page Section (Left side) */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold uppercase tracking-wider">Premium Course</span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-3">{course.title}</h2>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
          </div>

          {course.thumbnail && (
            <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200">
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Pricing detail split showing Gross / Admin (20%) / Teacher (80%) */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pricing Split Breakdown</h3>
            
            <div className="flex justify-between text-sm text-slate-600">
              <span>Gross Tuition Price</span>
              <span className="font-semibold text-slate-900">${course.price?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
                University Service Fee (20%)
              </span>
              <span className="font-semibold text-slate-800">${adminFee}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Instructor Compensation (80%)
              </span>
              <span className="font-semibold text-slate-800">${teacherEarnings}</span>
            </div>

            <div className="flex justify-between items-center text-base font-bold text-slate-900 border-t border-slate-100 pt-4">
              <span>Total Price Paid</span>
              <span className="text-xl text-blue-600">${course.price?.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 text-xs text-slate-500 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Demonstration Mode</p>
              <p className="mt-0.5">This platform resides inside a university demonstration sandbox. Payments are fully simulated—no real banking details are required or charged.</p>
            </div>
          </div>
        </div>

        {/* Credit Card Payment Section (Right side) */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-300" />
                University Sandboxed Checkout
              </h2>
              <p className="text-xs text-slate-400 mt-1">Accepts all standard student cards & mock details</p>
            </div>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between bg-sky-50 border border-sky-100 rounded-xl p-4 mb-6">
              <div className="text-xs text-sky-800">
                <p className="font-semibold">Quick Sandbox Payment Demo</p>
                <p className="mt-0.5">Fill in standard credentials automatically using the fast-fill button.</p>
              </div>
              <button 
                type="button" 
                onClick={fillTestCard}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm"
              >
                Auto Fill Mock Details
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Cardholder Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-950/10 focus:border-slate-400 outline-none transition-all"
                    placeholder="e.g. Sarah Ahmed"
                    required
                  />
                </div>
                {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-950/10 focus:border-slate-400 outline-none transition-all font-mono"
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                </div>
                {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Expiration Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-950/10 focus:border-slate-400 outline-none transition-all font-mono"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Security Code (CVC)</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={cardCvc}
                      onChange={handleCvcChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-950/10 focus:border-slate-400 outline-none transition-all font-mono"
                      placeholder="123"
                      required
                    />
                  </div>
                  {errors.cardCvc && <p className="text-red-500 text-xs mt-1">{errors.cardCvc}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || success}
                className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-50 mt-6 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transform transition-all duration-150"
              >
                {success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400 animate-bounce" />
                    Payment Success! Redirecting...
                  </>
                ) : submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Payment & Enrollment...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Complete Enrollment Purchase
                  </>
                )}
              </button>

            </form>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default SimulatedCheckout;
