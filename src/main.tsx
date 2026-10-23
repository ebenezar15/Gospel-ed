import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import People from './pages/People';
import PersonPage from './pages/PersonPage';
import Rosters from './pages/Rosters';
import Books, { BookPage } from './pages/Books';
import Timeline from './pages/Timeline';
import Maps from './pages/Maps';
import Lens from './pages/Lens';
import Family from './pages/Family';
import Connections from './pages/Connections';
import Work from './pages/Work';
import GospelHistory from './pages/GospelHistory';
import Afterlife from './pages/Afterlife';
import Debates, { DebatePage } from './pages/Debates';
import Context, { ContextPage } from './pages/Context';
import Study from './pages/Study';
import Quiz from './pages/Quiz';
import NotFound from './pages/NotFound';
import Guides, { GuidePage } from './pages/Guides';
import Theologians from './pages/Theologians';
import Canon from './pages/Canon';
import Paradoxes from './pages/Paradoxes';
import BibleHistory from './pages/BibleHistory';
import Types from './pages/Types';
import Symbols from './pages/Symbols';
import Gods from './pages/Gods';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/people" element={<People />} />
          <Route path="/people/:id" element={<PersonPage />} />
          <Route path="/rosters" element={<Rosters />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookPage />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/lens" element={<Lens />} />
          <Route path="/family" element={<Family />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/work" element={<Work />} />
          <Route path="/gospel-history" element={<GospelHistory />} />
          <Route path="/afterlife" element={<Afterlife />} />
          <Route path="/debates" element={<Debates kind="debate" />} />
          <Route path="/debates/:id" element={<DebatePage />} />
          <Route path="/movements" element={<Debates kind="movement" />} />
          <Route path="/movements/:id" element={<DebatePage />} />
          <Route path="/context" element={<Context />} />
          <Route path="/context/:id" element={<ContextPage />} />
          <Route path="/study" element={<Study />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/:id" element={<GuidePage />} />
          <Route path="/theologians" element={<Theologians />} />
          <Route path="/canon" element={<Canon />} />
          <Route path="/paradoxes" element={<Paradoxes />} />
          <Route path="/bible-history" element={<BibleHistory />} />
          <Route path="/types" element={<Types />} />
          <Route path="/symbols" element={<Symbols />} />
          <Route path="/gods" element={<Gods />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HashRouter>
  </React.StrictMode>,
);
