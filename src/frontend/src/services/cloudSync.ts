import axios from 'axios';

// Microsoft Graph API Configuration
const MS_GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

// Google Sheets API Configuration
const GOOGLE_SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4';
const GOOGLE_DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webUrl?: string;
}

export interface CloudAuthConfig {
  provider: 'microsoft' | 'google';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

class CloudSyncService {
  private authConfig: CloudAuthConfig | null = null;

  setAuthConfig(config: CloudAuthConfig) {
    this.authConfig = config;
    localStorage.setItem(`cloud_auth_${config.provider}`, JSON.stringify(config));
  }

  getAuthConfig(provider: 'microsoft' | 'google'): CloudAuthConfig | null {
    if (this.authConfig?.provider === provider) {
      return this.authConfig;
    }
    const stored = localStorage.getItem(`cloud_auth_${provider}`);
    return stored ? JSON.parse(stored) : null;
  }

  clearAuthConfig(provider: 'microsoft' | 'google') {
    if (this.authConfig?.provider === provider) {
      this.authConfig = null;
    }
    localStorage.removeItem(`cloud_auth_${provider}`);
  }

  isAuthenticated(provider: 'microsoft' | 'google'): boolean {
    const config = this.getAuthConfig(provider);
    if (!config) return false;
    if (config.expiresAt && Date.now() > config.expiresAt) {
      this.clearAuthConfig(provider);
      return false;
    }
    return true;
  }

  // ==================== MICROSOFT GRAPH API ====================

  async getMicrosoftFiles(folderId: string = 'root'): Promise<CloudFile[]> {
    const config = this.getAuthConfig('microsoft');
    if (!config) throw new Error('Not authenticated with Microsoft');

    try {
      const response = await axios.get(
        `${MS_GRAPH_BASE_URL}/me/drive/items/${folderId}/children`,
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
          params: {
            $filter: "mimeType eq 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType eq 'application/vnd.ms-excel'",
            $select: 'id,name,mimeType,lastModifiedDateTime,webUrl',
          },
        }
      );

      return response.data.value.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.lastModifiedDateTime,
        webUrl: file.webUrl,
      }));
    } catch (error) {
      console.error('Microsoft Graph API error:', error);
      throw new Error('Failed to fetch Microsoft files');
    }
  }

  async downloadMicrosoftFile(fileId: string): Promise<any[][]> {
    const config = this.getAuthConfig('microsoft');
    if (!config) throw new Error('Not authenticated with Microsoft');

    try {
      // First, get the workbook metadata
      const workbookResponse = await axios.get(
        `${MS_GRAPH_BASE_URL}/me/drive/items/${fileId}/workbook`,
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
        }
      );

      // Get worksheets
      const worksheetsResponse = await axios.get(
        `${MS_GRAPH_BASE_URL}/me/drive/items/${fileId}/workbook/worksheets`,
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
        }
      );

      const sheets: Record<string, any[][]> = {};

      // Get data from each worksheet
      for (const worksheet of worksheetsResponse.data.value) {
        const rangeResponse = await axios.get(
          `${MS_GRAPH_BASE_URL}/me/drive/items/${fileId}/workbook/worksheets/${worksheet.id}/usedRange`,
          {
            headers: { Authorization: `Bearer ${config.accessToken}` },
          }
        );

        sheets[worksheet.name] = rangeResponse.data.values || [];
      }

      return sheets;
    } catch (error) {
      console.error('Microsoft download error:', error);
      throw new Error('Failed to download from Microsoft');
    }
  }

  async uploadToMicrosoft(fileName: string, data: Record<string, any[][]>, folderId: string = 'root'): Promise<string> {
    const config = this.getAuthConfig('microsoft');
    if (!config) throw new Error('Not authenticated with Microsoft');

    try {
      // Create a simple Excel file using the backend API
      // Microsoft Graph doesn't support creating workbooks directly with values easily
      // We'll create via backend and upload
      const response = await axios.post(
        `${MS_GRAPH_BASE_URL}/me/drive/items/${folderId}/children`,
        {
          name: fileName,
          file: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        },
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
        }
      );

      const fileId = response.data.id;

      // Update each worksheet
      for (const [sheetName, values] of Object.entries(data)) {
        try {
          // Create or get worksheet
          await axios.post(
            `${MS_GRAPH_BASE_URL}/me/drive/items/${fileId}/workbook/worksheets`,
            { name: sheetName },
            {
              headers: { Authorization: `Bearer ${config.accessToken}` },
            }
          );

          // Update range with values
          const rangeAddress = `A1:${this.getColumnLetter(values[0]?.length || 1)}${values.length}`;
          await axios.patch(
            `${MS_GRAPH_BASE_URL}/me/drive/items/${fileId}/workbook/worksheets/${sheetName}/range(address='${rangeAddress}')`,
            { values },
            {
              headers: { Authorization: `Bearer ${config.accessToken}` },
            }
          );
        } catch (sheetError) {
          console.warn(`Failed to update sheet ${sheetName}:`, sheetError);
        }
      }

      return response.data.webUrl;
    } catch (error) {
      console.error('Microsoft upload error:', error);
      throw new Error('Failed to upload to Microsoft');
    }
  }

  // ==================== GOOGLE SHEETS API ====================

  async getGoogleFiles(): Promise<CloudFile[]> {
    const config = this.getAuthConfig('google');
    if (!config) throw new Error('Not authenticated with Google');

    try {
      const response = await axios.get(
        `${GOOGLE_DRIVE_BASE_URL}/files`,
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
          params: {
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
          },
        }
      );

      return response.data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        webUrl: file.webViewLink,
      }));
    } catch (error) {
      console.error('Google Drive API error:', error);
      throw new Error('Failed to fetch Google files');
    }
  }

  async downloadGoogleFile(fileId: string): Promise<Record<string, any[][]>> {
    const config = this.getAuthConfig('google');
    if (!config) throw new Error('Not authenticated with Google');

    try {
      // Get spreadsheet metadata
      const spreadsheetResponse = await axios.get(
        `${GOOGLE_SHEETS_BASE_URL}/spreadsheets/${fileId}`,
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
        }
      );

      const sheets: Record<string, any[][]> = {};

      // Get data from each sheet
      for (const sheet of spreadsheetResponse.data.sheets) {
        const sheetName = sheet.properties.title;
        const rangeResponse = await axios.get(
          `${GOOGLE_SHEETS_BASE_URL}/spreadsheets/${fileId}/values/${sheetName}`,
          {
            headers: { Authorization: `Bearer ${config.accessToken}` },
          }
        );

        sheets[sheetName] = rangeResponse.data.values || [];
      }

      return sheets;
    } catch (error) {
      console.error('Google Sheets download error:', error);
      throw new Error('Failed to download from Google');
    }
  }

  async uploadToGoogle(fileName: string, data: Record<string, any[][]>): Promise<string> {
    const config = this.getAuthConfig('google');
    if (!config) throw new Error('Not authenticated with Google');

    try {
      // Create spreadsheet
      const createResponse = await axios.post(
        `${GOOGLE_SHEETS_BASE_URL}/spreadsheets`,
        {
          properties: { title: fileName },
        },
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
        }
      );

      const spreadsheetId = createResponse.data.spreadsheetId;
      const sheetIds = createResponse.data.sheets.map((s: any) => ({
        id: s.properties.sheetId,
        title: s.properties.title,
      }));

      // Add data to sheets
      const batchUpdateRequests = [];
      let sheetIndex = 0;

      for (const [sheetName, values] of Object.entries(data)) {
        // Rename default sheet or add new ones
        if (sheetIndex === 0) {
          batchUpdateRequests.push({
            updateSheetProperties: {
              properties: {
                sheetId: sheetIds[0].id,
                title: sheetName,
              },
              fields: 'title',
            },
          });
        } else if (sheetIndex >= sheetIds.length) {
          batchUpdateRequests.push({
            addSheet: {
              properties: { title: sheetName },
            },
          });
        }

        // Update values
        const range = `${sheetName}!A1:${this.getColumnLetter(values[0]?.length || 1)}${values.length}`;
        batchUpdateRequests.push({
          updateCells: {
            range: { sheetId: sheetIndex === 0 ? sheetIds[0].id : sheetIndex },
            rows: values.map(row => ({
              values: row.map(cell => ({
                userEnteredValue: typeof cell === 'number' 
                  ? { numberValue: cell }
                  : { stringValue: String(cell) },
              })),
            })),
            fields: 'userEnteredValue',
          },
        });

        sheetIndex++;
      }

      // Execute batch update
      await axios.post(
        `${GOOGLE_SHEETS_BASE_URL}/spreadsheets/${spreadsheetId}:batchUpdate`,
        { requests: batchUpdateRequests },
        {
          headers: { Authorization: `Bearer ${config.accessToken}` },
        }
      );

      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    } catch (error) {
      console.error('Google Sheets upload error:', error);
      throw new Error('Failed to upload to Google');
    }
  }

  // ==================== HELPER METHODS ====================

  private getColumnLetter(index: number): string {
    let result = '';
    let n = index - 1;
    do {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26);
    } while (n > 0);
    return result || 'A';
  }

  // OAuth helpers
  getMicrosoftAuthUrl(clientId: string, redirectUri: string): string {
    const scopes = [
      'Files.ReadWrite',
      'User.Read',
    ].join(' ');

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_mode=fragment`;
  }

  getGoogleAuthUrl(clientId: string, redirectUri: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' ');

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&include_granted_scopes=true`;
  }

  handleAuthCallback(provider: 'microsoft' | 'google', hash: string): CloudAuthConfig {
    const params = new URLSearchParams(hash.replace('#', ''));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (!accessToken) {
      throw new Error('No access token received');
    }

    const config: CloudAuthConfig = {
      provider,
      accessToken,
      expiresAt: expiresIn ? Date.now() + parseInt(expiresIn) * 1000 : undefined,
    };

    this.setAuthConfig(config);
    return config;
  }
}

export const cloudSyncService = new CloudSyncService();
export default cloudSyncService;
