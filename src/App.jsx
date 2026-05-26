import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import SellerDashboard from './pages/SellerDashboard';
import ProjectDetails from './pages/ProjectDetails';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/success/:orderId" element={<PaymentSuccess />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

