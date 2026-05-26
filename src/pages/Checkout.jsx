import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, AlertCircle, ShoppingCart, ArrowLeft, CreditCard, ChevronRight } from 'lucide-react';

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/projects/${id}`);
        setProject(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load project details.');
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const initPayment = (data) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!window.Razorpay) {
      setError('Payment gateway SDK (Razorpay) failed to load. Please refresh the page or check your internet connection.');
      setProcessing(false);
      return;
    }
    const options = {
      key: "rzp_test_StI3EJ4JSfgGF2",
      amount: data.amount,
      currency: data.currency,
      name: "Developer Marketplace",
      description: `Purchase of ${project.title}`,
      order_id: data.id,
      handler: async (response) => {
        try {
          setProcessing(true);
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          const verifyUrl = "http://localhost:5000/api/orders/verify";
          const { data: verifyData } = await axios.post(verifyUrl, {
            ...response,
            projectId: project._id,
          }, config);

          navigate(`/success/${verifyData.order._id}`);
        } catch (err) {
          setError(err.response?.data?.message || 'Payment Verification Failed.');
          setProcessing(false);
        }
      },
      prefill: {
        name: userInfo.name,
        email: userInfo.email,
        contact: "9999999999",
      },
      theme: {
        color: "#8b5cf6",
      },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo) {
        setError('You must be logged in to purchase.');
        setProcessing(false);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      if (project.price === 0) {
        const { data } = await axios.post(
          'http://localhost:5000http://localhost:5000/api/orders',
          { projectId: id, paymentMethod: 'Free' },
          config
        );
        navigate(`/success/${data._id}`);
        setProcessing(false);
        return;
      }

      const { data } = await axios.post(
        'http://localhost:5000http://localhost:5000/api/orders/razorpay',
        { projectId: id },
        config
      );

      initPayment(data);
      setProcessing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize payment.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="glass-card p-8 space-y-4">
            <div className="h-6 bg-light-surface rounded w-1/2" />
            <div className="h-32 bg-light-surface rounded-xl" />
            <div className="h-4 bg-light-surface rounded w-3/4" />
          </div>
          <div className="glass-card p-8 space-y-4">
            <div className="h-6 bg-light-surface rounded w-1/2" />
            <div className="h-10 bg-light-surface rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-xl text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const inrPrice = Math.round(project.price * 83);

  return (
    <div className="min-h-screen">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 to-transparent -z-10 h-96" />

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-light-text-secondary hover:text-brand-600 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-3 space-y-6"
          >
            <div className="glass-card p-6 md:p-8">
              <h2 className="text-xl font-bold text-light-text mb-6 flex items-center gap-2">
                <ShoppingCart size={20} className="text-brand-500" />
                Order Summary
              </h2>

              <div className="flex items-start gap-4 pb-6 mb-6 border-b border-light-border">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-light-surface to-light-bg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-light-muted" />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-light-text">{project.title}</h3>
                  <p className="text-sm text-light-text-secondary mt-1 line-clamp-2">{project.shortDescription}</p>
                </div>
                <span className="text-xl font-bold gradient-text whitespace-nowrap">${project.price}</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary">Subtotal</span>
                  <span className="text-light-text">${project.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary">Platform Fee</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary">Tax</span>
                  <span className="text-light-text-secondary">Included</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-light-border">
                  <span className="text-light-text font-semibold">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold gradient-text">${project.price}</span>
                    <span className="text-xs text-light-muted block">~ ₹{inrPrice}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-light-text mb-4">What you'll get</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Full Source Code',
                  'Documentation Included',
                  '1 Year Updates',
                  'Email Support'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-light-text-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Payment Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2"
          >
            <div className="glass-card p-6 md:p-8 sticky top-24">
              <h2 className="text-xl font-bold text-light-text mb-2 flex items-center gap-2">
                <ShieldCheck className="text-brand-500" size={20} />
                Secure Checkout
              </h2>
              <p className="text-xs text-light-muted mb-6">Pay securely via Razorpay</p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-6">
                <div className="bg-light-surface rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard size={16} className="text-brand-500" />
                    <span className="text-light-text">Credit / Debit Card</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <img src="https://cdn.razorpay.com/assets/upi.svg" alt="UPI" className="w-4 h-4" />
                    <span className="text-light-text">UPI (GPay, Paytm, PhonePe)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <img src="https://cdn.razorpay.com/assets/netbanking.svg" alt="Netbanking" className="w-4 h-4" />
                    <span className="text-light-text">Netbanking</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/15 disabled:opacity-60 group relative overflow-hidden bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Initializing Gateway...
                      </>
                    ) : (
                      <>
                        Pay ₹{inrPrice}
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>

                <div className="flex items-center gap-2 text-xs text-light-muted justify-center">
                  <Lock size={12} className="text-green-500" />
                  256-bit SSL Encrypted
                </div>

                <div className="flex justify-center">
                  <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-5 opacity-40" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
