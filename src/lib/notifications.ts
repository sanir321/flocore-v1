/**
 * Browser Notification Service
 * Handles permission requests and sending notifications
 */

export type NotificationType = 'escalation' | 'booking' | 'mention' | 'message'

interface NotificationOptions {
    title: string
    body: string
    icon?: string
    tag?: string
    data?: any
}

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported(): boolean {
    return 'Notification' in window
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!isNotificationSupported()) return 'unsupported'
    return Notification.permission
}

/**
 * Request notification permission from browser
 * Returns true if granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!isNotificationSupported()) {
        console.warn('Browser notifications not supported')
        return false
    }

    // Already granted
    if (Notification.permission === 'granted') {
        return true
    }

    // Already denied - can't request again
    if (Notification.permission === 'denied') {
        console.warn('Notification permission was denied previously')
        return false
    }

    // Request permission
    try {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    } catch (error) {
        console.error('Error requesting notification permission:', error)
        return false
    }
}

/**
 * Send a browser notification
 */
export function sendNotification(options: NotificationOptions): Notification | null {
    if (!isNotificationSupported()) {
        console.warn('Browser notifications not supported')
        return null
    }

    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted')
        return null
    }

    try {
        const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/favicon.ico',
            tag: options.tag,
            data: options.data,
            badge: '/favicon.ico',
            requireInteraction: false
        })

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000)

        // Handle click
        notification.onclick = () => {
            window.focus()
            notification.close()

            // Navigate based on notification type
            if (options.data?.url) {
                window.location.href = options.data.url
            }
        }

        return notification
    } catch (error) {
        console.error('Error sending notification:', error)
        return null
    }
}

/**
 * Send an escalation notification
 */
export function sendEscalationNotification(customerName: string, conversationId: string) {
    return sendNotification({
        title: '🚨 Escalation Alert',
        body: `${customerName} needs human assistance`,
        tag: `escalation-${conversationId}`,
        data: { url: `/inbox?id=${conversationId}`, type: 'escalation' }
    })
}

/**
 * Send a booking notification
 */
export function sendBookingNotification(customerName: string, dateTime: string, appointmentId: string) {
    return sendNotification({
        title: '📅 New Booking',
        body: `${customerName} booked for ${dateTime}`,
        tag: `booking-${appointmentId}`,
        data: { url: '/appointments', type: 'booking' }
    })
}

/**
 * Send a mention notification
 */
export function sendMentionNotification(mentionedBy: string, context: string) {
    return sendNotification({
        title: '💬 You were mentioned',
        body: `${mentionedBy}: ${context}`,
        tag: `mention-${Date.now()}`,
        data: { url: '/inbox', type: 'mention' }
    })
}

/**
 * Send a new message notification
 */
export function sendMessageNotification(customerName: string, preview: string, conversationId: string) {
    return sendNotification({
        title: `💬 ${customerName}`,
        body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
        tag: `message-${conversationId}`,
        data: { url: `/inbox?id=${conversationId}`, type: 'message' }
    })
}
