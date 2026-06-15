export const TEST_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
} as const;

export const SESSION_COOKIE = 'forco_session';
export const SESSION_VALUE = 'authenticated';

export function isAuthenticated(cookieValue: string | undefined): boolean {
    return cookieValue === SESSION_VALUE;
}
