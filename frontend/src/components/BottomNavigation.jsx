import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  BookOpen,
  LayoutDashboard,
  FileText,
  HelpCircle,
  PlusCircle,
  Mail,
  Info,
  LogIn,
  Shield,
  User
} from "lucide-react";

const BottomNavigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role?.toLowerCase();

  // Define tab items based on user role
  let tabs = [];

  if (role === 'admin') {
    tabs = [
      { label: 'Admin Hub', path: '/admin/dashboard', icon: Shield },
      { label: 'Home',      path: '/',                icon: Home },
      { label: 'Courses',   path: '/courses',         icon: BookOpen },
      { label: 'Contact',   path: '/contact',         icon: Mail },
    ];
  } else if (role === 'teacher') {
    tabs = [
      { label: 'Dashboard',   path: '/teacher/dashboard',      icon: LayoutDashboard },
      { label: 'My Courses',  path: '/teacher/courses',        icon: BookOpen },
      { label: 'Create',      path: '/teacher/courses/create', icon: PlusCircle },
      { label: 'Assignments', path: '/teacher/assignments',    icon: FileText },
      { label: 'Quizzes',     path: '/teacher/quizzes',        icon: HelpCircle },
    ];
  } else if (role === 'student') {
    tabs = [
      { label: 'Home',      path: '/',          icon: Home },
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Courses',   path: '/courses',   icon: BookOpen },
      { label: 'Contact',   path: '/contact',   icon: Mail },
    ];
  } else {
    // Guest / Unauthenticated
    tabs = [
      { label: 'Home',    path: '/',        icon: Home },
      { label: 'Courses', path: '/courses', icon: BookOpen },
      { label: 'About',   path: '/about',   icon: Info },
      { label: 'Contact', path: '/contact', icon: Mail },
      { label: 'Login',   path: '/login',   icon: LogIn },
    ];
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 ${
                active
                  ? role === 'admin'
                    ? 'text-purple-600 font-semibold bg-purple-50/80 scale-105'
                    : role === 'teacher'
                    ? 'text-indigo-600 font-semibold bg-indigo-50/80 scale-105'
                    : 'text-blue-600 font-semibold bg-blue-50/80 scale-105'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'stroke-[2.3]' : 'stroke-[1.7]'}`} />
                {active && (
                  <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${
                    role === 'admin' ? 'bg-purple-600' : role === 'teacher' ? 'bg-indigo-600' : 'bg-blue-600'
                  }`} />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
