export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    moviesWatched?: { movieId: string; count: number; duration: number }[];
    watchLater?: string[];
}

export interface AuthPayload {
    id: string;
    name: string;
    email: string;
    avatar: string;
    exp?: number;
    iat?: number;
}
