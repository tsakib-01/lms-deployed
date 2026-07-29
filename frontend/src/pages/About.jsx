import { useState, useEffect } from "react";

const About = () => {
  // Dynamic about content from backend
  const [aboutContent, setAboutContent] = useState({
    heroTitle: 'About Learning Platform',
    heroDescription: 'Empowering learners worldwide with high-quality, accessible education. We\'re on a mission to make learning engaging, effective, and available to everyone.',
    storyTitle: 'Our Story',
    storyParagraphs: [
      'Founded in 2020, Learning Platform was born from a simple idea: education should be accessible, engaging, and effective for everyone, regardless of their background or location.',
      'What started as a small team of passionate educators and developers has grown into a thriving community of learners and instructors from around the world.',
      'Today, we\'re proud to offer hundreds of courses across diverse subjects, helping thousands of students achieve their learning goals and advance their careers.',
      'Our commitment remains the same: to provide the highest quality educational content and the best learning experience possible.'
    ],
    missionTitle: 'Our Mission',
    missionDescription: 'To democratize education by providing world-class learning experiences that are accessible, affordable, and adaptable to every learner\'s needs. We believe that everyone deserves the opportunity to learn, grow, and achieve their full potential.',
    stats: [
      { number: '10K+', label: 'Active Students' },
      { number: '500+', label: 'Courses Available' },
      { number: '50+', label: 'Expert Instructors' },
      { number: '95%', label: 'Satisfaction Rate' }
    ],
    values: [
      { icon: '🎯', title: 'Excellence', description: 'We strive for excellence in everything we do, from course content to student support.' },
      { icon: '🤝', title: 'Community', description: 'Building a supportive learning community where everyone can thrive together.' },
      { icon: '💡', title: 'Innovation', description: 'Constantly evolving our platform with the latest educational technologies.' },
      { icon: '🌍', title: 'Accessibility', description: 'Making quality education accessible to learners worldwide.' }
    ]
  });

  // Static team data (not editable from dashboard)
  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: "https://via.placeholder.com/200",
      description: "10+ years in education technology"
    },
    {
      name: "Michael Chen",
      role: "Chief Technology Officer",
      image: "https://via.placeholder.com/200",
      description: "Former Google engineer"
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Content",
      image: "https://via.placeholder.com/200",
      description: "PhD in Educational Psychology"
    },
    {
      name: "David Kim",
      role: "Lead Instructor",
      image: "https://via.placeholder.com/200",
      description: "Award-winning educator"
    }
  ];

  // Fetch about page content on mount
  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content/pages/about`);
        const data = await response.json();
        
        if (data.success) {
          setAboutContent(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch about content:', err);
      }
    };

    fetchAboutContent();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">{aboutContent.heroTitle}</h1>
          <p className="text-orange-100 text-lg max-w-3xl mx-auto">
            {aboutContent.heroDescription}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {aboutContent.stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">{aboutContent.storyTitle}</h2>
            <div className="space-y-4 text-gray-600">
              {aboutContent.storyParagraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎓</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Learning Made Simple</h3>
                <p className="text-gray-600">Join our community today</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              These principles guide everything we do and shape the learning experience we provide
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aboutContent.values.map((value, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition text-center">
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Dedicated professionals committed to your learning success
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, idx) => (
            <div key={idx} className="text-center group">
              <div className="mb-4 relative overflow-hidden rounded-2xl">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover transition transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
              <p className="text-orange-600 font-medium mb-2">{member.role}</p>
              <p className="text-gray-600 text-sm">{member.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-gradient-to-r from-orange-500 to-pink-500 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">{aboutContent.missionTitle}</h2>
          <p className="text-orange-100 text-xl leading-relaxed">
            {aboutContent.missionDescription}
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Start Learning?</h2>
        <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of learners already transforming their careers and lives through our platform
        </p>
        <div className="flex justify-center space-x-4">
          <button className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition shadow-lg">
            Browse Courses
          </button>
          <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-gray-400 transition">
            Contact Us
          </button>
        </div>
      </section>
    </div>
  );
};

export default About;