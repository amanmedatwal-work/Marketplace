import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Monitor, Tablet, Smartphone, ArrowUpRight, Copy, Check,
  Lock, Info, Layout, Layers, Code, GitBranch, RefreshCw,
  AlertTriangle, Server, FileCode, Package, Globe,
  Play, Square, Loader
} from 'lucide-react';
import axios from 'axios';
import { apiUrl } from '../config/api';

const TIMEOUT_DEMO = 8000;
const TIMEOUT_STACKBLITZ = 30000;
const TIMEOUT_LOCAL = 6000;

const FRAMEWORK_COLORS = {
  react: 'bg-cyan-50 border-cyan-200 text-cyan-700',
  vue: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  angular: 'bg-red-50 border-red-200 text-red-700',
  nextjs: 'bg-neutral-50 border-neutral-200 text-neutral-700',
  gatsby: 'bg-purple-50 border-purple-200 text-purple-700',
  svelte: 'bg-orange-50 border-orange-200 text-orange-700',
  static: 'bg-blue-50 border-blue-200 text-blue-700',
  unknown: 'bg-gray-50 border-gray-200 text-gray-600',
};

const LivePreviewModal = ({ project, onClose }) => {
  const [device, setDevice] = useState('desktop');
  const [activeTab, setActiveTab] = useState('interactive');
  const [copied, setCopied] = useState(false);
  const [iframeState, setIframeState] = useState('loading');
  const [previewHealth, setPreviewHealth] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState(null); // null | 'starting' | 'installing_deps' | 'running' | 'error'
  const [runtimeUrl, setRuntimeUrl] = useState('');
  const [runtimeMessage, setRuntimeMessage] = useState('');
  const [isStartingRuntime, setIsStartingRuntime] = useState(false);

  const loadTimeoutRef = useRef(null);
  const healthIntervalRef = useRef(null);
  const runtimePollRef = useRef(null);

  const isGithubRepoUrl = (url) => url && url.includes('github.com') && url.match(/github\.com\/([^/]+)\/([^/]+)/);

  let actualDemoUrl = project.demoUrl?.trim() || '';
  let actualGithubUrl = project.githubRepoUrl?.trim() || '';

  // If a GitHub URL is placed in the demo URL field, treat it as the repository URL
  if (isGithubRepoUrl(actualDemoUrl) && !actualGithubUrl) {
    actualGithubUrl = actualDemoUrl;
    actualDemoUrl = '';
  } else if (isGithubRepoUrl(actualDemoUrl) && actualGithubUrl) {
    // Both are github URLs, likely the same. Discard the demoUrl as it's invalid for iframe.
    actualDemoUrl = '';
  }

  const hasDemoUrl = !!actualDemoUrl;
  const hasGithubUrl = !!actualGithubUrl;
  const isLocalUpload = project.uploadMethod === 'local';

  const framework = project.analysis?.framework || (() => {
    const stack = (project.techStack || []).map(t => t.toLowerCase().replace(/[.\s]/g, ''));
    if (stack.some(t => t.includes('react') || t === 'reactjs')) return 'react';
    if (stack.some(t => t.includes('vue') || t === 'vuejs')) return 'vue';
    if (stack.some(t => t.includes('angular') || t === 'angularjs')) return 'angular';
    if (stack.some(t => t.includes('next') || t === 'nextjs')) return 'nextjs';
    if (stack.some(t => t.includes('html') || t.includes('css') || t.includes('javascript'))) return 'static';
    return 'unknown';
  })();

  const frameworkColorClass = FRAMEWORK_COLORS[framework] || FRAMEWORK_COLORS.unknown;
  
  let githubOwner = '';
  let githubRepo = '';
  if (hasGithubUrl) {
    const cleanUrl = actualGithubUrl.replace(/\/$/, '');
    const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      githubOwner = match[1];
      githubRepo = match[2].replace(/\.git$/, '');
    }
  }

  // Fetch preview health status for local uploads
  useEffect(() => {
    if (!isLocalUpload) return;
    
    const checkHealth = async () => {
      try {
        const { data } = await axios.get(apiUrl(`/api/projects/preview/${project._id}/status`));
        setPreviewHealth(data);
      } catch (err) {
        // silent
      }
    };
    
    checkHealth();
    healthIntervalRef.current = setInterval(checkHealth, 5000);
    
    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
    };
  }, [project._id, isLocalUpload]);

  // Poll runtime status
  useEffect(() => {
    if (!isLocalUpload || !runtimeStatus || runtimeStatus === 'error' || runtimeStatus === 'running') return;
    
    runtimePollRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(apiUrl(`/api/projects/runtime/status/${project._id}`));
        setRuntimeStatus(data.status);
        if (data.status === 'running') {
          setRuntimeUrl(data.proxyPath ? `${data.proxyPath}` : (data.previewUrl || ''));
          setRuntimeMessage('Runtime preview ready');
          clearInterval(runtimePollRef.current);
        } else if (data.status === 'installing_deps') {
          setRuntimeMessage('Installing dependencies...');
        } else if (data.status === 'starting') {
          setRuntimeMessage('Starting dev server...');
        } else if (data.status === 'error') {
          setRuntimeMessage(data.errorMessage || 'Failed to start runtime');
          clearInterval(runtimePollRef.current);
          setIsStartingRuntime(false);
        } else if (data.status === 'not_started') {
          clearInterval(runtimePollRef.current);
          setIsStartingRuntime(false);
        }
      } catch (_) {}
    }, 2000);
    
    return () => {
      if (runtimePollRef.current) clearInterval(runtimePollRef.current);
    };
  }, [project._id, isLocalUpload, runtimeStatus]);

  const handleStartRuntime = async () => {
    setIsStartingRuntime(true);
    setRuntimeStatus('starting');
    setRuntimeMessage('Starting runtime sandbox...');
    try {
      const { data } = await axios.post(apiUrl(`/api/projects/runtime/start/${project._id}`));
      if (data.status === 'running') {
        setRuntimeStatus('running');
        setRuntimeUrl(data.proxyPath ? `${data.proxyPath}` : (data.previewUrl || ''));
        setRuntimeMessage('Runtime preview ready');
        setIsStartingRuntime(false);
      } else if (data.status === 'static') {
        setRuntimeStatus('running');
        setRuntimeUrl(apiUrl(`/api/projects/preview/${project._id}`));
        setRuntimeMessage('Static site preview ready');
        setIsStartingRuntime(false);
      } else {
        setRuntimeStatus(data.status);
        setIsStartingRuntime(false);
      }
    } catch (err) {
      setRuntimeStatus('error');
      setRuntimeMessage(err.response?.data?.message || 'Failed to start runtime preview');
      setIsStartingRuntime(false);
    }
  };

  const handleStopRuntime = async () => {
    try {
      await axios.post(apiUrl(`/api/projects/runtime/stop/${project._id}`));
    } catch (_) {}
    setRuntimeStatus(null);
    setRuntimeUrl('');
    setRuntimeMessage('');
    setIframeState('loading');
  };

  useEffect(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setIframeState('loading');
    setShowFallback(false);

    const timeout = hasDemoUrl ? TIMEOUT_DEMO : (isLocalUpload ? TIMEOUT_LOCAL : (hasGithubUrl ? TIMEOUT_STACKBLITZ : 0));
    if (timeout > 0) {
      loadTimeoutRef.current = setTimeout(() => {
        setIframeState('error');
      }, timeout);
    }

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [project, activeTab, hasDemoUrl, hasGithubUrl, isLocalUpload, retryCount]);

  const getStackBlitzUrl = (view = 'preview') => {
    if (!githubOwner || !githubRepo) return '';
    const base = `https://stackblitz.com/github/${githubOwner}/${githubRepo}?embed=1`;
    if (view === 'code') return `${base}&view=editor&theme=dark`;
    return `${base}&view=preview&theme=dark`;
  };

  const getPreviewUrl = () => {
    if (hasDemoUrl) return actualDemoUrl;
    if (isLocalUpload) return apiUrl(`/api/projects/preview/${project._id}`);
    if (hasGithubUrl) {
      const sb = getStackBlitzUrl('preview');
      if (sb) return sb;
      return actualGithubUrl;
    }
    return '';
  };

  const staticPreviewUrl = getPreviewUrl();
  const effectivePreviewUrl = runtimeUrl || staticPreviewUrl;
  const hasValidPreviewUrl = !!effectivePreviewUrl;

  const handleIframeLoad = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setIframeState('loaded');
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIframeState('loading');
    setShowFallback(false);
  };

  const handleCopyLink = () => {
    const url = effectivePreviewUrl || actualGithubUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDeviceDimensions = () => {
    switch (device) {
      case 'tablet':
        return { width: '768px', height: '100%' };
      case 'mobile':
        return { width: '380px', height: '100%', borderRadius: '32px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const renderFallbackActions = () => (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
      <button
        onClick={handleRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-all border border-brand-200"
      >
        <RefreshCw size={14} />
        Retry Preview
      </button>
      {hasDemoUrl && (
        <a
          href={actualDemoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-light-surface text-light-text text-xs font-semibold transition-all border border-light-border"
        >
          <ArrowUpRight size={14} />
          Open in New Tab
        </a>
      )}
      {hasGithubUrl && (
        <a
          href={actualGithubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-light-surface text-light-text text-xs font-semibold transition-all border border-light-border"
        >
          <GitBranch size={14} />
          View on GitHub
        </a>
      )}
      {isLocalUpload && runtimeStatus === 'running' && runtimeUrl && (
        <button
          onClick={() => { setIframeState('loading'); window.location.reload(); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold transition-all border border-green-200"
        >
          <Play size={14} />
          Open Runtime Preview
        </button>
      )}
      {isLocalUpload && (
        <span className="text-[10px] text-light-muted">
          Entry: {previewHealth?.entryPoint || '/'}
        </span>
      )}
    </div>
  );

  const renderInteractiveContent = () => {
    if (hasDemoUrl || isLocalUpload) {
      const isLocal = isLocalUpload;
      return (
        <div className="w-full h-full relative">
          {!hasValidPreviewUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
              <Info size={40} className="text-light-muted mb-4" />
              <h4 className="text-lg font-bold text-light-text mb-2">No Preview Available</h4>
              <p className="text-sm text-light-text-secondary max-w-md">No valid preview URL could be generated for this project.</p>
            </div>
          ) : (
            <>
              {iframeState === 'loading' && (
                <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20">
                  <div className="w-10 h-10 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm text-light-text-secondary">
                    {isLocal ? 'Loading project preview...' : 'Loading live site...'}
                  </p>
                  {isLocal && previewHealth && (
                    <div className="mt-4 flex items-center gap-4 text-xs text-light-muted">
                      <span className="flex items-center gap-1">
                        <FileCode size={12} />
                        {previewHealth.fileCount || 0} files
                      </span>
                      {previewHealth.framework && (
                        <span className="flex items-center gap-1">
                          <Package size={12} />
                          {previewHealth.framework}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {iframeState === 'error' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-amber-500" />
                  </div>
                  <h4 className="text-lg font-bold text-light-text mb-2">
                    {isLocal ? 'Preview Unavailable' : 'Site Blocks Embedding'}
                  </h4>
                  <p className="text-sm text-light-text-secondary max-w-md mb-2">
                    {isLocal
                      ? 'Could not serve the uploaded project preview. The project may require a build step or server runtime.'
                      : 'This website prevents being displayed inside an embedded frame for security reasons.'}
                  </p>
                  {isLocal && previewHealth && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${frameworkColorClass}`}>
                        {framework}
                      </span>
                      {previewHealth.entryPoint && (
                        <span className="text-[10px] text-light-muted font-mono">
                          {previewHealth.entryPoint}
                        </span>
                      )}
                    </div>
                  )}
                  {isLocal && runtimeStatus === 'error' && (
                    <p className="text-xs text-red-500 mb-3">{runtimeMessage}</p>
                  )}
                  {isLocal && (
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
                      {!runtimeStatus || runtimeStatus === 'error' ? (
                        <button
                          onClick={handleStartRuntime}
                          disabled={isStartingRuntime}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/15 disabled:opacity-60"
                        >
                          {isStartingRuntime ? (
                            <><Loader size={14} className="animate-spin" /> Starting Runtime...</>
                          ) : (
                            <><Play size={14} /> Start Runtime Preview</>
                          )}
                        </button>
                      ) : runtimeStatus === 'running' && runtimeUrl ? (
                        <>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Runtime Active
                          </span>
                          <button
                            onClick={handleStopRuntime}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium border border-red-200"
                          >
                            <Square size={12} /> Stop
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-light-muted">
                          <Loader size={14} className="animate-spin" />
                          {runtimeMessage || 'Preparing runtime...'}
                        </div>
                      )}
                    </div>
                  )}
                  {renderFallbackActions()}
                </div>
              ) : (
                <iframe
                  src={effectivePreviewUrl}
                  className="w-full h-full bg-white"
                  onLoad={handleIframeLoad}
                  title={project.title}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
                  allow="cross-origin-isolated; fullscreen"
                  referrerPolicy="no-referrer"
                />
              )}
            </>
          )}
        </div>
      );
    }

    if (hasGithubUrl) {
      return (
        <div className="w-full h-full flex flex-col">
          {!hasValidPreviewUrl ? (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-white">
              <Info size={40} className="text-light-muted mb-4" />
              <h4 className="text-lg font-bold text-light-text mb-2">No Preview Available</h4>
              <p className="text-sm text-light-text-secondary max-w-md mb-4">Could not parse the GitHub repository URL.</p>
              <a
                href={actualGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-light-border text-light-text text-xs font-semibold hover:bg-light-surface transition-all"
              >
                <GitBranch size={14} /> Open Repository Directly <ArrowUpRight size={14} />
              </a>
            </div>
          ) : (
            <>
              <div className="flex-grow relative">
                {iframeState === 'loading' && (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20">
                    <div className="w-10 h-10 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-3" />
                    <p className="text-sm text-light-text-secondary">Starting StackBlitz sandbox...</p>
                  </div>
                )}
                {iframeState === 'error' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-4">
                      <Code size={32} className="text-blue-500" />
                    </div>
                    <h4 className="text-lg font-bold text-light-text mb-2">Preview Unavailable</h4>
                    <p className="text-sm text-light-text-secondary max-w-md mb-4">
                      StackBlitz could not process this repository. Try opening it directly on GitHub or StackBlitz.
                    </p>
                    {renderFallbackActions()}
                  </div>
                ) : (
                  <iframe
                    src={effectivePreviewUrl}
                    className="w-full h-full bg-black"
                    onLoad={handleIframeLoad}
                    title={project.title}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
                    allow="cross-origin-isolated; fullscreen"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <div className="shrink-0 flex items-center justify-center gap-3 px-3 py-2 bg-white border-t border-light-border z-30">
                <span className="text-[10px] text-light-muted font-medium uppercase tracking-wider mr-1">Powered by StackBlitz</span>
                {githubOwner && githubRepo && (
                  <a
                    href={`https://stackblitz.com/github/${githubOwner}/${githubRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-all border border-blue-200"
                  >
                    Open in StackBlitz <ArrowUpRight size={12} />
                  </a>
                )}
                <a
                  href={actualGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-light-surface text-light-text-secondary text-[11px] font-semibold transition-all border border-light-border"
                >
                  <GitBranch size={12} />
                  View on GitHub <ArrowUpRight size={12} />
                </a>
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="w-full h-full overflow-y-auto bg-white text-light-text flex flex-col relative">
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-6">
            <Layout size={36} className="text-brand-500" />
          </div>
          <h3 className="text-xl font-bold text-light-text mb-2">{project.title}</h3>
          <p className="text-sm text-light-text-secondary max-w-md mb-6">
            {project.shortDescription || 'No preview URL or uploaded file available for this project.'}
          </p>
          {project.thumbnail ? (
            <div className="w-full max-w-3xl rounded-2xl border border-light-border bg-light-surface overflow-hidden">
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>
          ) : (
            <div className="w-full max-w-md p-8 rounded-2xl border border-light-border bg-white">
              <div className="flex flex-col items-center gap-3 text-light-muted">
                <Code size={48} className="text-light-muted" />
                <p className="text-sm">No preview image available.</p>
                <p className="text-xs text-light-muted">The seller has not uploaded a demo URL or screenshot for this project.</p>
              </div>
            </div>
          )}
          {project.techStack?.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl">
              {project.techStack.map((tech, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 text-xs font-medium">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full h-full md:h-[92vh] max-w-7xl bg-white border border-light-border md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-light-border bg-light-surface shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold shrink-0">
              {project.category === 'Web App' || project.category === 'Template' ? <Layout size={20} /> : <Layers size={20} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-light-text truncate max-w-[200px] sm:max-w-[260px]">{project.title}</h3>
              <p className="text-xs text-light-text-secondary flex items-center gap-1.5 mt-0.5 truncate">
                <span className="badge-primary text-[9px] px-1.5 py-0">{project.category}</span>
                <span className={`px-1.5 py-0 rounded text-[9px] font-medium ${frameworkColorClass} border`}>
                  {framework}
                </span>
                <span>• by {project.seller?.name || 'DevMarket'}</span>
              </p>
            </div>
          </div>

          {(hasDemoUrl || hasGithubUrl) && (
            <div className="hidden lg:flex items-center bg-white border border-light-border rounded-xl px-4 py-1.5 w-[38%] text-xs text-light-muted gap-2 font-mono">
              <Lock size={12} className="text-green-500" />
              <span className="text-green-600">https://</span>
              <span className="text-light-text truncate">
                {hasDemoUrl 
                  ? actualDemoUrl.replace(/^https?:\/\//, '') 
                  : actualGithubUrl.replace(/^https?:\/\//, '')}
              </span>
            </div>
          )}
          {isLocalUpload && (
            <div className="hidden lg:flex items-center bg-white border border-light-border rounded-xl px-4 py-1.5 w-[38%] text-xs text-light-muted gap-2 font-mono">
              <Server size={12} className="text-green-500" />
              <span className="text-green-600">preview://</span>
              <span className="text-light-text truncate">{project.title} (local upload)</span>
              {runtimeStatus === 'running' ? (
                <span className="ml-auto flex items-center gap-1 text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px]">Runtime</span>
                </span>
              ) : previewHealth?.status === 'ready' ? (
                <span className="ml-auto flex items-center gap-1 text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[9px]">Static</span>
                </span>
              ) : runtimeStatus === 'installing_deps' || runtimeStatus === 'starting' ? (
                <span className="ml-auto flex items-center gap-1 text-amber-500">
                  <Loader size={10} className="animate-spin" />
                  <span className="text-[9px]">{runtimeStatus === 'installing_deps' ? 'Installing' : 'Starting'}</span>
                </span>
              ) : null}
            </div>
          )}

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="flex bg-white border border-light-border rounded-xl p-1 text-[11px] font-semibold text-light-muted shrink-0">
              <button
                onClick={() => setActiveTab('interactive')}
                className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'interactive' ? 'bg-brand-100 text-brand-700 font-bold shadow-sm' : 'hover:text-light-text'}`}
              >
                Interactive
              </button>
              <button
                onClick={() => setActiveTab('screenshot')}
                className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'screenshot' ? 'bg-brand-100 text-brand-700 font-bold shadow-sm' : 'hover:text-light-text'}`}
              >
                Static Image
              </button>
              {hasGithubUrl && (
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'code' ? 'bg-brand-100 text-brand-700 font-bold shadow-sm' : 'hover:text-light-text'}`}
                >
                  Code (Sandbox)
                </button>
              )}
            </div>

            {activeTab !== 'screenshot' && (
              <div className="hidden md:flex bg-white border border-light-border rounded-xl p-1 text-light-muted shrink-0">
                <button
                  onClick={() => setDevice('desktop')}
                  className={`p-1.5 rounded-lg transition-all ${device === 'desktop' ? 'bg-brand-100 text-brand-600' : 'hover:text-light-text'}`}
                  title="Desktop View"
                >
                  <Monitor size={15} />
                </button>
                <button
                  onClick={() => setDevice('tablet')}
                  className={`p-1.5 rounded-lg transition-all ${device === 'tablet' ? 'bg-brand-100 text-brand-600' : 'hover:text-light-text'}`}
                  title="Tablet View"
                >
                  <Tablet size={15} />
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  className={`p-1.5 rounded-lg transition-all ${device === 'mobile' ? 'bg-brand-100 text-brand-600' : 'hover:text-light-text'}`}
                  title="Mobile View"
                >
                  <Smartphone size={15} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
              <button
                onClick={handleRetry}
                className="p-2 rounded-xl border border-light-border bg-white hover:bg-light-surface text-light-muted hover:text-light-text transition-all"
                title="Reload Preview"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl border border-light-border bg-white hover:bg-light-surface text-light-muted hover:text-light-text transition-all"
                title="Copy Preview URL"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
              {(hasDemoUrl || hasGithubUrl) && (
                <a
                  href={hasDemoUrl ? actualDemoUrl : actualGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-light-border bg-white hover:bg-light-surface text-light-muted hover:text-light-text transition-all"
                  title={hasDemoUrl ? "Open site in new tab" : "Open repository in new tab"}
                >
                  <ArrowUpRight size={16} />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all border border-red-200 ml-1"
                title="Close Preview"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow bg-light-bg overflow-auto p-4 flex justify-center items-center relative">
          
          {activeTab === 'interactive' && (
            <div 
              style={getDeviceDimensions()} 
              className="relative shadow-2xl transition-all duration-300 ease-out border border-light-border bg-white h-full flex flex-col overflow-hidden rounded-xl"
            >
              {renderInteractiveContent()}
            </div>
          )}

          {activeTab === 'screenshot' && (
            <div className="w-full h-full max-w-5xl rounded-2xl border border-light-border bg-white overflow-hidden flex flex-col p-4">
              <div className="flex items-center gap-2 mb-3 shrink-0 text-xs text-light-text-secondary">
                <Info size={14} className="text-brand-500" />
                <span>Scroll or drag to view the project's high resolution thumbnail or screenshot.</span>
              </div>
              <div className="flex-grow overflow-auto flex items-center justify-center bg-light-surface rounded-xl border border-light-border p-4 min-h-[300px]">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="max-w-full max-h-full rounded-lg object-contain shadow-lg border border-light-border hover:scale-102 transition-transform duration-300 select-text"
                  />
                ) : (
                  <div className="text-center py-20 flex flex-col items-center gap-3">
                    <Globe size={48} className="text-light-muted mb-1" />
                    <p className="text-sm text-light-text-secondary">No thumbnail available</p>
                    <p className="text-xs text-light-muted max-w-xs">
                      {isLocalUpload
                        ? 'A thumbnail could not be auto-generated from the uploaded files.'
                        : 'The seller has not provided a screenshot or demo image.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'code' && hasGithubUrl && (
            <div 
              style={getDeviceDimensions()} 
              className="relative shadow-2xl transition-all duration-300 ease-out border border-light-border bg-white h-full flex flex-col overflow-hidden rounded-xl"
            >
              <iframe
                src={getStackBlitzUrl('code')}
                className="w-full h-full border-none bg-black"
                title={`${project.title} Stackblitz Sandbox`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
                allow="cross-origin-isolated; fullscreen"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

        </div>

        <div className="p-4 border-t border-light-border bg-light-surface flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[10px] text-light-muted uppercase tracking-widest block font-bold font-sans">Verification Price</span>
            <span className="text-lg font-black text-brand-600">${project.price} <span className="text-xs text-light-muted font-medium">for lifetime access</span></span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-light-border bg-white hover:bg-light-surface text-light-text-secondary hover:text-light-text font-semibold text-xs transition-all"
            >
              Keep Browsing
            </button>
            <a
              href={`/checkout/${project._id}`}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs transition-all shadow-md shadow-brand-500/15 text-center flex items-center justify-center gap-1.5"
            >
              Buy Source Code Now
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LivePreviewModal;
