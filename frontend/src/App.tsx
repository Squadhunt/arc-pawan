import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { CameraProvider } from './contexts/CameraContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PlayerOnlyRoute from './components/PlayerOnlyRoute';
import AdminRoute from './components/AdminRoute';
import DevDebugPanel from './components/DevDebugPanel';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';

// Lazy load components for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CreatePost = React.lazy(() => import('./pages/CreatePost'));
const Profile = React.lazy(() => import('./pages/Profile'));
const TeamProfile = React.lazy(() => import('./pages/TeamProfile'));
const TeamEditProfile = React.lazy(() => import('./pages/TeamEditProfile'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Search = React.lazy(() => import('./pages/Search'));
const Tournaments = React.lazy(() => import('./pages/Tournaments'));
const TournamentDetail = React.lazy(() => import('./pages/TournamentDetail'));
const CreateDuo = React.lazy(() => import('./pages/CreateDuo'));
const Settings = React.lazy(() => import('./pages/Settings'));
const RandomConnect = React.lazy(() => import('./pages/RandomConnectNew'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const Recruitment = React.lazy(() => import('./pages/Recruitment'));
const RecruitmentManagement = React.lazy(() => import('./pages/RecruitmentManagement'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const MediaTest = React.lazy(() => import('./components/MediaTest'));
const ConnectionTest = React.lazy(() => import('./components/ConnectionTest'));

// Admin components
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminPosts = React.lazy(() => import('./pages/AdminPosts'));
const AdminTournaments = React.lazy(() => import('./pages/AdminTournaments'));
const AdminFeedback = React.lazy(() => import('./pages/AdminFeedback'));
const AdminTest = React.lazy(() => import('./pages/AdminTest'));
const ComingSoon = React.lazy(() => import('./pages/ComingSoon'));

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-gray-400/30 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-20 h-20 border-4 border-gray-400 rounded-full animate-spin border-t-transparent"></div>
      </div>
                        <h2 className="mt-6 text-3xl font-bold text-white">Loading...</h2>
      <p className="mt-2 text-gray-300">Preparing your gaming experience</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CameraProvider>
          <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-black">
            {/* <ConnectionStatus /> */}
            <Navbar />
            <DevDebugPanel />
            <Suspense fallback={<LoadingScreen />}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                  <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                  <Route path="/" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
                  <Route path="/create-post" element={<ProtectedRoute><PageTransition><CreatePost /></PageTransition></ProtectedRoute>} />
                  <Route path="/post/:id" element={<PageTransition><PostDetail /></PageTransition>} />
                  <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
                  <Route path="/profile/:id" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
                  <Route path="/team/:id" element={<ProtectedRoute><PageTransition><TeamProfile /></PageTransition></ProtectedRoute>} />
                  <Route path="/team/:id/edit" element={<ProtectedRoute><PageTransition><TeamEditProfile /></PageTransition></ProtectedRoute>} />
                  <Route path="/edit-profile" element={<ProtectedRoute><PageTransition><EditProfile /></PageTransition></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><PageTransition><Messages /></PageTransition></ProtectedRoute>} />
                  <Route path="/search" element={<ProtectedRoute><PageTransition><Search /></PageTransition></ProtectedRoute>} />
                  <Route path="/tournaments" element={<ProtectedRoute><PageTransition><Tournaments /></PageTransition></ProtectedRoute>} />
                  <Route path="/tournament/:id" element={<ProtectedRoute><PageTransition><TournamentDetail /></PageTransition></ProtectedRoute>} />
                  <Route path="/tournaments/:tournamentName/:hostUsername" element={<ProtectedRoute><PageTransition><TournamentDetail /></PageTransition></ProtectedRoute>} />
                  <Route path="/create-duo" element={<ProtectedRoute><PageTransition><CreateDuo /></PageTransition></ProtectedRoute>} />
                  <Route path="/recruitment" element={<ProtectedRoute><PageTransition><Recruitment /></PageTransition></ProtectedRoute>} />
                  <Route path="/recruitment-management" element={<ProtectedRoute><PageTransition><RecruitmentManagement /></PageTransition></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><PageTransition><Notifications /></PageTransition></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
                  <Route path="/coming-soon" element={<ProtectedRoute><PageTransition><ComingSoon /></PageTransition></ProtectedRoute>} />
                  <Route path="/random-connect" element={
                    <PlayerOnlyRoute>
                      <ErrorBoundary>
                        <PageTransition><RandomConnect /></PageTransition>
                      </ErrorBoundary>
                    </PlayerOnlyRoute>
                  } />
                  <Route path="/media-test" element={<ProtectedRoute><PageTransition><MediaTest /></PageTransition></ProtectedRoute>} />
                  <Route path="/connection-test" element={<ProtectedRoute><PageTransition><ConnectionTest /></PageTransition></ProtectedRoute>} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><PageTransition><AdminUsers /></PageTransition></AdminRoute>} />
                  <Route path="/admin/posts" element={<AdminRoute><PageTransition><AdminPosts /></PageTransition></AdminRoute>} />
                  <Route path="/admin/tournaments" element={<AdminRoute><PageTransition><AdminTournaments /></PageTransition></AdminRoute>} />
                  <Route path="/admin/feedback" element={<AdminRoute><PageTransition><AdminFeedback /></PageTransition></AdminRoute>} />
                  <Route path="/admin-test" element={<PageTransition><AdminTest /></PageTransition>} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </div>
          </Router>
        </CameraProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
