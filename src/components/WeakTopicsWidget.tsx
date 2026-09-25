import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Play, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ratingApi, type WeakTopic } from '../lib/api/rating';

export default function WeakTopicsWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ratingApi.getWeakTopics()
      .then(data => setWeakTopics(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch weak topics:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleStartPractice = (topic: WeakTopic) => {
    if (topic.topic_id) {
      navigate(`/tests`, { state: { targetTopicId: topic.topic_id, targetSubjectId: topic.subject_id } });
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t('weak_topics.title', 'Заиф темы (Weak Topics)')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-1 font-medium">
            {t('weak_topics.subtitle', 'Mavzulashtirilgan testlarda xato qilgan mavzularingiz')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border animate-pulse flex items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
                <div className="w-20 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ) : weakTopics.length > 0 ? (
          weakTopics.map((topic, idx) => (
            <div
              key={topic.topic_id || idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border hover:border-amber-200 dark:hover:border-amber-950/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400">
                    {topic.subject_name || 'Fan'}
                  </span>
                  {topic.accuracy_percentage !== undefined && (
                    <span className="text-xs font-bold text-rose-500 dark:text-rose-400">
                      {topic.accuracy_percentage}% aniqlik
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-sm truncate">
                  {topic.topic_name}
                </h4>
                {topic.mistake_count > 0 && (
                  <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-0.5">
                    {topic.mistake_count} ta xato savol
                  </p>
                )}
              </div>

              <button
                onClick={() => handleStartPractice(topic)}
                disabled={!topic.can_start_test}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                {t('weak_topics.practice', 'Mashq qilish')}
              </button>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-dark-text-muted font-medium flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
            <p className="text-sm font-bold text-slate-700 dark:text-dark-text-main">
              {t('weak_topics.empty_title', 'Hozircha zaif mavzular yo\'q!')}
            </p>
            <p className="text-xs text-slate-400">
              {t('weak_topics.empty_desc', 'Ajoyib natija! Testlarni ishlashda davom eting.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
