import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, Code, ShoppingCart, ExternalLink, Grid3X3, List, ArrowUpDown, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LivePreviewModal from '../components/LivePreviewModal';

const categories = ['All', 'Web App', 'Mobile App', 'API', 'UI Kit', 'Boilerplate', 'Theme', 'Other'];

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [activePreviewProject, setActivePreviewProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/projects');
        setProjects(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden pb-8 pt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 to-transparent -z-10" />
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="section-title">
              <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="section-subtitle">Discover top-quality digital assets for your next project.</p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col lg:flex-row gap-4 mt-8"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                className="input-field pl-11 h-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field h-12 pr-10 appearance-none cursor-pointer min-w-[140px]"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low</option>
                  <option value="price-high">Price: High</option>
                  <option value="name">Name</option>
                </select>
                <ArrowUpDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-light-muted pointer-events-none" />
              </div>
              <div className="flex rounded-xl border border-light-border overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-brand-100 text-brand-600' : 'text-light-muted hover:text-light-text bg-white'}`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-all ${viewMode === 'list' ? 'bg-brand-100 text-brand-600' : 'text-light-muted hover:text-light-text bg-white'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 mt-6"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${selectedCategory === cat
                  ? 'bg-brand-100 text-brand-700 border border-brand-300 shadow-sm'
                  : 'bg-white text-light-text-secondary border border-light-border hover:border-brand-300 hover:text-brand-600'
                  }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="container mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-0 overflow-hidden animate-pulse">
                <div className="h-48 bg-light-surface" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-light-surface rounded w-3/4" />
                  <div className="h-4 bg-light-surface rounded w-full" />
                  <div className="h-4 bg-light-surface rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Code className="w-16 h-16 text-light-muted mx-auto mb-4" />
            <p className="text-xl text-light-text-secondary">No projects found</p>
            <p className="text-light-muted mt-2">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-8 ${viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'
              : 'space-y-4'
              }`}
          >
            {filteredProjects.map((project, index) => (
              viewMode === 'grid' ? (
                <ProjectCard key={project._id} project={project} index={index} onPreview={setActivePreviewProject} />
              ) : (
                <ProjectListItem key={project._id} project={project} index={index} onPreview={setActivePreviewProject} />
              )
            ))}
          </motion.div>
        )}
      </div>

      {/* Live Preview Modal */}
      <AnimatePresence>
        {activePreviewProject && (
          <LivePreviewModal
            project={activePreviewProject}
            onClose={() => setActivePreviewProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── PROJECT CARD (Grid View) ────────────────────────────────────────────────
const ProjectCard = ({ project, index, onPreview }) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (
      e.target.closest('button') ||
      e.target.closest('a')
    ) return;
    navigate(`/project/${project._id}`);
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    onPreview(project);
  };

  const hasDemoUrl = !!(project.demoUrl?.trim());
  const hasGithubUrl = !!(project.githubRepoUrl?.trim());
  const isLocalUpload = project.uploadMethod === 'local';
  const hasPreview = hasDemoUrl || hasGithubUrl || isLocalUpload;

  const framework = project.analysis?.framework || '';
  const previewStatus = project.previewStatus || '';

  const FRAMEWORK_STYLES = {
    react: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    vue: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    angular: 'bg-red-50 text-red-700 border-red-200',
    nextjs: 'bg-neutral-50 text-neutral-700 border-neutral-200',
    svelte: 'bg-orange-50 text-orange-700 border-orange-200',
    static: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={handleCardClick}
      className="glass-card-hover overflow-hidden group flex flex-col cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-light-surface to-light-bg flex items-center justify-center">
            <Code className="w-16 h-16 text-light-muted" />
          </div>
        )}
        <div className="absolute top-3 left-3 z-20 flex gap-1.5">
          <span className="badge-primary text-[11px]">{project.category}</span>
          {framework && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${FRAMEWORK_STYLES[framework] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {framework}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="badge-accent text-[11px]">
            <Star size={10} className="mr-1" fill="currentColor" /> 5.0
          </span>
        </div>

        {/* Preview health dot */}
        {isLocalUpload && (
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              previewStatus === 'ready' ? 'bg-green-500' :
              previewStatus === 'extracting' ? 'bg-amber-400 animate-pulse' :
              'bg-gray-400'
            }`} />
            <span className="text-[9px] text-white/90 drop-shadow-sm font-medium">
              {previewStatus === 'ready' ? 'Preview Ready' :
               previewStatus === 'extracting' ? 'Extracting...' :
               'Pending'}
            </span>
          </div>
        )}

        {/* Hover overlay: Click to Preview */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold shadow-lg transition-all transform hover:scale-105"
          >
            <Play size={12} fill="currentColor" />
            {hasDemoUrl ? 'Live Preview' : isLocalUpload ? 'Local Preview' : hasGithubUrl ? 'GitHub Preview' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-grow flex flex-col">
        <div>
          <div className="flex justify-between items-start gap-3 mb-2">
            <h3 className="text-lg font-bold text-light-text group-hover:text-brand-600 transition-colors line-clamp-1">
              {project.title}
            </h3>
            <span className="text-lg font-bold text-brand-600 whitespace-nowrap">${project.price}</span>
          </div>
          <p className="text-sm text-light-text-secondary line-clamp-2 mb-4 flex-grow">
            {project.shortDescription}
          </p>
        </div>

        {/* Seller + Analysis Info */}
        <div className="flex items-center justify-between text-xs text-light-muted mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-[9px] font-bold text-brand-600">
                {project.seller?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span>{project.seller?.name || 'Unknown'}</span>
          </div>
          {project.analysis?.totalFiles > 0 && (
            <span className="text-[9px] text-light-muted">
              {project.analysis.totalFiles} files
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-4 border-t border-light-border">
          <button
            onClick={handlePreview}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all border ${
              hasPreview
                ? 'bg-white hover:bg-light-surface text-light-text-secondary border-light-border hover:border-brand-300 hover:text-brand-600'
                : 'bg-white hover:bg-light-surface text-light-muted border-light-border hover:text-light-text'
            }`}
          >
            <ExternalLink size={13} />
            {hasDemoUrl ? 'Live Preview' : isLocalUpload ? 'Local Preview' : 'Preview'}
          </button>

          <Link
            to={`/checkout/${project._id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-medium transition-all shadow-md shadow-brand-500/15"
          >
            <ShoppingCart size={13} />
            Buy Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// ─── PROJECT LIST ITEM (List View) ──────────────────────────────────────────
const ProjectListItem = ({ project, index, onPreview }) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(`/project/${project._id}`);
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    onPreview(project);
  };

  const hasDemoUrl = !!(project.demoUrl?.trim());

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleCardClick}
      className="glass-card-hover p-4 flex items-center gap-6 cursor-pointer"
    >
      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-light-surface to-light-bg flex items-center justify-center">
            <Code className="w-8 h-8 text-light-muted" />
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-primary">{project.category}</span>
          <span className="text-xs text-light-muted">by {project.seller?.name || 'Unknown'}</span>
        </div>
        <h3 className="text-lg font-bold text-light-text group-hover:text-brand-600 transition-colors truncate">{project.title}</h3>
        <p className="text-sm text-light-text-secondary truncate">{project.shortDescription}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-2xl font-bold text-brand-600">${project.price}</span>
        <button
          onClick={handlePreview}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-light-surface text-light-text-secondary hover:text-brand-600 text-xs font-medium transition-all border border-light-border hover:border-brand-300 whitespace-nowrap"
        >
          <ExternalLink size={13} />
          {hasDemoUrl ? 'Live Preview' : 'Preview'}
        </button>
        <Link
          to={`/checkout/${project._id}`}
          onClick={(e) => e.stopPropagation()}
          className="btn-primary text-xs py-2.5 px-5 whitespace-nowrap"
        >
          Buy Now
        </Link>
      </div>
    </motion.div>
  );
};

export default Marketplace;
