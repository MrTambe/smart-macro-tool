import { useAIStore } from '../store/aiStore'
import useSpreadsheetStore from '../store/spreadsheetStore'
import { getAIService, AIRequest } from './aiService'

// System AI Skill Types
export type SystemAISkill = 
  | 'errorDetection'
  | 'promptEnhancement' 
  | 'responseValidation'
  | 'healthMonitoring'
  | 'autoRecovery'
  | 'userGuidance'

export interface SystemAIContext {
  currentFile?: string
  currentSheet?: string
  selectedCells?: string[]
  recentActions?: string[]
  undoStackSize?: number
  errorCount?: number
}

export interface EnhancedPrompt {
  originalPrompt: string
  enhancedPrompt: string
  context: SystemAIContext
  confidence: number
}

export interface ValidationResult {
  valid: boolean
  issues: string[]
  suggestions: string[]
  confidence: number
}

export interface ErrorReport {
  error: Error
  context: SystemAIContext
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  userFriendlyMessage: string
  suggestedFixes: string[]
  autoRecoverable: boolean
}

// System AI Service
class SystemAIService {
  private isRunning = false
  private checkInterval: number | null = null
  private lastHealthCheck = Date.now()
  private errorLog: ErrorReport[] = []
  private context: SystemAIContext = {}

  // Start the System AI
  start() {
    const state = useAIStore.getState()
    
    if (!state.systemAI.enabled) {
      console.log('[System AI] Disabled, not starting')
      return
    }

    if (this.isRunning) {
      console.log('[System AI] Already running')
      return
    }

    console.log('[System AI] Starting...')
    this.isRunning = true
    
    // Update status
    useAIStore.getState().resumeSystemAI()

    // Start monitoring loop
    this.checkInterval = window.setInterval(() => {
      this.monitoringLoop()
    }, 1000) // Check every second

    // Add activity log
    useAIStore.getState().addActivityLog({
      type: 'system',
      provider: 'ollama',
      model: state.systemAI.model,
      message: 'System AI started',
      details: { model: state.systemAI.model }
    })
  }

  // Stop the System AI
  stop() {
    if (!this.isRunning) return

    console.log('[System AI] Stopping...')
    this.isRunning = false

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    useAIStore.getState().pauseSystemAI()

    useAIStore.getState().addActivityLog({
      type: 'system',
      provider: 'ollama',
      model: useAIStore.getState().systemAI.model,
      message: 'System AI stopped'
    })
  }

  // Main monitoring loop
  private async monitoringLoop() {
    const state = useAIStore.getState()
    
    if (!state.systemAI.enabled || state.systemAI.status === 'paused') {
      return
    }

    const now = Date.now()

    // Health monitoring (every 60 seconds)
    if (state.systemAI.responsibilities.healthMonitoring && 
        now - this.lastHealthCheck > 60000) {
      await this.checkSystemHealth()
      this.lastHealthCheck = now
    }

    // Resource monitoring
    if (state.systemAI.responsibilities.healthMonitoring) {
      this.monitorResources()
    }
  }

  // Skill 1: Error Detective
  async detectAndReportError(error: Error, context?: Partial<SystemAIContext>): Promise<ErrorReport | null> {
    const state = useAIStore.getState()
    
    if (!state.systemAI.responsibilities.errorDetection) {
      return null
    }

    // Analyze error
    const severity = this.analyzeErrorSeverity(error)
    const userMessage = this.generateUserFriendlyErrorMessage(error)
    const fixes = await this.suggestFixes(error, context)
    const autoRecoverable = this.isAutoRecoverable(error)

    const report: ErrorReport = {
      error,
      context: { ...this.context, ...context },
      timestamp: new Date(),
      severity,
      userFriendlyMessage: userMessage,
      suggestedFixes: fixes,
      autoRecoverable
    }

    this.errorLog.push(report)

    // Add to activity log
    useAIStore.getState().addActivityLog({
      type: 'error',
      provider: 'ollama',
      model: state.systemAI.model,
      message: `Error detected: ${error.message}`,
      details: { severity, autoRecoverable }
    })

    // Try auto-recovery if enabled
    if (autoRecoverable && state.systemAI.responsibilities.autoRecovery) {
      await this.attemptAutoRecovery(report)
    }

    return report
  }

  private analyzeErrorSeverity(error: Error): ErrorReport['severity'] {
    const message = error.message.toLowerCase()
    
    if (message.includes('fatal') || message.includes('crash')) {
      return 'critical'
    }
    if (message.includes('failed') || message.includes('error')) {
      return 'high'
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'medium'
    }
    return 'low'
  }

  private generateUserFriendlyErrorMessage(error: Error): string {
    const message = error.message
    
    // Common error patterns
    if (message.includes('Cannot read property')) {
      return 'An unexpected value was encountered. This usually happens when data is missing or formatted incorrectly.'
    }
    if (message.includes('NetworkError') || message.includes('fetch')) {
      return 'Connection failed. Please check your internet connection or API settings.'
    }
    if (message.includes('timeout')) {
      return 'The operation took too long to complete. The server might be busy or the request was too large.'
    }
    
    return `An error occurred: ${message}`
  }

  private async suggestFixes(error: Error, context?: Partial<SystemAIContext>): Promise<string[]> {
    const fixes: string[] = []
    const message = error.message.toLowerCase()

    if (message.includes('cannot read property')) {
      fixes.push('Check if the selected range contains valid data')
      fixes.push('Try selecting a different range')
      fixes.push('Refresh the file and try again')
    }

    if (message.includes('network') || message.includes('connection')) {
      fixes.push('Check your internet connection')
      fixes.push('Verify API key is correct')
      fixes.push('Try switching to a local AI provider')
    }

    if (message.includes('timeout')) {
      fixes.push('Try processing a smaller range')
      fixes.push('Check if the AI server is running')
      fixes.push('Increase timeout limit in settings')
    }

    return fixes
  }

  private isAutoRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase()
    
    // These errors can potentially be auto-recovered
    return message.includes('timeout') || 
           message.includes('temporary') ||
           message.includes('retry')
  }

  private async attemptAutoRecovery(report: ErrorReport): Promise<boolean> {
    console.log('[System AI] Attempting auto-recovery...')
    
    // Simple recovery strategies
    try {
      // Wait a moment and retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      useAIStore.getState().addActivityLog({
        type: 'system',
        provider: 'ollama',
        model: useAIStore.getState().systemAI.model,
        message: 'Auto-recovery attempted',
        details: { error: report.error.message }
      })
      
      return true
    } catch {
      return false
    }
  }

  // Skill 2: Prompt Engineer
  async enhancePrompt(
    userPrompt: string, 
    context?: Partial<SystemAIContext>
  ): Promise<EnhancedPrompt> {
    const state = useAIStore.getState()
    
    if (!state.systemAI.responsibilities.promptEnhancement) {
      return {
        originalPrompt: userPrompt,
        enhancedPrompt: userPrompt,
        context: { ...this.context, ...context },
        confidence: 1.0
      }
    }

    const fullContext = { ...this.context, ...context }
    const spreadsheetStore = useSpreadsheetStore.getState()
    const activeFile = spreadsheetStore.getActiveFile()
    const activeSheet = spreadsheetStore.getActiveSheet()
    
    // Build enhancement context
    let enhancedPrompt = userPrompt
    
    // Add file context
    if (activeFile && activeSheet) {
      const selection = spreadsheetStore.selectedCells
      const sampleData = Array.from(activeSheet.cells.entries())
        .slice(0, 20)
        .map(([id, data]) => `${id}: ${data.value}`)
        .join(', ')

      enhancedPrompt = `
      CONTEXT:
      File: ${activeFile.name}
      Sheet: ${activeSheet.name}
      Current Selection: ${selection.join(', ') || 'None'}
      Sample Data: ${sampleData || 'Empty'}
      
      USER REQUEST:
      ${userPrompt}
      
      INSTRUCTION:
      Please respond as an expert spreadsheet assistant. 
      If you need to make changes, provide them in the specified action JSON format.`
    }

    // Log enhancement
    useAIStore.getState().addActivityLog({
      type: 'prompt_enhancement',
      provider: 'ollama',
      model: state.systemAI.model,
      message: 'Prompt enhanced with workspace context',
      details: { 
        original: userPrompt,
        enhanced: enhancedPrompt
      }
    })

    return {
      originalPrompt: userPrompt,
      enhancedPrompt,
      context: fullContext,
      confidence: 0.95
    }
  }

  // Skill 3: Response Validator
  async validateResponse(
    response: string, 
    expectedFormat?: 'json' | 'text' | 'code'
  ): Promise<ValidationResult> {
    const state = useAIStore.getState()
    
    if (!state.systemAI.responsibilities.responseValidation) {
      return { valid: true, issues: [], suggestions: [], confidence: 1.0 }
    }

    const issues: string[] = []
    const suggestions: string[] = []

    // Check for empty response
    if (!response || response.trim().length === 0) {
      issues.push('Response is empty')
    }

    // Check for error indicators
    if (response.includes('error') || response.includes('Error')) {
      issues.push('Response may contain errors')
    }

    // Format-specific validation
    if (expectedFormat === 'json') {
      try {
        JSON.parse(response)
      } catch {
        issues.push('Response is not valid JSON')
        suggestions.push('Request JSON format explicitly')
      }
    }

    // Check for hallucinations (basic heuristic)
    if (response.length > 10000) {
      suggestions.push('Response is very long - verify all content is relevant')
    }

    const valid = issues.length === 0
    const confidence = valid ? 0.9 : 0.5

    return {
      valid,
      issues,
      suggestions,
      confidence
    }
  }

  // Skill 4: System Diagnostics
  private async checkSystemHealth(): Promise<void> {
    const state = useAIStore.getState()
    const aiService = getAIService()

    // Check Ollama
    const ollama = aiService.getProvider('ollama')
    if (ollama) {
      const available = await ollama.isAvailable()
      if (!available && state.ollama.enabled) {
        console.warn('[System AI] Ollama not available')
      }
    }

    // Check OpenRouter
    if (state.openRouter.enabled && state.openRouter.apiKey) {
      const openRouter = aiService.getProvider('openrouter')
      if (openRouter) {
        const available = await openRouter.isAvailable()
        if (!available) {
          console.warn('[System AI] OpenRouter not available')
        }
      }
    }

    // Update average response time
    const startTime = Date.now()
    try {
      const ollama = aiService.getProvider('ollama')
      if (ollama) {
        await ollama.generate({
          prompt: 'test',
          model: state.systemAI.model,
          maxTokens: 10
        })
        const duration = Date.now() - startTime
        
        // Update average
        const current = state.systemAI.averageResponseTime
        const newAverage = current === 0 ? duration : (current + duration) / 2
        
        useAIStore.setState({
          systemAI: {
            ...state.systemAI,
            averageResponseTime: newAverage
          }
        })
      }
    } catch (error) {
      console.error('[System AI] Health check failed:', error)
    }
  }

  // Skill 5: User Guidance
  async provideGuidance(
    userAction: string,
    context?: Partial<SystemAIContext>
  ): Promise<string | null> {
    const state = useAIStore.getState()
    
    if (!state.systemAI.responsibilities.userGuidance) {
      return null
    }

    // Simple pattern detection for guidance
    const fullContext = { ...this.context, ...context }
    
    // Detect repeated actions
    if (fullContext.undoStackSize && fullContext.undoStackSize > 5) {
      return '💡 Tip: You\'ve undone several actions. Consider using keyboard shortcuts (Ctrl+Z) for faster undo.'
    }

    // Detect empty selections
    if (userAction === 'format' && (!fullContext.selectedCells || fullContext.selectedCells.length === 0)) {
      return '💡 Tip: Select cells first before applying formatting. Click and drag to select a range.'
    }

    return null
  }

  // Resource monitoring
  private monitorResources(): void {
    // In a real app, this would use performance APIs
    // For now, simulate resource usage
    const state = useAIStore.getState()
    
    // Simulate CPU and memory usage
    const cpuUsage = Math.random() * 5 // 0-5%
    const memoryUsage = 200 + Math.random() * 100 // 200-300MB

    useAIStore.setState({
      systemAI: {
        ...state.systemAI,
        resourceUsage: {
          cpu: cpuUsage,
          memory: memoryUsage
        }
      }
    })

    // Check if we should auto-pause
    if (state.systemAI.resourceLimits.autoPauseWhenIdle) {
      const lastActivity = state.systemAI.lastActivity
      if (lastActivity && Date.now() - lastActivity.getTime() > 300000) { // 5 minutes
        this.pause()
      }
    }
  }

  // Update context
  updateContext(context: Partial<SystemAIContext>): void {
    this.context = { ...this.context, ...context }
    
    // Update last activity
    useAIStore.setState({
      systemAI: {
        ...useAIStore.getState().systemAI,
        lastActivity: new Date()
      }
    })
  }

  // Pause System AI
  pause(): void {
    useAIStore.getState().pauseSystemAI()
    console.log('[System AI] Paused due to inactivity')
  }

  // Resume System AI
  resume(): void {
    useAIStore.getState().resumeSystemAI()
    console.log('[System AI] Resumed')
  }

  // Get error log
  getErrorLog(): ErrorReport[] {
    return this.errorLog
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = []
  }
}

// Singleton instance
let systemAIInstance: SystemAIService | null = null

export const getSystemAI = (): SystemAIService => {
  if (!systemAIInstance) {
    systemAIInstance = new SystemAIService()
  }
  return systemAIInstance
}

export default SystemAIService
