import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Keep name/email in sync when user logs in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));
    }
  }, [user]);

  // Dynamic contact content from backend
  const [contactContent, setContactContent] = useState({
    heroTitle: 'Get in Touch',
    heroDescription: 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
    contactInfo: {
      email1: 'support@learning.com',
      email2: 'info@learning.com',
      phone: '+1 (555) 123-4567',
      phoneHours: 'Mon-Fri, 9AM-6PM EST',
      address1: '123 Learning Street',
      address2: 'Education City, EC 12345',
      liveChatAvailability: 'Available 24/7'
    },
    faqs: [
      { question: 'How do I enroll in a course?', answer: 'Simply browse our courses, select one you like, and click "Enroll Now". You\'ll be guided through the registration process.' },
      { question: 'Can I get a refund?', answer: 'Yes! We offer a 30-day money-back guarantee for all our courses. No questions asked.' },
      { question: 'Do you offer certificates?', answer: 'Yes, you\'ll receive a certificate of completion for each course you finish successfully.' },
      { question: 'How long do I have access?', answer: 'Once enrolled, you have lifetime access to the course materials and all future updates.' }
    ]
  });

  useEffect(() => {
    const fetchContactContent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/pages/contact`);
        const data = await response.json();
        if (data.success) setContactContent(data.data);
      } catch (err) {
        console.error('Failed to fetch contact content:', err);
      }
    };
    fetchContactContent();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      // Always use the account email — never the editable field — to ensure inbox lookup works
      const payload = { ...formData, email: user.email };
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/contact/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
        setTimeout(() => setSubmitted(false), 6000);
      } else {
        setError(data.message || 'Failed to send message.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">{contactContent.heroTitle}</h1>
          <p className="text-orange-100 text-lg max-w-2xl mx-auto">
            {contactContent.heroDescription}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12">

          {/* Contact Form / Login Gate */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>

            {!user ? (
              /* ── Not logged in ── */
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-2xl mb-5">
                  <span className="text-4xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  You need to be logged in as a student to send a message to the admin.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-pink-600 transition shadow-lg"
                >
                  Login to Continue →
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  Don't have an account?{' '}
                  <button onClick={() => navigate('/register')} className="text-orange-500 font-semibold hover:underline">
                    Register here
                  </button>
                </p>
              </div>
            ) : (
              /* ── Logged in ── */
              <>
                {submitted && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
                    <p className="font-semibold">✅ Message sent successfully!</p>
                    <p className="text-sm mt-1">
                      Check your <strong>Inbox</strong> in the{' '}
                      <button onClick={() => navigate('/student/dashboard')} className="underline font-semibold">
                        Student Dashboard
                      </button>{' '}
                      to see the admin's reply.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-xs text-gray-400 font-normal ml-1">🔒 account email</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={user.email}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="How can we help?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="Tell us more about your inquiry..."
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white py-4 rounded-lg font-semibold transition shadow-lg ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600'
                    }`}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <p className="text-gray-600 mb-8">
                We're here to help and answer any questions you might have. We look forward to hearing from you!
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-6 bg-orange-50 rounded-xl hover:bg-orange-100 transition">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">{contactContent.contactInfo.email1}</p>
                  <p className="text-gray-600">{contactContent.contactInfo.email2}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📞</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Phone</h3>
                  <p className="text-gray-600">{contactContent.contactInfo.phone}</p>
                  <p className="text-gray-600">{contactContent.contactInfo.phoneHours}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Office</h3>
                  <p className="text-gray-600">{contactContent.contactInfo.address1}</p>
                  <p className="text-gray-600">{contactContent.contactInfo.address2}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-green-50 rounded-xl hover:bg-green-100 transition">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Live Chat</h3>
                  <p className="text-gray-600">{contactContent.contactInfo.liveChatAvailability}</p>
                  <button className="text-green-600 hover:text-green-700 font-semibold mt-1">Start Chat →</button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition"><span className="text-xl">𝕏</span></a>
                <a href="#" className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition"><span className="text-xl">f</span></a>
                <a href="#" className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white hover:bg-blue-600 transition"><span className="text-xl">in</span></a>
                <a href="#" className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition"><span className="text-xl">IG</span></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-lg">Quick answers to common questions</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {contactContent.faqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
