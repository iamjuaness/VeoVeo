import type { Movie } from "../../interfaces/Movie";

// Percentil genérico (ejemplo: P50 = 50)
export const percentile = (arr: number[], p: number) => {
  if (!arr.length) return 0;
  const a = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (a.length - 1));
  return a[idx];
};

// Diversidad de géneros
export const getGenreDiversity = (movies: any[]) => {
  const set = new Set<string>();
  movies.forEach(m => (m.genres || []).forEach((g: string) => set.add(g)));
  return { unique: set.size, total: movies.length, ratio: set.size / movies.length };
};

// Concentración por top N géneros (ejemplo, N=3)
export const getGenreConcentration = (movies: any[], topN = 3) => {
  const genreMap: Record<string, number> = {};
  movies.forEach(m => (m.genres || []).forEach((g: string) => genreMap[g] = (genreMap[g] || 0) + 1));
  const total = movies.length;
  const sorted = Object.entries(genreMap).sort(([, a], [, b]) => b - a);
  const topSum = sorted.slice(0, topN).reduce((acc, [, c]) => acc + c, 0);
  return { topN, topSum, ratio: total ? topSum / total : 0 };
};

// Afinidad por género (prom rating por género)
export const getGenreAffinity = (movies: any[], minCount = 3) => {
  const affinity: Record<string, { sum: number, count: number }> = {};

  interface MovieWithGenresAndRating {
    genres?: string[];
    rating: number;
  }

  movies.forEach((m: MovieWithGenresAndRating) => (m.genres || []).forEach((g: string) => {
    affinity[g] = affinity[g] || { sum: 0, count: 0 };
    affinity[g].sum += m.rating;
    affinity[g].count += 1;
  }));
  return Object.entries(affinity)
    .filter(([_, v]) => v.count >= minCount)
    .map(([g, v]) => ({ genre: g, avg: v.sum / v.count, count: v.count }))
    .sort((a, b) => b.avg - a.avg);
};

// Split por año clásico/moderno (año corte: 2000)
export const splitClassicModern = (movies: any[]) => {
  const classic = movies.filter(m => m.year < 2000);
  const modern = movies.filter(m => m.year >= 2000);
  return {
    classic: classic.length,
    modern: modern.length,
    avgClassic: classic.length ? classic.reduce((a, m) => a + m.rating, 0) / classic.length : 0,
    avgModern: modern.length ? modern.reduce((a, m) => a + m.rating, 0) / modern.length : 0,
  };
};

// Correlación simple duración-rating (tendencia)
export const getDurationRatingTrend = (movies: any[]) => {
  const xs = movies.map(m => m.duration || 0);
  const ys = movies.map(m => m.rating || 0);
  const n = xs.length;
  if (n < 2) return 0;
  const [avgX, avgY] = [xs.reduce((a, b) => a + b) / n, ys.reduce((a, b) => a + b) / n];
  const num = xs.map((x, i) => (x - avgX) * (ys[i] - avgY)).reduce((a, b) => a + b, 0);
  const denX = Math.sqrt(xs.map(x => (x - avgX) ** 2).reduce((a, b) => a + b, 0));
  const denY = Math.sqrt(ys.map(y => (y - avgY) ** 2).reduce((a, b) => a + b, 0));
  return (denX && denY) ? num / (denX * denY) : 0; // entre -1 y 1
};
// Promedio de vistas por mes (para gráfico de línea)
export function getViewsByMonth(movies: Movie[]) {
  const perMonth: Record<string, number> = {};
  movies.forEach(m =>
    (m.watchedAt || []).forEach(dateStr => {
      const month = dateStr.slice(0, 7); // "YYYY-MM"
      perMonth[month] = (perMonth[month] || 0) + 1;
    })
  );
  return Object.entries(perMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Promedio rating por mes (para gráfico de línea)
export function getAvgRatingByMonth(movies: Movie[]) {
  const perMonth: Record<string, number[]> = {};
  movies.forEach(m =>
    (m.watchedAt || []).forEach(dateStr => {
      const month = dateStr.slice(0, 7);
      if (!perMonth[month]) perMonth[month] = [];
      perMonth[month].push(m.rating || 0);
    })
  );
  return Object.entries(perMonth)
    .map(([month, arr]) => ({
      month,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
      count: arr.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getRatingVsDuration(movies: Movie[]) {
  return movies.flatMap(m =>
    (m.watchedAt || []).map(() => ({
      duration: Math.round(m.duration / 60), // minutos
      rating: m.rating,
      genre: m.genres?.[0] || "Otro",
      year: m.year
    }))
  );
}

export function getYearsRanking(movies: Movie[]) {
  const perYear: Record<number, number> = {};
  movies.forEach(m =>
    (m.watchedAt || []).forEach(() => {
      perYear[m.year] = (perYear[m.year] || 0) + 1;
    })
  );
  return Object.entries(perYear)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => b.count - a.count);
}

const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export function getViewsByDayOfWeek(movies: Movie[]) {
  const dayMap: Record<string, number> = {};
  movies.forEach(m =>
    (m.watchedAt || []).forEach(d => {
      const day = DOW[new Date(d).getDay()];
      dayMap[day] = (dayMap[day] || 0) + 1;
    })
  );
  return DOW.map(day => ({ day, count: dayMap[day] || 0 }));
}


export function getRewatchDistribution(movies: Movie[]) {
  const buckets: Record<number, number> = {};
  movies.forEach(m => {
    const count = m.watchCount || 1;
    buckets[count] = (buckets[count] || 0) + 1;
  });
  return Array.from({ length: 6 }, (_, i) => ({
    times: i < 5 ? `${i + 1}x` : '6x+',
    count: i < 5 ? (buckets[i + 1] || 0) : Object.entries(buckets).filter(([k]) => Number(k) > 5).reduce((a, [_, v]) => a + v, 0)
  }));
}

export function getGenreYearHeatmap(movies: Movie[]) {
  const map: Record<string, Record<string, number>> = {};
  movies.forEach(m =>
    (m.watchedAt || []).forEach(() => {
      const decade = `${Math.floor(m.year / 10) * 10}s`;
      (m.genres || []).forEach(g => {
        if (!map[g]) map[g] = {};
        map[g][decade] = (map[g][decade] || 0) + 1;
      });
    })
  );
  const genres = Object.keys(map);
  const decades = Array.from(new Set(genres.flatMap(g => Object.keys(map[g])))).sort();
  return { genres, decades, data: genres.map(g => ({ genre: g, ...decades.reduce((acc, d) => ({ ...acc, [d]: map[g][d] || 0 }), {}) })) };
}
