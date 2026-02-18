import { useState, useCallback, useRef, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export interface UseVoiceToTextReturn {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
  supported: boolean
}

export const useVoiceToText = (): UseVoiceToTextReturn => {
  const { enableSTT, language } = useSettingsStore()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (!enableSTT) {
      setSupported(false)
      return
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false)
      setError('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = language || 'en-US'

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }
      setTranscript(prev => prev + finalTranscript)
    }

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Error: ${event.error}`)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [enableSTT, language])

  const startListening = useCallback(() => {
    if (recognitionRef.current && enableSTT) {
      setError(null)
      setTranscript('')
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error('Speech recognition start failed:', e)
      }
    }
  }, [enableSTT])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    supported,
  }
}

export interface UseTextToVoiceReturn {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
  supported: boolean
}

export const useTextToVoice = (): UseTextToVoiceReturn => {
  const { enableTTS, ttsRate, ttsPitch, language } = useSettingsStore()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false)
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || !enableTTS) return

    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = ttsRate || 1
    utterance.pitch = ttsPitch || 1
    utterance.volume = 1
    utterance.lang = language || 'en-US'
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    window.speechSynthesis.speak(utterance)
  }, [enableTTS, ttsRate, ttsPitch, language])

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    supported,
  }
}

// Types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
