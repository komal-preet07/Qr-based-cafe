import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderSuccess from './pages/OrderSuccess'
import OwnerDashboard from './pages/OwnerDashboard'
import KitchenPage from './pages/KitchenPage'
import MenuManager from './pages/MenuManager'
import QRGenerator from './pages/QrGenerator'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
       
<Route path="/menu" element={<MenuPage />} />
<Route path="/" element={<LandingPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/login" element={<LoginPage />} />

        {/* protected routes - login required */}
        <Route path="/kitchen" element={
          <ProtectedRoute>
            <KitchenPage />
          </ProtectedRoute>
        } />
        <Route path="/owner" element={
          <ProtectedRoute>
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/owner/menu" element={
          <ProtectedRoute>
            <MenuManager />
          </ProtectedRoute>
        } />
        <Route path="/owner/qr" element={
          <ProtectedRoute>
            <QRGenerator />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App