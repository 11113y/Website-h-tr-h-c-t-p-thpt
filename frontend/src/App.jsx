import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import axios from './api/client';

// Lazy-load pages
const HomePage        = lazy(() => import('./pages/HomePage'));
const LoginPage       = lazy(() => import('./pages/LoginPage'));
const RegisterPage    = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'));
const LearnPage       = lazy(() => import('./pages/LearnPage'));
const LessonDetailPage= lazy(() => import('./pages/LessonDetailPage'));
const StudyMaterialDetailPage = lazy(() => import('./pages/StudyMaterialDetailPage'));
const ExamsListPage   = lazy(() => import('./pages/ExamsListPage'));
const ExamPage        = lazy(() => import('./pages/ExamPage'));
const ResultPage      = lazy(() => import('./pages/ResultPage'));
const ExplanationPage = lazy(() => import('./pages/ExplanationPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage     = lazy(() => import('./pages/ProfilePage'));
const ArticlesPage    = lazy(() => import('./pages/ArticlesPage'));
const ArticleDetailPage=lazy(() => import('./pages/ArticleDetailPage'));
const DocumentsPage   = lazy(() => import('./pages/DocumentsPage'));
const FeedbackPage    = lazy(() => import('./pages/FeedbackPage'));
const AdminPage       = lazy(() => import('./pages/AdminPage'));
const NotFoundPage    = lazy(() => import('./pages/NotFoundPage'));
const SavedQuestionsPage = lazy(() => import('./pages/SavedQuestionsPage'));
const CollectionsPage    = lazy(() => import('./pages/CollectionsPage'));
const BlogPage        = lazy(() => import('./pages/BlogPage'));
const FormulasPage    = lazy(() => import('./pages/FormulasPage'));
const GrapherPage     = lazy(() => import('./pages/GrapherPage'));


function PageLoader() {
  return (
    <div className="page-loading">
      <div className="spinner" />
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAdmin ? children : <Navigate to="/" replace />;
}

import { useDialog } from './contexts/DialogContext';


export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, refreshUser } = useAuth();
  const { alert } = useDialog();
  const [savedQuestions, setSavedQuestions] = useState([]);

  useEffect(() => {
    if (isLoggedIn) {
      axios.get('/bookmarks')
        .then(res => {
          if (res.data?.success) {
            setSavedQuestions(res.data.bookmarks.map(b => b.questionId));
          }
        })
        .catch(() => {});
    } else {
      setSavedQuestions([]);
    }
  }, [isLoggedIn]);

  // Redirect admin users out of student/public pages
  useEffect(() => {
    if (isLoggedIn && user?.role?.toLowerCase() === 'admin' && !location.pathname.startsWith('/admin')) {
      navigate('/admin', { replace: true });
    }
  }, [isLoggedIn, user, location.pathname, navigate]);

  const toggleSaveQuestion = async (questionId, forceRemove = false) => {
    try {
      if (forceRemove || savedQuestions.includes(questionId)) {
        await axios.delete(`/bookmarks/questions/${questionId}`);
        setSavedQuestions(prev => prev.filter(id => id !== questionId));
        return false;
      } else {
        const res = await axios.post('/bookmarks/toggle', { questionId });
        setSavedQuestions(prev => [...prev, questionId]);
        return res.data.bookmarked;
      }
    } catch (e) {
      console.error(e);
      alert('Không thể thực hiện lưu/bỏ lưu câu hỏi');
      return false;
    }
  };

  // Pages that don't show header/footer (full-screen)
  const isFullscreen = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname) || 
    (/^\/exams\/[^/]+$/).test(location.pathname) ||
    location.pathname.startsWith('/admin') ||
    location.pathname.includes('/result');

  return (
    <div className="app-wrapper">
      {!isFullscreen && <AppHeader />}
      <main className="page-container" style={isFullscreen ? { padding: 0 } : {}}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Learning */}
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:subjectId" element={<LearnPage />} />
            <Route path="/lessons/:lessonId" element={<PrivateRoute><LessonDetailPage /></PrivateRoute>} />
            <Route path="/study-materials/:materialId" element={<PrivateRoute><StudyMaterialDetailPage /></PrivateRoute>} />

            {/* Exams */}
            <Route path="/exams" element={<ExamsListPage />} />
            <Route path="/exams/:examId" element={<ExamPage isLoggedIn={isLoggedIn} savedQuestions={savedQuestions} toggleSaveQuestion={toggleSaveQuestion} />} />
            <Route path="/exams/:examId/result" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
            <Route path="/exams/:examId/explanations" element={<ExplanationPage />} />

            {/* Community */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/formulas" element={<FormulasPage />} />
            <Route path="/grapher" element={<GrapherPage />} />
            <Route path="/blog" element={
              <BlogPage 
                isLoggedIn={isLoggedIn} 
                currentUser={user} 
                userPoints={user?.points || 0} 
                setUserPoints={() => refreshUser()} 
                setPrefilledEmail={() => {}} 
                navigateTo={navigate} 
              />
            } />
            <Route path="/articles" element={<Navigate to="/blog" replace />} />
            <Route path="/articles/:articleId" element={<ArticleDetailPage />} />
            <Route path="/documents" element={<Navigate to="/blog" replace />} />
            <Route path="/feedback" element={<PrivateRoute><FeedbackPage /></PrivateRoute>} />

            {/* User */}
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/saved-questions" element={<PrivateRoute><SavedQuestionsPage isLoggedIn={isLoggedIn} savedQuestions={savedQuestions} toggleSaveQuestion={toggleSaveQuestion} /></PrivateRoute>} />
            <Route path="/collections" element={<PrivateRoute><CollectionsPage isLoggedIn={isLoggedIn} savedQuestions={savedQuestions} toggleSaveQuestion={toggleSaveQuestion} /></PrivateRoute>} />

            {/* Admin */}
            <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isFullscreen && <AppFooter />}
    </div>
  );
}
