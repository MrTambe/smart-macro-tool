import React, { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, 
  Check, 
  X, 
  Eye, 
  Play, 
  RotateCcw,
  AlertCircle,
  FileEdit,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileDown,
  Info,
  Lightbulb,
  Shield,
  Table,
  FileSpreadsheet
} from 'lucide-react';
import { useSpreadsheetStore } from '../../store/spreadsheetStore';
import { useToast } from '../../contexts/ToastContext';
import ReactMarkdown from 'react-markdown';

interface AIReviewPanelProps {
  onClose: () => void;
}

interface Suggestion {
  suggestion_id: string;
  title: string;
  description: string;
  reasoning: string;
  confidence: string;
  confidence_score: number;
  impact: 'low' | 'medium' | 'high';
  affected_cells: number;
  change_types: string[];
  requires_confirmation: boolean;
  preview_available: boolean;
  changes: CellChange[];
}

interface CellChange {
  cell_id: string;
  old_value: string | null;
  new_value: string | null;
  is_formula: boolean;
  change_type: string;
  description: string;
}

interface DetailedPreview {
  markdown_preview: string;
  html_preview: string;
  changes_table: string;
  statistics: any;
  warnings: string[];
  recommendations: string[];
}

const AIReviewPanelEnhanced: React.FC<AIReviewPanelProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [changeRequest, setChangeRequest] = useState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [detailedPreview, setDetailedPreview] = useState<DetailedPreview | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'explanation'>('overview');
  const [formattedOutput, setFormattedOutput] = useState<any>(null);
  
  const spreadsheetStore = useSpreadsheetStore();
  const { showSuccess, showError, showInfo } = useToast();
  
  const activeFile = spreadsheetStore.getActiveFile();
  const activeSheet = spreadsheetStore.getActiveSheet();

  const handleRequestChanges = async () => {
    if (!prompt.trim()) {
      showError('Please enter a request');
      return;
    }
    
    if (!activeFile || !activeSheet) {
      showError('No file is currently open');
      return;
    }
    
    setIsAnalyzing(true);
    setChangeRequest(null);
    setFormattedOutput(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/ai-review/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: activeFile.id,
          sheet_id: activeSheet.id,
          user_prompt: prompt,
          options: { max_suggestions: 5 }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to request AI analysis');
      }
      
      const data = await response.json();
      setChangeRequest(data);
      setFormattedOutput(data.formatted_output);
      showSuccess('AI analysis complete!');
      
    } catch (error) {
      showError('Failed to analyze file: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreview = async (suggestionId: string) => {
    if (!changeRequest) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/ai-review/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: changeRequest.request_id,
          suggestion_id: suggestionId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to preview changes');
      }
      
      const data = await response.json();
      setDetailedPreview(data);
      setSelectedSuggestion(suggestionId);
      setActiveTab('detailed');
      
    } catch (error) {
      showError('Failed to preview: ' + (error as Error).message);
    }
  };

  const handleExplain = async (suggestionId: string) => {
    if (!changeRequest) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/ai-review/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: changeRequest.request_id,
          suggestion_id: suggestionId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get explanation');
      }
      
      const data = await response.json();
      setExplanation(data.explanation);
      setActiveTab('explanation');
      
    } catch (error) {
      showError('Failed to explain: ' + (error as Error).message);
    }
  };

  const handleApprove = async (suggestionId: string) => {
    if (!changeRequest) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/ai-review/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: changeRequest.request_id,
          suggestion_id: suggestionId,
          note: 'Approved by user'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve');
      }
      
      const data = await response.json();
      setChangeRequest({ ...changeRequest, status: 'approved', selected_suggestion: suggestionId });
      showSuccess('Changes approved!');
      
    } catch (error) {
      showError('Failed to approve: ' + (error as Error).message);
    }
  };

  const handleApply = async () => {
    if (!changeRequest || !changeRequest.selected_suggestion) {
      showError('No changes selected');
      return;
    }
    
    setIsApplying(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/ai-review/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: changeRequest.request_id,
          create_backup: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply changes');
      }
      
      const data = await response.json();
      
      // Refresh the grid
      spreadsheetStore.refreshGrid();
      
      setChangeRequest({ ...changeRequest, status: 'applied' });
      showSuccess(`Applied ${data.changes_applied} changes in ${data.execution_time_ms}ms!`);
      
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      showError('Failed to apply: ' + (error as Error).message);
    } finally {
      setIsApplying(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.8) return 'bg-green-100 text-green-800 border-green-300';
    if (score > 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Info className="w-4 h-4 text-yellow-500" />;
      default: return <Check className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Review & Approve</h2>
              <p className="text-sm text-gray-500">
                Intelligent analysis with detailed explanations
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Sidebar - Suggestions List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4 bg-gray-50">
            {/* Input Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to change?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Calculate totals in column F', 'Clean up data', 'Add formulas'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                rows={3}
                disabled={isAnalyzing}
              />
              <button
                onClick={handleRequestChanges}
                disabled={isAnalyzing || !prompt.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Play className="w-4 h-4" /> Analyze</>
                )}
              </button>
            </div>

            {/* Suggestions List */}
            {changeRequest?.suggestions && changeRequest.suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggestions ({changeRequest.suggestions.length})
                </h3>
                
                {changeRequest.suggestions.map((suggestion: Suggestion, idx: number) => (
                  <div
                    key={suggestion.suggestion_id}
                    onClick={() => setSelectedSuggestion(suggestion.suggestion_id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSuggestion === suggestion.suggestion_id
                        ? 'border-purple-500 bg-purple-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getConfidenceColor(suggestion.confidence_score)}`}>
                        {suggestion.confidence}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{suggestion.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{suggestion.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        {getImpactIcon(suggestion.impact)}
                        {suggestion.impact}
                      </span>
                      <span>{suggestion.affected_cells} cells</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Content - Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {!changeRequest && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Sparkles className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Ready to Analyze</p>
                <p className="text-sm">Enter your request and click Analyze</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-lg font-medium text-gray-700">AI is analyzing your data...</p>
                <p className="text-sm text-gray-500">This may take a few moments</p>
              </div>
            )}

            {changeRequest && selectedSuggestion && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b border-gray-200">
                  {['overview', 'detailed', 'explanation'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                        activeTab === tab
                          ? 'text-purple-600 border-b-2 border-purple-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {changeRequest.summary && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Summary
                        </h3>
                        <p className="text-sm text-blue-800">{changeRequest.summary}</p>
                      </div>
                    )}

                    {changeRequest.action_items && changeRequest.action_items.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          Action Items
                        </h3>
                        <ul className="space-y-1">
                          {changeRequest.action_items.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-purple-500 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {formattedOutput?.markdown && (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{formattedOutput.markdown}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'detailed' && detailedPreview && (
                  <div className="space-y-4">
                    {/* Warnings */}
                    {detailedPreview.warnings.length > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Warnings
                        </h3>
                        <ul className="space-y-1">
                          {detailedPreview.warnings.map((warning, idx) => (
                            <li key={idx} className="text-sm text-yellow-800">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Changes Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                        <Table className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700">Changes Preview</span>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <div 
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: detailedPreview.html_preview }}
                        />
                      </div>
                    </div>

                    {/* Recommendations */}
                    {detailedPreview.recommendations.length > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="font-medium text-green-900 mb-2">Recommendations</h3>
                        <ul className="space-y-1">
                          {detailedPreview.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-green-800">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'explanation' && explanation && (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handlePreview(selectedSuggestion)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleExplain(selectedSuggestion)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Info className="w-4 h-4" />
                    Explain
                  </button>
                  
                  {changeRequest.status === 'suggested' && (
                    <button
                      onClick={() => handleApprove(selectedSuggestion)}
                      className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          {changeRequest?.status === 'suggested' && (
            <button
              onClick={() => {}} // Reject handler
              className="flex items-center gap-2 px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg"
            >
              <XCircle className="w-4 h-4" />
              Reject All
            </button>
          )}
          
          <div className="flex gap-2">
            {changeRequest?.status === 'approved' && (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {isApplying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Apply Changes</>
                )}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReviewPanelEnhanced;
