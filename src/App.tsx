import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Suspense, lazy } from 'react'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import AuthLayout from '@/components/auth/AuthLayout'
import SignInForm from '@/components/auth/SignInForm'
import SignUpForm from '@/components/auth/SignUpForm'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

// Lazy Load Pages
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const AppLayout = lazy(() => import('./layouts/AppLayout'))
const InboxPage = lazy(() => import('@/pages/InboxPage'))
const InsightsPage = lazy(() => import('@/pages/InsightsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const WhatsAppSettingsPage = lazy(() => import('@/pages/WhatsAppSettingsPage'))
const CalendarSettingsPage = lazy(() => import('@/pages/CalendarSettingsPage'))
const ProfileSettingsPage = lazy(() => import('@/pages/ProfileSettingsPage'))
const NotificationSettingsPage = lazy(() => import('@/pages/NotificationSettingsPage'))
const AgentsPage = lazy(() => import('@/pages/AgentsPage'))
const AppointmentsPage = lazy(() => import('@/pages/AppointmentsPage'))
const ContactsPage = lazy(() => import('@/pages/ContactsPage'))
const KnowledgeBasePage = lazy(() => import('@/pages/KnowledgeBasePage'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FlowCoreLoader fullScreen />}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<SignInForm />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* App Routes */}
          <Route element={<AppLayout />}>

            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/whatsapp" element={<WhatsAppSettingsPage />} />
            <Route path="/settings/calendar" element={<CalendarSettingsPage />} />
            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  )
}

function RootRedirect() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/inbox" replace />
  return <LandingPage />
}

export default App


