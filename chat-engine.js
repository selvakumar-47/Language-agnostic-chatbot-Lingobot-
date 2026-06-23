/**
 * Chat Engine - Manages bot responses using either the Google Gemini API
 * or a localized mock multilingual response system for offline/demo use.
 */

// Dictionary of pre-translated mock chatbot responses for major languages
const MOCK_RESPONSES = {
  en: {
    greeting: "Hello! I am your Language Agnostic Chatbot. How can I help you today?",
    about: "This chatbot is designed for a college project to showcase language-agnostic communication. It supports multiple languages, automatic speech recognition, voice synthesis, and premium UI themes.",
    features: "My key features include:\n1. **Language-Agnostic Processing** (works in any language)\n2. **Visual Theme Switcher** (Midnight Glow, Cyberpunk, Sakura, etc.)\n3. **Voice Typing** (Speech-to-Text)\n4. **Voice Output** (Text-to-Speech)\n5. **Gemini LLM Integration** for intelligent replies",
    help: "You can chat with me in your preferred language! Set your API key in the Settings to enable the Gemini API, toggle translation below any message, or click the mic button to speak.",
    fallback: "That sounds interesting! Since I'm running in local demo mode, my replies are pre-programmed. To get full artificial intelligence capability, please add a Gemini API Key in the settings!"
  },
  es: {
    greeting: "¡Hola! Soy tu Chatbot Agnóstico del Idioma. ¿Cómo puedo ayudarte hoy?",
    about: "Este chatbot está diseñado para un proyecto universitario para mostrar la comunicación independiente del idioma. Admite múltiples idiomas, reconocimiento automático de voz, síntesis de voz y temas de interfaz de usuario premium.",
    features: "Mis características clave incluyen:\n1. **Procesamiento independiente del idioma** (funciona en cualquier idioma)\n2. **Selector de temas visuales** (Midnight Glow, Cyberpunk, Sakura, etc.)\n3. **Dictado por voz** (Voz a texto)\n4. **Salida de voz** (Texto a voz)\n5. **Integración Gemini LLM** para respuestas inteligentes",
    help: "¡Puedes chatear conmigo en tu idioma preferido! Configura tu clave API en la configuración para habilitar Gemini, activa la traducción debajo de cualquier mensaje o haz clic en el micrófono para hablar.",
    fallback: "¡Eso suena interesante! Como estoy en modo de demostración local, mis respuestas están preprogramadas. ¡Para obtener la capacidad completa de IA, agrega una clave API de Gemini en la configuración!"
  },
  fr: {
    greeting: "Bonjour ! Je suis votre chatbot indépendant de la langue. Comment puis-je vous aider aujourd'hui ?",
    about: "Ce chatbot est conçu pour un projet universitaire afin de présenter une communication agnostique de la langue. Il prend en charge plusieurs langues, la reconnaissance vocale automatique, la synthèse vocale et des thèmes d'interface utilisateur premium.",
    features: "Mes fonctionnalités clés comprennent :\n1. **Traitement agnostique de la langue** (fonctionne dans n'importe quelle langue)\n2. **Sélecteur de thèmes visuels** (Midnight Glow, Cyberpunk, etc.)\n3. **Saisie vocale** (Speech-to-Text)\n4. **Sortie vocale** (Text-to-Speech)\n5. **Intégration Gemini LLM** pour des réponses intelligentes",
    help: "Vous pouvez discuter avec moi dans votre langue préférée ! Définissez votre clé API dans les Paramètres pour activer Gemini, activez la traduction sous n'importe quel message, ou cliquez sur le micro.",
    fallback: "Cela a l'air intéressant ! Comme je fonctionne en mode démo locale, mes réponses sont préprogrammées. Pour obtenir toute la puissance de l'IA, veuillez ajouter une clé API Gemini !"
  },
  de: {
    greeting: "Hallo! Ich bin Ihr sprachunabhängiger Chatbot. Wie kann ich Ihnen heute helfen?",
    about: "Dieser Chatbot wurde für ein College-Projekt entwickelt, um sprachübergreifende Kommunikation zu demonstrieren. Er unterstützt mehrere Sprachen, automatische Spracherkennung, Sprachsynthese und Premium-UI-Themes.",
    features: "Meine Hauptmerkmale sind:\n1. **Sprachunabhängige Verarbeitung** (funktioniert in jeder Sprache)\n2. **Visueller Theme-Wechsler** (Midnight Glow, Cyberpunk, Sakura usw.)\n3. **Spracheingabe** (Speech-to-Text)\n4. **Sprachausgabe** (Text-to-Speech)\n5. **Gemini LLM-Integration** für intelligente Antworten",
    help: "Sie können mit mir in Ihrer bevorzugten Sprache chatten! Richten Sie Ihren API-Schlüssel in den Einstellungen ein, um Gemini zu aktivieren, schalten Sie die Übersetzung unter den Nachrichten ein oder klicken Sie auf das Mikrofon.",
    fallback: "Das klingt interessant! Da ich im lokalen Demomodus laufe, sind meine Antworten vorprogrammiert. Um die volle KI-Kapazität zu erhalten, fügen Sie bitte einen Gemini-API-Schlüssel in den Einstellungen hinzu!"
  },
  hi: {
    greeting: "नमस्ते! मैं आपका भाषा-मुक्त चैटबॉट (Language Agnostic Chatbot) हूँ। मैं आज आपकी क्या सहायता कर सकता हूँ?",
    about: "यह चैटबॉट एक कॉलेज प्रोजेक्ट के लिए डिज़ाइन किया गया है ताकि बहुभाषी संचार का प्रदर्शन किया जा सके। यह कई भाषाओं, स्वचालित वाक् पहचान (STT), भाषण संश्लेषण (TTS) और प्रीमियम UI थीम्स का समर्थन करता है।",
    features: "मेरी मुख्य विशेषताएं इस प्रकार हैं:\n1. **भाषा-मुक्त प्रसंस्करण** (किसी भी भाषा में काम करता है)\n2. **विज़ुअल थीम स्विचर** (Midnight Glow, Cyberpunk, Sakura आदि)\n3. **आवाज टाइपिंग** (Speech-to-Text)\n4. **आवाज आउटपुट** (Text-to-Speech)\n5. **Gemini LLM इंटीग्रेशन** बुद्धिमान उत्तरों के लिए",
    help: "आप अपनी पसंदीदा भाषा में मुझसे बात कर सकते हैं! मिथुन (Gemini) API को सक्रिय करने के लिए सेटिंग्स में अपनी API कुंजी डालें, अनुवाद देखने के लिए संदेश के नीचे टॉगल करें, या माइक्रोफ़ोन बटन दबाएं।",
    fallback: "यह सुनकर बहुत अच्छा लगा! चूँकि मैं अभी लोकल डेमो मोड में चल रहा हूँ, मेरे उत्तर पूर्व-निर्धारित हैं। पूरी एआई क्षमता का उपयोग करने के लिए, सेटिंग्स में जेमिनी (Gemini) एपीआई कुंजी जोड़ें!"
  },
  zh: {
    greeting: "你好！我是您的语言无关聊天机器人。今天我能为您做些什么？",
    about: "本聊天机器人专为大学项目设计，展示跨语言的无缝交流。它支持多种语言、自动语音识别、语音合成以及优质的主题界面。",
    features: "我的核心功能包括：\n1. **语言无关处理**（支持任何语言）\n2. **视觉主题切换**（Midnight Glow、Cyberpunk、Sakura 等）\n3. **语音输入**（语音转文字）\n4. **语音输出**（文字转语音）\n5. **Gemini LLM 集成**以获取智能回复",
    help: "您可以使用首选语言与我聊天！在设置中输入您的 API 密钥以启用 Gemini API，切换消息下方的翻译，或点击麦克风按钮说话。",
    fallback: "听起来很有趣！由于我正处于本地演示模式，因此回复是预先设置的。要获得完整的人工智能功能，请在设置中添加 Gemini API 密钥！"
  },
  ja: {
    greeting: "こんにちは！私は言語にとらわれないチャットボットです。どのようなご用件でしょうか？",
    about: "このチャットボットは、言語に依存しないコミュニケーションを展示するための大学のプロジェクトとして設計されました。多言語対応、自動音声認識、音声合成、プレミアムなUIテーマをサポートしています。",
    features: "主な特徴：\n1. **言語に依存しない処理** (あらゆる言語に対応)\n2. **テーマ切り替え機能** (Midnight Glow, Cyberpunk, Sakura など)\n3. **音声入力** (音声からテキスト)\n4. **音声出力** (テキストから音声)\n5. **Gemini LLM 連携**によるインテリジェントな回答",
    help: "お好みの言語でチャットできます！設定でAPIキーを入力するとGeminiが有効になります。メッセージの下にある翻訳切り替えや、マイクボタンでの音声入力も可能です。",
    fallback: "面白そうですね！現在ローカルのデモモードで動作しているため、返信は事前にプログラムされています。高度なAI機能を利用するには、設定からGemini APIキーを登録してください！"
  },
  ar: {
    greeting: "مرحباً! أنا روبوت المحادثة العابر للغات. كيف يمكنني مساعدتك اليوم؟",
    about: "تم تصميم روبوت الدردشة هذا لمشروع جامعي لعرض التواصل العابر للغات. وهو يدعم لغات متعددة، والتعرف التلقائي على الكلام، والتركيب الصوتي، ومظاهر واجهة المستخدم المتميزة.",
    features: "تشمل ميزاتي الرئيسية ما يلي:\n1. **معالجة عابرة للغات** (يعمل بأي لغة)\n2. **مبدل سمات واجهة المستخدم** (Midnight Glow, Cyberpunk, Sakura, إلخ.)\n3. **الكتابة بالصوت** (تحويل الكلام إلى نص)\n4. **المخرجات الصوتية** (تحويل النص إلى كلام)\n5. **تكامل Gemini LLM** للحصول على ردود ذكية",
    help: "يمكنك الدردشة معي بلغتك المفضلة! قم بتعيين مفتاح API الخاص بك في الإعدادات لتمكين Gemini، أو قم بتبديل الترجمة أسفل أي رسالة، أو انقر فوق رمز الميكروفون للتحدث.",
    fallback: "يبدو ذلك مثيراً للاهتمام! نظرًا لأنني أعمل في وضع التجربة المحلي، فإن ردودي مبرمجة مسبقًا. للحصول على قدرات الذكاء الاصطناعي الكاملة، يرجى إضافة مفتاح Gemini API في الإعدادات!"
  },
  ru: {
    greeting: "Здравствуйте! Я ваш многоязычный чат-бот. Чем я могу помочь вам сегодня?",
    about: "Этот чат-бот разработан в рамках университетского проекта для демонстрации независимого от языка общения. Он поддерживает несколько языков, автоматическое распознавание речи, голосовой синтез и премиальные визуальные темы.",
    features: "Мои ключевые особенности включают:\n1. **Языковая независимость** (работает на любом языке)\n2. **Переключатель визуальных тем** (Midnight Glow, Cyberpunk, Sakura и др.)\n3. **Голосовой ввод** (Преобразование речи в текст)\n4. **Голосовой вывод** (Преобразование текста в речь)\n5. **Интеграция с Gemini LLM** для умных ответов",
    help: "Вы можете общаться со мной на удобном для вас языке! Введите ваш API-ключ в настройках для включения Gemini, переключайте перевод под сообщениями или нажмите на микрофон, чтобы говорить.",
    fallback: "Звучит интересно! Поскольку я работаю в локальном демонстрационном режиме, мои ответы запрограммированы заранее. Чтобы раскрыть весь потенциал ИИ, добавьте API-ключ Gemini в настройках!"
  },
  pt: {
    greeting: "Olá! Eu sou o seu Chatbot Agnóstico de Idioma. Como posso ajudar você hoje?",
    about: "Este chatbot foi desenvolvido para um projeto universitário para demonstrar comunicação independente de idioma. Ele suporta múltiplos idiomas, reconhecimento de voz automatizado, síntese de voz e temas visuais premium.",
    features: "Minhas principais características incluem:\n1. **Processamento independente de idioma** (funciona em qualquer língua)\n2. **Seletor de temas visuais** (Midnight Glow, Cyberpunk, Sakura, etc.)\n3. **Digitação por voz** (Voz para texto)\n4. **Saída de áudio** (Texto para voz)\n5. **Integração Gemini LLM** para respostas inteligentes",
    help: "Você pode conversar comigo em seu idioma preferido! Defina sua chave de API nas Configurações para ativar o Gemini, alterne a tradução sob qualquer mensagem ou clique no microfone para falar.",
    fallback: "Isso parece interessante! Como estou rodando no modo de demonstração local, minhas respostas são pré-programadas. Para obter capacidade total de IA, adicione uma chave de API do Gemini nas configurações!"
  }
};

export class ChatEngine {
  constructor() {
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.systemInstruction = "You are a Language Agnostic Chatbot designed as a premium college project. Always reply directly in the language in which the user writes to you. Keep your answers formatting clean, engaging, and professional. Use markdown formatting appropriately. If the user asks about yourself, explain that you are language-agnostic and support voice features and custom themes.";
  }

  /**
   * Set and save a new Gemini API Key
   * @param {string} key 
   */
  setApiKey(key) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      localStorage.setItem('gemini_api_key', this.apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }

  /**
   * Check if Gemini API key is configured
   * @returns {boolean}
   */
  isApiConfigured() {
    return !!this.apiKey;
  }

  /**
   * Generates a response based on selected language, input message, and conversation history.
   * @param {string} userMessage - The current message from the user
   * @param {string} langCode - Current language code (2-letter)
   * @param {Array} history - Previous messages array: [{role: 'user'|'bot', text: '...'}]
   * @returns {Promise<string>} - Resolves to the bot's response
   */
  async getResponse(userMessage, langCode, history = []) {
    if (this.isApiConfigured()) {
      return this.getGeminiResponse(userMessage, history);
    } else {
      return this.getMockResponse(userMessage, langCode);
    }
  }

  /**
   * Fetch a response from Google's Gemini API
   */
  async getGeminiResponse(userMessage, history) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
    
    // Construct the contents structure representing the conversational history
    // Gemini roles: 'user' and 'model'
    const contents = [];
    
    // Add history (up to last 10 messages to save context/tokens)
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });

    // Add the current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: {
            parts: [{ text: this.systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!botText) {
        throw new Error('Empty response received from Gemini API.');
      }

      return botText;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini Error: ${error.message}. Falling back to offline responses...`);
    }
  }

  /**
   * Local keyword-matching fallback system when offline or API key is not configured.
   */
  getMockResponse(userMessage, langCode) {
    const text = userMessage.toLowerCase().trim();
    const responses = MOCK_RESPONSES[langCode] || MOCK_RESPONSES['en'];

    return new Promise((resolve) => {
      // Simulate network delay for realistic chatbot feel
      setTimeout(() => {
        // Simple heuristic matching
        if (text.includes('hello') || text.includes('hi') || text.includes('hola') || text.includes('bonjour') || text.includes('नमस्ते') || text.includes('namaste') || text.includes('你好')) {
          resolve(responses.greeting);
        } else if (text.includes('about') || text.includes('project') || text.includes('university') || text.includes('college') || text.includes('बारे में') || text.includes('प्रोजेक्ट')) {
          resolve(responses.about);
        } else if (text.includes('feature') || text.includes('capability') || text.includes('विशेषता') || text.includes('काम') || text.includes('funciona')) {
          resolve(responses.features);
        } else if (text.includes('help') || text.includes('how to') || text.includes('सहायता') || text.includes('मदद') || text.includes('ayuda')) {
          resolve(responses.help);
        } else {
          resolve(responses.fallback);
        }
      }, 800);
    });
  }

  /**
   * Translates text to English or user's target language.
   * If Gemini key is set, we query Gemini to perform a translation.
   * Otherwise, we simulate a mock translation response.
   * @param {string} text - Text to translate
   * @param {string} targetLangName - Friendly name of target language (e.g. 'English', 'Spanish')
   */
  async translateText(text, targetLangName) {
    if (this.isApiConfigured()) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: `Translate the following text strictly into ${targetLangName}. Do not add any conversational text or explanation. Return only the translated text.\n\nText: "${text}"` }]
            }],
            generationConfig: { temperature: 0.2 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const translated = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (translated) return translated.trim();
        }
      } catch (err) {
        console.error('Translation error via API:', err);
      }
    }

    // Mock Translation Fallback
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`[Translated to ${targetLangName}]: "${text}" (Connect Gemini API Key in Settings for actual translation)`);
      }, 500);
    });
  }
}
