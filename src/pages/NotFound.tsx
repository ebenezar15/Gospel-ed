import { Link } from 'react-router-dom';
import { t } from '../i18n';
export default function NotFound() {
  return <div className="py-20 text-center"><h1 className="text-5xl mb-3">{t('Off the map')}</h1><p className="text-muted font-serif mb-6">{t('This page isn’t in the atlas.')}</p><Link className="btn btn-primary" to="/">{t('Back to the beginning')}</Link></div>;
}
