// API Constants
export const API_ROUTES = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
    },
    USER: {
        PROFILE: '/api/user/profile',
        MOVIES: '/api/user/movies',
    },
    IMDB: {
        SEARCH: '/api/imbd/search',
    },
} as const;
