import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
}) => {
  const { t } = useTranslation();
  const { login } = useAuthStore();

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-dark-surface w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-dark-border text-center relative text-slate-800 dark:text-dark-text-main"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-dark-text-main p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border shadow-md flex items-center justify-center mx-auto mb-4 p-2">
            <img src="/logo.png" alt="Unitest Logo" className="w-full h-full object-contain" />
          </div>

          {/* Title & Description */}
          <h3 className="text-2xl font-extrabold mb-3 text-slate-900 dark:text-dark-text-main">
            {title || t('auth.required_title', 'Avtorizatsiya talab qilinadi')}
          </h3>
          <p className="text-slate-500 dark:text-dark-text-muted text-sm leading-relaxed mb-6">
            {description ||
              t(
                'auth.required_desc',
                'Ushbu xizmatdan foydalanish, natijalaringizni saqlash va progresingizni kuzatish uchun tizimga kiring.'
              )}
          </p>

          {/* Action Buttons */}
          <div className="flex justify-center w-full mt-2">
            {/* Google Sign-in Option */}
            <GoogleLogin
              width="280"
              onSuccess={async (credentialResponse) => {
                try {
                  const response = await api.post('/api/auth/google/', {
                    id_token: credentialResponse.credential,
                  });
                  const { access, refresh, user } = response.data;
                  login(user, access, refresh);
                  onClose();
                } catch (error) {
                  console.error('Google Auth Failed', error);
                }
              }}
              onError={() => {
                console.error('Google Auth Failed');
              }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
