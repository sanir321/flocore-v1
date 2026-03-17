import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAnalytics } from './useAnalytics'
import { supabase } from '@/lib/supabase'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAnalytics', () => {
  const workspaceId = 'test-workspace-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', async () => {
    const { result } = renderHook(() => useAnalytics(workspaceId), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(true)
  })

  it('should handle analytics fetching', async () => {
    // Mock successful data response for all 3 queries
    const mockData = { data: [], error: null }
    const mockGte = vi.fn().mockResolvedValue(mockData)
    
    ;(supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: mockGte,
    })

    const { result } = renderHook(() => useAnalytics(workspaceId), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})
