export interface Series {
  id: string;
  type: string;
  title: string;
  year: number;
  genres: string[];
  rating: number;
  description: string;
  poster: string;
  backdrop: string;
  watchLater: boolean;
  endYear?: number;
}

export interface Episode {
  id: string;
  title: string;
  primaryImage?: {
    url: string;
    width: number;
    height: number;
  };
  season: string;
  episodeNumber: number;
  runtimeSeconds: number;
  plot: string;
  rating: {
    aggregateRating: number;
    voteCount: number;
  };
  releaseDate: {
    year: number;
    month: number;
    day: number;
  };
}

export interface Season {
  season: string;
  episodeCount: number;
  episodes?: Episode[];
}
