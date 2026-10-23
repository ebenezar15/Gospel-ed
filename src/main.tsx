import React from 'react';
import ReactDOM from 'react-dom/client';
import { isTa, loadOverlay } from './i18n';

// Tamil content is loaded before the data module runs, so every page and index is built in the chosen language.
document.documentElement.lang = isTa ? 'ta' : 'en';
const root = ReactDOM.createRoot(document.getElementById('root')!);
if (isTa) root.render(<div style={{ display: 'grid', placeItems: 'center', height: '100vh', fontFamily: 'Noto Sans Tamil, sans-serif', opacity: 0.7 }}>தமிழ் உள்ளடக்கம் ஏற்றப்படுகிறது…</div>);
loadOverlay().then(() => import('./App')).then(({ default: App }) => root.render(<App />));
