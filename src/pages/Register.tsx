import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API Call
    setTimeout(() => {
      login(
        { id: '1', name, email, role: 'student' },
        'mock-jwt-token-12345'
      );
      navigate('/onboarding');
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="bg-surface p-8 rounded-2xl shadow-soft border border-border w-full max-w-sm">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">{t('register.title')}</h2>
          <p className="text-text-muted mt-2 text-sm">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('register.name_placeholder')} 
              className="w-full pl-10 p-3 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" 
            />
          </div>

          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('register.email_placeholder')} 
              className="w-full pl-10 p-3 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" 
            />
          </div>
          
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('register.password_placeholder')} 
              className="w-full pl-10 p-3 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('register.btn_submit')}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">{t('register.or')}</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <button className="mt-6 w-full flex items-center justify-center gap-3 py-3 border border-border rounded-xl hover:bg-slate-50 transition text-slate-700 font-medium text-sm">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          {t('register.btn_google')}
        </button>

        <p className="mt-8 text-sm text-center text-text-muted">
          {t('register.login_prompt')} <Link to="/login" className="text-primary font-semibold hover:underline">{t('register.login_link')}</Link>
        </p>
      </div>
    </div>
  );
}
