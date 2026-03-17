import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { subDays, startOfDay, format, getDay, getHours } from 'date-fns'

const MODEL_COSTS: Record<string, { prompt: number; completion: number }> = {
    'gpt-4o': { prompt: 5.0, completion: 15.0 }, // per 1M tokens
    'gpt-4v': { prompt: 10.0, completion: 30.0 },
    'claude-3-5-sonnet': { prompt: 3.0, completion: 15.0 },
    'haiku': { prompt: 0.25, completion: 1.25 },
    'default': { prompt: 10.0, completion: 30.0 }
}

export function useAnalytics(workspaceId: string | undefined, days: number = 7) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!workspaceId) return

        const channel = supabase
            .channel(`analytics-realtime-${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ai_interactions',
                    filter: `workspace_id=eq.${workspaceId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['analytics', workspaceId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId, queryClient])

    return useQuery({
        queryKey: ['analytics', workspaceId, days],
        queryFn: async () => {
            if (!workspaceId) return null

            const sinceDate = subDays(new Date(), days).toISOString()
            
            // 1. Fetch Conversations
            const { data: conversations, error: convError } = await supabase
                .from('conversations')
                .select('created_at, status, escalated, assigned_to_human, escalation_reason, escalated_at, agent_id')
                .eq('workspace_id', workspaceId)
                .gte('created_at', sinceDate)

            if (convError) throw convError

            // 2. Fetch AI Interactions with agent details
            const { data: aiInteractions, error: aiError } = await supabase
                .from('ai_interactions')
                .select('*, agent:agents(name, model)')
                .eq('workspace_id', workspaceId)
                .gte('created_at', sinceDate)

            if (aiError) throw aiError

            // 3. Fetch Messages with sentiment/topic
            const { data: messages, error: msgError } = await supabase
                .from('messages')
                .select('created_at, sender, metadata, sentiment_score, topic_detected')
                .eq('workspace_id', workspaceId)
                .gte('created_at', sinceDate)

            if (msgError) throw msgError

            return processAnalytics(conversations || [], aiInteractions || [], messages || [], days)
        },
        enabled: !!workspaceId
    })
}

function processAnalytics(data: any[], aiData: any[], messageData: any[], days: number) {
    const total = data.length
    
    // Volume & Sentiment Trends
    const volumeTrend = []
    const sentimentTrend = []
    const escTrend = []
    
    for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'MMM dd')
        const dayStart = startOfDay(date).getTime()
        const dayEnd = dayStart + 86400000
        
        const dailyConvs = data.filter(c => {
            const t = new Date(c.created_at).getTime()
            return t >= dayStart && t < dayEnd
        })
        
        const dailyMsgs = messageData.filter(m => {
            const t = new Date(m.created_at).getTime()
            return t >= dayStart && t < dayEnd
        })

        const dailyEscCount = data.filter(c => {
            const t = new Date(c.escalated_at || c.created_at).getTime()
            return c.escalated && t >= dayStart && t < dayEnd
        }).length
        
        const avgSent = dailyMsgs.length > 0
            ? dailyMsgs.reduce((acc, curr) => acc + (curr.sentiment_score || 0), 0) / dailyMsgs.length
            : 0

        volumeTrend.push({ name: dateStr, value: dailyConvs.length })
        escTrend.push({ name: dateStr, value: dailyEscCount })
        sentimentTrend.push({ name: dateStr, value: parseFloat(((avgSent + 1) * 50).toFixed(1)) }) // 0-100 scale
    }

    // Agent Performance Leaderboard
    const agentMap: Record<string, any> = {}
    aiData.forEach(interaction => {
        const name = interaction.agent?.name || 'Unknown Agent'
        if (!agentMap[name]) {
            agentMap[name] = { name, totalTokens: 0, cost: 0, avgLatency: 0, count: 0, toolCalls: 0 }
        }
        const modelKey = interaction.model || 'default'
        const pricing = MODEL_COSTS[modelKey as keyof typeof MODEL_COSTS] || MODEL_COSTS.default
        const cost = (interaction.prompt_tokens / 1000000 * pricing.prompt) + (interaction.completion_tokens / 1000000 * pricing.completion)
        
        agentMap[name].totalTokens += interaction.total_tokens || 0
        agentMap[name].cost += cost
        agentMap[name].avgLatency += interaction.latency_ms || 0
        agentMap[name].count++
        agentMap[name].toolCalls += interaction.tool_calls?.length || 0
    })

    const agentLeaderboard = Object.values(agentMap).map((a: any) => ({
        ...a,
        avgLatency: Math.round(a.avgLatency / a.count),
        cost: parseFloat(a.cost.toFixed(4))
    })).sort((a, b) => b.count - a.count)

    // Finance Breakdown
    const totalCost = agentLeaderboard.reduce((acc, curr) => acc + curr.cost, 0)

    // Topics Breakdown
    const topicMap: Record<string, number> = {}
    messageData.forEach(m => {
        if (m.topic_detected) {
            topicMap[m.topic_detected] = (topicMap[m.topic_detected] || 0) + 1
        }
    })
    const byTopic = Object.entries(topicMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    // General Metrics
    const avgSentiment = messageData.length > 0 
        ? messageData.reduce((acc, curr) => acc + (curr.sentiment_score || 0), 0) / messageData.length
        : 0
    const satisfaction = ((avgSentiment + 1) / 2) * 100

    const replies = messageData.filter(m => m.sender === 'assistant' || m.metadata?.is_human_reply).length
    const replyRate = messageData.length > 0 ? (replies / messageData.length) * 100 : 0

    return {
        volumeTrend,
        sentimentTrend,
        escTrend,
        topicTrend: byTopic,
        agentLeaderboard,
        totalCost: parseFloat(totalCost.toFixed(2)),
        openConversations: data.filter(c => c.status === 'todo').length,
        totalConversations: total,
        aiAutomationRate: total > 0 ? ((total - data.filter(c => c.assigned_to_human).length) / total) * 100 : 0,
        satisfaction: parseFloat(satisfaction.toFixed(1)),
        replyRate: parseFloat(replyRate.toFixed(1)),
        tasksDetected: messageData.filter(m => m.metadata?.tool_calls?.length > 0).length,
        avgLatencyMs: aiData.length > 0 
            ? Math.round(aiData.reduce((acc, curr) => acc + (curr.latency_ms || 0), 0) / aiData.length)
            : 0,
        totalTokens: aiData.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0),
        heatmap: generateHeatmap(data)
    }
}

function generateHeatmap(data: any[]) {
    const heatmap = Array(6).fill(0).map(() => Array(7).fill(0))
    data.filter(c => c.escalated).forEach(c => {
        const date = new Date(c.escalated_at || c.created_at)
        const dayIndex = getDay(date)
        const hour = getHours(date)
        let slotIndex = 0
        if (hour >= 9 && hour < 13) slotIndex = 0
        else if (hour >= 13 && hour < 17) slotIndex = 1
        else if (hour >= 17 && hour < 21) slotIndex = 2
        else if (hour >= 21 || hour < 1) slotIndex = 3
        else if (hour >= 1 && hour < 5) slotIndex = 4
        else if (hour >= 5 && hour < 9) slotIndex = 5
        heatmap[slotIndex][dayIndex]++
    })
    return heatmap
}
