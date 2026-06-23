/**
 * Voice Engine - Handles Speech-to-Text (STT) and Text-to-Speech (TTS)
 * using the browser's Web Speech APIs.
 */

// Language code to locale mapping for Web Speech API
const LANGUAGE_LOCALE_MAP = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'hi': 'hi-IN',
  'zh': 'zh-CN',
  'ja': 'ja-JP',
  'ar': 'ar-SA',
  'ru': 'ru-RU',
  'pt': 'pt-PT',
  'it': 'it-IT',
  'ko': 'ko-KR'
};

export class VoiceEngine {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.speechEnabled = true;

    this.initSpeechRecognition();
  }

  /**
   * Initializes browser SpeechRecognition
   */
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    } else {
      console.warn('Speech Recognition API is not supported in this browser.');
    }
  }

  /**
   * Start listening to voice input
   * @param {string} langCode - 2-letter language code (e.g., 'es', 'hi')
   * @param {function} onResult - Callback when text is recognized
   * @param {function} onError - Callback when error occurs
   * @param {function} onEnd - Callback when listening ends
   */
  startListening(langCode, onResult, onError, onEnd) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    const locale = LANGUAGE_LOCALE_MAP[langCode] || 'en-US';
    this.recognition.lang = locale;
    this.isListening = true;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      this.isListening = false;
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      this.isListening = false;
      if (onError) onError(e.message);
    }
  }

  /**
   * Stop listening immediately
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Speak text in selected language
   * @param {string} text - The text to speak
   * @param {string} langCode - 2-letter language code
   * @param {function} onStart - Callback when speech starts
   * @param {function} onEnd - Callback when speech ends
   */
  speak(text, langCode, onStart, onEnd) {
    if (!this.synthesis || !this.speechEnabled) return;

    // Cancel any active speech
    this.stopSpeaking();

    // Clean text from markdown formatting for speech
    const cleanText = text.replace(/[*#`_\-]/g, '').trim();

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    const locale = LANGUAGE_LOCALE_MAP[langCode] || 'en-US';
    this.currentUtterance.lang = locale;

    // Find a matching voice for the target locale
    const voices = this.synthesis.getVoices();
    const matchingVoice = voices.find(voice => voice.lang.startsWith(locale) || voice.lang.includes(langCode));
    if (matchingVoice) {
      this.currentUtterance.voice = matchingVoice;
    }

    if (onStart) this.currentUtterance.onstart = onStart;
    if (onEnd) this.currentUtterance.onend = onEnd;

    this.currentUtterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      if (onEnd) onEnd();
    };

    this.synthesis.speak(this.currentUtterance);
  }

  /**
   * Stop any active speech synthesis
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Toggles speech sound active state
   */
  toggleSpeechEnabled() {
    this.speechEnabled = !this.speechEnabled;
    if (!this.speechEnabled) {
      this.stopSpeaking();
    }
    return this.speechEnabled;
  }
}
