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
import { Subscription } from "./pages/Subscription";
import { QRBuilder } from "./pages/QRBuilder";
import { KitchenPanel } from "./pages/KitchenPanel";
import { LiveMenu } from "./pages/LiveMenu";
import { ForgotPassword } from "./pages/ForgotPassword";
import { CompleteProfile } from "./pages/CompleteProfile";
import { TeamManagement } from "./pages/TeamManagement";
import { OneDemo } from "./pages/demos/OneDemo";
import { TwoDemo } from "./pages/demos/TwoDemo";
import { ThreeDemo } from "./pages/demos/ThreeDemo";
import { SidebarDemo } from "./pages/demos/SidebarDemo";
import { LandingDemo } from "./pages/demos/LandingDemo";
import { DarkStoryDemo } from "./pages/demos/DarkStoryDemo";
import { SwipeDemo } from "./pages/demos/SwipeDemo";
import { VintageDemo } from "./pages/demos/VintageDemo";
import { OrbitalDemo } from "./pages/demos/OrbitalDemo";
import { BentoDemo } from "./pages/demos/BentoDemo";
import { ProductManagement } from "./pages/ProductManagement";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { WaiterPanel } from "./pages/WaiterPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/onedemo" element={<OneDemo />} />
        <Route path="/twodemo" element={<TwoDemo />} />
        <Route path="/threedemo" element={<ThreeDemo />} />
        <Route path="/fourdemo" element={<SidebarDemo />} />
        <Route path="/fivedemo" element={<LandingDemo />} />
        <Route path="/sixdemo" element={<DarkStoryDemo />} />
        <Route path="/sevendemo" element={<SwipeDemo />} />
        <Route path="/eightdemo" element={<VintageDemo />} />
        <Route path="/ninedemo" element={<OrbitalDemo />} />
        <Route path="/tendemo" element={<BentoDemo />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/support" element={<Support />} />
            <Route path="/wallet" element={<Wallet />} />{" "}
            {/* <--- جایگزین شد */}
            <Route path="/venue-settings" element={<VenueSettings />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/qr-builder" element={<QRBuilder />} />
            <Route path="/kitchen" element={<KitchenPanel />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/products" element={<ProductManagement />} />
          </Route>
          <Route path="/setup-venue" element={<SetupVenue />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/waiter" element={<WaiterPanel />} />
        </Route>

        <Route path="/:slug" element={<LiveMenu />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
