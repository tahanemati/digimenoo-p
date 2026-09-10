import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { SetupVenue } from "./pages/SetupVenue";
import { Venues } from "./pages/Venues";
import { Support } from "./pages/Support";
import { Wallet } from "./pages/Wallet"; // <--- ایمپورت صفحه جدید کیف پول
import { DashboardLayout } from "./components/DashboardLayout";
import { VenueSettings } from "./pages/VenueSettings";
import { ModernDemo, MinimalDemo, ClassicDemo } from "./pages/ThemeDemos";
import { Subscription } from "./pages/Subscription";
import { QRBuilder } from "./pages/QRBuilder";
import { KitchenPanel } from "./pages/KitchenPanel";
import { LiveMenu } from "./pages/LiveMenu";
import { ForgotPassword } from "./pages/ForgotPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/setup-venue" element={<SetupVenue />} />

        <Route path="/modern-demo" element={<ModernDemo />} />
        <Route path="/minimal-demo" element={<MinimalDemo />} />
        <Route path="/classic-demo" element={<ClassicDemo />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/support" element={<Support />} />
          <Route path="/wallet" element={<Wallet />} /> {/* <--- جایگزین شد */}
          <Route path="/venue-settings" element={<VenueSettings />} />
          <Route path="/subscription" element={<Subscription />} /> 
          <Route path="/qr-builder" element={<QRBuilder />} />
          <Route path="/kitchen" element={<KitchenPanel />} />
        </Route>

        <Route path="/:englishName" element={<LiveMenu />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
