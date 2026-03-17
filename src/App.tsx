import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import FlowCoreLoader from '@/components/ui/FlowCoreLoader'
import AuthLayout from '@/components/auth/AuthLayout'
import SignInForm from '@/components/auth/SignInForm'
import SignUpForm from '@/components/auth/SignUpForm'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
const GmailSettingsPage = lazy(() => import('@/pages/GmailSettingsPage'))
const ChannelsPage = lazy(() => import('@/pages/ChannelsPage'))
const AgentsPage = lazy(() => import('@/pages/AgentsPage'))
const AppointmentsPage = lazy(() => import('@/pages/AppointmentsPage'))
const ContactsPage = lazy(() => import('@/pages/ContactsPage'))
const KnowledgeBasePage = lazy(() => import('@/pages/KnowledgeBasePage'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const SlackSettingsPage = lazy(() => import('@/pages/SlackSettingsPage'))
const TelegramSettingsPage = lazy(() => import('@/pages/TelegramSettingsPage'))
const WebchatSettingsPage = lazy(() => import('@/pages/WebchatSettingsPage'))

// Marketing Pages
const InsightsMarketing = lazy(() => import('@/pages/marketing/InsightsView'))
const InboxMarketing = lazy(() => import('@/pages/marketing/InboxView'))

import { Toaster } from '@/components/ui/toaster'

function AppContent() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
        >
            <ErrorBoundary key={location.pathname}>
                <Suspense fallback={<FlowCoreLoader fullScreen />}>
                    <Routes location={location}>
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

                        {/* Marketing Routes (Public) */}
                        <Route path="/features/insights" element={<InsightsMarketing />} />
                        <Route path="/features/inbox" element={<InboxMarketing />} />

                        {/* App Routes */}
                        <Route element={<AppLayout />}>
                            <Route path="/inbox" element={<InboxPage />} />
                            <Route path="/insights" element={<InsightsPage />} />
                            <Route path="/appointments" element={<AppointmentsPage />} />
                            <Route path="/contacts" element={<ContactsPage />} />
                            <Route path="/agents" element={<AgentsPage />} />
                            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/settings/channels" element={<ChannelsPage />} />
                            <Route path="/settings/whatsapp" element={<WhatsAppSettingsPage />} />
                            <Route path="/settings/gmail" element={<GmailSettingsPage />} />
                            <Route path="/settings/calendar" element={<CalendarSettingsPage />} />
                            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
                            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
                            <Route path="/settings/slack" element={<SlackSettingsPage />} />
                            <Route path="/settings/telegram" element={<TelegramSettingsPage />} />
                            <Route path="/settings/webchat" element={<WebchatSettingsPage />} />
                        </Route>
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
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


