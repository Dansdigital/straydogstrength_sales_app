import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

export async function fetchCurrentUser() {
    try {
        const currentUser = await getCurrentUser();
        const { tokens } = await fetchAuthSession();

        const decodeJwtPayload = (token: string | undefined) => {
            if (!token) return null;
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join(''));
                return JSON.parse(jsonPayload);
            } catch (e) {
                console.error('Error decoding token:', e);
                return null;
            }
        };

        const getUserGroups = (token: string | undefined) => {
            if (!token) return null;
            const decoded = decodeJwtPayload(token);
            return decoded?.['cognito:groups'];
        };

        return {
            username: currentUser?.username,
            userId: currentUser?.userId,
            signInDetails: {
                loginId: currentUser?.signInDetails?.loginId || ''
            },
            groups: getUserGroups(tokens?.idToken?.toString()) || []
        };
    } catch (error) {
        console.error("error getting current user:", error);
    }
}