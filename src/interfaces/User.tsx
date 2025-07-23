export interface User {
    id: string
    name: string
    email: string
    avatar: string
    moviesWatched?: { movieId: string, count: number }[]
    watchLater?: string[]

  }