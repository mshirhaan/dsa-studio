'use client';

import { useState, useEffect } from 'react';
import { X, GitCommit, Loader2, Check, AlertCircle, Github, Settings } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Problem, RoadmapTopic } from '@/types';
import { 
  commitFileToGitHub, 
  updateSolutionsFile, 
  loadGitConfig, 
  saveGitConfig,
  GitConfig,
  CommitResult 
} from '@/lib/gitUtils';

interface CommitSolutionModalProps {
  problem: Problem;
  topic: RoadmapTopic;
  onClose: () => void;
}

export default function CommitSolutionModal({ problem, topic, onClose }: CommitSolutionModalProps) {
  const { codeFiles, roadmapTopics, updateProblemCommitInfo } = useStore();
  
  const [selectedFileId, setSelectedFileId] = useState<string>(codeFiles[0]?.id || '');
  const [commitMessage, setCommitMessage] = useState(`feat: Solve ${problem.title}`);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitStatus, setCommitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [commitUrl, setCommitUrl] = useState('');
  
  // Git config state
  const [showGitConfig, setShowGitConfig] = useState(false);
  const [gitConfig, setGitConfig] = useState<GitConfig | null>(null);
  const [configToken, setConfigToken] = useState('');
  const [configUsername, setConfigUsername] = useState('');
  const [configRepo, setConfigRepo] = useState('');
  const [configBranch, setConfigBranch] = useState('main');
  
  // Load git config on mount
  useEffect(() => {
    const config = loadGitConfig();
    if (config) {
      setGitConfig(config);
      setConfigToken(config.token);
      setConfigUsername(config.username);
      setConfigRepo(config.repo);
      setConfigBranch(config.branch || 'main');
    } else {
      setShowGitConfig(true); // Show config form if no config exists
    }
  }, []);
  
  const selectedFile = codeFiles.find(f => f.id === selectedFileId);
  
  const handleSaveConfig = () => {
    const config: GitConfig = {
      token: configToken,
      username: configUsername,
      repo: configRepo,
      branch: configBranch,
    };
    saveGitConfig(config);
    setGitConfig(config);
    setShowGitConfig(false);
  };
  
  const handleCommit = async () => {
    if (!selectedFile || !gitConfig) return;
    
    setIsCommitting(true);
    setCommitStatus('idle');
    setErrorMessage('');
    
    try {
      // Step 1: Commit the solution file
      const result: CommitResult = await commitFileToGitHub({
        config: gitConfig,
        fileName: selectedFile.name,
        fileContent: selectedFile.content,
        commitMessage,
      });
      
      if (!result.success || !result.commitUrl || !result.commitSha) {
        throw new Error(result.error || 'Failed to commit file');
      }
      
      setCommitUrl(result.commitUrl);
      
      // Step 2: Update problem with commit info
      updateProblemCommitInfo(topic.id, problem.id, {
        githubCommitUrl: result.commitUrl,
        solutionFileName: selectedFile.name,
        commitSha: result.commitSha,
      });
      
      // Step 3: Update SOLUTIONS.md with the updated roadmap
      // We need to manually create the updated topics array since store update is async
      const updatedTopics = roadmapTopics.map(t => 
        t.id === topic.id
          ? {
              ...t,
              problems: t.problems.map(p =>
                p.id === problem.id
                  ? {
                      ...p,
                      githubCommitUrl: result.commitUrl,
                      solutionFileName: selectedFile.name,
                      commitSha: result.commitSha,
                      status: 'completed' as const,
                      completedDate: Date.now(),
                    }
                  : p
              ),
            }
          : t
      );
      
      const mdResult = await updateSolutionsFile(gitConfig, updatedTopics);
      
      if (!mdResult.success) {
        console.error('Failed to update SOLUTIONS.md:', mdResult.error);
        setErrorMessage(`Solution committed but SOLUTIONS.md update failed: ${mdResult.error}`);
      } else {
        console.log('SOLUTIONS.md updated successfully:', mdResult.commitUrl);
      }
      
      setCommitStatus('success');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Commit error:', error);
      setCommitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsCommitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Commit Solution</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            disabled={isCommitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Problem Info */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-blue-400">{problem.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                problem.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                problem.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {problem.difficulty}
              </span>
            </div>
            <p className="text-sm text-gray-400">{topic.name}</p>
            {problem.leetcodeUrl && (
              <a 
                href={problem.leetcodeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline flex items-center gap-1"
              >
                View on LeetCode →
              </a>
            )}
          </div>
          
          {/* Git Config Section */}
          {!showGitConfig && gitConfig ? (
            <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {gitConfig.username}/{gitConfig.repo}
                </span>
              </div>
              <button
                onClick={() => setShowGitConfig(true)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Change
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <h4 className="font-medium text-sm">Git Configuration</h4>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">GitHub Token</label>
                <input
                  type="password"
                  value={configToken}
                  onChange={(e) => setConfigToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={configUsername}
                    onChange={(e) => setConfigUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Repository</label>
                  <input
                    type="text"
                    value={configRepo}
                    onChange={(e) => setConfigRepo(e.target.value)}
                    placeholder="repo-name"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Branch</label>
                <input
                  type="text"
                  value={configBranch}
                  onChange={(e) => setConfigBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={handleSaveConfig}
                disabled={!configToken || !configUsername || !configRepo}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded text-sm font-medium transition-colors"
              >
                Save Configuration
              </button>
            </div>
          )}
          
          {/* File Selection */}
          {gitConfig && !showGitConfig && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Select Solution File</label>
                <select
                  value={selectedFileId}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  disabled={isCommitting}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  {codeFiles.map(file => (
                    <option key={file.id} value={file.id}>
                      {file.name} ({file.language})
                    </option>
                  ))}
                </select>
                {selectedFile && (
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedFile.content.split('\n').length} lines
                  </p>
                )}
              </div>
              
              {/* Commit Message */}
              <div>
                <label className="block text-sm font-medium mb-2">Commit Message</label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  disabled={isCommitting}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="feat: Solve problem name"
                />
              </div>
              
              {/* Status Messages */}
              {commitStatus === 'success' && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-400">Success!</p>
                    <p className="text-xs text-green-300 mt-1">
                      Solution committed, roadmap updated, and SOLUTIONS.md generated!
                    </p>
                    {commitUrl && (
                      <div className="mt-2 space-y-1">
                        <a 
                          href={commitUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-green-400 hover:underline block"
                        >
                          View solution commit →
                        </a>
                        <a 
                          href={`https://github.com/${gitConfig?.username}/${gitConfig?.repo}/blob/${gitConfig?.branch || 'main'}/SOLUTIONS.md`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-green-400 hover:underline block"
                        >
                          View SOLUTIONS.md →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {commitStatus === 'error' && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400">Error</p>
                    <p className="text-xs text-red-300 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        {gitConfig && !showGitConfig && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
            <button
              onClick={onClose}
              disabled={isCommitting}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={isCommitting || !selectedFile || !commitMessage || commitStatus === 'success'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Committing...
                </>
              ) : commitStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4" />
                  Committed
                </>
              ) : (
                <>
                  <GitCommit className="w-4 h-4" />
                  Commit & Track
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

