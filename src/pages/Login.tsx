import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, X, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginAsGuest } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showGuestAlert, setShowGuestAlert] = useState(false);

  const handleConfirmGuest = () => {
    loginAsGuest();
    setShowGuestAlert(false);
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-transparent font-body relative">
      <div className="bg-surface p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm text-center relative z-10">
        
        <div className="mb-8 flex flex-col items-center">
          <h2 className="text-3xl font-display font-extrabold text-slate-800">{t('login.title')}</h2>
          <p className="text-slate-500 font-medium mt-2 text-sm">{t('login.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="w-full flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center w-full">
            <div className="flex justify-center w-full">
              <GoogleLogin
                width="280"
                onSuccess={async (credentialResponse) => {
                  setIsLoading(true);
                  try {
                    const response = await api.post('/api/auth/google/', { 
                      id_token: credentialResponse.credential 
                    });
                    
                    const { access, refresh, user } = response.data;
                    
                    login(user || { id: '1', name: 'Student', email: '', role: 'student' }, access, refresh);
                    navigate('/dashboard');
                  } catch (error: any) {
                    console.error('Google Auth Failed. Backend response:', error.response?.data || error.message);
                    alert('Ошибка входа: ' + JSON.stringify(error.response?.data || error.message));
                  } finally {
                    setIsLoading(false);
                  }
                }}
                onError={() => {
                  console.error('Google Auth Failed');
                }}
              />
            </div>

            <div className="relative w-full flex items-center my-1">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-400 font-bold uppercase">{t('login.or', 'yoki')}</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              onClick={() => setShowGuestAlert(true)}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span>{t('login.continue_as_guest', 'Mehmon sifatida davom etish')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Guest Confirmation Alert Modal */}
      {showGuestAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-slate-800">
            <button
              onClick={() => setShowGuestAlert(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold mb-2 text-slate-800">
              {t('guest.modal_title', 'Mehmon rejimiga kirish')}
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {t('guest.modal_desc', 'Siz platformani ro\'yxatdan o\'tmasdan sinab ko\'rishingiz mumkin. Bilish muhim:')}
            </p>

            <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-sm">
              <p className="leading-relaxed">
                <strong>{t('guest.available_label', 'Mavjud:')}</strong> {t('guest.available_desc', '20 ta savoldan iborat mashq testlarini yechish.')}
              </p>
              <p className="leading-relaxed">
                <strong>{t('guest.limits_label', 'Cheklovlar:')}</strong> {t('guest.limits_desc', 'Hisob yaratilgunicha bollar ko\'rinmaydi, tarix va XP saqlanmaydi.')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGuestAlert(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common.back', 'Orqaga')}</span>
              </button>
              <button
                onClick={handleConfirmGuest}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-md flex items-center justify-center"
              >
                <span>{t('common.ok_continue', 'Tushunarli')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
