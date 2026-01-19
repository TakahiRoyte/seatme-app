import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerView from './pages/CustomerView';
import RestaurantDetail from './pages/RestaurantDetail';
import StaffDashboard from './pages/StaffDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerView />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/staff" element={<StaffDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
