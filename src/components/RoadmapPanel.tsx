'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, ChevronDown, ChevronRight, ExternalLink, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Problem, RoadmapTopic } from '@/types';

export function RoadmapPanel() {
  const { roadmapTopics, showRoadmap, setShowRoadmap, updateProblemStatus, updateProblemNotes } = useStore();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedProblem, setSelectedProblem] = useState<{ topicId: string; problem: Problem } | null>(null);

  if (!showRoadmap) return null;

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const getTopicProgress = (topic: RoadmapTopic) => {
    const completed = topic.problems.filter(p => p.status === 'completed').length;
    const total = topic.problems.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const getTotalProgress = () => {
    const totalProblems = roadmapTopics.reduce((sum, topic) => sum + topic.problems.length, 0);
    const completedProblems = roadmapTopics.reduce(
      (sum, topic) => sum + topic.problems.filter(p => p.status === 'completed').length,
      0
    );
    const percentage = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;
    return { completed: completedProblems, total: totalProblems, percentage };
  };

  const getStatusIcon = (status: Problem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <Circle size={16} className="text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: Problem['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'hard':
        return 'text-red-400';
    }
  };

  const totalProgress = getTotalProgress();

  // Group topics by category
  const beginnerTopics = roadmapTopics.filter(t => t.category === 'beginner').sort((a, b) => a.order - b.order);
  const intermediateTopics = roadmapTopics.filter(t => t.category === 'intermediate').sort((a, b) => a.order - b.order);
  const advancedTopics = roadmapTopics.filter(t => t.category === 'advanced').sort((a, b) => a.order - b.order);

  return (
    <div className="w-96 h-full bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🗺️ DSA Roadmap
          </h2>
          <button
            onClick={() => setShowRoadmap(false)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            title="Close roadmap"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-blue-400 font-semibold">
              {totalProgress.completed}/{totalProgress.total} ({totalProgress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto">
        {/* Beginner Section */}
        {beginnerTopics.length > 0 && (
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">
              📚 Beginner
            </h3>
            {beginnerTopics.map(topic => {
              const progress = getTopicProgress(topic);
              const isExpanded = expandedTopics.has(topic.id);
              
              return (
                <div key={topic.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  {/* Topic Header */}
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-medium text-white">{topic.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {progress.completed}/{progress.total}
                    </span>
                  </button>
                  
                  {/* Progress Bar */}
                  <div className="px-3 pb-2">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-green-500 h-1 rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Problems List */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1">
                      {topic.problems.map(problem => (
                        <button
                          key={problem.id}
                          onClick={() => setSelectedProblem({ topicId: topic.id, problem })}
                          className="w-full p-2 flex items-center gap-2 hover:bg-gray-750 rounded text-left transition-colors"
                        >
                          {getStatusIcon(problem.status)}
                          <span className="flex-1 text-sm text-gray-300">{problem.title}</span>
                          <span className={`text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Intermediate Section */}
        {intermediateTopics.length > 0 && (
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">
              📚 Intermediate
            </h3>
            {intermediateTopics.map(topic => {
              const progress = getTopicProgress(topic);
              const isExpanded = expandedTopics.has(topic.id);
              
              return (
                <div key={topic.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-medium text-white">{topic.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {progress.completed}/{progress.total}
                    </span>
                  </button>
                  
                  <div className="px-3 pb-2">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-yellow-500 h-1 rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1">
                      {topic.problems.map(problem => (
                        <button
                          key={problem.id}
                          onClick={() => setSelectedProblem({ topicId: topic.id, problem })}
                          className="w-full p-2 flex items-center gap-2 hover:bg-gray-750 rounded text-left transition-colors"
                        >
                          {getStatusIcon(problem.status)}
                          <span className="flex-1 text-sm text-gray-300">{problem.title}</span>
                          <span className={`text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Advanced Section */}
        {advancedTopics.length > 0 && (
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
              📚 Advanced
            </h3>
            {advancedTopics.map(topic => {
              const progress = getTopicProgress(topic);
              const isExpanded = expandedTopics.has(topic.id);
              
              return (
                <div key={topic.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-medium text-white">{topic.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {progress.completed}/{progress.total}
                    </span>
                  </button>
                  
                  <div className="px-3 pb-2">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-red-500 h-1 rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1">
                      {topic.problems.map(problem => (
                        <button
                          key={problem.id}
                          onClick={() => setSelectedProblem({ topicId: topic.id, problem })}
                          className="w-full p-2 flex items-center gap-2 hover:bg-gray-750 rounded text-left transition-colors"
                        >
                          {getStatusIcon(problem.status)}
                          <span className="flex-1 text-sm text-gray-300">{problem.title}</span>
                          <span className={`text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Problem Detail Modal */}
      {selectedProblem && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedProblem.problem.title}</h3>
                <span className={`text-sm font-medium ${getDifficultyColor(selectedProblem.problem.difficulty)}`}>
                  {selectedProblem.problem.difficulty.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            {/* Status Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateProblemStatus(selectedProblem.topicId, selectedProblem.problem.id, 'not_started');
                  setSelectedProblem(null);
                }}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  selectedProblem.problem.status === 'not_started'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Todo
              </button>
              <button
                onClick={() => {
                  updateProblemStatus(selectedProblem.topicId, selectedProblem.problem.id, 'in_progress');
                  setSelectedProblem(null);
                }}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  selectedProblem.problem.status === 'in_progress'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => {
                  updateProblemStatus(selectedProblem.topicId, selectedProblem.problem.id, 'completed');
                  setSelectedProblem(null);
                }}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  selectedProblem.problem.status === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Completed
              </button>
            </div>
            
            {/* LeetCode Link */}
            {selectedProblem.problem.leetcodeUrl && (
              <a
                href={selectedProblem.problem.leetcodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
              >
                <ExternalLink size={16} />
                Open on LeetCode
              </a>
            )}
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
              <textarea
                value={selectedProblem.problem.notes}
                onChange={(e) => updateProblemNotes(selectedProblem.topicId, selectedProblem.problem.id, e.target.value)}
                placeholder="Add your notes here..."
                className="w-full h-24 p-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Stats */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Attempts: {selectedProblem.problem.attempts}</span>
              {selectedProblem.problem.completedDate && (
                <span>
                  Completed: {new Date(selectedProblem.problem.completedDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

