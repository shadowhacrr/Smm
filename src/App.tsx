import { BrowserRouter, Routes, Route } from "react-router";
import UserSite from "./pages/UserSite";
import AdminPanel from "./pages/AdminPanel";
import OwnerPanel from "./pages/OwnerPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserSite />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/owner" element={<OwnerPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
