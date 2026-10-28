import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerView from './pages/CustomerView';
import RestaurantDetail from './pages/RestaurantDetail';
import StaffDashboard from './pages/StaffDashboard';
import TableManagement from './pages/TableManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerView />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/restaurant/:id" element={<TableManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
