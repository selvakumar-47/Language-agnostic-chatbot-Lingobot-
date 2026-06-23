import { VoiceEngine } from './voice-engine.js';
import { ChatEngine } from './chat-engine.js';
import { ParticleSystem } from './particles.js';

const BOT_AVATAR_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px #facc15);">
  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5.5 5.5 0 0 0 7 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/>
  <line x1="9" y1="18" x2="15" y2="18"/>
  <line x1="10" y1="22" x2="14" y2="22"/>
  <line x1="12" y1="2" x2="12" y2="4"/>
  <line x1="4.22" y1="5.64" x2="5.64" y2="7.06"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="7.06"/>
  <line x1="2" y1="12" x2="4" y2="12"/>
  <line x1="20" y1="12" x2="22" y2="12"/>
</svg>`;

const USER_AVATAR_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.5));">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>`;

// Elements Cache
const DOM = {
  body: document.body,
  newChatBtn: document.getElementById('newChatBtn'),
  historyList: document.getElementById('historyList'),
  settingsModalBtn: document.getElementById('settingsModalBtn'),
  menuToggleBtn: document.getElementById('menuToggleBtn'),
  sidebar: document.getElementById('sidebar'),
  chatSessionTitle: document.getElementById('chatSessionTitle'),
  apiStatusDot: document.getElementById('apiStatusDot'),
  apiStatusText: document.getElementById('apiStatusText'),
  ttsToggleBtn: document.getElementById('ttsToggleBtn'),
  ttsIcon: document.getElementById('ttsIcon'),
  langSelect: document.getElementById('langSelect'),
  chatMessages: document.getElementById('chatMessages'),
  emptyState: document.getElementById('emptyState'),
  chatInput: document.getElementById('chatInput'),
  voiceInputBtn: document.getElementById('voiceInputBtn'),
  sendBtn: document.getElementById('sendBtn'),

  // Settings Modal
  settingsModal: document.getElementById('settingsModal'),
  settingsModalCloseBtn: document.getElementById('settingsModalCloseBtn'),
  settingsModalSaveBtn: document.getElementById('settingsModalSaveBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  systemPromptInput: document.getElementById('systemPromptInput'),
  exportHistoryBtn: document.getElementById('exportHistoryBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer'),
  bgParticles: document.getElementById('bg-particles')
};

// Application State
let state = {
  chats: JSON.parse(localStorage.getItem('lingobot_chats')) || {},
  activeChatId: localStorage.getItem('lingobot_active_chat_id') || null,
  ttsEnabled: localStorage.getItem('lingobot_tts_enabled') !== 'false', // Default to true
  selectedLanguage: 'en',
  isBotTyping: false
};

// Engines initialization
const voiceEngine = new VoiceEngine();
const chatEngine = new ChatEngine();
const particleSystem = new ParticleSystem(DOM.bgParticles);

// Sync Sound state with saved preference
voiceEngine.speechEnabled = state.ttsEnabled;

/**
 * Show a toast notification
 * @param {string} message 
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);
  
  // Trigger removal after animation completes
  setTimeout(() => {
    toast.style.animation = 'message-slide-up 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Updates status bar to show if Gemini API or Local Mock is active
 */
function updateApiStatus() {
  const hasApiKey = chatEngine.isApiConfigured();
  if (hasApiKey) {
    DOM.apiStatusDot.className = 'status-dot'; // Green
    DOM.apiStatusText.textContent = 'Gemini 2.5 Flash Connected';
    DOM.apiKeyInput.value = chatEngine.apiKey;
  } else {
    DOM.apiStatusDot.className = 'status-dot offline'; // Amber
    DOM.apiStatusText.textContent = 'Local Mock Engine';
    DOM.apiKeyInput.value = '';
  }
}

/**
 * Handle TTS sound toggle
 */
function toggleSound() {
  const enabled = voiceEngine.toggleSpeechEnabled();
  state.ttsEnabled = enabled;
  localStorage.setItem('lingobot_tts_enabled', enabled);
  
  if (enabled) {
    DOM.ttsIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
    showToast('Sound feedback enabled');
  } else {
    DOM.ttsIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
    showToast('Sound feedback muted');
  }
}

/**
 * Format language code to display name
 * @param {string} code 
 */
function getLanguageName(code) {
  const selectNode = DOM.langSelect.querySelector(`option[value="${code}"]`);
  return selectNode ? selectNode.textContent.split(' ')[0] : 'English';
}

/**
 * Populate Sidebar Chat History UI
 */
function renderHistory() {
  DOM.historyList.innerHTML = '';
  const sortedChats = Object.values(state.chats).sort((a, b) => b.timestamp - a.timestamp);
  
  if (sortedChats.length === 0) {
    DOM.historyList.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:16px; font-size:0.85rem; font-style:italic;">No chats yet</p>';
    return;
  }

  sortedChats.forEach(chat => {
    const item = document.createElement('div');
    item.className = `history-item ${chat.id === state.activeChatId ? 'active' : ''}`;
    item.dataset.id = chat.id;

    item.innerHTML = `
      <div class="history-item-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <span class="history-item-text">${escapeHtml(chat.title)}</span>
      </div>
      <button class="delete-chat-btn" title="Delete chat" aria-label="Delete chat">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.delete-chat-btn')) return;
      selectChat(chat.id);
    });

    item.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });

    DOM.historyList.appendChild(item);
  });
}

/**
 * Escapes HTML characters to prevent XSS in chat titles/rendered items
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Switch focus to a specific chat session
 * @param {string} id 
 */
function selectChat(id) {
  state.activeChatId = id;
  localStorage.setItem('lingobot_active_chat_id', id);
  
  const chat = state.chats[id];
  if (chat) {
    DOM.chatSessionTitle.textContent = chat.title;
    DOM.langSelect.value = chat.langCode;
    state.selectedLanguage = chat.langCode;
    renderMessages();
  } else {
    resetToEmptyState();
  }
  
  renderHistory();
  
  if (window.innerWidth <= 768) {
    DOM.sidebar.classList.remove('open');
  }
}

/**
 * Delete a specific chat session
 * @param {string} id 
 */
function deleteChat(id) {
  delete state.chats[id];
  localStorage.setItem('lingobot_chats', JSON.stringify(state.chats));
  
  if (state.activeChatId === id) {
    const remainingIds = Object.keys(state.chats);
    if (remainingIds.length > 0) {
      selectChat(remainingIds[0]);
    } else {
      resetToEmptyState();
    }
  } else {
    renderHistory();
  }
  showToast('Chat deleted');
}

/**
 * Wipe all sessions
 */
function clearAllHistory() {
  state.chats = {};
  localStorage.removeItem('lingobot_chats');
  resetToEmptyState();
  showToast('Cleared all data');
}

/**
 * Reset UI to standard empty state
 */
function resetToEmptyState() {
  state.activeChatId = null;
  localStorage.removeItem('lingobot_active_chat_id');
  DOM.chatSessionTitle.textContent = 'Active Chat';
  renderMessages();
  renderHistory();
}

/**
 * Start a brand new empty chat session
 */
function createNewChat(initialTitle = 'New Chat') {
  const id = Date.now().toString();
  state.chats[id] = {
    id: id,
    title: initialTitle,
    messages: [],
    langCode: DOM.langSelect.value,
    timestamp: Date.now()
  };
  
  localStorage.setItem('lingobot_chats', JSON.stringify(state.chats));
  selectChat(id);
}

/**
 * Render conversation messages for active session
 */
function renderMessages() {
  DOM.chatMessages.innerHTML = '';

  const activeChat = state.chats[state.activeChatId];
  if (!activeChat || activeChat.messages.length === 0) {
    DOM.emptyState.style.display = 'flex';
    DOM.chatMessages.appendChild(DOM.emptyState);
    return;
  }

  DOM.emptyState.style.display = 'none';

  activeChat.messages.forEach((msg, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${msg.role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    if (msg.role === 'user') {
      avatar.innerHTML = USER_AVATAR_SVG;
    } else {
      avatar.innerHTML = BOT_AVATAR_SVG;
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = formatMarkdown(msg.text);
    bubble.appendChild(textDiv);

    if (msg.translation) {
      const transContainer = document.createElement('div');
      transContainer.className = 'translation-container';
      transContainer.innerHTML = `
        <div class="translation-header">Translation (${msg.translationLang})</div>
        <div>${escapeHtml(msg.translation)}</div>
      `;
      bubble.appendChild(transContainer);
    }

    const actions = document.createElement('div');
    actions.className = 'message-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn';
    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(msg.text);
      showToast('Copied to clipboard');
    });

    const speakBtn = document.createElement('button');
    speakBtn.className = 'action-btn';
    speakBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Listen`;
    speakBtn.addEventListener('click', () => {
      voiceEngine.speak(msg.text, activeChat.langCode);
    });

    const transBtn = document.createElement('button');
    transBtn.className = 'action-btn';
    transBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> Translate`;
    transBtn.addEventListener('click', () => {
      toggleMessageTranslation(index);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(speakBtn);
    actions.appendChild(transBtn);
    bubble.appendChild(actions);

    if (msg.role === 'user') {
      wrapper.appendChild(bubble);
      wrapper.appendChild(avatar);
    } else {
      wrapper.appendChild(avatar);
      wrapper.appendChild(bubble);
    }

    DOM.chatMessages.appendChild(wrapper);
  });

  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

/**
 * Convert plain text / basic markdown to HTML elements for chat layout
 * @param {string} text 
 */
function formatMarkdown(text) {
  let html = escapeHtml(text);
  
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Toggle translation subfield for specific message index
 * @param {number} msgIndex 
 */
async function toggleMessageTranslation(msgIndex) {
  const activeChat = state.chats[state.activeChatId];
  if (!activeChat) return;

  const msg = activeChat.messages[msgIndex];
  
  if (msg.translation) {
    msg.translation = null;
    msg.translationLang = null;
    localStorage.setItem('lingobot_chats', JSON.stringify(state.chats));
    renderMessages();
    return;
  }

  const isEn = activeChat.langCode === 'en';
  const targetLangName = isEn ? 'Spanish' : 'English';

  showToast(`Translating to ${targetLangName}...`);

  try {
    const translation = await chatEngine.translateText(msg.text, targetLangName);
    msg.translation = translation;
    msg.translationLang = targetLangName;
    localStorage.setItem('lingobot_chats', JSON.stringify(state.chats));
    renderMessages();
  } catch (err) {
    showToast('Translation failed');
    console.error(err);
  }
}

/**
 * Injects typing bubble animation directly into the chat container
 */
function injectTypingIndicator() {
  const wrapper = document.createElement('div');
  wrapper.className = 'message-wrapper bot typing-indicator-wrapper';
  wrapper.innerHTML = `
    <div class="message-avatar">${BOT_AVATAR_SVG}</div>
    <div class="message-bubble typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  DOM.chatMessages.appendChild(wrapper);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

/**
 * Removes typing bubble from viewport
 */
function removeTypingIndicator() {
  const indicator = DOM.chatMessages.querySelector('.typing-indicator-wrapper');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Submit chat input contents to chatbot core
 */
async function handleMessageSubmit() {
  const query = DOM.chatInput.value.trim();
  if (!query || state.isBotTyping) return;

  DOM.chatInput.value = '';
  DOM.chatInput.style.height = '44px';

  if (!state.activeChatId) {
    const title = query.length > 25 ? query.substring(0, 25) + '...' : query;
    createNewChat(title);
  }

  const activeChat = state.chats[state.activeChatId];
  
  if (activeChat.messages.length === 0) {
    activeChat.title = query.length > 25 ? query.substring(0, 25) + '...' : query;
  }

  activeChat.messages.push({
    role: 'user',
    text: query,
    timestamp: Date.now()
  });

  activeChat.timestamp = Date.now();
  localStorage.setItem('lingobot_chats', JSON.stringify(state.chats));
  
  renderMessages();
  renderHistory();

  state.isBotTyping = true;
  injectTypingIndicator();

  try {
    const response = await chatEngine.getResponse(
      query,
      activeChat.langCode,
      activeChat.messages.slice(0, -1)
    );

    removeTypingIndicator();

    activeChat.messages.push({
      role: 'bot',
      text: response,
      timestamp: Date.now()
    });

    localStorage.setItem('lingobot_chats', JSON.stringify(state.chats));
    renderMessages();

    if (state.ttsEnabled) {
      voiceEngine.speak(response, activeChat.langCode);
    }
  } catch (error) {
    removeTypingIndicator();
    showToast('Failed to generate response');
    
    activeChat.messages.push({
      role: 'bot',
      text: `⚠️ **Connection Error**: ${error.message}`,
      timestamp: Date.now()
    });
    localStorage.setItem('lingobot_chats', JSON.stringify(state.chats));
    renderMessages();
  } finally {
    state.isBotTyping = false;
  }
}

/**
 * Handle Voice Speech-to-Text Input flow
 */
function handleVoiceInput() {
  if (voiceEngine.isListening) {
    voiceEngine.stopListening();
    return;
  }

  const lang = DOM.langSelect.value;
  DOM.voiceInputBtn.classList.add('active');
  showToast(`Listening in ${getLanguageName(lang)}...`);

  voiceEngine.startListening(
    lang,
    (transcript) => {
      const currentVal = DOM.chatInput.value.trim();
      DOM.chatInput.value = currentVal ? `${currentVal} ${transcript}` : transcript;
      DOM.chatInput.focus();
      DOM.chatInput.style.height = DOM.chatInput.scrollHeight + 'px';
    },
    (err) => {
      showToast(`Speech error: ${err}`);
      DOM.voiceInputBtn.classList.remove('active');
    },
    () => {
      DOM.voiceInputBtn.classList.remove('active');
      showToast('Microphone deactivated');
    }
  );
}

/**
 * Exports current chats database to file
 */
function exportChatsJSON() {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state.chats, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `lingobot-chats-export-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Chats exported successfully');
}

// Modal Toggle Helpers
function toggleModal(modalNode, show) {
  modalNode.classList.toggle('open', show);
}

// Set up UI Event bindings
function bindEvents() {
  // New Chat
  DOM.newChatBtn.addEventListener('click', () => {
    createNewChat();
    showToast('New chat created');
  });

  // Sound TTS Switch
  DOM.ttsToggleBtn.addEventListener('click', toggleSound);

  // Global Language Selector Change
  DOM.langSelect.addEventListener('change', () => {
    const nextLang = DOM.langSelect.value;
    state.selectedLanguage = nextLang;
    
    if (state.activeChatId && state.chats[state.activeChatId]) {
      state.chats[state.activeChatId].langCode = nextLang;
      localStorage.setItem('lingobot_chats', JSON.stringify(state.chats));
      showToast(`Language updated to ${getLanguageName(nextLang)}`);
      renderHistory();
    }
  });

  // Message Typing Trigger
  DOM.sendBtn.addEventListener('click', handleMessageSubmit);
  DOM.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMessageSubmit();
    }
  });

  DOM.chatInput.addEventListener('input', () => {
    DOM.chatInput.style.height = 'auto';
    DOM.chatInput.style.height = DOM.chatInput.scrollHeight + 'px';
  });

  // Mic Activation
  DOM.voiceInputBtn.addEventListener('click', handleVoiceInput);

  // Sidebar drawers (mobile only)
  DOM.menuToggleBtn.addEventListener('click', () => {
    DOM.sidebar.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !DOM.sidebar.contains(e.target) && 
        !DOM.menuToggleBtn.contains(e.target) && 
        DOM.sidebar.classList.contains('open')) {
      DOM.sidebar.classList.remove('open');
    }
  });

  // Suggestions Card clicks
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.suggestion-card');
    if (card) {
      DOM.chatInput.value = card.dataset.prompt;
      handleMessageSubmit();
    }
  });

  // Modals — Settings Modal Setup
  DOM.settingsModalBtn.addEventListener('click', () => {
    DOM.apiKeyInput.value = chatEngine.apiKey;
    DOM.systemPromptInput.value = chatEngine.systemInstruction;
    toggleModal(DOM.settingsModal, true);
  });
  DOM.settingsModalCloseBtn.addEventListener('click', () => toggleModal(DOM.settingsModal, false));
  DOM.settingsModalSaveBtn.addEventListener('click', () => {
    chatEngine.setApiKey(DOM.apiKeyInput.value);
    chatEngine.systemInstruction = DOM.systemPromptInput.value.trim() || chatEngine.systemInstruction;
    updateApiStatus();
    toggleModal(DOM.settingsModal, false);
    showToast('Settings saved successfully');
  });

  DOM.exportHistoryBtn.addEventListener('click', exportChatsJSON);
  
  DOM.clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete ALL chats? This action is irreversible.')) {
      clearAllHistory();
      toggleModal(DOM.settingsModal, false);
    }
  });
}

/**
 * Main application bootloader
 */
function init() {
  updateApiStatus();
  bindEvents();
  
  // Start the background particle animation loop
  particleSystem.start();

  if (!state.ttsEnabled) {
    DOM.ttsIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
  }

  if (state.activeChatId && state.chats[state.activeChatId]) {
    selectChat(state.activeChatId);
  } else {
    resetToEmptyState();
  }
}

// Bootstrap application
init();
