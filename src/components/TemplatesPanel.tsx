'use client';

import { useState } from 'react';
import { FileCode, X, Search, Code } from 'lucide-react';
import { codeTemplates, CodeTemplate } from '@/lib/codeTemplates';
import { useStore } from '@/store/useStore';

export function TemplatesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { addCodeFile } = useStore();

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'array', label: 'Arrays' },
    { id: 'linked-list', label: 'Linked Lists' },
    { id: 'tree', label: 'Trees' },
    { id: 'graph', label: 'Graphs' },
    { id: 'sorting', label: 'Sorting' },
    { id: 'searching', label: 'Searching' },
    { id: 'dp', label: 'Dynamic Programming' },
    { id: 'other', label: 'Other' },
  ];

  const filteredTemplates = codeTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInsertTemplate = (template: CodeTemplate) => {
    const newFile = {
      id: `file-${Date.now()}`,
      name: `${template.id}.${template.language === 'javascript' ? 'js' : template.language === 'typescript' ? 'ts' : template.language === 'python' ? 'py' : template.language === 'cpp' ? 'cpp' : 'java'}`,
      language: template.language,
      content: template.code,
    };
    
    addCodeFile(newFile);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors text-white"
        title="Code Templates"
      >
        <FileCode size={16} />
        Templates
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden m-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Code className="text-purple-500" size={24} />
                <h2 className="text-xl font-bold text-white">Code Templates</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-700 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Code size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No templates found</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-gray-750 border border-gray-600 rounded-lg p-4 hover:border-purple-500 transition-colors cursor-pointer"
                      onClick={() => handleInsertTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">{template.description}</p>
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 bg-purple-600 text-purple-100 text-xs rounded">
                              {template.language}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-600 text-gray-200 text-xs rounded capitalize">
                              {template.category.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                        <button
                          className="ml-4 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsertTemplate(template);
                          }}
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
              <p>💡 Tip: Click on a template to insert it as a new file in your editor</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

