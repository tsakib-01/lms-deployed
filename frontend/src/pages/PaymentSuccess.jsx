import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Bookmark, Calendar, Receipt, User, Globe } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authorization required to verify payment.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/verify-session?session_id=${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setTransaction(data.transaction);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err.message || 'Payment verification failed.');
        }
      } catch (err) {
        console.error('💥 Error during payment verification:', err);
        setError('Network failure while verifying purchase. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      verifyPayment();
    } else {
      setError('No session ID found.');
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Verifying your enrollment with Stripe...</p>
          <p className="text-xs text-slate-400">Please do not close this window or refresh the page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
          <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-rose-500 text-3xl font-extrabold font-mono">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Enrollment Failed</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/courses')} className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition">Browse Courses</button>
            <button onClick={() => navigate('/contact')} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition">Support Help</button>
          </div>
        </div>
      </div>
    );
  }

  const courseId = transaction?.course?._id || transaction?.course;
  const courseTitle = transaction?.course?.title || 'Premium Course';
  const pricePaid = transaction?.amount || 0;

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Confirmed checkmark bubble */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute w-24 h-24 bg-emerald-100 rounded-full animate-ping opacity-25" />
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg relative">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Payment Confirmed!</h1>
          <p className="text-sm text-slate-500">Your enrollment was processed successfully. Welcome to the class!</p>
        </div>

        {/* Premium Receipt Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left divide-y divide-slate-100 space-y-4">
          <div className="pb-4 space-y-1.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Enrolled Course</span>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600 flex-shrink-0" />
              {courseTitle}
            </h3>
          </div>

          <div className="py-4 space-y-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> Transaction ID</span>
              <span className="font-mono text-slate-800 font-medium truncate max-w-[200px]">{transaction?._id}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date & Time</span>
              <span className="font-medium text-slate-800">{new Date(transaction?.createdAt).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Instructor</span>
              <span className="font-medium text-slate-800">{transaction?.teacher?.name || 'Authorized Faculty'}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Payment System</span>
              <span className="capitalize font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] tracking-wide">
                {transaction?.paymentMethod} testnet
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between font-bold text-slate-900 text-sm">
            <span>Amount Charged</span>
            <span className="text-lg text-emerald-600 font-extrabold">${pricePaid.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Button to Enter Course Room */}
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="w-full bg-slate-900 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-slate-800 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 transform transition-all duration-150 group"
        >
          Start Learning Now
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        <p className="text-xs text-slate-400">A payment receipt and course invitation have been stored in your profile dashboard.</p>
        
      </div>
    </div>
  );
};

export default PaymentSuccess;
