import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function AuthLayout() {
    const { session, loading } = useAuth()

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if (session) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <Outlet />
            </div>
        </div>
    )
}
