import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  CloudOff, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { useSpreadsheetStore } from '../../store/spreadsheetStore';
import { cloudSyncService } from '../../services/cloudSync';
import { spreadsheetAPI } from '../../services/spreadsheetAPI';

interface CloudSyncPanelProps {
  onClose: () => void;
}

const CloudSyncPanel: React.FC<CloudSyncPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'microsoft' | 'google'>('microsoft');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  const { getActiveFile, getActiveSheet, openFiles } = useSpreadsheetStore();

  useEffect(() => {
    checkAuth();
  }, [activeTab]);

  const checkAuth = () => {
    const authed = cloudSyncService.isAuthenticated(activeTab);
    setIsAuthenticated(authed);
    if (authed) {
      loadFiles();
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await cloudSyncService.getCloudFiles(activeTab);
      setFiles(files);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = () => {
    const clientId = activeTab === 'microsoft' 
      ? import.meta.env.VITE_MICROSOFT_CLIENT_ID 
      : import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError(`${activeTab === 'microsoft' ? 'Microsoft' : 'Google'} client ID not configured`);
      return;
    }

    const redirectUri = window.location.origin + '/oauth/callback';
    const authUrl = activeTab === 'microsoft'
      ? cloudSyncService.getMicrosoftAuthUrl(clientId, redirectUri)
      : cloudSyncService.getGoogleAuthUrl(clientId, redirectUri);

    // Open popup for OAuth
    const popup = window.open(
      authUrl,
      'oauth',
      'width=600,height=700,scrollbars=yes'
    );

    // Listen for message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth_success') {
        cloudSyncService.handleAuthCallback(activeTab, event.data.hash);
        checkAuth();
        popup?.close();
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);
  };

  const handleDownload = async (fileId: string) => {
    setSyncStatus('syncing');
    try {
      const data = await cloudSyncService.downloadFromCloud(activeTab, fileId);
      // TODO: Load data into spreadsheet store
      console.log('Downloaded data:', data);
      setSyncStatus('success');
    } catch (err: any) {
      setError(err.message || 'Download failed');
      setSyncStatus('error');
    }
  };

  const handleUpload = async () => {
    const file = getActiveFile();
    const sheet = getActiveSheet();
    
    if (!file || !sheet) {
      setError('No file open');
      return;
    }

    setSyncStatus('syncing');
    try {
      // Convert sheet data to arrays
      const data: Record<string, any[][]> = {
        [sheet.name]: [['Test']]  // TODO: Convert actual sheet data
      };
      
      const url = await cloudSyncService.uploadToGoogle(file.name, data);
      setSyncStatus('success');
      console.log('Uploaded to:', url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setSyncStatus('error');
    }
  };

  const handleLogout = () => {
    cloudSyncService.clearAuthConfig(activeTab);
    setIsAuthenticated(false);
    setFiles([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloud Sync
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('microsoft')}
            className={`flex-1 px-4 py-2 font-medium ${
              activeTab === 'microsoft'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Microsoft OneDrive
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 px-4 py-2 font-medium ${
              activeTab === 'google'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Google Drive
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {!isAuthenticated ? (
            <div className="text-center py-8">
              <CloudOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Connect to {activeTab === 'microsoft' ? 'Microsoft OneDrive' : 'Google Drive'} to sync your spreadsheets
              </p>
              <button
                onClick={handleAuth}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Cloud className="w-4 h-4" />
                Connect
              </button>
            </div>
          ) : (
            <div>
              {/* Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleUpload}
                  disabled={syncStatus === 'syncing'}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Upload className="w-4 h-4" />
                  Upload Current
                </button>
                <button
                  onClick={loadFiles}
                  disabled={loading}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm ml-auto"
                >
                  Disconnect
                </button>
              </div>

              {/* Status */}
              {syncStatus === 'success' && (
                <div className="mb-4 p-2 bg-green-50 text-green-700 rounded flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Sync successful!
                </div>
              )}
              {syncStatus === 'error' && (
                <div className="mb-4 p-2 bg-red-50 text-red-700 rounded flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Sync failed
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              {/* File List */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading files...
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-2" />
                  No spreadsheet files found
                </div>
              ) : (
                <div className="space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudSyncPanel;
