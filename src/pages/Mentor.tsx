// @ts-nocheck
import React, { useState } from 'react';
import { Bot, User, ArrowUpRight, Copy, Sparkles } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

const Mentor = () => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');

  const MOCK_MESSAGES = [
    { id: 1, sender: 'ai', text: t('mentor.mock_msg_1'), time: '10:00' },
    { id: 2, sender: 'user', text: t('mentor.mock_msg_2'), time: '10:05' },
    { id: 3, sender: 'ai', text: t('mentor.mock_msg_3'), time: '10:06' },
  ];

  return (
    <div className="md:bg-slate-50/95 dark:md:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-hidden">
      
      {/* Decorative top-left glare inside the card */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-white/5 rounded-t-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-dark-text-main tracking-tight">
            {t('mentor.title')}
          </h1>
          <p className="text-slate-500 dark:text-dark-text-muted mt-2 font-medium text-lg">{t('mentor.subtitle')}</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-8 mt-2 h-full min-h-[500px] flex-1">
        
        {/* Left Column (2/3) - Chat Interface */}
        <div className="xl:col-span-2 flex flex-col bg-white dark:bg-dark-surface rounded-3xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden relative">
          
          {/* Chat Messages Area */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
            {MOCK_MESSAGES.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${isAi ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'bg-slate-200 dark:bg-dark-bg text-slate-500 dark:text-dark-text-muted'}`}>
                    {isAi ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`flex flex-col gap-1 ${isAi ? 'items-start' : 'items-end'}`}>
                    <div className={`p-4 rounded-2xl shadow-sm leading-relaxed ${isAi ? 'bg-slate-50 dark:bg-dark-bg/60 border border-slate-100 dark:border-dark-border text-slate-700 dark:text-dark-text-main rounded-tl-sm' : 'bg-violet-600 text-white rounded-tr-sm'}`}>
                      {/* Very basic markdown rendering for strong tag just for this mock */}
                      <p className="whitespace-pre-wrap text-sm md:text-base font-medium" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-dark-text-muted px-1">{msg.time}</span>
                  </div>

                </div>
              )
            })}
          </div>

          {/* Chat Input Area */}
          <div className="p-4 sm:p-6 bg-white dark:bg-dark-surface border-t border-slate-100 dark:border-dark-border">
            <div className="relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('mentor.placeholder')} 
                className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-800 dark:text-dark-text-main text-sm font-medium rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 block p-4 pr-16 outline-none transition-all shadow-inner"
              />
              <button className="absolute right-2 top-2 bottom-2 w-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-md shadow-violet-500/30">
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 mt-4 text-xs font-bold text-slate-500 dark:text-dark-text-muted justify-center">
              <span>{t('mentor.warning')}</span>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) - Insights & Prompts */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Quick Prompts */}
          <section className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-lg">{t('mentor.prompts_title')}</h3>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg hover:bg-violet-50 dark:hover:bg-violet-950/20 border border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-900/30 text-slate-700 hover:text-violet-700 dark:text-dark-text-main dark:hover:text-violet-400 transition-all text-sm font-bold flex items-center justify-between group shadow-sm hover:shadow-md">
                <span>{t('mentor.prompt_1')}</span>
                <Copy className="w-4 h-4 text-slate-400 dark:text-dark-text-muted group-hover:text-violet-500 opacity-50 group-hover:opacity-100 transition-all shrink-0" />
              </button>
              <button className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg hover:bg-violet-50 dark:hover:bg-violet-950/20 border border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-900/30 text-slate-700 hover:text-violet-700 dark:text-dark-text-main dark:hover:text-violet-400 transition-all text-sm font-bold flex items-center justify-between group shadow-sm hover:shadow-md">
                <span>{t('mentor.prompt_2')}</span>
                <Copy className="w-4 h-4 text-slate-400 dark:text-dark-text-muted group-hover:text-violet-500 opacity-50 group-hover:opacity-100 transition-all shrink-0" />
              </button>
              <button className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg hover:bg-violet-50 dark:hover:bg-violet-950/20 border border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-900/30 text-slate-700 hover:text-violet-700 dark:text-dark-text-main dark:hover:text-violet-400 transition-all text-sm font-bold flex items-center justify-between group shadow-sm hover:shadow-md">
                <span>{t('mentor.prompt_3')}</span>
                <Copy className="w-4 h-4 text-slate-400 dark:text-dark-text-muted group-hover:text-violet-500 opacity-50 group-hover:opacity-100 transition-all shrink-0" />
              </button>
            </div>
          </section>

          {/* AI Insights Card */}
          <section className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="font-extrabold text-white text-xl mb-4 flex items-center gap-2">
                {t('mentor.insights_title')}
              </h3>
              <p className="text-violet-100 text-sm font-medium leading-relaxed mb-6">
                <Trans i18nKey="mentor.insights_desc">
                  Your average score in <strong className="text-white">Math</strong> dropped by 12% last week. I recommend focusing on "Trigonometry".
                </Trans>
              </p>
              <button className="w-full py-3 bg-white text-violet-700 hover:bg-slate-50 font-bold rounded-xl transition-colors shadow-sm text-sm">
                {t('mentor.insights_btn')}
              </button>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

export default Mentor;
