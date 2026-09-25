import { useState, useRef, useEffect } from 'react';
import { Bot, User, ArrowUpRight, Copy, Sparkles, Check, Send } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export default function Mentor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: t('mentor.mock_msg_1', 'Salom! Men sizning shaxsiy AI Ustozingizman. Qaysi fandan yoki mavzudan yordam kerak?'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isTyping) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: now
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI Response Generation
    setTimeout(() => {
      let aiText = "Ajoyib savol! Ushbu mavzuni tushunish uchun avvalo asosiy formulalar va qoidalarni takrorlab olishni maslahat beraman.";
      
      const lower = query.toLowerCase();
      if (lower.includes('reja') || lower.includes('plan')) {
        aiText = "📅 **Haftalik O'quv Rejangiz:**\n- **Dushanba - Chorshanba:** Matematika (Funktsiyalar va Tenglamalar)\n- **Payshanba - Juma:** Fizika (Mexanika bo'limi)\n- **Shanba:** Zaif mavzulardan test yechish va tahlil qilish\n- **Yakshanba:** Dam olish va oraliq takrorlash!";
      } else if (lower.includes('zaif') || lower.includes('weak') || lower.includes('test')) {
        aiText = "⚡ **Zaif mavzular bo'yicha tavsiya:**\nSiz oxirgi testlarda \"Trigonometriya\" va \"Differentsial\" mavzularida xato qilgansiz. Hozir mashq rejimida 20 ta savol yechib bilimingizni mustahkamlab oling!";
      } else if (lower.includes('murakkab') || lower.includes('tushuntir')) {
        aiText = "💡 **Murakkab mavzularni oson o'rganish usuli:**\n1. Mavzuni 3 ta kichik qismga bo'ling.\n2. Har bir qism uchun 5 tadan misol yeching.\n3. Nega xato qilganingizni yechim izohida ko'rib chiqing.";
      }

      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePromptClick = (promptKey: string) => {
    const promptText = t(promptKey);
    setInputText(promptText);
  };

  return (
    <div className="md:bg-slate-50/95 dark:md:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-hidden">
      
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-dark-text-main tracking-tight">
            {t('mentor.title', 'AI Ustoz')}
          </h1>
          <p className="text-slate-500 dark:text-dark-text-muted mt-2 font-medium text-lg">
            {t('mentor.subtitle', 'Savollar bering va 24/7 yordam oling')}
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-8 mt-2 h-full min-h-[500px] flex-1">
        
        {/* Left Column - Chat Interface */}
        <div className="xl:col-span-2 flex flex-col bg-white dark:bg-dark-surface rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden relative min-h-[480px]">
          
          {/* Messages Area */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 max-h-[520px]">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${
                    isAi ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'bg-slate-200 dark:bg-dark-bg text-slate-600 dark:text-dark-text-muted'
                  }`}>
                    {isAi ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`flex flex-col gap-1 ${isAi ? 'items-start' : 'items-end'}`}>
                    <div className={`p-4 rounded-2xl shadow-sm leading-relaxed relative group ${
                      isAi 
                        ? 'bg-slate-50 dark:bg-dark-bg/60 border border-slate-100 dark:border-dark-border text-slate-700 dark:text-dark-text-main rounded-tl-sm' 
                        : 'bg-violet-600 text-white rounded-tr-sm'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm md:text-base font-medium">
                        {msg.text}
                      </p>
                      {isAi && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white dark:bg-dark-surface opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-violet-600 shadow-sm"
                          title="Nusxalash"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-dark-text-muted px-1">{msg.time}</span>
                  </div>

                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-4 max-w-[85%] items-center">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg/60 border border-slate-100 dark:border-dark-border flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-6 bg-white dark:bg-dark-surface border-t border-slate-100 dark:border-dark-border mt-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-center">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('mentor.placeholder', 'Savolingizni bering...')} 
                className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-800 dark:text-dark-text-main text-sm font-medium rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 p-4 pr-16 outline-none transition-all shadow-inner"
              />
              <button 
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="absolute right-2 w-12 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shadow-md shadow-violet-500/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex gap-2 mt-3 text-xs font-bold text-slate-400 dark:text-dark-text-muted justify-center">
              <span>{t('mentor.warning', 'AI xato qilishi mumkin. Muhim ma\'lumotlarni tekshiring.')}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Prompts & AI Insights */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Quick Prompts */}
          <section className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-lg">
                {t('mentor.prompts_title', 'Tezkor so\'rovlar')}
              </h3>
            </div>
            
            <div className="space-y-3">
              {['prompt_1', 'prompt_2', 'prompt_3'].map((key) => (
                <button 
                  key={key}
                  onClick={() => handlePromptClick(`mentor.${key}`)}
                  className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg hover:bg-violet-50 dark:hover:bg-violet-950/20 border border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-900/30 text-slate-700 hover:text-violet-700 dark:text-dark-text-main dark:hover:text-violet-400 transition-all text-sm font-bold flex items-center justify-between group shadow-sm hover:shadow-md"
                >
                  <span>{t(`mentor.${key}`)}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-dark-text-muted group-hover:text-violet-500 opacity-60 group-hover:opacity-100 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* AI Insights Card */}
          <section className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="font-extrabold text-white text-xl mb-4 flex items-center gap-2">
                {t('mentor.insights_title', 'AIdan tahlillar')}
              </h3>
              <p className="text-violet-100 text-sm font-medium leading-relaxed mb-6">
                <Trans i18nKey="mentor.insights_desc">
                  Matematika bo'yicha o'rtacha ballingiz o'tgan haftada 12% ga tushdi. Men "Trigonometriya" bo'limiga e'tibor berishni maslahat beraman.
                </Trans>
              </p>
              <button 
                onClick={() => navigate('/progress')}
                className="w-full py-3 bg-white text-violet-700 hover:bg-slate-50 font-bold rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
              >
                {t('mentor.insights_btn', 'Trigonometriyaning takrorlash')}
              </button>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
