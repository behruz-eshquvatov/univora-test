import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { useState } from 'react';
import { Apple } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-transparent font-body relative">
      <div className="bg-surface p-10 rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm text-center relative z-10">
        
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-slate-800">Добро пожаловать</h2>
          <p className="text-slate-500 mt-2 text-sm">Войдите в систему для продолжения</p>
        </div>

        {isLoading ? (
          <div className="w-full flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <div className="flex justify-center">
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
            
            <button
              onClick={() => alert('Вход через Apple в разработке')}
              className="flex items-center justify-center gap-2 bg-black text-white shadow-sm hover:bg-gray-900 transition-colors"
              style={{ width: '280px', height: '40px', borderRadius: '4px' }}
            >
              <Apple className="w-5 h-5 mb-0.5" />
              <span className="text-sm font-medium font-roboto" style={{ fontFamily: 'Roboto, arial, sans-serif' }}>Sign in with Apple</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
