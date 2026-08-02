import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dictionary } from './pages/Dictionary';
import { FlashCards } from './pages/FlashCards';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dictionary />} />
        <Route path="/flashcards" element={<FlashCards />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}