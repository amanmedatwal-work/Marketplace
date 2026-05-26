import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, Download, ArrowLeft, ShoppingCart, FileCode } from 'lucide-react';

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await axios({
        url: `http://localhost:5000/api/projects/${order.project?._id}/download`,
        method: 'GET',
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${userInfo?.token}`
        }
      });

      const disposition = response.headers['content-disposition'];
      let filename = `${order.project?.title.toLowerCase().replace(/\s+/g, '_')}_project.zip`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadError('Failed to download project files. Please check if your session is active.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo?.token}` }
        };
        const { data } = await axios.get(`http://localhost:5000/api/orders/${orderId}`, config);
        setOrder(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-20 max-w-2xl text-center">
        <div className="glass-card p-10 animate-pulse space-y-4">
          <div className="w-24 h-24 rounded-full bg-light-surface mx-auto" />
          <div className="h-6 bg-light-surface rounded w-1/2 mx-auto" />
          <div className="h-4 bg-light-surface rounded w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-6 py-20 max-w-2xl text-center">
        <div className="glass-card p-10">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <ShoppingCart className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-lg text-red-500">Order not found or you don't have permission to view it.</p>
          <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2 mt-6">
            <ArrowLeft size={18} /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 md:p-10 text-center relative overflow-hidden"
        >
          {/* Decorative top gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-green-400 to-brand-500" />
          <div className="absolute -top-24 right-[-80px] w-48 h-48 bg-green-500/8 rounded-full blur-[80px]" />

          {/* Success Icon */}
          <div className="flex justify-center mb-6 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-light-text mb-2">Payment Successful!</h1>
            <p className="text-light-text-secondary mb-8">
              Thank you for your purchase of <span className="text-brand-600 font-semibold">{order.project?.title}</span>
            </p>
          </motion.div>

          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-light-surface rounded-2xl p-6 text-left mb-8 border border-light-border"
          >
            <h3 className="font-semibold text-light-text mb-4 flex items-center gap-2 text-sm">
              <FileCode size={16} className="text-brand-500" />
              Order Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-light-border">
                <span className="text-light-text-secondary">Project</span>
                <span className="font-medium text-light-text">{order.project?.title}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-light-border">
                <span className="text-light-text-secondary">Amount Paid</span>
                <span className="font-bold gradient-text text-base">${order.totalPrice}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-light-border">
                <span className="text-light-text-secondary">Order ID</span>
                <span className="font-mono text-xs text-light-text bg-white px-2 py-1 rounded border border-light-border">{order._id.slice(-12)}</span>
              </div>
              {order.paymentResult?.id && (
                <div className="flex justify-between items-center">
                  <span className="text-light-text-secondary">Transaction ID</span>
                  <span className="font-mono text-xs text-light-text bg-white px-2 py-1 rounded border border-light-border">{order.paymentResult.id.slice(-12)}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Download error banner */}
          {downloadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 text-sm py-3 px-4 rounded-xl mb-6 text-center"
            >
              {downloadError}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center relative z-10"
          >
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold transition-all shadow-md shadow-brand-500/15 group disabled:opacity-60 disabled:cursor-wait"
            >
              {downloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
                  Download Files
                </>
              )}
            </button>
            <Link to="/marketplace" className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white hover:bg-light-surface text-light-text font-semibold transition-all border border-light-border hover:border-brand-300 group">
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Browse More
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
