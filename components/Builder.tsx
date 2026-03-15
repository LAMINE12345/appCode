'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Code2, Play, Loader2, Sparkles, Bot, User, TerminalSquare, Monitor, Tablet, Smartphone, Settings, X, Plus, Trash2, Download, RotateCcw, ExternalLink, Terminal } from 'lucide-react';
import Editor, { useMonaco } from '@monaco-editor/react';
import JSZip from 'jszip';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_INSTRUCTION = `You are an expert Next.js and React developer. 
Your task is to generate a complete, working, single-file React application that follows modern Next.js 15+ and React 19 patterns.
The output must be a single HTML file that uses:
1. React 19 and ReactDOM 19 via CDN.
2. Babel for JSX transformation.
3. Tailwind CSS v4 via CDN.
4. Lucide-react for icons.
5. Framer Motion (motion/react) for animations.

CRITICAL INSTRUCTIONS:
- Use modern React 19 features (useActionState, improved hooks).
- The code should be structured like a Next.js App Router page (layout, page, components).
- Return ONLY the raw code. 
- Do NOT wrap it in markdown code blocks. 
- Ensure the UI is "Next.js style": clean, dark-mode friendly, high-quality typography (Inter/Geist style).
- Always include a responsive navigation bar and a footer.
- Use subtle animations with Framer Motion for a premium feel.

Template:
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Next.js Sandbox</title>
    <script src="https://unpkg.com/react@19/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@19/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://unpkg.com/framer-motion@11/dist/framer-motion.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-zinc-950 text-zinc-50 antialiased">
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect, useCallback, useMemo, useRef } = React;
        const { motion, AnimatePresence } = window.Motion;
        
        // Components
        const Navbar = () => (
            <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-black rounded-sm" />
                        </div>
                        <span className="font-bold tracking-tight">Sandbox</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-zinc-400">
                        <a href="#" className="hover:text-white transition-colors">Docs</a>
                        <a href="#" className="hover:text-white transition-colors">Components</a>
                        <button className="bg-white text-black px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors">
                            Deploy
                        </button>
                    </div>
                </div>
            </nav>
        );

        const App = () => {
            return (
                <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-1 max-w-7xl mx-auto w-full p-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <h1 className="text-6xl font-extrabold tracking-tighter leading-none">
                                    The Next.js <br/>
                                    <span className="text-zinc-500">Sandbox Experience.</span>
                                </h1>
                                <p className="text-zinc-400 text-xl max-w-2xl">
                                    Build, preview, and deploy React applications with the speed of light. 
                                    Powered by React 19 and Tailwind CSS v4.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors group">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-zinc-700 transition-colors">
                                            <i data-lucide="zap" className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <h3 className="font-bold mb-2">Feature {i}</h3>
                                        <p className="text-sm text-zinc-500">Description of a powerful feature that makes development faster.</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </main>
                    <footer className="border-t border-zinc-800 py-8 text-center text-zinc-600 text-sm">
                        &copy; 2026 Next.js Sandbox. Built with React Builder.
                    </footer>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
        
        // Initialize Lucide icons
        setTimeout(() => lucide.createIcons(), 100);
    </script>
</body>
</html>`;

export default function Builder() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Bienvenue dans votre **Next.js Sandbox**. Je suis prêt à construire votre application React 19. Que souhaitez-vous créer ? (ex: \"Un dashboard SaaS moderne\", \"Une application de streaming\")",
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  const [autoFixCount, setAutoFixCount] = useState(0);
  
  // Settings & OpenRouter State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [customModels, setCustomModels] = useState<{id: string, name: string}[]>([]);
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  
  // Mode State
  const [mode, setMode] = useState<'builder' | 'chat'>('builder');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Supabase State
  const [supabaseConfigs, setSupabaseConfigs] = useState<{id: string, name: string, url: string, anonKey: string}[]>([]);
  const [newSupabaseName, setNewSupabaseName] = useState('');
  const [newSupabaseUrl, setNewSupabaseUrl] = useState('');
  const [newSupabaseKey, setNewSupabaseKey] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const monaco = useMonaco();

  useEffect(() => {
    const savedKey = localStorage.getItem('openRouterKey');
    if (savedKey) setOpenRouterKey(savedKey);
    const savedModels = localStorage.getItem('customModels');
    if (savedModels) setCustomModels(JSON.parse(savedModels));
    const savedSupabase = localStorage.getItem('supabaseConfigs');
    if (savedSupabase) setSupabaseConfigs(JSON.parse(savedSupabase));
  }, []);

  const saveOpenRouterKey = (key: string) => {
    setOpenRouterKey(key);
    localStorage.setItem('openRouterKey', key);
  };

  const addCustomModel = () => {
    if (!newModelId || !newModelName) return;
    const updated = [...customModels, { id: newModelId, name: newModelName }];
    setCustomModels(updated);
    localStorage.setItem('customModels', JSON.stringify(updated));
    setNewModelId('');
    setNewModelName('');
  };

  const removeCustomModel = (id: string) => {
    const updated = customModels.filter(m => m.id !== id);
    setCustomModels(updated);
    localStorage.setItem('customModels', JSON.stringify(updated));
    if (selectedModel === `openrouter:${id}`) {
      setSelectedModel('gemini-3.1-pro-preview');
    }
  };

  const addSupabaseConfig = () => {
    if (!newSupabaseName || !newSupabaseUrl || !newSupabaseKey) return;
    const updated = [...supabaseConfigs, { id: Date.now().toString(), name: newSupabaseName, url: newSupabaseUrl, anonKey: newSupabaseKey }];
    setSupabaseConfigs(updated);
    localStorage.setItem('supabaseConfigs', JSON.stringify(updated));
    setNewSupabaseName('');
    setNewSupabaseUrl('');
    setNewSupabaseKey('');
  };

  const removeSupabaseConfig = (id: string) => {
    const updated = supabaseConfigs.filter(s => s.id !== id);
    setSupabaseConfigs(updated);
    localStorage.setItem('supabaseConfigs', JSON.stringify(updated));
  };

  const buildContext = useCallback(async (userMessageContent: string, isAutoFix: boolean, currentMode: 'builder' | 'chat' = 'builder') => {
    const promptContext = messages
      .filter(m => m.id !== '1')
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
      
    let supabaseContext = '';
    if (supabaseConfigs.length > 0) {
      supabaseContext = '\n\nDatabase Schemas (Supabase):\n';
      for (const config of supabaseConfigs) {
        try {
          const res = await fetch(`${config.url}/rest/v1/?apikey=${config.anonKey}`);
          if (res.ok) {
            const schema = await res.json();
            let tablesInfo = '';
            if (schema.definitions) {
              for (const [tableName, def] of Object.entries(schema.definitions)) {
                tablesInfo += `Table: ${tableName}\n`;
                if ((def as any).properties) {
                  for (const [colName, colDef] of Object.entries((def as any).properties)) {
                    tablesInfo += `  - ${colName} (${(colDef as any).type})\n`;
                  }
                }
              }
            }
            supabaseContext += `\nProject: ${config.name}\nURL: ${config.url}\nAnon Key: ${config.anonKey}\nSchema:\n${tablesInfo}`;
          }
        } catch (e) {
          console.error("Failed to fetch supabase schema", e);
        }
      }
    }

    const basePrompt = `Context history:\n${promptContext}\n\nUser's new request: ${userMessageContent}${supabaseContext}\n\nCurrent Code:\n${generatedCode}`;

    if (currentMode === 'chat') {
      return `${basePrompt}\n\nYou are in Chat mode. Provide a text response only. Analyze the context (Supabase, Code) and answer the user's question. Do not generate or update code.`;
    }

    if (isAutoFix) {
      return `${basePrompt}\n\nGenerate the updated HTML file that fixes this error.`;
    } else {
      return `${basePrompt}\n\nGenerate the updated HTML file.`;
    }
  }, [messages, supabaseConfigs, generatedCode]);

  const generateWithAI = useCallback(async (prompt: string) => {
    if (selectedModel.startsWith('openrouter:')) {
      const actualModel = selectedModel.replace('openrouter:', '');
      if (!openRouterKey) throw new Error("Clé API OpenRouter manquante. Veuillez l'ajouter dans les paramètres.");
      
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: actualModel,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Erreur OpenRouter");
      }
      
      const data = await res.json();
      return data.choices[0].message.content || '';
    } else {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
        }
      });
      return response.text || '';
    }
  }, [selectedModel, openRouterKey]);

  useEffect(() => {
    if (!monaco) return;

    const provider = monaco.languages.registerInlineCompletionsProvider('html', {
      provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
        if (token.isCancellationRequested) return { items: [] };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        if (textUntilPosition.trim().length === 0) return { items: [] };

        const textAfterPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: model.getLineCount(),
          endColumn: model.getLineMaxColumn(model.getLineCount())
        });

        try {
          const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
          const prompt = `You are an inline code completion assistant (like GitHub Copilot).
Your task is to provide the exact code that should be inserted at the cursor position.
Do NOT repeat the code before or after the cursor.
Output ONLY the raw code to insert. No markdown blocks, no explanations.

<CodeBeforeCursor>
${textUntilPosition.slice(-1000)}
</CodeBeforeCursor>
<CodeAfterCursor>
${textAfterPosition.slice(0, 1000)}
</CodeAfterCursor>`;

          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
              temperature: 0.1,
              maxOutputTokens: 256,
            }
          });
          
          if (token.isCancellationRequested) return { items: [] };

          let completion = response.text || '';
          completion = completion.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();

          if (!completion) return { items: [] };

          return {
            items: [{
              insertText: completion,
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
            }]
          };
        } catch (error) {
          console.error('Completion error:', error);
          return { items: [] };
        }
      },
      freeInlineCompletions: () => {},
      disposeInlineCompletions: () => {}
    } as any);

    return () => provider.dispose();
  }, [monaco]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const getInjectedCode = () => {
    if (!generatedCode) return '';
    
    const errorScript = `
<script>
  window.onerror = function(message, source, lineno, colno, error) {
    window.parent.postMessage({ type: 'APP_ERROR', message: message + ' at line ' + lineno + ':' + colno }, '*');
    return true;
  };
  window.addEventListener('unhandledrejection', function(event) {
    window.parent.postMessage({ type: 'APP_ERROR', message: event.reason ? event.reason.toString() : 'Unhandled promise rejection' }, '*');
  });
</script>
`;
    
    if (generatedCode.includes('<head>')) {
      return generatedCode.replace('<head>', '<head>' + errorScript);
    }
    return errorScript + generatedCode;
  };

  const handleAutoFix = useCallback(async (errorMessage: string) => {
    if (isGenerating || mode !== 'builder') return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: `L'application a généré cette erreur : "${errorMessage}". Peux-tu la corriger ?` 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const finalPrompt = await buildContext(userMessage.content, true, mode);
      let code = await generateWithAI(finalPrompt);
      
      if (code.startsWith('```html')) {
        code = code.replace(/^```html\n/, '').replace(/\n```$/, '');
      } else if (code.startsWith('```')) {
        code = code.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      setGeneratedCode(code);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "J'ai détecté une erreur et tenté de la corriger automatiquement. Vérifiez si cela fonctionne maintenant."
      }]);
      
      setActiveTab('preview');
    } catch (error) {
      console.error('Error auto-fixing app:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Une erreur est survenue lors de la tentative de correction automatique.'
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, mode, messages, buildContext, generateWithAI]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'APP_ERROR') {
        if (mode === 'builder' && autoFixCount < 3 && !isGenerating) {
          console.log("Auto-fixing error:", event.data.message);
          setAutoFixCount(prev => prev + 1);
          handleAutoFix(event.data.message);
        } else if (autoFixCount >= 3) {
          console.warn("Max auto-fix attempts reached.");
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [autoFixCount, isGenerating, generatedCode, messages, handleAutoFix, mode]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    setAutoFixCount(0);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      const finalPrompt = await buildContext(userMessage.content, false, mode);
      const response = await generateWithAI(finalPrompt);

      if (mode === 'chat') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: response
        }]);
      } else {
        let code = response;
        // Clean up markdown if the model accidentally includes it
        if (code.startsWith('```html')) {
          code = code.replace(/^```html\n/, '').replace(/\n```$/, '');
        } else if (code.startsWith('```')) {
          code = code.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        setGeneratedCode(code);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "J'ai mis à jour l'application selon vos instructions. Vous pouvez voir le résultat dans le panneau de prévisualisation."
        }]);
        
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Error generating app:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Une erreur est survenue lors de la génération. Veuillez réessayer.'
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, mode, messages, buildContext, generateWithAI]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const downloadZip = async () => {
    if (!generatedCode) return;

    const zip = new JSZip();
    zip.file("index.html", generatedCode);
    
    // On pourrait ajouter d'autres fichiers si nécessaire
    // zip.file("README.md", "# Mon Application IA\n\nGénéré avec AI Studio Build Clone.");

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mon-projet-ia.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {showSplash && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
            <Sparkles className="w-16 h-16 text-indigo-400 relative animate-bounce" />
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tighter text-white animate-in slide-in-from-bottom-4 duration-1000">
            Next.js <span className="text-indigo-400">Sandbox</span>
          </h1>
          <p className="mt-2 text-zinc-500 font-mono text-sm animate-pulse">
            Initialisation de l'environnement de développement...
          </p>
          <div className="mt-12 w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[progress_2s_ease-in-out]" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      <div className="flex h-screen w-full bg-zinc-950 text-zinc-300 overflow-hidden font-sans">
      
      {/* Left Panel: Chat & Controls */}
      <div className="w-[400px] flex-shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
            <h1 className="font-medium text-zinc-100">Next.js Sandbox</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-md">
              <button
                onClick={() => setMode('builder')}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  mode === 'builder' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Builder
              </button>
              <button
                onClick={() => setMode('chat')}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  mode === 'chat' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Chat
              </button>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-zinc-800 text-zinc-300 text-xs rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[180px] truncate"
            >
              <optgroup label="Google Gemini">
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-3-flash-preview">Gemini 3.0 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-flash-8b">Gemini 2.5 Flash 8B</option>
              </optgroup>
              {customModels.length > 0 && (
                <optgroup label="OpenRouter">
                  {customModels.map(m => (
                    <option key={m.id} value={`openrouter:${m.id}`}>{m.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
              title="Paramètres des modèles"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-800'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-400" />}
              </div>
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[280px] text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-zinc-800 text-zinc-400 rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Génération en cours...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="relative flex items-end bg-zinc-950 rounded-xl border border-zinc-800 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Décrivez l'application à créer..."
              className="w-full max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 pl-4 pr-12 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-indigo-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">
            L&apos;IA peut faire des erreurs. Vérifiez le code généré.
          </p>
        </div>
      </div>

      {/* Right Panel: Preview & Code */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        {/* Tabs */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
          <div className="flex space-x-1 bg-zinc-950/50 p-1 rounded-lg border border-zinc-800/50">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'preview' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Play className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'code' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Code2 className="w-4 h-4 mr-2" />
              Code
            </button>
          </div>

          <div className="flex items-center gap-3">
            {generatedCode && (
              <button
                onClick={downloadZip}
                className="flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                title="Télécharger le projet ZIP"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exporter ZIP
              </button>
            )}

            {activeTab === 'preview' && (
              <div className="flex space-x-1 bg-zinc-950/50 p-1 rounded-lg border border-zinc-800/50">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`p-1.5 rounded-md transition-colors ${
                    deviceView === 'desktop' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  title="Desktop view"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView('tablet')}
                  className={`p-1.5 rounded-md transition-colors ${
                    deviceView === 'tablet' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  title="Tablet view"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`p-1.5 rounded-md transition-colors ${
                    deviceView === 'mobile' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  title="Mobile view"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden bg-zinc-950">
          {!generatedCode && !isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
              <TerminalSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm">Votre application apparaîtra ici</p>
            </div>
          ) : (
            <div className="h-full w-full relative">
              {/* Preview Tab */}
              <div 
                className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
                  activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                } flex flex-col bg-zinc-950`}
              >
                {/* Browser Frame */}
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                  <div className="flex-1 flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-800/50">
                    {/* Browser Header */}
                    <div className="h-10 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 max-w-md bg-white border border-zinc-200 rounded-md h-7 flex items-center px-3 gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[11px] text-zinc-500 font-mono truncate">localhost:3000</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <RotateCcw className="w-3.5 h-3.5 hover:text-zinc-600 cursor-pointer" />
                        <ExternalLink className="w-3.5 h-3.5 hover:text-zinc-600 cursor-pointer" />
                      </div>
                    </div>
                    
                    {/* Iframe Container */}
                    <div className="flex-1 relative bg-white">
                      <div 
                        className={`absolute inset-0 transition-all duration-300 ease-in-out flex items-center justify-center`}
                      >
                        <div 
                          className={`transition-all duration-300 ease-in-out h-full ${
                            deviceView === 'desktop' ? 'w-full' :
                            deviceView === 'tablet' ? 'w-[768px]' :
                            'w-[375px]'
                          }`}
                        >
                          <iframe
                            srcDoc={getInjectedCode()}
                            className="w-full h-full border-none bg-white"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                            title="App Preview"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Terminal */}
                <div className="h-40 bg-zinc-900 border-t border-zinc-800 flex flex-col font-mono text-[11px]">
                  <div className="h-8 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-zinc-400 font-semibold uppercase tracking-wider">Terminal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Ready</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-1 text-zinc-400">
                    <p><span className="text-zinc-500">▲</span> Next.js 15.0.0</p>
                    <p>- Local:        http://localhost:3000</p>
                    <p>- Environments: .env.local</p>
                    <p className="text-zinc-500 mt-2">✓ Compiled successfully</p>
                    <p className="text-zinc-500">○ Compiling / ...</p>
                    <p className="text-emerald-400">✓ Compiled / in 42ms (124 modules)</p>
                    {isGenerating && (
                      <p className="text-indigo-400 animate-pulse">○ Hot Module Replacement (HMR) active...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Tab */}
              <div 
                className={`absolute inset-0 w-full h-full bg-[#1e1e1e] transition-opacity duration-200 ${
                  activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                <Editor
                  height="100%"
                  width="100%"
                  defaultLanguage="html"
                  theme="vs-dark"
                  value={generatedCode || '<!-- Le code apparaîtra ici -->'}
                  onChange={(value) => setGeneratedCode(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: 'on',
                    inlineSuggest: { enabled: true },
                    suggest: { preview: true },
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-[600px] max-w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
              <h2 className="text-lg font-medium text-zinc-100">Paramètres</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-8 overflow-y-auto">
              {/* OpenRouter Settings */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-indigo-400 border-b border-zinc-800 pb-2">Modèles IA (OpenRouter)</h2>
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">Clé API OpenRouter</h3>
                  <input 
                    type="password" 
                    value={openRouterKey}
                    onChange={(e) => saveOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Stockée localement dans votre navigateur.</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">Modèles OpenRouter personnalisés</h3>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="Nom (ex: Claude 3.5)"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                    <input 
                      type="text" 
                      value={newModelId}
                      onChange={(e) => setNewModelId(e.target.value)}
                      placeholder="ID (ex: anthropic/claude-3.5-sonnet)"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      onClick={addCustomModel}
                      disabled={!newModelId || !newModelName}
                      className="bg-indigo-600 text-white p-2 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {customModels.map(model => (
                      <div key={model.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                        <div>
                          <p className="text-sm text-zinc-200">{model.name}</p>
                          <p className="text-xs text-zinc-500">{model.id}</p>
                        </div>
                        <button onClick={() => removeCustomModel(model.id)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {customModels.length === 0 && (
                      <p className="text-sm text-zinc-500 text-center py-4">Aucun modèle personnalisé ajouté.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Supabase Settings */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-green-400 border-b border-zinc-800 pb-2">Backend (Supabase)</h2>
                <div>
                  <p className="text-xs text-zinc-400 mb-3">
                    Connectez un projet Supabase pour que l&apos;IA connaisse automatiquement le schéma de votre base de données.
                  </p>
                  <div className="flex flex-col gap-2 mb-3">
                    <input 
                      type="text" 
                      value={newSupabaseName}
                      onChange={(e) => setNewSupabaseName(e.target.value)}
                      placeholder="Nom du projet"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-green-500"
                    />
                    <input 
                      type="text" 
                      value={newSupabaseUrl}
                      onChange={(e) => setNewSupabaseUrl(e.target.value)}
                      placeholder="URL du projet (ex: https://xyz.supabase.co)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-green-500"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        value={newSupabaseKey}
                        onChange={(e) => setNewSupabaseKey(e.target.value)}
                        placeholder="Clé Anon (anon key)"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-green-500"
                      />
                      <button 
                        onClick={addSupabaseConfig}
                        disabled={!newSupabaseName || !newSupabaseUrl || !newSupabaseKey}
                        className="bg-green-600 text-white p-2 rounded-lg disabled:opacity-50 hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {supabaseConfigs.map(config => (
                      <div key={config.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                        <div>
                          <p className="text-sm text-zinc-200">{config.name}</p>
                          <p className="text-xs text-zinc-500">{config.url}</p>
                        </div>
                        <button onClick={() => removeSupabaseConfig(config.id)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {supabaseConfigs.length === 0 && (
                      <p className="text-sm text-zinc-500 text-center py-4">Aucun projet Supabase configuré.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
