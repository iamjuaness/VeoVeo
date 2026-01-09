export const movieGenres = [
  "All",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Sci-Fi",
  "Short",
] as const;

export type Genre = (typeof movieGenres)[number];
