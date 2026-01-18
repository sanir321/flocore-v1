import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p>Welcome to Flowcore Slice-1</p>
            <Button
                className="mt-4"
                onClick={() => supabase.auth.signOut()}
            >
                Sign Out
            </Button>
        </div>
    )
}
