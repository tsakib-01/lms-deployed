import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNavigation from "./BottomNavigation";

const Layout = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Layout;