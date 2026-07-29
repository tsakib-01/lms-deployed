import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_BACKEND_URL;

// ── Default content (used as fallback if API is unavailable) ─────────────────
const DEFAULT_HOME = {
  hero: {
    badgeLabel:   'New',
    badgeText:    'Advanced JavaScript Courses',
    titleLine1:   'Track Your',
    titleLine2:   'Learning Progress',
    description:  'Stay on top of your courses, quizzes, and rankings with real-time insights and interactive learning tools.',
    primaryBtn:   'Get Started',
    secondaryBtn: 'Learn More',
    rating:       '4.9',
    reviewCount:  '10k+ reviews',
  },
  trustedBy: {
    title:    'We are trusted by',
    companies: ['Google', 'Udemy', 'Khan Academy', 'Codecademy', 'Cloud Academy']
  },
  features: {
    title:       'Experience Learning Like Never Before',
    description: 'Stay motivated, track your progress, and connect with a community—all in one seamless platform.',
    cards: [
      { icon: '📈', title: 'Track Progress',       description: 'Monitor your learning journey with detailed analytics and insights.' },
      { icon: '💡', title: 'Interactive Quizzes',  description: 'Test your knowledge with engaging quizzes and instant feedback.' },
      { icon: '👥', title: 'Community Learning',   description: 'Connect with peers and mentors in a collaborative environment.' }
    ]
  },
  cta: {
    title:       'Ready to Start Your Learning Journey?',
    description: 'Join thousands of learners already growing their skills',
    buttonText:  'Get Started Today'
  }
};

const Home = () => {
  const [courses, setCourses]       = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [home, setHome]             = useState(DEFAULT_HOME);
  const [logoPath, setLogoPath]     = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Fetch home content + logo + courses in parallel ─────────────────────────
  useEffect(() => {
    // Courses
    fetch(`${API}/api/courses`)
      .then(r => r.ok ? r.json() : { courses: [] })
      .then(d => setCourses(d.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));

    // Home page content
    fetch(`${API}/api/content/pages/home`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success && d.data) setHome(d.data); })
      .catch(() => {});

    // Logo
    fetch(`${API}/api/content/logo`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success && d?.logoUrl) setLogoPath(d.logoUrl); })
      .catch(() => {});
  }, []);

  const { hero, trustedBy, features, cta } = home;

  return (
    <div className="bg-white min-h-screen">

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center space-x-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="text-orange-500">{hero.badgeLabel}</span>
              <span>{hero.badgeText}</span>
              <span>→</span>
            </div>

            {/* Logo (if set by admin) */}
          

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {hero.titleLine1}<br />
              <span className="text-gray-900">{hero.titleLine2}</span>
            </h1>

            <p className="text-gray-600 text-lg mb-8 max-w-xl">
              {hero.description}
            </p>

            <div className="flex items-center space-x-4 mb-8">
              <button
                onClick={() => navigate(user ? "/dashboard" : "/register")}
                className="bg-orange-500 text-white px-8 py-3.5 rounded-lg font-semibold transition flex items-center space-x-2"
              >
                <span>{hero.primaryBtn}</span>
                <span>→</span>
              </button>
              <button
                onClick={() => navigate("/courses")}
                className="text-gray-700 px-8 py-3.5 rounded-lg font-semibold transition"
              >
                {hero.secondaryBtn}
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">{hero.rating}</span>
                <span className="text-yellow-400 ml-1">★</span>
              </div>
              <span className="text-gray-500">{hero.reviewCount}</span>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white" />
              </div>
            </div>
          </div>

          {/* Right — hero image */}
          <img
            src="/hero.png"
            alt="Learning Platform Preview"
            className="w-full h-auto rounded-2xl object-cover"
          />
        </div>
      </section>

      {/* ── TRUSTED BY ───────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-gray-600 mb-8 font-medium">{trustedBy.title}</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            {trustedBy.companies.map((name, i) => (
              <div key={i} className="text-2xl font-bold text-gray-700">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Featured Courses</h2>
            <p className="text-gray-600">Explore our most popular courses</p>
          </div>
          <button
            onClick={() => navigate("/courses")}
            className="text-orange-600 hover:text-orange-700 font-semibold flex items-center space-x-2"
          >
            <span>View All Courses</span>
            <span>→</span>
          </button>
        </div>

        {coursesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        ) : courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.slice(0, 6).map(course => (
              <div
                key={course._id}
                onClick={() => {
                  if (user?.role === 'admin') {
                    alert('Admins cannot participate in or view course details as students.');
                    return;
                  }
                  navigate(`/courses/${course._id}`);
                }}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer border border-gray-100 overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={course.thumbnail
                      ? (course.thumbnail.startsWith('http') ? course.thumbnail : `${API}${course.thumbnail}`)
                      : "https://via.placeholder.com/400x225"}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <span className={`absolute top-4 right-4 text-white text-xs font-semibold px-3 py-1 rounded-full ${course.isPublished ? 'bg-green-500' : 'bg-gray-500'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-bold text-orange-600">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{course.category}</span>
                    <span className="text-xs text-gray-500">{course.level || 'All Levels'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{course.description}</p>
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="font-semibold text-gray-700">{course.averageRating?.toFixed(1) || '0.0'}</span>
                      <span className="mx-1">·</span>
                      <span>({course.totalRatings || 0})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span>👥 {course.enrolledStudents?.length || 0}</span>
                      <span>📚 {course.lessons?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center pt-4 border-t border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {course.instructor?.name?.charAt(0) || 'T'}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">{course.instructor?.name || 'Instructor'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No courses available yet</p>
            <button
              onClick={() => navigate(user?.role === 'teacher' ? '/teacher/courses' : '/courses')}
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              {user?.role === 'teacher' ? 'Create Your First Course' : 'Check Back Later'}
            </button>
          </div>
        )}
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-gray-50 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{features.title}</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">{features.description}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.cards.map((card, i) => (
            <div key={i} className="text-center p-8 bg-white rounded-2xl hover:shadow-lg transition">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">{card.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-20 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">{cta.title}</h2>
          <p className="text-orange-100 text-lg mb-8">{cta.description}</p>
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-orange-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl"
          >
            {cta.buttonText}
          </button>
        </div>
      </section>

    </div>
  );
};

export default Home;