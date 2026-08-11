import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { Header } from './components/Header';
import { LandingPage } from './views/LandingPage';
import { Login } from './views/Login';
import { Reception } from './views/Reception';
import { Counter } from './views/Counter';
import { LEDDisplay } from './views/LEDDisplay';
import { Admin } from './views/Admin';
import { SuperAdmin } from './views/SuperAdmin';
import { QRRegistration } from './views/QRRegistration';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <div className="layout-container font-manrope">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/reception" element={<Reception />} />
          <Route path="/counter" element={<Counter />} />
          <Route path="/display" element={<LEDDisplay />} />
          <Route path="/register-qr" element={<QRRegistration />} />
          <Route path="/token-pass/:tokenId" element={<QRRegistration />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
