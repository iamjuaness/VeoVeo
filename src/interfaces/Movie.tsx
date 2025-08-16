export interface Movie {
  id: number
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
}