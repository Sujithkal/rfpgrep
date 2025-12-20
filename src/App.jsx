import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectIndexPage from './pages/ProjectIndexPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/PricingPage';
import KnowledgePage from './pages/KnowledgePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RefundPage from './pages/RefundPage';
import ContactPage from './pages/ContactPage';
import ShippingPage from './pages/ShippingPage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import SecurityPage from './pages/SecurityPage';
import RoadmapPage from './pages/RoadmapPage';
import BlogPage from './pages/BlogPage';
import CareersPage from './pages/CareersPage';
import DocsPage from './pages/DocsPage';
import ApiDocsPage from './pages/ApiDocsPage';
import HelpPage from './pages/HelpPage';
import StatusPage from './pages/StatusPage';
import CompliancePage from './pages/CompliancePage';
import TeamPage from './pages/TeamPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AnswerLibraryPage from './pages/AnswerLibraryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BrandingPage from './pages/BrandingPage';
import IntegrationsPage from './pages/IntegrationsPage';
import NotFoundPage from './pages/NotFoundPage';
import TrialSignupPage from './pages/TrialSignupPage';
import AUPPage from './pages/AUPPage';
import DPAPage from './pages/DPAPage';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  iconTheme: { primary: '#10B981', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#EF4444', secondary: '#fff' },
                },
              }}
            />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/project" element={<ProjectIndexPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/upload" element={<Navigate to="/projects" replace />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/refund" element={<RefundPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/shipping" element={<ShippingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/api-docs" element={<ApiDocsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/answers" element={<AnswerLibraryPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/branding" element={<BrandingPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/trial-signup" element={<TrialSignupPage />} />
              <Route path="/aup" element={<AUPPage />} />
              <Route path="/acceptable-use" element={<AUPPage />} />
              <Route path="/dpa" element={<DPAPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;




