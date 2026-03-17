// src/lib/whatsapp.ts
// Stub implementation to fix build errors since WhatsApp is currently disabled
export const whatsapp = {
    sendText: async (_workspaceId: string, _phone: string, _message: string): Promise<any> => {
        return null;
    },
    health: async (): Promise<{ status: string }> => {
        return { status: 'disabled' };
    }
}
