import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { SetupVenue } from "./pages/SetupVenue";
import { Venues } from "./pages/Venues";
import { Support } from "./pages/Support";
import { Wallet } from "./pages/Wallet";
import { DashboardLayout } from "./components/DashboardLayout";
import { VenueSettings } from "./pages/VenueSettings";
import { Subscription } from "./pages/Subscription";
import { QrCodes } from "./pages/QrCodes";
import { KitchenPanel } from "./pages/KitchenPanel";
import { ForgotPassword } from "./pages/ForgotPassword";
import { CompleteProfile } from "./pages/CompleteProfile";
import { TeamManagement } from "./pages/TeamManagement";
import { ProductManagement } from "./pages/ProductManagement";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CustomerMenu } from "./pages/CustomerMenu";
import FinancialReports from "./pages/FinancialReports";
import TableReservations from "./pages/TableReservations";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/:slug" element={<CustomerMenu />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/support" element={<Support />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/venue-settings" element={<VenueSettings />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/qrcodes" element={<QrCodes />} />
            <Route path="/kitchen" element={<KitchenPanel />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/financial-reports" element={<FinancialReports />} />
            <Route path="/reservations" element={<TableReservations />} />
            <Route path="/products" element={<ProductManagement />} />
          </Route>
          <Route path="/setup-venue" element={<SetupVenue />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
