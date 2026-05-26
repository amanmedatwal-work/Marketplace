import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Package, DollarSign, Eye, AlertCircle, CheckCircle2, FileCode, Tag,
  UploadCloud, GitBranch, Search, Link as LinkIcon, FileArchive,
  LayoutDashboard, TrendingUp, X, FolderOpen, Cloud, Settings, Store, ArrowRight
} from 'lucide-react';
import { apiUrl } from '../config/api';

const getRepoInfo = (url) => {
  if (!url) return null;
  const cleanUrl = url.replace(/\/$/, '');
  const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }
  return null;
};

const fetchProjectScreenshot = async (owner, repo, defaultBranch = 'main', token = '') => {
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
    if (contentsRes.ok) {
      const files = await contentsRes.json();
      if (Array.isArray(files)) {
        const imageFile = files.find(file => {
          if (file.type !== 'file') return false;
          const name = file.name.toLowerCase();
          const isImg = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp');
          const isKeyword = name.includes('screenshot') || name.includes('preview') || name.includes('thumbnail') || name.includes('hero') || name.includes('cover') || name.includes('design') || name.includes('app');
          return isImg && isKeyword;
        });
        if (imageFile && imageFile.download_url) return imageFile.download_url;
        const anyImageFile = files.find(file => {
          if (file.type !== 'file') return false;
          const name = file.name.toLowerCase();
          return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp');
        });
        if (anyImageFile && anyImageFile.download_url) return anyImageFile.download_url;
      }
    }
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      const markdown = decodeURIComponent(escape(atob(readmeData.content.replace(/\s/g, ''))));
      const mdImageMatch = markdown.match(/!\[.*?\]\((.*?)\)/);
      if (mdImageMatch && mdImageMatch[1]) {
        let imgUrl = mdImageMatch[1].trim();
        if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
          const cleanPath = imgUrl.replace(/^\.\//, '');
          imgUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${cleanPath}`;
        }
        return imgUrl;
      }
      const htmlImageMatch = markdown.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
      if (htmlImageMatch && htmlImageMatch[1]) {
        let imgUrl = htmlImageMatch[1].trim();
        if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
          const cleanPath = imgUrl.replace(/^\.\//, '');
          imgUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${cleanPath}`;
        }
        return imgUrl;
      }
    }
  } catch (err) {
    console.error('Error fetching project screenshot:', err);
  }
  return null;
};

const fetchWebsiteScreenshot = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`);
    const data = await res.json();
    if (data && data.status === 'success' && data.data && data.data.screenshot) {
      return data.data.screenshot.url;
    }
  } catch (err) {
    console.error('Error fetching website screenshot:', err);
  }
  return `https://image.thum.io/get/width/1200/crop/800/${url}`;
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    detailedDescription: '',
    techStack: '',
    category: 'Web App',
    price: '',
    demoUrl: '',
    uploadMethod: 'local',
    githubRepoUrl: '',
    fileUrl: '',
    thumbnail: '',
  });

  const [useCustomThumbnail, setUseCustomThumbnail] = useState(false);
  const [fetchingRepoDetails, setFetchingRepoDetails] = useState(false);
  const [repoScreenshotUrl, setRepoScreenshotUrl] = useState('');

  const [githubUsername, setGitBranchUsername] = useState('');
  const [githubRepos, setGitBranchRepos] = useState([]);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [modalInput, setModalInput] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notSeller, setNotSeller] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const fileInputRef = useRef(null);

  let userInfo = null;
  try {
    const stored = localStorage.getItem('userInfo');
    if (stored) userInfo = JSON.parse(stored);
  } catch (e) {
    userInfo = null;
  }

  const fetchMyProjects = async (showErrors = true) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      };
      const { data } = await axios.get(apiUrl('/api/projects/myprojects'), config);
      setProjects(data);
      setNotSeller(false);
      setLoading(false);
    } catch (err) {
      if (err.response?.data?.message === 'Not authorized as a seller') {
        setNotSeller(true);
        setLoading(false);
        return;
      }
      if (showErrors) {
        if (err.code === 'ERR_NETWORK') {
          setError('Cannot connect to server. Make sure the backend is running on port 5000.');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to fetch projects.');
        }
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo || !userInfo.token) {
      navigate('/login');
      return;
    }
    fetchMyProjects();
  }, []);

  const fetchRepoDetails = async (owner, repo) => {
    if (fetchingRepoDetails) return;
    setFetchingRepoDetails(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (res.ok) {
        const data = await res.json();
        const demo = data.homepage || '';
        setFormData(prev => ({
          ...prev,
          title: data.name.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
          shortDescription: data.description || `Explore ${data.name.replace(/-/g, ' ')}, a robust ${data.language || 'software'} project with modern tooling.`,
          detailedDescription: data.description ? `${data.description}\n\nRepository: ${data.html_url}\nPrimary Language: ${data.language || 'Not specified'}` : `Welcome to ${data.name.replace(/-/g, ' ')}!\n\nThis repository features a comprehensive ${data.language || 'software'} project. It comes with clean code architecture and modern tooling.\n\nCheck out the source code at ${data.html_url} for more technical details and setup instructions.`,
          techStack: data.language || 'JavaScript',
          demoUrl: demo,
        }));

        let screenshot = null;
        if (demo) {
          screenshot = await fetchWebsiteScreenshot(demo);
        }
        if (!screenshot) {
          screenshot = await fetchProjectScreenshot(owner, repo, data.default_branch || 'main', githubToken);
        }
        if (screenshot) {
          setRepoScreenshotUrl(screenshot);
        } else {
          setRepoScreenshotUrl('');
        }
        setSuccess(`Fetched repository details for: ${data.name}`);
      }
    } catch (err) {
      console.error('Error fetching repo details:', err);
    } finally {
      setFetchingRepoDetails(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'githubRepoUrl') {
      const repoInfo = getRepoInfo(value);
      if (repoInfo) {
        fetchRepoDetails(repoInfo.owner, repoInfo.repo);
      }
    }
  };

  const parseLocalZip = async (file) => {
    if (!file) return;
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      let packageJsonPath = Object.keys(contents.files).find(path => path.endsWith('package.json') && !path.includes('node_modules') && !path.includes('__MACOSX'));
      if (packageJsonPath) {
        const text = await contents.files[packageJsonPath].async('string');
        try {
          const pkg = JSON.parse(text);
          setFormData(prev => ({
            ...prev,
            title: prev.title || (pkg.name ? pkg.name.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : ''),
            shortDescription: prev.shortDescription || pkg.description || `A premium project available on DevMarket.`,
            detailedDescription: prev.detailedDescription || (pkg.description ? `${pkg.description}\n\nThis project is uploaded directly from a local archive.` : `This project is uploaded directly from a local archive.`)
          }));
        } catch (e) {
          console.error('Error parsing package.json', e);
        }
      }
      let imagePath = Object.keys(contents.files).find(path => {
        const lower = path.toLowerCase();
        const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');
        const isKeyword = lower.includes('screenshot') || lower.includes('preview') || lower.includes('thumbnail') || lower.includes('hero') || lower.includes('cover');
        return isImage && isKeyword && !lower.includes('node_modules') && !lower.includes('__MACOSX');
      });
      if (!imagePath) {
        imagePath = Object.keys(contents.files).find(path => {
          const lower = path.toLowerCase();
          return (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) && !lower.includes('node_modules') && !lower.includes('__MACOSX');
        });
      }
      if (imagePath) {
        const imageBase64 = await contents.files[imagePath].async('base64');
        const ext = imagePath.split('.').pop().toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
        setRepoScreenshotUrl(`data:${mimeType};base64,${imageBase64}`);
      }
    } catch (err) {
      console.error('Error parsing ZIP file:', err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      parseLocalZip(file);
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      parseLocalZip(file);
    }
  };

  const [githubToken, setGithubToken] = useState('');

  const fetchGitBranchRepos = async (username, token) => {
    const user = username || githubUsername;
    const pat = token || githubToken;
    if (!user && !pat) return;
    setFetchingRepos(true);
    setError('');
    try {
      let url = `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`;
      let headers = {};
      if (pat) {
        url = `https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator`;
        headers['Authorization'] = `Bearer ${pat}`;
      }
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (response.ok) {
        setGitBranchRepos(data);
        if (pat && data.length > 0) setGitBranchUsername(data[0].owner.login);
        else if (user) setGitBranchUsername(user);
      } else {
        setError('GitHub user not found or Invalid Token.');
      }
    } catch (err) {
      setError('Failed to fetch GitHub repos.');
    }
    setFetchingRepos(false);
  };

  const selectGitBranchRepo = async (repo) => {
    const owner = repo.owner?.login || githubUsername;
    const name = repo.name;
    const defaultBranch = repo.default_branch || 'main';
    const demo = repo.homepage || '';
    setFormData({
      ...formData,
      title: repo.name.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
      shortDescription: repo.description || `Explore ${repo.name.replace(/-/g, ' ')}, a robust ${repo.language || 'software'} project with modern tooling.`,
      detailedDescription: repo.description ? `${repo.description}\n\nRepository: ${repo.html_url}\nPrimary Language: ${repo.language || 'Not specified'}` : `Welcome to ${repo.name.replace(/-/g, ' ')}!\n\nThis repository features a comprehensive ${repo.language || 'software'} project. It comes with clean code architecture and modern tooling.\n\nCheck out the source code at ${repo.html_url} for more technical details and setup instructions.`,
      techStack: repo.language || 'JavaScript',
      demoUrl: demo,
      githubRepoUrl: repo.html_url,
      uploadMethod: 'github_import'
    });
    setSuccess(`Selected repository: ${repo.name}`);
    let screenshot = null;
    if (demo) screenshot = await fetchWebsiteScreenshot(demo);
    if (!screenshot) screenshot = await fetchProjectScreenshot(owner, name, defaultBranch, githubToken);
    if (screenshot) setRepoScreenshotUrl(screenshot);
    else setRepoScreenshotUrl('');
  };

  const handleGithubUrlBlur = () => {
    const repoInfo = getRepoInfo(formData.githubRepoUrl);
    if (repoInfo) fetchRepoDetails(repoInfo.owner, repoInfo.repo);
  };

  const handleDemoUrlBlur = async () => {
    if (formData.demoUrl) {
      setFetchingRepoDetails(true);
      try {
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(formData.demoUrl)}&screenshot=true`);
        const data = await res.json();
        if (data && data.status === 'success' && data.data) {
          const screenshotUrl = data.data.screenshot?.url || `https://image.thum.io/get/width/1200/crop/800/${formData.demoUrl}`;
          setRepoScreenshotUrl(screenshotUrl);
          setFormData(prev => ({
            ...prev,
            title: prev.title || data.data.title || '',
            shortDescription: prev.shortDescription || data.data.description || `Explore this premium project with modern tooling.`,
            detailedDescription: prev.detailedDescription || (data.data.description ? `${data.data.description}\n\nCheck out the demo link to explore the features in detail.` : `Welcome to this project!\n\nThis application features modern UI/UX and clean architecture.\n\nCheck out the live demo at ${formData.demoUrl} for more details.`)
          }));
        } else {
          setRepoScreenshotUrl(`https://image.thum.io/get/width/1200/crop/800/${formData.demoUrl}`);
        }
      } catch (err) {
        console.error(err);
        setRepoScreenshotUrl(`https://image.thum.io/get/width/1200/crop/800/${formData.demoUrl}`);
      }
      setFetchingRepoDetails(false);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Thumbnail image size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, thumbnail: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getAutoThumbnail = () => {
    if (repoScreenshotUrl) return repoScreenshotUrl;
    if (formData.uploadMethod === 'github_import' || formData.uploadMethod === 'github_link') {
      const repoInfo = getRepoInfo(formData.githubRepoUrl);
      if (repoInfo) return `https://opengraph.githubassets.com/1/${repoInfo.owner}/${repoInfo.repo}`;
    }
    return 'https://placehold.co/600x400/e2e8f0/7c3aed?text=Project+Thumbnail';
  };

  const thumbnailPreview = useCustomThumbnail ? formData.thumbnail : getAutoThumbnail();

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadProject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) { setError('Project title is required.'); return; }
    if (!formData.shortDescription.trim()) { setError('Short description is required.'); return; }
    if (!formData.detailedDescription.trim()) { setError('Detailed description is required.'); return; }
    if (!formData.techStack.trim()) { setError('Tech stack is required.'); return; }
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) { setError('Please enter a valid price (0 or greater).'); return; }
    if (formData.uploadMethod === 'local' && !selectedFile) { setError('Please select a file to upload.'); return; }
    if ((formData.uploadMethod === 'github_link' || formData.uploadMethod === 'github_import') && !formData.githubRepoUrl.trim()) { setError('GitHub repository URL is required.'); return; }

    setUploading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
          'Content-Type': 'application/json',
        },
      };
      const finalThumbnail = useCustomThumbnail ? formData.thumbnail : getAutoThumbnail();
      const projectPayload = {
        ...formData,
        techStack: formData.techStack.split(',').map((tech) => tech.trim()),
        price: Number(formData.price),
        fileUrl: '',
        fileData: null,
        fileOriginalName: '',
        thumbnail: finalThumbnail,
      };

      if (selectedFile) {
        projectPayload.fileOriginalName = selectedFile.name;
        try {
          projectPayload.fileData = await readFileAsBase64(selectedFile);
        } catch (fileErr) {
          setError('Failed to read file. Please try again.');
          setUploading(false);
          return;
        }
      }

      const { data: createdProject } = await axios.post(apiUrl('/api/projects'), projectPayload, config);
      setSuccess('Project uploaded successfully!');

      // Trigger auto-analysis for local uploads
      if (selectedFile && createdProject?._id) {
        try {
          await axios.post(
            apiUrl(`/api/projects/analyze/${createdProject._id}`),
            {},
            config
          );
          setSuccess('Project uploaded and analyzed successfully!');
        } catch (analyzeErr) {
          console.warn('Auto-analysis triggered but background analysis may still run:', analyzeErr.message);
        }
      }

      setFormData({
        title: '', shortDescription: '', detailedDescription: '', techStack: '',
        category: 'Web App', price: '', demoUrl: '', uploadMethod: 'local', githubRepoUrl: '', fileUrl: '',
        thumbnail: '',
      });
      setUseCustomThumbnail(false);
      setSelectedFile(null);
      setGitBranchRepos([]);
      setShowUploadForm(false);
      fetchMyProjects(false);
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else if (err.response?.data?.message === 'Not authorized as a seller') {
        setNotSeller(true);
        setError('');
        setSuccess('');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid project data. Check all fields.');
      } else {
        setError(err.response?.data?.message || 'Failed to upload project.');
      }
    } finally {
      setUploading(false);
    }
  };

  const upgradeToSeller = async () => {
    setUpgrading(true);
    setError('');
    setSuccess('');
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      };
      const { data } = await axios.put(apiUrl('/api/auth/upgrade-to-seller'), {}, config);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setSuccess('Upgraded to seller successfully! You can now upload projects.');
      setNotSeller(false);
      fetchMyProjects(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const totalEarnings = projects.reduce((acc, curr) => acc + (curr.isApproved ? curr.price * 5 : 0), 0);

  const uploadMethods = [
    { value: 'local', label: 'Local File (ZIP)', icon: FileArchive, desc: 'Upload from your computer' },
    { value: 'github_link', label: 'GitHub Repo URL', icon: LinkIcon, desc: 'Link to public repository' },
    { value: 'github_import', label: 'Import from GitHub', icon: GitBranch, desc: 'Browse & import repos' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden pb-8 pt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 to-transparent -z-10" />
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="section-title flex items-center gap-3">
              <LayoutDashboard className="text-brand-500" size={32} />
              <span>Seller <span className="gradient-text">Dashboard</span></span>
            </h1>
            <p className="section-subtitle">Manage your projects, track earnings, and upload new assets.</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-16">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 flex items-center justify-between group hover:border-brand-300 transition-all"
          >
            <div>
              <span className="text-sm text-light-text-secondary">Total Projects</span>
              <h3 className="text-3xl font-bold text-light-text mt-1">{projects.length}</h3>
              <p className="text-xs text-light-muted mt-1">Your portfolio</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center group-hover:bg-brand-100 transition-all">
              <Package size={28} className="text-brand-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 flex items-center justify-between group hover:border-green-300 transition-all"
          >
            <div>
              <span className="text-sm text-light-text-secondary">Simulated Earnings</span>
              <h3 className="text-3xl font-bold text-green-600 mt-1">${totalEarnings}</h3>
              <p className="text-xs text-light-muted mt-1">$5 per approval</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center group-hover:bg-green-100 transition-all">
              <TrendingUp size={28} className="text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="glass-card p-6 flex items-center justify-between group cursor-pointer hover:border-brand-500/50 transition-all hover:-translate-y-1"
          >
            <div>
              <span className="text-sm text-light-text-secondary">Quick Action</span>
              <h3 className="text-xl font-bold text-brand-600 mt-1 flex items-center gap-2">
                <Plus size={20} />
                Upload Project
              </h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
              <UploadCloud size={28} className="text-white" />
            </div>
          </motion.div>
        </div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 p-5 rounded-2xl mb-6"
            >
              <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm">{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 p-5 rounded-2xl mb-6"
            >
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Become a Seller Prompt */}
        {notSeller && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 md:p-16 text-center max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-6">
              <Store size={40} className="text-brand-500" />
            </div>
            <h2 className="text-3xl font-bold text-light-text mb-3">Become a Seller</h2>
            <p className="text-light-text-secondary text-sm mb-2 max-w-md mx-auto">
              Your account is currently set as a <strong>Buyer</strong>. 
              Upgrade to a Seller account to start uploading projects on DevMarket.
            </p>
            <p className="text-xs text-light-muted mb-8 max-w-sm mx-auto">
              You can switch back to Buyer anytime from your account settings.
            </p>
            <button
              onClick={upgradeToSeller}
              disabled={upgrading}
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base"
            >
              {upgrading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <Store size={20} />
                  Upgrade to Seller
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Upload Form */}
        {!notSeller && (
        <AnimatePresence>
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-6 md:p-8 mb-12 max-w-4xl mx-auto overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-light-text flex items-center gap-2">
                  <UploadCloud className="text-brand-500" size={24} />
                  Upload New Project
                </h2>
                <button onClick={() => setShowUploadForm(false)} className="p-2 rounded-xl text-light-muted hover:text-light-text hover:bg-light-surface transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Upload Method Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-light-text-secondary mb-3">Select Upload Method</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {uploadMethods.map((method) => {
                    const Icon = method.icon;
                    const isActive = formData.uploadMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, uploadMethod: method.value })}
                        className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${isActive
                            ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-sm'
                            : 'bg-white border-light-border text-light-text-secondary hover:border-brand-300 hover:text-brand-600'
                          }`}
                      >
                        <Icon size={28} className={isActive ? 'text-brand-500' : ''} />
                        <span className="font-medium text-sm">{method.label}</span>
                        <span className="text-[10px] text-light-muted">{method.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Upload Sections */}
              <div className="mb-8 p-6 bg-light-surface rounded-2xl border border-light-border">
                {formData.uploadMethod === 'local' && (
                  <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragActive ? 'border-brand-500 bg-brand-50' : 'border-light-border hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !selectedFile && fileInputRef.current.click()}
                  >
                    <input ref={fileInputRef} type="file" className="hidden" accept=".zip,.rar,.tar.gz" onChange={handleFileChange} />
                    {selectedFile ? (
                      <div>
                        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
                          <FileArchive size={32} className="text-brand-500" />
                        </div>
                        <p className="text-lg font-medium text-light-text mb-1">{selectedFile.name}</p>
                        <p className="text-sm text-light-muted mb-4">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-sm text-red-500 hover:text-red-400 transition-colors">
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={48} className={`mx-auto mb-4 ${dragActive ? 'text-brand-500' : 'text-light-muted'}`} />
                        <p className="text-lg text-light-text mb-2">Drag and drop your project ZIP here</p>
                        <p className="text-sm text-light-muted mb-4">or</p>
                        <button type="button" onClick={() => fileInputRef.current.click()} className="btn-secondary">
                          Browse Files
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {formData.uploadMethod === 'github_link' && (
                  <div>
                    <label className="block text-sm font-medium text-light-text mb-2">GitHub Repository URL</label>
                    <div className="relative">
                      <GitBranch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-muted" />
                      <input
                        type="url"
                        name="githubRepoUrl"
                        required
                        className="input-field pl-10 pr-32"
                        placeholder="https://github.com/username/repo"
                        value={formData.githubRepoUrl}
                        onChange={handleInputChange}
                        onBlur={handleGithubUrlBlur}
                      />
                      {fetchingRepoDetails && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-brand-600">
                          <div className="w-3.5 h-3.5 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                          <span>Autofilling...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-light-muted mt-2 flex items-center gap-1">
                      <AlertCircle size={12} /> Enter a public GitHub repo URL. Details will auto-fill.
                    </p>
                  </div>
                )}

                {formData.uploadMethod === 'github_import' && (
                  <div>
                    {!githubUsername ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
                          <GitBranch size={32} className="text-brand-500" />
                        </div>
                        <h3 className="text-xl font-bold text-light-text mb-2">Connect to GitHub</h3>
                        <p className="text-light-text-secondary text-sm mb-6 max-w-md mx-auto">
                          Link your GitHub account to directly import repositories as projects on DevMarket.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowGithubModal(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all shadow-xl"
                        >
                          <GitBranch size={20} />
                          Import from GitHub
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                          <div
                            onClick={() => setShowGithubModal(true)}
                            className="flex items-center justify-between bg-white border border-light-border rounded-xl px-4 py-3 sm:w-64 cursor-pointer hover:border-brand-300 transition-all"
                          >
                            <div className="flex items-center gap-2 text-light-text">
                              <GitBranch size={18} className="text-brand-500" />
                              <span className="font-medium text-sm truncate">{githubUsername}</span>
                            </div>
                            <Settings size={14} className="text-light-muted" />
                          </div>
                          <div className="relative flex-grow">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-muted" />
                            <input
                              type="text"
                              className="w-full bg-white border border-light-border rounded-xl pl-10 pr-4 py-3 text-sm text-light-text focus:outline-none focus:border-brand-500/50 transition-colors placeholder-light-muted"
                              placeholder="Search repositories..."
                            />
                          </div>
                        </div>

                        {fetchingRepos ? (
                          <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-light-text-secondary text-sm">Loading repositories...</p>
                          </div>
                        ) : (
                          <div className="space-y-1 rounded-2xl border border-light-border overflow-hidden max-h-[400px] overflow-y-auto">
                            {githubRepos.map((repo, index) => (
                              <div
                                key={repo.id}
                                className={`flex items-center justify-between p-4 bg-white hover:bg-light-surface transition-all ${index !== githubRepos.length - 1 ? 'border-b border-light-border' : ''
                                  }`}
                              >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                                    <FileCode size={18} className="text-brand-500" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-light-text text-sm truncate flex items-center gap-2">
                                      {repo.name}
                                      <span className="text-xs text-light-muted font-normal flex-shrink-0">
                                        {repo.language && `• ${repo.language}`}
                                      </span>
                                    </h4>
                                    {repo.description && (
                                      <p className="text-xs text-light-text-secondary truncate mt-0.5">{repo.description}</p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => selectGitBranchRepo(repo)}
                                  className="flex-shrink-0 ml-3 px-4 py-2 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-all"
                                >
                                  Import
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Standard Project Details Form */}
              <form onSubmit={handleUploadProject} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light-text mb-1.5">Project Title</label>
                    <input type="text" name="title" required className="input-field" placeholder="e.g. Real-Time Chat App" value={formData.title} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-text mb-1.5">Price ($)</label>
                    <input type="number" name="price" required className="input-field" placeholder="29" value={formData.price} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-light-text mb-1.5">Category</label>
                    <select name="category" className="input-field" value={formData.category} onChange={handleInputChange}>
                      <option value="Web App">Web App</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="API">API</option>
                      <option value="UI Kit">UI Kit</option>
                      <option value="Boilerplate">Boilerplate</option>
                      <option value="Theme">Theme</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-light-text mb-1.5">Demo URL</label>
                    <input type="url" name="demoUrl" className="input-field" placeholder="https://example.com" value={formData.demoUrl} onChange={handleInputChange} onBlur={handleDemoUrlBlur} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-text mb-1.5">Tech Stack (comma separated)</label>
                  <input type="text" name="techStack" required className="input-field" placeholder="React, Node.js, Socket.IO" value={formData.techStack} onChange={handleInputChange} />
                </div>

                {/* Thumbnail Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-light-text">Project Thumbnail</label>
                    <label className="flex items-center gap-2 text-sm text-light-text-secondary cursor-pointer hover:text-light-text transition-colors">
                      <input
                        type="checkbox"
                        checked={useCustomThumbnail}
                        onChange={(e) => setUseCustomThumbnail(e.target.checked)}
                        className="rounded bg-white border-light-border text-brand-500 focus:ring-brand-500 w-4 h-4"
                      />
                      Upload Custom
                    </label>
                  </div>

                  {useCustomThumbnail ? (
                    <div
                      onClick={() => document.getElementById('thumbnail-file-input').click()}
                      className="border-2 border-dashed border-light-border hover:border-brand-300 bg-white rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px]"
                    >
                      <input id="thumbnail-file-input" type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                      {formData.thumbnail ? (
                        <div className="relative group w-full max-w-[280px] h-[140px] rounded-xl overflow-hidden border border-light-border mx-auto">
                          <img src={formData.thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-medium text-light-text backdrop-blur-sm">
                            Change Image
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Plus size={36} className="text-light-muted mb-3" />
                          <span className="text-sm text-light-text-secondary font-medium">Click to upload custom image</span>
                          <span className="text-xs text-light-muted mt-1">PNG, JPG or WEBP up to 2MB</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-light-border bg-light-surface rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 min-h-[140px]">
                      <div className="w-[200px] h-[110px] rounded-xl overflow-hidden border border-light-border bg-white flex items-center justify-center flex-shrink-0">
                        <img src={thumbnailPreview} alt="Automatic Preview" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-light-text">Automatic Thumbnail</h4>
                        <p className="text-xs text-light-text-secondary mt-1 leading-relaxed max-w-sm">
                          {formData.uploadMethod === 'github_import' || formData.uploadMethod === 'github_link'
                            ? (repoScreenshotUrl
                              ? "Detected a real screenshot/preview image in your repository!"
                              : "Using the repository's open-graph social preview.")
                            : "Using a default premium developer placeholder image."}
                        </p>
                        <span className="inline-block badge-primary mt-2 text-[10px]">Auto-generated</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-text mb-1.5">Short Description</label>
                  <input type="text" name="shortDescription" required className="input-field" placeholder="Brief one-line overview" value={formData.shortDescription} onChange={handleInputChange} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-text mb-1.5">Detailed Description</label>
                  <textarea name="detailedDescription" required rows="5" className="input-field resize-none" placeholder="Describe features, installation steps, architecture..." value={formData.detailedDescription} onChange={handleInputChange} />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`btn-primary flex-1 py-3.5 text-base ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={18} />
                          Finalize & Upload Project
                        </>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={uploading}
                    className={`btn-secondary flex-1 py-3.5 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* Projects List */}
        <div>
          <h2 className="text-2xl font-bold text-light-text mb-6 flex items-center gap-2">
            <FolderOpen className="text-brand-500" size={22} />
            Your Uploaded Projects
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card p-6 animate-pulse space-y-4">
                  <div className="flex justify-between">
                    <div className="h-6 bg-light-surface rounded w-1/2" />
                    <div className="h-6 bg-light-surface rounded w-16" />
                  </div>
                  <div className="h-4 bg-light-surface rounded w-full" />
                  <div className="h-4 bg-light-surface rounded w-2/3" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-light-surface rounded w-16" />
                    <div className="h-6 bg-light-surface rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-brand-500" />
              </div>
              <p className="text-lg text-light-text font-medium mb-1">No projects uploaded yet</p>
              <p className="text-sm text-light-muted mb-6">Click "Upload Project" to get started</p>
              <button onClick={() => setShowUploadForm(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus size={18} />
                Upload Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card-hover p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-light-text">{project.title}</h3>
                      <span className="text-xl font-bold gradient-text">${project.price}</span>
                    </div>
                    <p className="text-light-text-secondary text-sm mb-4 line-clamp-2">{project.shortDescription}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.techStack?.map((tech, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
                          <Tag size={10} />
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="badge-primary text-[10px] flex items-center gap-1">
                        {project.uploadMethod === 'local' && <><FileArchive size={10} /> Local File</>}
                        {project.uploadMethod === 'github_link' && <><LinkIcon size={10} /> GitHub Link</>}
                        {project.uploadMethod === 'github_import' && <><GitBranch size={10} /> GitHub Import</>}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-light-border mt-auto">
                    <span className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium ${project.isApproved
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${project.isApproved ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {project.isApproved ? 'Approved & Live' : 'Pending Approval'}
                    </span>
                    {project.demoUrl && (
                      <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:text-brand-500 transition-colors flex items-center gap-1">
                        <Eye size={16} />
                        Live Demo
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GitHub Modal */}
      <AnimatePresence>
        {showGithubModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setShowGithubModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-light-muted hover:text-light-text hover:bg-light-surface transition-all"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
                  <GitBranch size={28} className="text-brand-500" />
                </div>
                <h3 className="text-xl font-bold text-light-text">Connect GitHub</h3>
                <p className="text-sm text-light-text-secondary mt-2">
                  Enter your GitHub Username for public repos.<br />
                  <span className="text-xs text-light-muted">(Or enter a Personal Access Token for private repos)</span>
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. username or ghp_..."
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  className="input-field"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmedInput = modalInput.trim();
                      if (!trimmedInput) return;
                      if (trimmedInput.startsWith('ghp_') || trimmedInput.startsWith('github_pat_')) {
                        setGithubToken(trimmedInput);
                        fetchGitBranchRepos(null, trimmedInput);
                      } else {
                        setGitBranchUsername(trimmedInput);
                        fetchGitBranchRepos(trimmedInput, null);
                      }
                      setShowGithubModal(false);
                      setModalInput('');
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    const trimmedInput = modalInput.trim();
                    if (!trimmedInput) return;
                    if (trimmedInput.startsWith('ghp_') || trimmedInput.startsWith('github_pat_')) {
                      setGithubToken(trimmedInput);
                      fetchGitBranchRepos(null, trimmedInput);
                    } else {
                      setGitBranchUsername(trimmedInput);
                      fetchGitBranchRepos(trimmedInput, null);
                    }
                    setShowGithubModal(false);
                    setModalInput('');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold transition-all shadow-lg shadow-brand-500/20"
                >
                  Connect Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerDashboard;
