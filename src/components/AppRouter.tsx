import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OffSeason from '../pages/OffSeason';

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<OffSeason />} />
      </Routes>
    </Router>
  );
}