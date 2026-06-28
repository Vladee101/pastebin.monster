import { useState } from 'react';
import CreatePaste from './components/CreatePaste';
import RetrievePaste from './components/RetrievePaste';
import ViewPaste from './components/ViewPaste';
import NotFound from './components/NotFound';
import TabBar, { type Tab } from './components/TabBar';
import Footer from './components/Footer';

function wasJustDeleted(): boolean {
  const deleted = new URLSearchParams(window.location.search).has('deleted');
  if (deleted) {
    window.history.replaceState(null, '', '/');
  }
  return deleted;
}

function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('retrieve');
  const [showDeletedNotice, setShowDeletedNotice] = useState(wasJustDeleted);

  return (
    <>
      <div className="home-header">
        {showDeletedNotice && (
          <p className="notice" onAnimationEnd={() => setShowDeletedNotice(false)}>
            Paste deleted
          </p>
        )}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      {activeTab === 'retrieve' ? <RetrievePaste /> : <CreatePaste />}
    </>
  );
}

function App() {
  const path = window.location.pathname;

  let content;
  if (path === '/') {
    content = <Home />;
  } else {
    const slugMatch = path.match(/^\/([a-z]+-[a-z]+-\d{3})$/);
    content = slugMatch ? <ViewPaste slug={slugMatch[1]} /> : <NotFound />;
  }

  return (
    <>
      {content}
      <Footer />
    </>
  );
}

export default App;
