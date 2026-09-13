import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderSuccess from './pages/OrderSuccess'
import OwnerDashboard from './pages/OwnerDashboard'
import KitchenPage from './pages/KitchenPage'
import MenuManager from './pages/MenuManager'
import QRGenerator from './pages/QRGenerator'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import TrialGate from './components/TrialGate'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/login" element={<LoginPage />} />

        {/* staff — protected but no trial gate */}
        <Route path="/kitchen" element={
          <ProtectedRoute>
            <KitchenPage />
          </ProtectedRoute>
        } />

        {/* owner — protected + trial gate */}
        <Route path="/owner" element={
          <ProtectedRoute>
            <TrialGate>
              <OwnerDashboard />
            </TrialGate>
          </ProtectedRoute>
        } />
        <Route path="/owner/menu" element={
          <ProtectedRoute>
            <TrialGate>
              <MenuManager />
            </TrialGate>
          </ProtectedRoute>
        } />
        <Route path="/owner/qr" element={
          <ProtectedRoute>
            <TrialGate>
              <QRGenerator />
            </TrialGate>
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}

export default App