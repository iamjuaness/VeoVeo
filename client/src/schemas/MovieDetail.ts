export interface MovieDetail {
  id: string
  type: string
  primaryTitle: string
  originalTitle: string
  primaryImage: {
    url: string
    width: number
    height: number
  }
  startYear: number
  runtimeSeconds: number
  genres: string[]
  rating: {
    aggregateRating: number
    voteCount: number
  }
  plot: string
  directors: Array<{
    id: string
    displayName: string
    primaryImage?: {
      url: string
      width: number
      height: number
    }
  }>
  writers: Array<{
    id: string
    displayName: string
    primaryImage?: {
      url: string
      width: number
      height: number
    }
    primaryProfessions?: string[]
  }>
  stars: Array<{
    id: string
    displayName: string
    alternativeNames?: string[]
    primaryImage?: {
      url: string
      width: number
      height: number
    }
    primaryProfessions?: string[]
  }>
  originCountries: Array<{
    code: string
    name: string
  }>
  spokenLanguages: Array<{
    code: string
    name: string
  }>
  watchCount?: number
  watchLater?: boolean
}