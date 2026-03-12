import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    /**
     * Extends the built-in session.user type with LockForms-specific fields.
     * These are populated from the JWT in the session callback in src/lib/auth.ts.
     */
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            organizationId: string;
            organizationName: string;
            roles: string[];
        };
    }

    /**
     * Extends the built-in User type returned from authorize().
     * These fields are persisted into the JWT in the jwt callback.
     */
    interface User {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
        organizationId: string;
        organizationName: string;
        roles: string[];
    }
}

declare module 'next-auth/jwt' {
    /**
     * Extends the built-in JWT type with LockForms-specific fields.
     */
    interface JWT {
        id?: string;
        organizationId?: string;
        organizationName?: string;
        roles?: string[];
    }
}
