import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthLayout from '@/components/auth/AuthLayout'
import SignInForm from '@/components/auth/SignInForm'
import SignUpForm from '@/components/auth/SignUpForm'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import DashboardLayout from '@/layouts/DashboardLayout'
import DashboardHome from '@/pages/DashboardHome'
import InboxPage from '@/pages/InboxPage'
import SettingsPage from '@/pages/SettingsPage'
import WhatsAppSettingsPage from '@/pages/WhatsAppSettingsPage'
import CalendarSettingsPage from '@/pages/CalendarSettingsPage'
import ProfileSettingsPage from '@/pages/ProfileSettingsPage'
import NotificationSettingsPage from '@/pages/NotificationSettingsPage'
import AgentsPage from '@/pages/AgentsPage'
import AppointmentsPage from '@/pages/AppointmentsPage'
import ContactsPage from '@/pages/ContactsPage'
import Onboarding from '@/pages/Onboarding'
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<SignInForm />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        </Route>

        {/* Onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/whatsapp" element={<WhatsAppSettingsPage />} />
          <Route path="/settings/calendar" element={<CalendarSettingsPage />} />
          <Route path="/settings/profile" element={<ProfileSettingsPage />} />
          <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App


