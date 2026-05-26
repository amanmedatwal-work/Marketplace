import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, ShoppingCart, Code, Star, User, Calendar, Tag, Globe, ShieldCheck, ChevronRight, Clock, Layers } from 'lucide-react';
import axios from 'axios';
import LivePreviewModal from '../components/LivePreviewModal';
import { apiUrl } from '../config/api';

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data } = await axios.get(apiUrl(`/api/projects/${id}`));
                setProject(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load project details.');
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                    <div className="h-6 bg-light-surface rounded w-32" />
                    <div className="h-80 bg-light-surface rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-8 bg-light-surface rounded w-3/4" />
                            <div className="h-4 bg-light-surface rounded w-full" />
                            <div className="h-4 bg-light-surface rounded w-2/3" />
                        </div>
                        <div className="h-64 bg-light-surface rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="container mx-auto px-6 py-12">
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-200">
                        <Code className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-xl text-red-500 mb-4">{error || 'Project not found.'}</p>
                    <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft size={18} /> Back to Marketplace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Back Navigation */}
            <div className="container mx-auto px-6 pt-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-light-text-secondary hover:text-brand-600 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Marketplace
                    </Link>
                </motion.div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Thumbnail */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card overflow-hidden group"
                        >
                            <div className="h-64 md:h-80 relative">
                                {project.thumbnail ? (
                                    <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-light-surface to-light-bg flex items-center justify-center">
                                        <Code className="w-24 h-24 text-light-muted" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-4">
                                    <span className="badge-primary">{project.category}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Title & Price */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-6 md:p-8"
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-light-text mb-2">{project.title}</h1>
                                    <p className="text-light-text-secondary text-sm">{project.shortDescription}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                        <Star size={16} fill="currentColor" />
                                        <span className="text-light-text font-bold text-sm">{project.ratings || '5.0'}</span>
                                    </div>
                                    <span className="text-3xl md:text-4xl font-bold gradient-text whitespace-nowrap">${project.price}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Full Description */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="glass-card p-6 md:p-8"
                        >
                            <h2 className="text-xl font-bold text-light-text mb-4 flex items-center gap-2">
                                <Globe size={20} className="text-brand-500" />
                                About This Project
                            </h2>
                            <p className="text-light-text-secondary whitespace-pre-wrap leading-relaxed">{project.detailedDescription}</p>
                        </motion.div>

                        {/* Tech Stack */}
                        {project.techStack && project.techStack.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card p-6 md:p-8"
                            >
                                <h2 className="text-xl font-bold text-light-text mb-4 flex items-center gap-2">
                                    <Layers size={20} className="text-brand-500" />
                                    Tech Stack
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {project.techStack.map((tech, idx) => (
                                        <span key={idx} className="px-3 py-1.5 rounded-xl bg-brand-50 text-sm text-brand-700 border border-brand-100 hover:border-brand-300 hover:text-brand-600 transition-all">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Project Features Placeholder */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="glass-card p-6 md:p-8"
                        >
                            <h2 className="text-xl font-bold text-light-text mb-4 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-brand-500" />
                                What's Included
                            </h2>
                            <div className="grid md:grid-cols-2 gap-3">
                                {['Full Source Code', 'Documentation', 'Installation Guide', '1 Year Updates', 'Email Support', 'Commercial License'].map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-light-text-secondary">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Price & Actions */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="glass-card p-6 sticky top-24"
                        >
                            <div className="text-center mb-6 pb-6 border-b border-light-border">
                                <span className="text-sm text-light-text-secondary">Price</span>
                                <h3 className="text-4xl md:text-5xl font-bold gradient-text mt-1">${project.price}</h3>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    to={`/checkout/${project._id}`}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold transition-all shadow-lg shadow-brand-500/15 hover:shadow-brand-500/30 group"
                                >
                                    <ShoppingCart size={18} />
                                    Buy Now
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white hover:bg-light-surface text-light-text font-semibold transition-all border border-light-border hover:border-brand-300 group"
                                >
                                    <ExternalLink size={18} className="text-brand-500" />
                                    Live Preview
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-light-border">
                                <div className="flex items-center gap-2 text-xs text-light-muted justify-center">
                                    <ShieldCheck size={14} className="text-green-500" />
                                    Secure checkout with Razorpay
                                </div>
                            </div>
                        </motion.div>

                        {/* Seller Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-6"
                        >
                            <h3 className="text-lg font-bold text-light-text mb-4 flex items-center gap-2">
                                <User size={18} className="text-brand-500" />
                                Seller
                            </h3>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
                                    {project.seller?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="font-semibold text-light-text">{project.seller?.name || 'Unknown Seller'}</p>
                                    <p className="text-xs text-light-muted">{project.seller?.email || ''}</p>
                                </div>
                            </div>
                            {project.seller?.bio && (
                                <p className="text-sm text-light-text-secondary mt-3 pt-3 border-t border-light-border">{project.seller.bio}</p>
                            )}
                        </motion.div>

                        {/* Project Meta */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                            className="glass-card p-6"
                        >
                            <h3 className="text-lg font-bold text-light-text mb-4">Project Info</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-light-text-secondary flex items-center gap-2">
                                        <Clock size={14} /> Category
                                    </span>
                                    <span className="text-light-text font-medium">{project.category}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-light-text-secondary flex items-center gap-2">
                                        <Calendar size={14} /> Listed
                                    </span>
                                    <span className="text-light-text font-medium">
                                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recently'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-light-text-secondary flex items-center gap-2">
                                        <Star size={14} /> Rating
                                    </span>
                                    <span className="text-light-text font-medium flex items-center gap-1">
                                        <Star size={12} className="text-amber-500" fill="currentColor" />
                                        {project.ratings || '5.0'} ({project.numReviews || 0} reviews)
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Live Preview Modal Overlay */}
            <AnimatePresence>
                {showPreview && (
                    <LivePreviewModal
                        project={project}
                        onClose={() => setShowPreview(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectDetails;
