import { useState, useEffect, useCallback, useRef } from 'react';

import CertificateTab from './AdminCertificateTab';

import {

  Users, FileText, Mail, Inbox, Award, Search, RefreshCw,

  CheckCircle, XCircle, UserPlus, Shield, GraduationCap,

  ChevronDown, ExternalLink, Send, X, AlertTriangle,

  Clock, Eye, Trash2, ToggleLeft, ToggleRight, Save,

  LayoutDashboard, ArrowRight, Info, Home, Image, Upload, DollarSign, Landmark

} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

const Dashboard = () => {

  const [activeTab, setActiveTab] = useState('users');

  const [loading, setLoading]     = useState(false);

  const [success, setSuccess]     = useState('');

  const [error, setError]         = useState('');

  const [users, setUsers]                 = useState([]);

  const [usersLoading, setUsersLoading]   = useState(true);

  const [messages, setMessages]           = useState([]);

  const [messagesLoading, setMessagesLoading] = useState(true);

  const [replyState, setReplyState]       = useState({}); // { [msgId]: { open, text, loading } }

  const [userSubTab, setUserSubTab]     = useState('list');

  const [teacherForm, setTeacherForm]   = useState({ name: '', email: '' });

  const [createLoading, setCreateLoading] = useState(false);

  const [search, setSearch]         = useState('');

  const [roleFilter, setRoleFilter] = useState('');

  // Financials tab states

  const [financialStats, setFinancialStats] = useState({ totalSales: 0, totalFees: 0, totalTeacherEarnings: 0 });

  const [transactions, setTransactions] = useState([]);

  const [financialsLoading, setFinancialsLoading] = useState(true);

  // ── Logo state ──────────────────────────────────────────────────────────────

  const [logoUrl, setLogoUrl] = useState(null);

  const [logoPreview, setLogoPreview]   = useState(null);

  const [logoFile, setLogoFile]         = useState(null);

  const [logoLoading, setLogoLoading]   = useState(false);

  const logoInputRef = useRef();

  // ── Home page content state ─────────────────────────────────────────────────

  const [homeContent, setHomeContent] = useState({

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

      title:     'We are trusted by',

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

  });

  // ── About / Contact content ─────────────────────────────────────────────────

  const [aboutContent, setAboutContent] = useState({

    heroTitle: 'About Learning Platform',

    heroDescription: 'Empowering learners worldwide with high-quality, accessible education.',

    storyTitle: 'Our Story',

    storyParagraphs: ['Founded in 2020...', 'What started as...', 'Today, we\'re proud...', 'Our commitment remains...'],

    missionTitle: 'Our Mission',

    missionDescription: 'To democratize education...',

    stats: [

      { number: '10K+', label: 'Active Students' },

      { number: '500+', label: 'Courses Available' },

      { number: '50+',  label: 'Expert Instructors' },

      { number: '95%',  label: 'Satisfaction Rate' }

    ],

    values: [

      { icon: '🎯', title: 'Excellence',    description: 'We strive for excellence...' },

      { icon: '🤝', title: 'Community',     description: 'Building a supportive learning...' },

      { icon: '💡', title: 'Innovation',    description: 'Constantly evolving our platform...' },

      { icon: '🌍', title: 'Accessibility', description: 'Making quality education accessible...' }

    ]

  });

  const [contactContent, setContactContent] = useState({

    heroTitle: 'Get in Touch',

    heroDescription: 'Have questions? We\'d love to hear from you.',

    contactInfo: {

      email1: 'support@learning.com', email2: 'info@learning.com',

      phone: '+1 (555) 123-4567', phoneHours: 'Mon-Fri, 9AM-6PM EST',

      address1: '123 Learning Street', address2: 'Education City, EC 12345',

      liveChatAvailability: 'Available 24/7'

    },

    faqs: [

      { question: 'How do I enroll in a course?',  answer: 'Simply browse our courses...' },

      { question: 'Can I get a refund?',            answer: 'Yes! We offer a 30-day money-back guarantee...' },

      { question: 'Do you offer certificates?',     answer: 'Yes, you\'ll receive a certificate...' },

      { question: 'How long do I have access?',     answer: 'Once enrolled, you have lifetime access...' }

    ]

  });

  const clearNotification = useCallback((type) => {

    if (type === 'success') setSuccess(''); else setError('');

  }, []);

  const notify = (type, msg, ms = 4000) => {

    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), ms); }

    else                    { setError(msg);   setTimeout(() => setError(''),   ms); }

  };

  // ── Initial data fetch ──────────────────────────────────────────────────────

  useEffect(() => { fetchContent(); fetchLogo(); }, []);

  useEffect(() => {

    if (activeTab === 'messages') fetchMessages();

    else if (activeTab === 'users') fetchUsers();

    else if (activeTab === 'financials') fetchFinancials();

  }, [activeTab]);

  const fetchFinancials = async () => {

    setFinancialsLoading(true);

    try {

      const token = localStorage.getItem('token');

      const res = await fetch(`${API}/api/payments/admin-stats`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      const data = await res.json();

      if (data.success) {

        setFinancialStats(data.stats);

        setTransactions(data.transactions);

      }

    } catch (err) {

      console.error('Error fetching financials:', err);

    } finally {

      setFinancialsLoading(false);

    }

  };

  const fetchContent = async () => {

    try {

      const res  = await fetch(`${API}/api/content/pages`);

      const data = await res.json();

      if (data.success) {

        if (data.data.about)   setAboutContent(data.data.about);

        if (data.data.contact) setContactContent(data.data.contact);

        if (data.data.home)    setHomeContent(data.data.home);

      }

    } catch (err) { console.error('Failed to fetch content:', err); }

  };

 const fetchLogo = async () => {

  try {

    const res  = await fetch(`${API}/api/content/logo`);

    const data = await res.json();

    if (data.success && data.logoUrl) {

      setLogoUrl(data.logoUrl);

      setLogoPreview(data.logoUrl); // full Cloudinary URL, no prefix needed

    }

  } catch (_) {}

};

  const fetchUsers = async () => {

    setUsersLoading(true);

    try {

      const token = localStorage.getItem('token');

      const res   = await fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });

      const data  = await res.json();

      if (data.success) setUsers(data.data);

    } catch (err) { console.error('Error fetching users:', err); }

    finally { setUsersLoading(false); }

  };

  const fetchMessages = async () => {

    setMessagesLoading(true);

    try {

      const res  = await fetch(`${API}/api/contact/messages`);

      const data = await res.json();

      if (data.success) setMessages(data.data);

    } catch (err) { console.error('Error fetching messages:', err); }

    finally { setMessagesLoading(false); }

  };

  // ── Logo handlers ───────────────────────────────────────────────────────────

  const handleLogoSelect = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { notify('error', 'Logo must be under 2 MB'); return; }

    setLogoFile(file);

    setLogoPreview(URL.createObjectURL(file));

  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setLogoLoading(true);

    try {
      const fd = new FormData();
      fd.append('logo', logoFile);

      // Convert to Base64 data URI string as fallback
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(logoFile);
      });
      const b64 = await base64Promise;
      fd.append('logoBase64', b64);

      const token = localStorage.getItem('token');

      const res   = await fetch(`${API}/api/content/logo`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd
      });

      const data = await res.json();

      if (data.success) {
        setLogoUrl(data.logoUrl);
        setLogoPreview(data.logoUrl);
        setLogoFile(null);
        notify('success', 'Logo updated successfully!');
      } else { notify('error', data.message || 'Failed to upload logo'); }

    } catch (err) { notify('error', 'Failed to upload logo: ' + err.message); }

    finally { setLogoLoading(false); }
  };

const handleLogoRemove = async () => {

  if (!window.confirm('Remove the logo? The site will display the text name instead.')) return;

  setLogoLoading(true);

  try {

    const token = localStorage.getItem('token');

    await fetch(`${API}/api/content/logo`, {

      method: 'DELETE',

      headers: { Authorization: `Bearer ${token}` }

    });

    setLogoUrl(null);

    setLogoPreview(null);

    setLogoFile(null);

    notify('success', 'Logo removed');

  } catch (_) { notify('error', 'Failed to remove logo'); }

  finally { setLogoLoading(false); }

};

  // ── Generic page save ───────────────────────────────────────────────────────

  const handleSave = async () => {

    setLoading(true);

    try {

      const token = localStorage.getItem('token');

      const content =

        activeTab === 'about'   ? aboutContent   :

        activeTab === 'contact' ? contactContent :

        homeContent;

      const res  = await fetch(`${API}/api/content/pages/${activeTab}`, {

        method:  'PUT',

        headers: {

          'Content-Type': 'application/json',

          ...(token ? { Authorization: `Bearer ${token}` } : {})

        },

        body:    JSON.stringify(content)

      });

      const data = await res.json();

      if (data.success) {

        notify('success', `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} page updated successfully!`, 3000);

        fetchContent();

      } else notify('error', data.message || 'Failed to update content');

    } catch (_) { notify('error', 'Failed to save changes'); }

    finally { setLoading(false); }

  };

  // ── User actions ────────────────────────────────────────────────────────────

  const handleUserAction = async (userId, action) => {

    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {

      const token = localStorage.getItem('token');

      const res   = await fetch(`${API}/api/admin/users/${userId}/${action}`, {

        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

      });

      const data = await res.json();

      if (data.success) {

        notify('success', `User ${action === 'approve' ? 'approved' : 'rejected'} successfully${data.emailSent ? ' - Email sent' : ''}`, 5000);

        fetchUsers();

      } else notify('error', data.message || `Failed to ${action} user`);

    } catch (err) { notify('error', `Failed to ${action} user: ${err.message}`); }

  };

  const handleToggleStatus = async (userId, currentStatus) => {

    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;

    try {

      const token = localStorage.getItem('token');

      const res   = await fetch(`${API}/api/admin/users/${userId}/toggle-status`, {

        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

      });

      const data = await res.json();

      if (data.success) {

        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: data.isActive } : u));

        notify('success', `User ${data.isActive ? 'activated' : 'deactivated'} successfully`, 3000);

      } else notify('error', data.message || 'Failed to update status');

    } catch (_) { notify('error', 'Failed to update user status'); }

  };

  const handleInviteTeacher = async () => {

    const { name, email } = teacherForm;

    if (!name.trim() || !email.trim()) { notify('error', 'Please fill in both name and email'); return; }

    if (!/^\S+@\S+\.\S+$/.test(email)) { notify('error', 'Please enter a valid email address'); return; }

    setCreateLoading(true);

    try {

      const token = localStorage.getItem('token');

      const res   = await fetch(`${API}/api/admin/users/create-teacher`, {

        method: 'POST',

        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },

        body: JSON.stringify({ name, email })

      });

      const data = await res.json();

      if (data.success) {

        notify('success', data.emailSent

          ? `Invite sent to ${email}. ${name} will receive an email to set their password.`

          : `Account created for ${name} but the email failed to send.`, 7000);

        setTeacherForm({ name: '', email: '' });

        setUserSubTab('list');

        fetchUsers();

      } else notify('error', data.message || 'Failed to send invite');

    } catch (err) { notify('error', 'Failed to send invite: ' + err.message); }

    finally { setCreateLoading(false); }

  };

  const deleteMessage = async (id) => {

    if (!window.confirm('Delete this message?')) return;

    try {

      const res  = await fetch(`${API}/api/contact/messages/${id}`, { method: 'DELETE' });

      const data = await res.json();

      if (data.success) { setMessages(messages.filter(m => m._id !== id)); notify('success', 'Message deleted', 3000); }

    } catch (_) { notify('error', 'Failed to delete message'); }

  };

  const toggleReply = (id) => {

    setReplyState(prev => ({

      ...prev,

      [id]: { open: !prev[id]?.open, text: prev[id]?.text || '', loading: false }

    }));

  };

  const sendReply = async (id) => {

    const text = replyState[id]?.text?.trim();

    if (!text) { notify('error', 'Please type a reply before sending'); return; }

    setReplyState(prev => ({ ...prev, [id]: { ...prev[id], loading: true } }));

    try {

      const token = localStorage.getItem('token');

      const res   = await fetch(`${API}/api/contact/messages/${id}/reply`, {

        method: 'PUT',

        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },

        body: JSON.stringify({ adminReply: text })

      });

      const data = await res.json();

      if (data.success) {

        setMessages(prev => prev.map(m => m._id === id ? data.data : m));

        setReplyState(prev => ({ ...prev, [id]: { open: false, text: '', loading: false } }));

        notify('success', 'Reply sent successfully', 3000);

      } else {

        notify('error', data.message || 'Failed to send reply');

        setReplyState(prev => ({ ...prev, [id]: { ...prev[id], loading: false } }));

      }

    } catch (_) {

      notify('error', 'Failed to send reply');

      setReplyState(prev => ({ ...prev, [id]: { ...prev[id], loading: false } }));

    }

  };

  // ── Home content helpers ────────────────────────────────────────────────────

  const updateHero     = (field, val) => setHomeContent(p => ({ ...p, hero:      { ...p.hero,      [field]: val } }));

  const updateCTA      = (field, val) => setHomeContent(p => ({ ...p, cta:       { ...p.cta,       [field]: val } }));

  const updateTrusted  = (field, val) => setHomeContent(p => ({ ...p, trustedBy: { ...p.trustedBy, [field]: val } }));

  const updateFeatures = (field, val) => setHomeContent(p => ({ ...p, features:  { ...p.features,  [field]: val } }));

  const updateFeatureCard = (idx, field, val) => {

    const cards = [...(homeContent.features?.cards || [])];

    cards[idx] = { ...cards[idx], [field]: val };

    setHomeContent(p => ({ ...p, features: { ...p.features, cards } }));

  };

  const addFeatureCard    = () => setHomeContent(p => ({ ...p, features: { ...p.features, cards: [...(p.features?.cards || []), { icon: '💡', title: '', description: '' }] } }));

  const removeFeatureCard = (idx) => setHomeContent(p => ({ ...p, features: { ...p.features, cards: (p.features?.cards || []).filter((_, i) => i !== idx) } }));



  const updateCompany = (idx, val) => {

    const companies = [...(homeContent.trustedBy?.companies || [])];

    companies[idx] = val;

    setHomeContent(p => ({ ...p, trustedBy: { ...p.trustedBy, companies } }));

  };

  const addCompany    = () => setHomeContent(p => ({ ...p, trustedBy: { ...p.trustedBy, companies: [...(p.trustedBy?.companies || []), ''] } }));

  const removeCompany = (idx) => setHomeContent(p => ({ ...p, trustedBy: { ...p.trustedBy, companies: (p.trustedBy?.companies || []).filter((_, i) => i !== idx) } }));



  // ── About / Contact helpers ─────────────────────────────────────────────────

  const updateAboutField      = (f, v) => setAboutContent({ ...aboutContent, [f]: v });

  const updateStoryParagraph  = (i, v) => { const p = [...(aboutContent.storyParagraphs || [])]; p[i] = v; setAboutContent({ ...aboutContent, storyParagraphs: p }); };

  const addStoryParagraph     = () => setAboutContent(p => ({ ...p, storyParagraphs: [...(p.storyParagraphs || []), ''] }));

  const removeStoryParagraph  = (idx) => setAboutContent(p => ({ ...p, storyParagraphs: (p.storyParagraphs || []).filter((_, i) => i !== idx) }));



  const updateStat            = (i, f, v) => { const s = [...(aboutContent.stats || [])]; s[i] = { ...s[i], [f]: v }; setAboutContent({ ...aboutContent, stats: s }); };

  const addStat               = () => setAboutContent(p => ({ ...p, stats: [...(p.stats || []), { number: '', label: '' }] }));

  const removeStat            = (idx) => setAboutContent(p => ({ ...p, stats: (p.stats || []).filter((_, i) => i !== idx) }));



  const updateValue           = (i, f, v) => { const a = [...(aboutContent.values || [])]; a[i] = { ...a[i], [f]: v }; setAboutContent({ ...aboutContent, values: a }); };

  const addValue              = () => setAboutContent(p => ({ ...p, values: [...(p.values || []), { icon: '🎯', title: '', description: '' }] }));

  const removeValue           = (idx) => setAboutContent(p => ({ ...p, values: (p.values || []).filter((_, i) => i !== idx) }));



  const updateContactField    = (f, v) => setContactContent({ ...contactContent, [f]: v });

  const updateContactInfo     = (f, v) => setContactContent({ ...contactContent, contactInfo: { ...(contactContent.contactInfo || {}), [f]: v } });

  const updateFAQ             = (i, f, v) => { const q = [...(contactContent.faqs || [])]; q[i] = { ...q[i], [f]: v }; setContactContent({ ...contactContent, faqs: q }); };

  const addFAQ                = () => setContactContent(p => ({ ...p, faqs: [...(p.faqs || []), { question: '', answer: '' }] }));

  const removeFAQ             = (idx) => setContactContent(p => ({ ...p, faqs: (p.faqs || []).filter((_, i) => i !== idx) }));

  // ── Derived ─────────────────────────────────────────────────────────────────

  const pendingUsers   = users.filter(u => !u.isActive && (u.role === 'Teacher' || u.cv));

  const filteredUsers  = users.filter(u => {

    const q = search.toLowerCase();

    return (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))

        && (!roleFilter || u.role?.toLowerCase() === roleFilter);

  });

  const teacherCount = users.filter(u => u.role?.toLowerCase() === 'teacher').length;

  const studentCount = users.filter(u => u.role?.toLowerCase() === 'student').length;

  const tabs = [

    { key: 'users',        label: 'User Management', icon: Users,    badge: pendingUsers.length, badgeColor: 'bg-amber-500' },

    { key: 'financials',   label: 'Financials',      icon: DollarSign, badge: 0, badgeColor: '' },

    { key: 'certificates', label: 'Certificates',    icon: Award,    badge: 0, badgeColor: '' },

    { key: 'home',         label: 'Home Page',       icon: Home,     badge: 0, badgeColor: '' },

    { key: 'logo',         label: 'Logo',            icon: Image,    badge: 0, badgeColor: '' },

    { key: 'about',        label: 'About Page',      icon: FileText, badge: 0, badgeColor: '' },

    { key: 'contact',      label: 'Contact Page',    icon: Mail,     badge: 0, badgeColor: '' },

    { key: 'messages',     label: 'Inbox',           icon: Inbox,    badge: messages.length, badgeColor: 'bg-rose-500' },

  ];

  // ── Common input class ──────────────────────────────────────────────────────

  const inp  = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-sm transition-all";

  const inp3 = `${inp} resize-none`;

  const sectionCard = "bg-white rounded-2xl shadow-sm border border-slate-200 p-6";

  return (

    <div className="min-h-screen bg-slate-50">

      {/* Header */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">

                <LayoutDashboard className="w-5 h-5 text-white" />

              </div>

              <div>

                <h1 className="text-lg font-bold text-slate-900 leading-tight">Admin Dashboard</h1>

                <p className="text-xs text-slate-500">Manage users, content and messages</p>

              </div>

            </div>

            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">

              <Shield className="w-4 h-4 text-slate-600" />

            </div>

          </div>

        </div>

      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Notifications */}

        <div className="space-y-3 mb-6">

          {success && (

            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex justify-between items-center shadow-sm">

              <div className="flex items-center gap-2">

                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />

                <span className="text-sm font-medium">{success}</span>

              </div>

              <button onClick={() => clearNotification('success')} className="text-emerald-600 hover:text-emerald-800 transition p-1"><X className="w-4 h-4" /></button>

            </div>

          )}

          {error && (

            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex justify-between items-center shadow-sm">

              <div className="flex items-center gap-2">

                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />

                <span className="text-sm font-medium">{error}</span>

              </div>

              <button onClick={() => clearNotification('error')} className="text-rose-600 hover:text-rose-800 transition p-1"><X className="w-4 h-4" /></button>

            </div>

          )}

        </div>

        {/* Tab Navigation */}

        <nav className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 p-1.5">

          <div className="flex gap-1 overflow-x-auto">

            {tabs.map(({ key, label, icon: Icon, badge, badgeColor }) => (

              <button key={key} onClick={() => setActiveTab(key)}

                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${

                  activeTab === key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

                }`}>

                <Icon className="w-4 h-4" />

                {label}

                {badge > 0 && (

                  <span className={`${badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none`}>{badge}</span>

                )}

              </button>

            ))}

          </div>

        </nav>

        {/* ════════════════════════════════════════════════════════════════════

            USERS TAB

        ════════════════════════════════════════════════════════════════════ */}

        {activeTab === 'users' && (

          <div className="space-y-6">

            {/* Stats */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {[

                { label: 'Total Users', value: users.length,  icon: Users,        color: 'bg-slate-900', textColor: 'text-slate-900' },

                { label: 'Teachers',    value: teacherCount,  icon: GraduationCap, color: 'bg-teal-600',  textColor: 'text-teal-600' },

                { label: 'Students',    value: studentCount,  icon: Users,         color: 'bg-sky-600',   textColor: 'text-sky-600' },

              ].map(({ label, value, icon: StatIcon, color, textColor }) => (

                <div key={label} className={sectionCard + ' hover:shadow-md transition-shadow'}>

                  <div className="flex items-center justify-between mb-3">

                    <span className="text-sm font-medium text-slate-500">{label}</span>

                    <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>

                      <StatIcon className="w-4 h-4 text-white" />

                    </div>

                  </div>

                  <span className={`text-3xl font-bold ${textColor}`}>{value}</span>

                </div>

              ))}

            </div>

            {/* Pending approvals */}

            {pendingUsers.length > 0 && (

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/50 flex items-center gap-3">

                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div>

                  <h3 className="text-base font-bold text-slate-900">Pending Approvals</h3>

                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingUsers.length}</span>

                </div>

                <div className="overflow-x-auto">

                  <table className="w-full text-left">

                    <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">

                      <th className="px-6 py-3 font-semibold">Date</th>

                      <th className="px-6 py-3 font-semibold">Name</th>

                      <th className="px-6 py-3 font-semibold">Email</th>

                      <th className="px-6 py-3 font-semibold">Role</th>

                      <th className="px-6 py-3 font-semibold">CV</th>

                      <th className="px-6 py-3 font-semibold text-right">Actions</th>

                    </tr></thead>

                    <tbody className="divide-y divide-slate-100">

                      {pendingUsers.map(u => (

                        <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">

                          <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>

                          <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>

                          <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>

                          <td className="px-6 py-4"><span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold"><GraduationCap className="w-3 h-3" />{u.role}</span></td>

                          <td className="px-6 py-4">{u.cv ? <a href={`${API}/${u.cv}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-sm font-medium"><Eye className="w-3.5 h-3.5" />View CV</a> : <span className="text-slate-400 text-sm">None</span>}</td>

                          <td className="px-6 py-4 text-right">

                            <div className="flex items-center justify-end gap-2">

                              <button onClick={() => handleUserAction(u._id, 'approve')} className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"><CheckCircle className="w-3.5 h-3.5" />Approve</button>

                              <button onClick={() => handleUserAction(u._id, 'reject')}  className="inline-flex items-center gap-1.5 text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"><XCircle className="w-3.5 h-3.5" />Reject</button>

                            </div>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

            {/* All users + invite */}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">

                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">

                  {[{ k: 'list', label: 'All Users' }, { k: 'create', label: 'Invite Teacher', icon: UserPlus }].map(({ k, label, icon: I }) => (

                    <button key={k} onClick={() => setUserSubTab(k)}

                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${userSubTab === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                      {I && <I className="w-3.5 h-3.5" />}{label}

                    </button>

                  ))}

                </div>

                {userSubTab === 'list' && (

                  <div className="flex gap-3 sm:ml-auto flex-wrap items-center">

                    <div className="relative">

                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                      <input type="text" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)}

                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 w-56 transition-all bg-white" />

                    </div>

                    <div className="relative">

                      <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}

                        className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 bg-white transition-all cursor-pointer">

                        <option value="">All roles</option>

                        <option value="teacher">Teacher</option>

                        <option value="student">Student</option>

                      </select>

                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />

                    </div>

                    <button onClick={fetchUsers} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100">

                      <RefreshCw className="w-3.5 h-3.5" />Refresh

                    </button>

                  </div>

                )}

              </div>

              {userSubTab === 'list' && (

                usersLoading ? (

                  <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-slate-500">Loading users...</p></div>

                ) : filteredUsers.length === 0 ? (

                  <div className="p-12 text-center"><div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-7 h-7 text-slate-400" /></div><p className="text-sm text-slate-500">No users found.</p></div>

                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full text-left">

                      <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">

                        <th className="px-6 py-3 font-semibold">Joined</th>

                        <th className="px-6 py-3 font-semibold">Name</th>

                        <th className="px-6 py-3 font-semibold">Email</th>

                        <th className="px-6 py-3 font-semibold">Role</th>

                        <th className="px-6 py-3 font-semibold">Status</th>

                        <th className="px-6 py-3 font-semibold text-right">Actions</th>

                      </tr></thead>

                      <tbody className="divide-y divide-slate-100">

                        {filteredUsers.map(u => (

                          <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">

                            <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>

                            <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>

                            <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>

                            <td className="px-6 py-4">

                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${u.role === 'admin' ? 'bg-rose-50 text-rose-700' : u.role?.toLowerCase() === 'teacher' ? 'bg-teal-50 text-teal-700' : 'bg-sky-50 text-sky-700'}`}>

                                {u.role?.toLowerCase() === 'teacher' && <GraduationCap className="w-3 h-3" />}

                                {u.role === 'admin' && <Shield className="w-3 h-3" />}

                                {u.role}

                              </span>

                            </td>

                            <td className="px-6 py-4">

                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>

                                <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                                {u.isActive ? 'Active' : 'Pending'}

                              </span>

                            </td>

                            <td className="px-6 py-4 text-right">

                              {u.role !== 'admin' && (

                                <button onClick={() => handleToggleStatus(u._id, u.isActive)}

                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${u.isActive ? 'text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50' : 'text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50'}`}>

                                  {u.isActive ? <><ToggleRight className="w-3.5 h-3.5" />Deactivate</> : <><ToggleLeft className="w-3.5 h-3.5" />Activate</>}

                                </button>

                              )}

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )

              )}

              {userSubTab === 'create' && (

                <div className="p-6 max-w-xl">

                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6 flex gap-3">

                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0"><Info className="w-4 h-4 text-sky-600" /></div>

                    <div>

                      <p className="font-semibold text-sky-800 text-sm mb-1">How it works</p>

                      <ol className="text-sky-700 text-sm space-y-1 list-decimal list-inside">

                        <li>Enter the teacher's name and email below</li>

                        <li>They'll receive an invite email with a secure link</li>

                        <li>They click the link and create their own password</li>

                        <li>Their account activates automatically</li>

                      </ol>

                    </div>

                  </div>

                  <div className="space-y-5">

                    <div>

                      <label className="block text-sm font-medium text-slate-700 mb-2">Full name <span className="text-rose-500">*</span></label>

                      <input type="text" placeholder="e.g. Sarah Ahmed" value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} className={inp} />

                    </div>

                    <div>

                      <label className="block text-sm font-medium text-slate-700 mb-2">Email address <span className="text-rose-500">*</span></label>

                      <input type="email" placeholder="teacher@school.com" value={teacherForm.email} onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })} className={inp} />

                      <p className="text-xs text-slate-400 mt-1.5">The invite link will be sent to this address. It expires in 48 hours.</p>

                    </div>

                  </div>

                  <div className="flex gap-3 mt-8">

                    <button onClick={() => setTeacherForm({ name: '', email: '' })} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Clear</button>

                    <button onClick={handleInviteTeacher} disabled={createLoading}

                      className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 text-sm flex items-center gap-2">

                      {createLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending Invite...</> : <><Send className="w-4 h-4" />Send Invite Email</>}

                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

        )}

        {/* ════════════════════════════════════════════════════════════════════

            CERTIFICATES TAB

        ════════════════════════════════════════════════════════════════════ */}

        {activeTab === 'certificates' && <CertificateTab />}

        {/* ════════════════════════════════════════════════════════════════════

            FINANCIALS TAB

        ════════════════════════════════════════════════════════════════════ */}

        {activeTab === 'financials' && (

          <div className="space-y-6">

            {/* Financial summary metrics */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {[

                { label: 'Gross Course Tuition Sales', value: `$${financialStats.totalSales?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'bg-slate-900', textColor: 'text-slate-900' },

                { label: 'University Commision Collected (20%)', value: `$${financialStats.totalFees?.toFixed(2) || '0.00'}`, icon: Landmark, color: 'bg-emerald-600', textColor: 'text-emerald-600' },

                { label: 'Total Instructor Earnings (80%)', value: `$${financialStats.totalTeacherEarnings?.toFixed(2) || '0.00'}`, icon: GraduationCap, color: 'bg-sky-600', textColor: 'text-sky-600' },

              ].map(({ label, value, icon: StatIcon, color, textColor }) => (

                <div key={label} className={sectionCard + ' hover:shadow-md transition-all duration-200'}>

                  <div className="flex items-center justify-between mb-3">

                    <span className="text-sm font-medium text-slate-500">{label}</span>

                    <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>

                      <StatIcon className="w-4 h-4 text-white" />

                    </div>

                  </div>

                  <span className={`text-3xl font-bold ${textColor}`}>{value}</span>

                </div>

              ))}

            </div>

            {/* Transactions Table Ledger */}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">

                <div className="flex items-center gap-3">

                  <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">

                    <DollarSign className="w-4 h-4 text-white" />

                  </div>

                  <div>

                    <h3 className="text-base font-bold text-slate-900 leading-none">Tuition Receipt Ledger</h3>

                    <p className="text-[10px] text-slate-400 font-medium mt-1">Split distribution record database</p>

                  </div>

                  <span className="bg-slate-200 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-full ml-2">

                    {transactions.length} records

                  </span>

                </div>

                <button 

                  onClick={fetchFinancials}

                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-all"

                >

                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Reports

                </button>

              </div>

              {financialsLoading ? (

                <div className="p-12 text-center">

                  <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" />

                  <p className="text-sm text-slate-500 font-medium">Reconciling ledger ledger...</p>

                </div>

              ) : transactions.length === 0 ? (

                <div className="p-12 text-center">

                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">

                    <DollarSign className="w-7 h-7 text-slate-400" />

                  </div>

                  <p className="text-sm font-semibold text-slate-600">No Premium sales ledger</p>

                  <p className="text-xs text-slate-400 mt-1">Once premium tuition invoices are processed, statements will display here.</p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full text-left">

                    <thead>

                      <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">

                        <th className="px-6 py-3">Date</th>

                        <th className="px-6 py-3">Student</th>

                        <th className="px-6 py-3">Course</th>

                        <th className="px-6 py-3">Teacher</th>

                        <th className="px-6 py-3">Price Paid</th>

                        <th className="px-6 py-3">Admin Split (20%)</th>

                        <th className="px-6 py-3">Teacher Split (80%)</th>

                        <th className="px-6 py-3">Method</th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {transactions.map((tx) => (

                        <tr key={tx._id} className="hover:bg-slate-50/30 transition-colors">

                          <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">

                            {new Date(tx.createdAt).toLocaleDateString()}

                          </td>

                          <td className="px-6 py-4">

                            <div className="text-sm font-semibold text-slate-900">{tx.student?.name || 'Student'}</div>

                            <div className="text-xs text-slate-400 font-medium">{tx.student?.email}</div>

                          </td>

                          <td className="px-6 py-4 font-semibold text-sm text-slate-800">

                            {tx.course?.title || 'Deleted Course'}

                          </td>

                          <td className="px-6 py-4">

                            <div className="text-sm font-medium text-slate-800">{tx.teacher?.name || 'Instructor'}</div>

                            <div className="text-xs text-slate-400">{tx.teacher?.email}</div>

                          </td>

                          <td className="px-6 py-4 text-sm font-extrabold text-slate-900">

                            ${tx.amount?.toFixed(2)}

                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-emerald-600">

                            +${tx.adminFee?.toFixed(2)}

                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-slate-700">

                            ${tx.teacherEarnings?.toFixed(2)}

                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">

                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${

                              tx.paymentMethod === 'stripe' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'

                            }`}>

                              {tx.paymentMethod}

                            </span>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

        )}

        {/* ════════════════════════════════════════════════════════════════════

            LOGO TAB

        ════════════════════════════════════════════════════════════════════ */}

        {activeTab === 'logo' && (

          <div className="max-w-lg space-y-6">

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">

                <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center"><Image className="w-3.5 h-3.5 text-slate-600" /></div>

                Site Logo

              </h3>

              <p className="text-xs text-slate-400 mb-5">Upload a PNG, JPG, SVG or WebP image (max 2 MB). This logo appears on the Home page.</p>

              {/* Preview area */}

              <div

                onClick={() => logoInputRef.current?.click()}

                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition mb-5 min-h-[160px]"

              >

                {logoPreview ? (

                  <img src={logoPreview} alt="Logo preview" className="max-h-24 max-w-full object-contain" />

                ) : (

                  <>

                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">

                      <Upload className="w-6 h-6 text-slate-400" />

                    </div>

                    <p className="text-sm font-medium text-slate-600">Click to select a logo</p>

                    <p className="text-xs text-slate-400 mt-1">PNG · JPG · SVG · WebP</p>

                  </>

                )}

              </div>

              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoSelect} />

              {/* Info row */}

             {logoUrl && !logoFile && (

  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-emerald-700 text-sm">

    <CheckCircle className="w-4 h-4 flex-shrink-0" />

    Logo is live on Cloudinary ✓

  </div>

)}

              {logoFile && (

                <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sky-700 text-sm">

                  <Info className="w-4 h-4 flex-shrink-0" />

                  New file selected: <span className="font-semibold ml-1">{logoFile.name}</span>. Click Upload to save.

                </div>

              )}

              <div className="flex gap-3">

                <button onClick={handleLogoUpload} disabled={!logoFile || logoLoading}

                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition disabled:opacity-40 text-sm flex items-center justify-center gap-2">

                  {logoLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload Logo</>}

                </button>

                {logoUrl  && (

                  <button onClick={handleLogoRemove} disabled={logoLoading}

                    className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl font-semibold text-sm transition disabled:opacity-40">

                    Remove

                  </button>

                )}

              </div>

            </div>

          </div>

        )}

        {/* ════════════════════════════════════════════════════════════════════

            HOME PAGE TAB

        ════════════════════════════════════════════════════════════════════ */}

        {activeTab === 'home' && (

          <div className="space-y-6">

            {/* Hero section */}

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">

                <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center"><Home className="w-3.5 h-3.5 text-slate-600" /></div>

                Hero Section

              </h3>

              <div className="grid md:grid-cols-2 gap-4">

                {[

                  { label: 'Badge Label (e.g. "New")', key: 'badgeLabel' },

                  { label: 'Badge Text',              key: 'badgeText' },

                  { label: 'Title Line 1',            key: 'titleLine1' },

                  { label: 'Title Line 2',            key: 'titleLine2' },

                  { label: 'Primary Button Text',     key: 'primaryBtn' },

                  { label: 'Secondary Button Text',   key: 'secondaryBtn' },

                  { label: 'Rating Display',          key: 'rating' },

                  { label: 'Review Count Text',       key: 'reviewCount' },

                ].map(({ label, key }) => (

                  <div key={key}>

                    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

                    <input type="text" value={homeContent.hero[key]} onChange={e => updateHero(key, e.target.value)} className={inp} />

                  </div>

                ))}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>

                  <textarea value={homeContent.hero.description} onChange={e => updateHero('description', e.target.value)} rows={3} className={inp3} />

                </div>

              </div>

            </div>

            {/* Trusted By */}

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Trusted By Section</h3>

              <div className="mb-4">

                <label className="block text-sm font-medium text-slate-700 mb-2">Section Title</label>

                <input type="text" value={homeContent.trustedBy.title} onChange={e => updateTrusted('title', e.target.value)} className={inp} />

              </div>

              <label className="block text-sm font-medium text-slate-700 mb-3">Company / Brand Names</label>

              <div className="space-y-2">

                {homeContent.trustedBy.companies.map((name, i) => (

                  <div key={i} className="flex items-center gap-2">

                    <input type="text" value={name} onChange={e => updateCompany(i, e.target.value)}

                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" />

                    <button onClick={() => removeCompany(i)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition">

                      <X className="w-4 h-4" />

                    </button>

                  </div>

                ))}

              </div>

              <button onClick={addCompany} className="mt-3 text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition">

                + Add Company

              </button>

            </div>

            {/* Features */}

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Features Section</h3>

              <div className="space-y-4 mb-6">

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">Section Title</label>

                  <input type="text" value={homeContent.features.title} onChange={e => updateFeatures('title', e.target.value)} className={inp} />

                </div>

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">Section Description</label>

                  <textarea value={homeContent.features.description} onChange={e => updateFeatures('description', e.target.value)} rows={2} className={inp3} />

                </div>

              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">

                {(homeContent.features?.cards || []).map((card, i) => (

                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 relative group">

                    <div className="flex justify-between items-center">

                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Card {i + 1}</p>

                      <button onClick={() => removeFeatureCard(i)} className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition">

                        <X className="w-4 h-4" />

                      </button>

                    </div>

                    <div>

                      <label className="block text-xs font-medium text-slate-600 mb-1">Icon (emoji)</label>

                      <input type="text" value={card.icon || ''} onChange={e => updateFeatureCard(i, 'icon', e.target.value)}

                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" />

                    </div>

                    <div>

                      <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>

                      <input type="text" value={card.title || ''} onChange={e => updateFeatureCard(i, 'title', e.target.value)}

                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all" />

                    </div>

                    <div>

                      <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>

                      <textarea value={card.description || ''} onChange={e => updateFeatureCard(i, 'description', e.target.value)} rows={3}

                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none" />

                    </div>

                  </div>

                ))}

              </div>

              <button onClick={addFeatureCard} className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition">

                + Add Feature Card

              </button>

            </div>

            {/* CTA */}

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Call-to-Action Section</h3>

              <div className="space-y-4">

                {[

                  { label: 'Title',       key: 'title' },

                  { label: 'Description', key: 'description' },

                  { label: 'Button Text', key: 'buttonText' },

                ].map(({ label, key }) => (

                  <div key={key}>

                    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

                    <input type="text" value={homeContent.cta[key]} onChange={e => updateCTA(key, e.target.value)} className={inp} />

                  </div>

                ))}

              </div>

            </div>

          </div>

        )}

        {/* ════════════════════════════════════════════════════════════════════

            ABOUT TAB

        ════════════════════════════════════════════════════════════════════ */}

        {activeTab === 'about' && (

          <div className="space-y-6">

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-slate-600" /></div>Hero Section</h3>

              <div className="space-y-4">

                <div><label className="block text-sm font-medium text-slate-700 mb-2">Title</label><input type="text" value={aboutContent.heroTitle} onChange={e => updateAboutField('heroTitle', e.target.value)} className={inp} /></div>

                <div><label className="block text-sm font-medium text-slate-700 mb-2">Description</label><textarea value={aboutContent.heroDescription} onChange={e => updateAboutField('heroDescription', e.target.value)} rows={3} className={inp3} /></div>

              </div>

            </div>

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Statistics</h3>

              <div className="grid md:grid-cols-2 gap-4 mb-4">

                {(aboutContent.stats || []).map((stat, i) => (

                  <div key={i} className="border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3 relative group">

                    <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Number</label><input type="text" value={stat.number || ''} onChange={e => updateStat(i, 'number', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 transition-all" /></div>

                    <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Label</label><input type="text" value={stat.label || ''} onChange={e => updateStat(i, 'label', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 transition-all" /></div>

                    <button onClick={() => removeStat(i)} className="col-span-2 text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 justify-end font-medium">

                      <X className="w-3.5 h-3.5" /> Remove Stat

                    </button>

                  </div>

                ))}

              </div>

              <button onClick={addStat} className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition">

                + Add Stat

              </button>

            </div>



            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Our Story</h3>

              <div className="space-y-4 mb-4">

                <div><label className="block text-sm font-medium text-slate-700 mb-2">Story Title</label><input type="text" value={aboutContent.storyTitle || ''} onChange={e => updateAboutField('storyTitle', e.target.value)} className={inp} /></div>

                {(aboutContent.storyParagraphs || []).map((p, i) => (

                  <div key={i} className="space-y-1">

                    <div className="flex justify-between items-center">

                      <label className="block text-sm font-medium text-slate-700">Paragraph {i + 1}</label>

                      <button onClick={() => removeStoryParagraph(i)} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium">

                        <X className="w-3.5 h-3.5" /> Remove

                      </button>

                    </div>

                    <textarea value={p || ''} onChange={e => updateStoryParagraph(i, e.target.value)} rows={3} className={inp3} />

                  </div>

                ))}

              </div>

              <button onClick={addStoryParagraph} className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition">

                + Add Paragraph

              </button>

            </div>



            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Core Values</h3>

              <div className="grid md:grid-cols-2 gap-4 mb-4">

                {(aboutContent.values || []).map((v, i) => (

                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 relative group">

                    <div className="flex justify-between items-center">

                      <span className="text-xs font-bold text-slate-400">Value {i + 1}</span>

                      <button onClick={() => removeValue(i)} className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition">

                        <X className="w-4 h-4" />

                      </button>

                    </div>

                    <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Icon (emoji)</label><input type="text" value={v.icon || ''} onChange={e => updateValue(i, 'icon', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 transition-all" /></div>

                    <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Title</label><input type="text" value={v.title || ''} onChange={e => updateValue(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 transition-all" /></div>

                    <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label><textarea value={v.description || ''} onChange={e => updateValue(i, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 transition-all resize-none" /></div>

                  </div>

                ))}

              </div>

              <button onClick={addValue} className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition">

                + Add Core Value

              </button>

            </div>

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Mission Section</h3>

              <div className="space-y-4">

                <div><label className="block text-sm font-medium text-slate-700 mb-2">Mission Title</label><input type="text" value={aboutContent.missionTitle} onChange={e => updateAboutField('missionTitle', e.target.value)} className={inp} /></div>

                <div><label className="block text-sm font-medium text-slate-700 mb-2">Mission Description</label><textarea value={aboutContent.missionDescription} onChange={e => updateAboutField('missionDescription', e.target.value)} rows={4} className={inp3} /></div>

              </div>

            </div>

          </div>

        )}

        {/* ════════════════════════════════════════════════════════════════════

            CONTACT TAB

        ════════════════════════════════════════════════════════════════════ */}

        {activeTab === 'contact' && (

          <div className="space-y-6">

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-slate-600" /></div>Hero Section</h3>

              <div className="space-y-4">

                <div><label className="block text-sm font-medium text-slate-700 mb-2">Title</label><input type="text" value={contactContent.heroTitle} onChange={e => updateContactField('heroTitle', e.target.value)} className={inp} /></div>

                <div><label className="block text-sm font-medium text-slate-700 mb-2">Description</label><textarea value={contactContent.heroDescription} onChange={e => updateContactField('heroDescription', e.target.value)} rows={3} className={inp3} /></div>

              </div>

            </div>

            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Contact Information</h3>

              <div className="grid md:grid-cols-2 gap-4">

                {[{ label: 'Email 1', key: 'email1' }, { label: 'Email 2', key: 'email2' }, { label: 'Phone', key: 'phone' }, { label: 'Phone Hours', key: 'phoneHours' }, { label: 'Address Line 1', key: 'address1' }, { label: 'Address Line 2', key: 'address2' }, { label: 'Live Chat Availability', key: 'liveChatAvailability' }].map(({ label, key }) => (

                  <div key={key}>

                    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

                    <input type="text" value={contactContent.contactInfo?.[key] || ''} onChange={e => updateContactInfo(key, e.target.value)} className={inp} />

                  </div>

                ))}

              </div>

            </div>



            <div className={sectionCard}>

              <h3 className="text-base font-bold text-slate-900 mb-4">Frequently Asked Questions (FAQs)</h3>

              <div className="space-y-4 mb-4">

                {(contactContent.faqs || []).map((faq, i) => (

                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 relative group">

                    <div className="flex justify-between items-center">

                      <span className="text-xs font-bold text-slate-400">FAQ #{i + 1}</span>

                      <button onClick={() => removeFAQ(i)} className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition">

                        <X className="w-4 h-4" />

                      </button>

                    </div>

                    <div>

                      <label className="block text-xs font-medium text-slate-600 mb-1">Question</label>

                      <input type="text" value={faq.question || ''} onChange={e => updateFAQ(i, 'question', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 transition-all" />

                    </div>

                    <div>

                      <label className="block text-xs font-medium text-slate-600 mb-1">Answer</label>

                      <textarea value={faq.answer || ''} onChange={e => updateFAQ(i, 'answer', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 transition-all resize-none" />

                    </div>

                  </div>

                ))}

              </div>

              <button onClick={addFAQ} className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition">

                + Add FAQ

              </button>

            </div>

          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Received Messages</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{messages.length} total messages</p>
                </div>
                <button onClick={fetchMessages} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100">
                  <RefreshCw className="w-3.5 h-3.5" />Refresh
                </button>
              </div>
              {messagesLoading ? (

                <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-slate-500">Loading messages...</p></div>

              ) : messages.length === 0 ? (

                <div className="p-12 text-center"><div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Inbox className="w-7 h-7 text-slate-400" /></div><p className="text-sm text-slate-500">No messages found.</p></div>

              ) : (

                <div className="divide-y divide-slate-100">

                  {messages.map(msg => (

                    <div key={msg._id} className="px-6 py-5 hover:bg-slate-50/50 transition-colors group">

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center gap-3 mb-1">

                            <span className="font-semibold text-slate-900 text-sm">{msg.name}</span>

                            <span className="text-xs text-slate-400">{msg.email}</span>

                            {msg.status === 'replied' && (

                              <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">✓ Replied</span>

                            )}

                            <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{new Date(msg.createdAt).toLocaleDateString()}</span>

                          </div>

                          <p className="text-sm font-medium text-slate-700 mb-1">{msg.subject || 'No Subject'}</p>

                          <p className="text-sm text-slate-500 line-clamp-2">{msg.message}</p>

                          {msg.adminReply && (

                            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">

                              <p className="text-xs font-semibold text-blue-700 mb-1">Your reply:</p>

                              <p className="text-sm text-blue-800">{msg.adminReply}</p>

                            </div>

                          )}

                          {replyState[msg._id]?.open && (

                            <div className="mt-3 space-y-2">

                              <textarea

                                rows={3}

                                value={replyState[msg._id]?.text || ''}

                                onChange={e => setReplyState(prev => ({ ...prev, [msg._id]: { ...prev[msg._id], text: e.target.value } }))}

                                placeholder="Type your reply..."

                                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"

                              />

                              <div className="flex gap-2">

                                <button

                                  onClick={() => sendReply(msg._id)}

                                  disabled={replyState[msg._id]?.loading}

                                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60"

                                >

                                  <Send className="w-3 h-3" />{replyState[msg._id]?.loading ? 'Sending...' : 'Send Reply'}

                                </button>

                                <button

                                  onClick={() => toggleReply(msg._id)}

                                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"

                                >

                                  <X className="w-3 h-3" />Cancel

                                </button>

                              </div>

                            </div>

                          )}

                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">

                          <button onClick={() => toggleReply(msg._id)}

                            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"

                          >

                            <Send className="w-3.5 h-3.5" />{replyState[msg._id]?.open ? 'Cancel' : 'Reply'}

                          </button>

                          <button onClick={() => deleteMessage(msg._id)}

                            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"

                          >

                            <Trash2 className="w-3.5 h-3.5" />Delete

                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

        )}

        {/* ── Sticky Save Button (About / Contact / Home) ────────────────── */}

        {(activeTab === 'about' || activeTab === 'contact' || activeTab === 'home') && (

          <div className="sticky bottom-6 mt-6 bg-white rounded-2xl shadow-lg border border-slate-200 p-4">

            <div className="flex justify-between items-center">

              <div className="flex items-center gap-2 text-sm text-slate-500">

                <Info className="w-4 h-4" />

                Save your changes before leaving this page

              </div>

              <button onClick={handleSave} disabled={loading}

                className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 text-sm">

                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}

              </button>

            </div>

          </div>

        )}

      </div>

    </div>

  );

};

export default Dashboard;