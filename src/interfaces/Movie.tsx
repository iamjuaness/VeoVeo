export interface Movie {
  id: number
  title: string
  year: number
  genre: string
  rating: number
  description: string
  poster: string
  backdrop: string
  watchCount: number // Cambiar de 'watched: boolean' a 'watchCount: number'
  watchLater: boolean
}