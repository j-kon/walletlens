import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import BlockPage from './pages/BlockPage';
import TransactionPage from './pages/TransactionPage';

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/address/:address" element={<Home />} />
      <Route path="/tx/:txid" element={<TransactionPage />} />
      <Route path="/block/:blockId" element={<BlockPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
