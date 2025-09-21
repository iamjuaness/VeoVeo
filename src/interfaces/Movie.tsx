export interface Movie {
  id: number
  type: string
  title: string
  year: number
  genres: string[]
  rating: number
  description: string
  poster: string
  backdrop: string
  watchCount: number
  watchLater: boolean
  duration: number
  watchedAt: string[]
}