import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import { useSpreadsheetStore } from '../../store/spreadsheetStore';
import { useToast } from '../../contexts/ToastContext';

interface AIReviewPanelProps {
  onClose: () => void;
}

interface ChangeRequest {
  request_id: string;
  status: 'pending' | 'suggested' | 'approved' | 'rejected' | 'applied' | 'failed';
  user_prompt: string;
  suggestions: Suggestion[];
  selected_suggestion?: string;
}

interface Suggestion {
  suggestion_id: string;
  description: string;
  reasoning: string;
  confidence: string;
  affected_cells: number;
  change_types: string[];
}

interface CellChange {
  cell_id: string;
  old_value: string;
  new_value: string;
  change_type: string;
  description: string;
  is_formula: boolean;
}

const AIReviewPanel: React.FC<AIReviewPanelProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  
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
    
    try {
      const response = await fetch('http://localhost:8000/api/ai-review/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: activeFile.id,
          sheet_id: activeSheet.id,
          user_prompt: prompt
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to request AI analysis');
      }
      
      const data = await response.json();
      setChangeRequest(data);
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
      setPreview(data);
      setSelectedSuggestion(suggestionId);
      
    } catch (error) {
      showError('Failed to preview: ' + (error as Error).message);
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
          suggestion_id: suggestionId
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

  const handleReject = async () => {
    if (!changeRequest) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/ai-review/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: changeRequest.request_id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject');
      }
      
      setChangeRequest({ ...changeRequest, status: 'rejected' });
      showInfo('Changes rejected');
      
    } catch (error) {
      showError('Failed to reject: ' + (error as Error).message);
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
          request_id: changeRequest.request_id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply changes');
      }
      
      const data = await response.json();
      
      // Refresh the grid
      spreadsheetStore.refreshGrid();
      
      setChangeRequest({ ...changeRequest, status: 'applied' });
      showSuccess(`Applied ${data.changes_applied} changes successfully!`);
      
      // Close panel after successful application
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      showError('Failed to apply: ' + (error as Error).message);
    } finally {
      setIsApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'suggested': return 'text-blue-500';
      case 'approved': return 'text-green-500';
      case 'applied': return 'text-purple-500';
      case 'rejected': return 'text-red-500';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileEdit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Review & Approve</h2>
              <p className="text-sm text-gray-500">
                AI analyzes your file, suggests changes, you review and approve
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Request Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What changes would you like?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Calculate totals in column F', 'Clean up empty rows', 'Add SUM formulas'"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAnalyzing}
              />
              <button
                onClick={handleRequestChanges}
                disabled={isAnalyzing || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status */}
          {changeRequest && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500">Status: </span>
                  <span className={`font-medium capitalize ${getStatusColor(changeRequest.status)}`}>
                    {changeRequest.status}
                  </span>
                </div>
                {changeRequest.suggestions.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {changeRequest.suggestions.length} suggestion(s)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {changeRequest?.suggestions && changeRequest.suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                AI Suggestions
              </h3>
              
              {changeRequest.suggestions.map((suggestion) => (
                <div
                  key={suggestion.suggestion_id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedSuggestion === suggestion.suggestion_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{suggestion.description}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.reasoning}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        Confidence: {suggestion.confidence}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>{suggestion.affected_cells} cells affected</span>
                    <span>•</span>
                    <span>{suggestion.change_types.join(', ')}</span>
                  </div>

                  {/* Actions */}
                  {changeRequest.status === 'suggested' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreview(suggestion.suggestion_id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleApprove(suggestion.suggestion_id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Preview of Changes
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {preview.changes.map((change: CellChange, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded border">
                    <span className="font-mono text-sm font-medium text-gray-900 w-12">
                      {change.cell_id}
                    </span>
                    <div className="flex-1 flex items-center gap-2 text-sm">
                      <span className="text-red-600 line-through truncate max-w-[150px]">
                        {change.old_value || '(empty)'}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 font-medium truncate max-w-[150px]">
                        {change.new_value}
                      </span>
                      {change.is_formula && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                          formula
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{change.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No suggestions */}
          {changeRequest?.suggestions?.length === 0 && changeRequest.status !== 'pending' && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No suggestions generated. Try a different request.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          <div>
            {changeRequest?.status === 'suggested' && (
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg"
              >
                <XCircle className="w-4 h-4" />
                Reject All
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            {changeRequest?.status === 'approved' && (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Apply Changes
                  </>
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

export default AIReviewPanel;
