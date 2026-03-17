/**
 * Secure wrapper for localStorage to handle parsing safely
 * Prevents XSS from raw string manipulation and handles missing values.
 */
export const secureStorage = {
    getItem: <T>(key: string): T | null => {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : null
        } catch (error) {
            return null
        }
    },
    setItem: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            // Error ignored
        }
    },
    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key)
        } catch (error) {
            // Error ignored
        }
    }
}
