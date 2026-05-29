import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download, ArrowLeft, ShoppingCart, FileCode, FileText, Star, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { apiUrl } from '../config/api';

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const handleDownloadReceipt = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

      // 1. Header design
      doc.setFillColor(139, 92, 246); // Brand Color (purple-500)
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('DEVELOPER MARKETPLACE', 20, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('PAYMENT RECEIPT / INVOICE', 140, 25);

      // 2. Receipt metadata
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details:', 20, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt ID: ${order._id}`, 20, 62);
      doc.text(`Transaction ID: ${order.paymentResult?.id || 'N/A'}`, 20, 68);
      doc.text(`Date: ${new Date(order.paidAt || Date.now()).toLocaleDateString()}`, 20, 74);
      doc.text(`Payment Status: Paid`, 20, 80);

      // Buyer Details
      doc.setFont('helvetica', 'bold');
      doc.text('Billed To:', 120, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${userInfo.name || 'Customer'}`, 120, 62);
      doc.text(`Email: ${userInfo.email || ''}`, 120, 68);

      // Divider line
      doc.setDrawColor(220, 220, 220);
      doc.line(20, 90, 190, 90);

      // 3. Table header
      doc.setFillColor(245, 245, 247);
      doc.rect(20, 98, 170, 10, 'F');

      doc.setFont('helvetica', 'bold');
      doc.text('Product / Project Title', 25, 104);
      doc.text('Qty', 130, 104);
      doc.text('Price', 160, 104);

      // Table row
      doc.setFont('helvetica', 'normal');
      doc.text(order.project?.title || 'Project Source Code', 25, 118);
      doc.text('1', 130, 118);
      doc.text(`$${order.totalPrice}`, 160, 118);

      // Table divider
      doc.line(20, 126, 190, 126);

      // Summary
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount Paid:', 110, 138);
      doc.setFontSize(12);
      doc.text(`$${order.totalPrice}`, 160, 138);

      // Convert to INR estimated value
      const inrPrice = Math.round(order.totalPrice * 83);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text(`(~ INR ${inrPrice})`, 160, 143);

      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('This is a computer-generated receipt and does not require a physical signature.', 20, 260);
      doc.text('Thank you for supporting developers worldwide!', 20, 266);

      // Save PDF
      doc.save(`receipt_${order._id.slice(-8)}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Could not generate PDF receipt.');
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await axios({
        url: apiUrl(`/api/projects/${order.project?._id}/download`),
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
    if (!loading && order) {
      const timer = setTimeout(() => {
        const hasRated = sessionStorage.getItem(`rated_${order.project?._id}`);
        if (!hasRated) {
          setShowRatingPopup(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, order]);

  const handleRatingSubmit = async (value) => {
    if (submittingRating) return;
    setSubmittingRating(true);
    setRatingError('');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`
        }
      };
      await axios.post(
        apiUrl(`/api/projects/${order.project?._id}/rate`),
        { rating: value },
        config
      );
      setRatingSubmitted(true);
      sessionStorage.setItem(`rated_${order.project?._id}`, 'true');
      setTimeout(() => {
        setShowRatingPopup(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setRatingError('Could not submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo?.token}` }
        };
        const { data } = await axios.get(apiUrl(`/api/orders/${orderId}`), config);
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
            className="space-y-3 relative z-10 w-full"
          >
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
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

              <button 
                onClick={handleDownloadReceipt}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold transition-all shadow-md shadow-emerald-500/15 group"
              >
                <FileText size={18} className="group-hover:-translate-y-1 transition-transform" />
                Download Receipt
              </button>
            </div>

            <Link to="/marketplace" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white hover:bg-light-surface text-light-text font-semibold transition-all border border-light-border hover:border-brand-300 group">
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Browse More
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Right Rating Popup */}
      <AnimatePresence>
        {showRatingPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-40 w-80 glass-card p-5 shadow-2xl border border-light-border/80 bg-white/95 backdrop-blur-xl"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowRatingPopup(false)}
              className="absolute top-3 right-3 text-light-muted hover:text-light-text transition-colors"
            >
              <X size={16} />
            </button>

            {!ratingSubmitted ? (
              <div>
                <h4 className="text-sm font-bold text-light-text mb-1">Rate your experience</h4>
                <p className="text-xs text-light-text-secondary mb-4">
                  How would you rate <span className="font-semibold text-brand-600">{order.project?.title}</span>?
                </p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        handleRatingSubmit(star);
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform active:scale-95 duration-100"
                      disabled={submittingRating}
                    >
                      <Star
                        size={28}
                        className={`transition-colors duration-150 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-light-border hover:text-amber-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {ratingError && (
                  <p className="text-xs text-red-500 text-center mt-2">{ratingError}</p>
                )}

                <p className="text-[10px] text-light-muted text-center">
                  Click a star to instantly submit your rating
                </p>
              </div>
            ) : (
              <div className="text-center py-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-200"
                >
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </motion.div>
                <h4 className="text-sm font-bold text-light-text mb-1">Thank you!</h4>
                <p className="text-xs text-light-text-secondary">Your feedback helps the community.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentSuccess;
