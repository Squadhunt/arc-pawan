import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Calendar,
  BarChart3, 
  Crown,
  BookOpen,
  Target,
  Zap,
  Shield,
  Award,
  Users,
  Bell,
  Gamepad2,
  Mic,
  Trophy,
  Star,
  Camera,
  Headphones,
  Monitor,
  Rocket,
  Sparkles,
  CheckCircle,
  Clock,
  X,
  Send,
  GraduationCap,
  TrendingUp,
  Briefcase,
  UserCheck,
  PlayCircle,
  BookMarked,
  Lightbulb,
  Target as TargetIcon,
  Globe,
  DollarSign
} from 'lucide-react';
import config from '../config/config';

const ComingSoon: React.FC = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [mouseEnd, setMouseEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const mainFeatures = [
    {
      icon: Brain,
      title: "AI Coach Integration",
      description: "Personal AI coach that analyzes your gameplay, provides real-time feedback, and creates personalized training plans to improve your skills.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
      keyFeatures: [
        "AI-powered gameplay analysis",
        "Real-time performance feedback", 
        "Personalized training plans",
        "Skill progression tracking"
      ]
    },
    {
      icon: Calendar,
      title: "Smart Training Centre",
      description: "Teams can create training schedules, notify players, and get exclusive AI trainer guidance for practice sessions and skill development.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
      keyFeatures: [
        "Automated training schedules",
        "Player notification system",
        "AI trainer guidance",
        "Team performance analytics"
      ]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive performance tracking, skill progression analysis, and detailed statistics for every game you play.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      iconColor: "text-green-400",
      keyFeatures: [
        "Detailed performance metrics",
        "Skill progression charts",
        "Comparative analysis",
        "Historical data tracking"
      ]
    },
    {
      icon: Crown,
      title: "Creator Economy",
      description: "Monetization tools for content creators, exclusive challenges, custom tournaments, and community rewards system.",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      iconColor: "text-yellow-400",
      keyFeatures: [
        "Revenue sharing system",
        "Exclusive creator challenges",
        "Custom tournament creation",
        "Community rewards program"
      ]
    },
    {
      icon: BookOpen,
      title: "Gaming News Hub",
      description: "Real-time esports news, tournament updates, industry insights, and community highlights all in one place.",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      iconColor: "text-red-400",
      keyFeatures: [
        "Real-time news updates",
        "Tournament coverage",
        "Industry insights",
        "Community highlights"
      ]
    },
    {
      icon: Target,
      title: "Smart Challenges",
      description: "AI-generated personalized challenges, community-created content, and skill-based progression systems.",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
      iconColor: "text-indigo-400",
      keyFeatures: [
        "AI-generated challenges",
        "Community-created content",
        "Skill-based progression",
        "Dynamic difficulty adjustment"
      ]
    }
  ];

  const careerBuildingFeatures = [
    {
      icon: GraduationCap,
      title: "Professional Gaming Education",
      description: "Comprehensive courses and tutorials to master the fundamentals of professional gaming.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
      subsections: [
        "Game-specific strategies and tactics",
        "Mental preparation and focus techniques",
        "Physical health for gamers",
        "Team communication and leadership"
      ]
    },
    {
      icon: TrendingUp,
      title: "Career Path Guidance",
      description: "Step-by-step roadmap to build your professional gaming career from amateur to pro.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      iconColor: "text-green-400",
      subsections: [
        "Skill assessment and improvement plans",
        "Tournament participation strategies",
        "Building your gaming portfolio",
        "Networking with industry professionals"
      ]
    },
    {
      icon: Briefcase,
      title: "Industry Opportunities",
      description: "Discover various career paths in the gaming industry beyond just playing.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
      subsections: [
        "Esports team management",
        "Game development and design",
        "Content creation and streaming",
        "Gaming journalism and commentary"
      ]
    },
    {
      icon: UserCheck,
      title: "Mentorship Program",
      description: "Connect with professional gamers and industry experts for personalized guidance.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      iconColor: "text-orange-400",
      subsections: [
        "One-on-one coaching sessions",
        "Group workshops and masterclasses",
        "Career planning consultations",
        "Industry insider insights"
      ]
    },
    {
      icon: PlayCircle,
      title: "Practice & Training",
      description: "Structured training programs and practice routines to improve your gaming skills.",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
      iconColor: "text-indigo-400",
      subsections: [
        "Daily training schedules",
        "Skill-specific drills and exercises",
        "Performance tracking and analytics",
        "Competitive practice matches"
      ]
    },
    {
      icon: BookMarked,
      title: "Resources & Tools",
      description: "Access to exclusive resources, tools, and materials for professional development.",
      color: "from-teal-500 to-cyan-500",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/30",
      iconColor: "text-teal-400",
      subsections: [
        "Gaming equipment recommendations",
        "Software and training tools",
        "Industry reports and research",
        "Exclusive community access"
      ]
    }
  ];

  const additionalFeatures = [
    { icon: Zap, title: "AI-Powered Matchmaking", description: "Smart algorithm for perfect team matching" },
    { icon: Award, title: "Achievement System", description: "Comprehensive rewards system" },
    { icon: Star, title: "Skill Rating System", description: "Dynamic assessment and ranking" },
    { icon: Headphones, title: "Audio Quality", description: "Crystal clear communication" },
    { icon: Monitor, title: "Cross-Platform", description: "Desktop, mobile, console" }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setCurrentFeature((prev) => (prev + 1) % mainFeatures.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isTransitioning]);

  const handleFeatureChange = (index: number) => {
    if (index === currentFeature || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentFeature(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isTransitioning) return;
    
    const nextIndex = direction === 'left' 
      ? (currentFeature + 1) % mainFeatures.length
      : currentFeature === 0 
        ? mainFeatures.length - 1 
        : currentFeature - 1;
    
    handleFeatureChange(nextIndex);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleSwipe('left');
    } else if (isRightSwipe) {
      handleSwipe('right');
    }
  };

  // Mouse drag support for laptop touchpad
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setMouseEnd(null);
    setMouseStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setMouseEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging || !mouseStart || !mouseEnd) {
      setIsDragging(false);
      return;
    }
    
    const distance = mouseStart - mouseEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleSwipe('left');
    } else if (isRightSwipe) {
      handleSwipe('right');
    }
    
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setFeedback('');
        setTimeout(() => {
          setShowFeedbackDialog(false);
          setSubmitSuccess(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('Failed to submit feedback:', errorData);
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeFeedbackDialog = () => {
    setShowFeedbackDialog(false);
    setFeedback('');
    setSubmitSuccess(false);
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Main Title */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Coming Soon
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Revolutionary gaming features that will transform your gaming experience
              </p>
            </div>

            {/* Main Announcement */}
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 shadow-2xl max-w-4xl mx-auto mb-12">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    The Future of Gaming is Here
                  </h2>
                  <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
                    Experience next-generation gaming features that combine AI intelligence, community engagement, and cutting-edge technology to create the ultimate gaming platform.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300 text-sm">AI Coaching</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300 text-sm">Smart Analytics</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300 text-sm">Community Features</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300 text-sm">Real-time Updates</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Upcoming Features
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Exciting new features coming soon to enhance your gaming experience
          </p>
        </div>

        {/* Featured Feature Display */}
        <div className="mb-16">
          <div 
            className={`bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-gray-700/50 shadow-2xl relative overflow-hidden transition-all duration-200 ${
              isDragging ? 'cursor-grabbing scale-98' : 'cursor-grab'
            }`}
            style={{ minHeight: '400px' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          >
            <div className={`flex flex-col lg:flex-row items-center gap-8 transition-all duration-500 h-full ${
              isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}>
              <div className="flex-1 flex flex-col justify-center">
                <div className={`w-24 h-24 ${mainFeatures[currentFeature].bgColor} rounded-3xl flex items-center justify-center mb-6 border ${mainFeatures[currentFeature].borderColor} transition-all duration-500`}>
                  {React.createElement(mainFeatures[currentFeature].icon, {
                    className: `w-12 h-12 ${mainFeatures[currentFeature].iconColor}`
                  })}
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 transition-all duration-500 min-h-[3rem] flex items-center">
                  {mainFeatures[currentFeature].title}
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed transition-all duration-500 min-h-[4.5rem] flex items-start">
                  {mainFeatures[currentFeature].description}
                </p>
              </div>
               <div className="flex-1 flex items-center">
                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 transition-all duration-500 w-full">
                   <div className="space-y-6">
                     <div className="text-center">
                       <h4 className="text-xl font-semibold text-white mb-4">Key Features</h4>
                     </div>
                     <div className="space-y-4">
                       {mainFeatures[currentFeature].keyFeatures?.map((feature, index) => (
                         <div key={index} className="flex items-center space-x-3">
                           <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                           <span className="text-gray-300 text-lg">{feature}</span>
                         </div>
                       )) || (
                         <>
                           <div className="flex items-center space-x-3">
                             <CheckCircle className="w-6 h-6 text-green-400" />
                             <span className="text-gray-300 text-lg">Advanced AI Integration</span>
                           </div>
                           <div className="flex items-center space-x-3">
                             <CheckCircle className="w-6 h-6 text-green-400" />
                             <span className="text-gray-300 text-lg">Real-time Processing</span>
                           </div>
                           <div className="flex items-center space-x-3">
                             <CheckCircle className="w-6 h-6 text-green-400" />
                             <span className="text-gray-300 text-lg">Personalized Experience</span>
                           </div>
                           <div className="flex items-center space-x-3">
                             <CheckCircle className="w-6 h-6 text-green-400" />
                             <span className="text-gray-300 text-lg">Smart Analytics</span>
                           </div>
                         </>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
          
          {/* Navigation Dots - Moved Down */}
          <div className="flex justify-center space-x-3 mt-12">
            {mainFeatures.map((_, index) => (
              <button
                key={index}
                onClick={() => handleFeatureChange(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentFeature === index
                    ? 'bg-white scale-125'
                    : 'bg-gray-500 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mainFeatures.map((feature, index) => (
            <div
              key={index}
              className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-105 cursor-pointer ${
                currentFeature === index 
                  ? `${feature.borderColor} shadow-2xl` 
                  : 'border-gray-700/50 hover:border-gray-600'
              }`}
              onClick={() => handleFeatureChange(index)}
            >
              <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 border ${feature.borderColor}`}>
                {React.createElement(feature.icon, {
                  className: `w-8 h-8 ${feature.iconColor}`
                })}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Career Building Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Career Building
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Learn how to become a professional gamer with our comprehensive career development program
          </p>
        </div>

        {/* Career Building Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {careerBuildingFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-105"
            >
              <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 border ${feature.borderColor}`}>
                {React.createElement(feature.icon, {
                  className: `w-8 h-8 ${feature.iconColor}`
                })}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {feature.description}
              </p>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Areas:</h4>
                {feature.subsections.map((subsection, subIndex) => (
                  <div key={subIndex} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400 text-xs">{subsection}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Additional Features */}
      <div className="bg-gray-900/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            More Exciting Features
          </h2>
          <p className="text-lg text-gray-400">
            Additional features coming soon to make your gaming even better
          </p>
        </div>

          {/* Football Formation Layout - Top 2, Bottom 3 */}
          <div className="flex flex-col items-center space-y-8">
            {/* Top Row - 2 Features */}
            <div className="flex justify-center space-x-8">
              {additionalFeatures.slice(0, 2).map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-105 w-64 h-48 flex flex-col justify-center"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                      {React.createElement(feature.icon, {
                        className: "w-6 h-6 text-white"
                      })}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom Row - 3 Features */}
            <div className="flex justify-center space-x-6">
              {additionalFeatures.slice(2, 5).map((feature, index) => (
                <div
                  key={index + 2}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-105 w-64 h-48 flex flex-col justify-center"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                      {React.createElement(feature.icon, {
                        className: "w-6 h-6 text-white"
                      })}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 border border-purple-500/30">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-16 h-16 text-purple-400" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Ready for What's Next?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Be the first to experience these amazing new features. Join our community and get exclusive early access.
            </p>
            <div className="flex justify-center">
              <button 
                onClick={() => setShowFeedbackDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              >
                Submit your feedback and suggestions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 ARC Gaming Platform. All rights reserved.
          </p>
        </div>
      </div>

      {/* Feedback Dialog */}
      {showFeedbackDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-2xl border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-white">Share Your Feedback</h3>
              <button
                onClick={closeFeedbackDialog}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            
            {submitSuccess ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h4 className="text-3xl font-bold text-white mb-4">Thank You!</h4>
                <p className="text-xl text-gray-300 mb-2">Your feedback has been submitted successfully.</p>
                <p className="text-lg text-gray-400">We appreciate your input and will use it to improve our platform.</p>
                <div className="mt-6">
                  <div className="inline-flex items-center px-4 py-2 bg-green-500/20 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-green-400 font-medium">Feedback Received</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <div className="mb-8">
                  <label className="block text-lg font-medium text-gray-300 mb-4">
                    Your suggestions and feedback
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your ideas, suggestions, or any feedback to help us improve our gaming platform..."
                    className="w-full h-48 px-6 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-lg"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Minimum 10 characters, maximum 2000 characters
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={closeFeedbackDialog}
                    className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors text-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComingSoon;