import axios from 'axios';
import { useSettingsStore } from '../store/settingsStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FormulaRequest {
  formula: string;
  data: Record<string, any>;
  cellRef?: string;
}

export interface FormulaResponse {
  result: any;
  success: boolean;
  error?: string;
}

export interface SortRequest {
  data: any[];
  sortKeys: Array<{
    column: string;
    direction: 'asc' | 'desc';
    type?: string;
  }>;
}

export interface FilterRequest {
  data: any[];
  criteria: {
    column: string;
    condition: string;
    value: any;
  };
}

export interface ExcelImportResponse {
  sheets: Record<string, any[][]>;
  success: boolean;
  error?: string;
}

export interface CloudSyncRequest {
  provider: 'microsoft' | 'google';
  fileId: string;
  data: any;
}

class SpreadsheetAPIService {
  // Formula evaluation
  async evaluateFormula(request: FormulaRequest): Promise<FormulaResponse> {
    try {
      const response = await apiClient.post('/spreadsheet/formula/evaluate', request);
      return response.data;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      // Fallback to client-side evaluation
      const { evaluateFormula } = await import('./spreadsheetEngine');
      const result = evaluateFormula(request.formula, request.data);
      return { result, success: !result?.error };
    }
  }

  // Data operations
  async sortData(request: SortRequest): Promise<{ data: any[]; success: boolean }> {
    try {
      const response = await apiClient.post('/spreadsheet/data/sort', request);
      return response.data;
    } catch (error) {
      console.error('Sort error:', error);
      // Fallback to client-side sorting
      const sorted = [...request.data].sort((a, b) => {
        for (const key of request.sortKeys) {
          const aVal = a[key.column];
          const bVal = b[key.column];
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          if (comparison !== 0) {
            return key.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
      return { data: sorted, success: true };
    }
  }

  async filterData(request: FilterRequest): Promise<{ data: any[]; success: boolean }> {
    try {
      const response = await apiClient.post('/spreadsheet/data/filter', request);
      return response.data;
    } catch (error) {
      console.error('Filter error:', error);
      // Fallback to client-side filtering
      const filtered = request.data.filter(row => {
        const value = row[request.criteria.column];
        switch (request.criteria.condition) {
          case 'equals': return value === request.criteria.value;
          case 'notEquals': return value !== request.criteria.value;
          case 'greaterThan': return value > request.criteria.value;
          case 'lessThan': return value < request.criteria.value;
          case 'contains': return String(value).includes(request.criteria.value);
          default: return true;
        }
      });
      return { data: filtered, success: true };
    }
  }

  // Excel file operations
  async importExcel(file: File): Promise<ExcelImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/spreadsheet/excel/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Excel import error:', error);
      throw new Error('Failed to import Excel file');
    }
  }

  async exportExcel(data: Record<string, any[][]>): Promise<Blob> {
    try {
      const response = await apiClient.post('/spreadsheet/excel/export', data, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('Failed to export Excel file');
    }
  }

  // Cloud sync operations
  async syncToCloud(request: CloudSyncRequest): Promise<{ success: boolean; url?: string }> {
    try {
      const response = await apiClient.post('/spreadsheet/cloud/sync', request);
      return response.data;
    } catch (error) {
      console.error('Cloud sync error:', error);
      throw new Error('Failed to sync to cloud');
    }
  }

  async getCloudFiles(provider: 'microsoft' | 'google'): Promise<any[]> {
    try {
      const response = await apiClient.get(`/spreadsheet/cloud/files?provider=${provider}`);
      return response.data.files || [];
    } catch (error) {
      console.error('Get cloud files error:', error);
      return [];
    }
  }

  async downloadFromCloud(provider: 'microsoft' | 'google', fileId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/spreadsheet/cloud/download?provider=${provider}&fileId=${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Download from cloud error:', error);
      throw new Error('Failed to download from cloud');
    }
  }
}

export const spreadsheetAPI = new SpreadsheetAPIService();
export default spreadsheetAPI;
