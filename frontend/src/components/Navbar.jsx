import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // ── Fetch dynamic logo ──────────────────────────────────────────────────────
  const fetchLogo = async () => {
    try {
      const res  = await fetch(`${API}/api/content/logo`);
      const data = await res.json();
      // logoUrl is a full Cloudinary URL — no API prefix needed
      setLogoSrc(data.success && data.logoUrl ? data.logoUrl : '');
    } catch (_) { setLogoSrc(''); }
  };

  useEffect(() => {
    fetchLogo();
  }, []);

  // Re-fetch logo when navigating to home or admin dashboard
  // (so a freshly uploaded logo appears without a full page reload)
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/admin/dashboard') {
      fetchLogo();
    }
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const courseCategories = [
    { name: "Web Development",    icon: "💻", path: "/courses?category=web" },
    { name: "Mobile Development", icon: "📱", path: "/courses?category=mobile" },
    { name: "Data Science",       icon: "📊", path: "/courses?category=data" },
    { name: "Design",             icon: "🎨", path: "/courses?category=design" },
    { name: "Business",           icon: "💼", path: "/courses?category=business" },
    { name: "Marketing",          icon: "📢", path: "/courses?category=marketing" },
  ];

  // ── Logo ────────────────────────────────────────────────────────────────────
  const LogoBrand = () => {
    // null  = still loading → show skeleton
    if (logoSrc === null) return <div className="w-28 h-10 bg-gray-100 animate-pulse rounded" />;
    // non-empty string = Cloudinary URL → show image
    if (logoSrc) return (
      <img
        src={logoSrc}
        alt="Site Logo"
        className="h-14 w-auto max-w-[180px] object-contain"
        onError={() => setLogoSrc('')}
      />
    );
    // empty string = no logo → fall back to text brand name
    return <span className="text-xl font-bold text-gray-900 tracking-tight">SkillBridge</span>;
  };

  // ── User Avatar ─────────────────────────────────────────────────────────────
  const UserAvatar = ({ size = "sm", clickable = false }) => {
    const dim  = size === "sm" ? "w-9 h-9 text-sm" : "w-10 h-10 text-base";
    const base = `${dim} rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0`;
    const cls  = clickable ? `${base} cursor-pointer ring-2 ring-transparent hover:ring-orange-400 transition` : base;

    const content = (
      <>
        {user?.avatar
          ? <img src={`${API}${user.avatar}`} alt="avatar" className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
          : user?.name?.charAt(0)?.toUpperCase() || "U"}
      </>
    );

    if (clickable) {
      return <div className={cls} onClick={() => navigate("/dashboard")} title="Go to Dashboard">{content}</div>;
    }
    return <div className={cls}>{content}</div>;
  };

  // ── Courses dropdown (desktop) ──────────────────────────────────────────────
  const CoursesDropdown = () => (
    <div className="relative" onMouseEnter={() => setCoursesDropdownOpen(true)} onMouseLeave={() => setCoursesDropdownOpen(false)}>
      <button className={`flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/courses" ? "text-gray-900 font-semibold" : ""}`}>
        <span>Courses</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {coursesDropdownOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 py-4 z-50">
          <div className="px-4 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Browse by Category</h3>
          </div>
          <div className="py-2">
            {courseCategories.map((cat, i) => (
              <Link key={i} to={cat.path}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-orange-50 transition"
                onClick={() => setCoursesDropdownOpen(false)}>
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-gray-700 hover:text-gray-900 font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
          <div className="px-4 pt-3 border-t border-gray-100">
            <Link to="/courses" className="block text-center text-orange-600 hover:text-orange-700 font-semibold text-sm"
              onClick={() => setCoursesDropdownOpen(false)}>
              View All Courses →
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Main Navbar ──────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 md:hidden mr-2">☰</button>
              <Link to="/" className="flex items-center"><LogoBrand /></Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">

              {/* ── ADMIN ── */}
              {user?.role === "admin" && (
                <>
                  <Link to="/"                className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/"                ? "text-gray-900 font-semibold" : ""}`}>Home</Link>
                  <Link to="/about"           className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/about"           ? "text-gray-900 font-semibold" : ""}`}>About</Link>
                  <Link to="/admin/dashboard" className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/admin/dashboard" ? "text-gray-900 font-semibold" : ""}`}>Dashboard</Link>
                  <Link to="/contact"         className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/contact"         ? "text-gray-900 font-semibold" : ""}`}>Contact</Link>
                </>
              )}

              {/* ── TEACHER ── */}
              {user?.role === "teacher" && (
                <>
                  <Link to="/teacher/dashboard"   className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/teacher/dashboard"   ? "text-gray-900 font-semibold" : ""}`}>Dashboard</Link>
                  <Link to="/teacher/assignments" className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/teacher/assignments" ? "text-gray-900 font-semibold" : ""}`}>Assignments</Link>
                  <Link to="/teacher/quizzes"     className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/teacher/quizzes"     ? "text-gray-900 font-semibold" : ""}`}>Quizzes</Link>
                </>
              )}

              {/* ── STUDENT ── */}
              {user?.role === "student" && (
                <>
                  <Link to="/"        className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/"        ? "text-gray-900 font-semibold" : ""}`}>Home</Link>
                  <Link to="/about"   className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/about"   ? "text-gray-900 font-semibold" : ""}`}>About</Link>
                  <CoursesDropdown />
                  <Link to="/contact" className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/contact" ? "text-gray-900 font-semibold" : ""}`}>Contact</Link>
                </>
              )}

              {/* ── GUEST ── */}
              {!user && (
                <>
                  <Link to="/"        className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/"        ? "text-gray-900 font-semibold" : ""}`}>Home</Link>
                  <Link to="/about"   className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/about"   ? "text-gray-900 font-semibold" : ""}`}>About</Link>
                  <CoursesDropdown />
                  <Link to="/contact" className={`text-gray-700 hover:text-gray-900 transition font-medium ${location.pathname === "/contact" ? "text-gray-900 font-semibold" : ""}`}>Contact</Link>
                </>
              )}

            </nav>

            {/* Auth section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-3">
                    <UserAvatar size="sm" clickable={user.role === "student"} />
                    <div
                      className={`text-sm ${user.role === "student" ? "cursor-pointer hover:text-orange-600 transition" : ""}`}
                      onClick={() => user.role === "student" && navigate("/dashboard")}
                      title={user.role === "student" ? "Go to Dashboard" : undefined}
                    >
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="text-sm text-gray-700 hover:text-gray-900 font-medium">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"    className="text-gray-700 hover:text-gray-900 font-medium px-4 py-2">Sign In</Link>
                  <Link to="/register" className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition shadow-sm">Get Started</Link>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile Sidebar ───────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          <nav className="px-4 py-4 space-y-2">

            {/* ADMIN mobile */}
            {user?.role === "admin" && (
              <>
                <Link to="/"                className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Home</Link>
                <Link to="/about"           className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>About</Link>
                <Link to="/admin/dashboard" className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Dashboard</Link>
                <Link to="/contact"         className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Contact</Link>
              </>
            )}

            {/* TEACHER mobile */}
            {user?.role === "teacher" && (
              <>
                <Link to="/teacher/dashboard"   className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Dashboard</Link>
                <Link to="/teacher/assignments" className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Assignments</Link>
                <Link to="/teacher/quizzes"     className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Quizzes</Link>
              </>
            )}

            {/* STUDENT mobile */}
            {user?.role === "student" && (
              <>
                <Link to="/"      className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Home</Link>
                <Link to="/about" className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>About</Link>
                <div>
                  <button onClick={() => setCoursesDropdownOpen(!coursesDropdownOpen)}
                    className="flex items-center justify-between w-full text-gray-700 hover:text-gray-900 py-2.5 font-medium">
                    <span>Courses</span>
                    <svg className={`w-4 h-4 transition-transform ${coursesDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {coursesDropdownOpen && (
                    <div className="pl-4 space-y-2 mt-2">
                      {courseCategories.map((cat, i) => (
                        <Link key={i} to={cat.path}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 py-2"
                          onClick={() => { setSidebarOpen(false); setCoursesDropdownOpen(false); }}>
                          <span>{cat.icon}</span>
                          <span className="text-sm">{cat.name}</span>
                        </Link>
                      ))}
                      <Link to="/courses" className="block text-orange-600 hover:text-orange-700 py-2 text-sm font-semibold"
                        onClick={() => { setSidebarOpen(false); setCoursesDropdownOpen(false); }}>
                        View All Courses →
                      </Link>
                    </div>
                  )}
                </div>
                <Link to="/contact" className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Contact</Link>
                <button
                  className="flex items-center space-x-3 w-full py-2.5 border-t mt-2 pt-4 hover:text-orange-600 transition"
                  onClick={() => { setSidebarOpen(false); navigate("/dashboard"); }}
                >
                  <UserAvatar size="lg" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                    <div className="text-xs text-orange-500 font-medium">Go to Dashboard →</div>
                  </div>
                </button>
              </>
            )}

            {/* GUEST mobile */}
            {!user && (
              <>
                <Link to="/"      className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Home</Link>
                <Link to="/about" className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>About</Link>
                <div>
                  <button onClick={() => setCoursesDropdownOpen(!coursesDropdownOpen)}
                    className="flex items-center justify-between w-full text-gray-700 hover:text-gray-900 py-2.5 font-medium">
                    <span>Courses</span>
                    <svg className={`w-4 h-4 transition-transform ${coursesDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {coursesDropdownOpen && (
                    <div className="pl-4 space-y-2 mt-2">
                      {courseCategories.map((cat, i) => (
                        <Link key={i} to={cat.path}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 py-2"
                          onClick={() => { setSidebarOpen(false); setCoursesDropdownOpen(false); }}>
                          <span>{cat.icon}</span>
                          <span className="text-sm">{cat.name}</span>
                        </Link>
                      ))}
                      <Link to="/courses" className="block text-orange-600 hover:text-orange-700 py-2 text-sm font-semibold"
                        onClick={() => { setSidebarOpen(false); setCoursesDropdownOpen(false); }}>
                        View All Courses →
                      </Link>
                    </div>
                  )}
                </div>
                <Link to="/contact" className="block text-gray-700 hover:text-gray-900 py-2.5 font-medium" onClick={() => setSidebarOpen(false)}>Contact</Link>
              </>
            )}

            {/* Non-student logged-in user info in mobile */}
            {user && user.role !== "student" && (
              <div className="pt-4 border-t mt-4 flex items-center space-x-3">
                <UserAvatar size="lg" />
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                </div>
              </div>
            )}

          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;