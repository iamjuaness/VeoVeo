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
  "Biography",
  "Mystery",
  "Western",
] as const;

export type Genre = (typeof movieGenres)[number];
