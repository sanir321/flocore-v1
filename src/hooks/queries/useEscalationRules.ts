import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface EscalationRule {
  id: string
  workspace_id: string
  keyword: string
  is_active: boolean
  created_at: string
}

export function useEscalationRules(workspaceId?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['escalation_rules', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('keyword', { ascending: true })

      if (error) throw error
      return (data as unknown) as EscalationRule[]
    },
    enabled: !!workspaceId
  })

  const updateRules = useMutation({
    mutationFn: async (rules: (Partial<EscalationRule> & { keyword: string })[]) => {
      if (!workspaceId) return
      
      const { error } = await supabase
        .from('escalation_rules')
        .upsert(
          rules.map(r => ({
            ...r,
            workspace_id: workspaceId
          }))
        )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalation_rules', workspaceId] })
    }
  })

  const createRule = useMutation({
    mutationFn: async (keyword: string) => {
      if (!workspaceId) return
      const { error } = await supabase
        .from('escalation_rules')
        .insert({
          workspace_id: workspaceId,
          keyword: keyword,
          is_active: true
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalation_rules', workspaceId] })
    }
  })

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('escalation_rules')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalation_rules', workspaceId] })
    }
  })

  return {
    ...query,
    updateRules,
    createRule,
    deleteRule
  }
}
