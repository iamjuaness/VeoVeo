import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  Star,
  TrendingUp,
  Download,
  Info,
  Trophy,
  Medal,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "../../../shared/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../../../shared/components/ui/card";
import { Progress } from "../../../shared/components/ui/progress";
import { Badge } from "../../../shared/components/ui/badge";
import { useMovies } from "../../movies/context/MoviesContext";
import { Link } from "react-router-dom";
import { UserMenu } from "../../auth/components/UserMenu";
import { useMemo, useState, useRef } from "react";
import { FullScreenLoader } from "../../../shared/components/common/Loader";
import {
  percentile,
  getGenreDiversity,
  getGenreConcentration,
  getGenreAffinity,
  splitClassicModern,
  getDurationRatingTrend,
  getAvgRatingByMonth,
  getViewsByMonth,
  getYearsRanking,
  getViewsByDayOfWeek,
  getRewatchDistribution,
} from "../../../shared/utils/statsfunctions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  LabelList,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
  Pie,
} from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// Utilidad para desplazar fechas (resta o suma días)
function shiftDate(date: Date, numDays: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
}

export default function StatsPage() {
  const { totalResults } = useMovies();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { moviesWatchedList, moviesWatchLaterList, statsLoading } = useMovies();

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalSeconds = moviesWatchedList.reduce((acc, movie) => {
      return acc + (movie.duration ?? 0);
    }, 0);

    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const genreCountMap: Record<string, number> = {};

    // Contar solo el primer género de cada película
    moviesWatchedList.forEach((movie) => {
      const firstGenre =
        movie.genres && movie.genres.length > 0 ? movie.genres[0] : null;
      if (firstGenre) {
        genreCountMap[firstGenre] = (genreCountMap[firstGenre] || 0) + 1;
      }
    });

    const topGenres = Object.entries(genreCountMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    // Películas más vistas
    const mostWatchedMovies = moviesWatchedList
      .filter((m) => m.watchCount > 0)
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, 10);

    // Décadas más vistas
    const decadeStats = moviesWatchedList.reduce((acc, movie) => {
      const decade = Math.floor(movie.year / 10) * 10;
      acc[decade] = (acc[decade] || 0) + 1; // Incrementa solo 1 por película
      return acc;
    }, {} as Record<number, number>);

    const topDecades = Object.entries(decadeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const durations = moviesWatchedList.map((m) => m.duration || 0);
    const ratings = moviesWatchedList.map((m) => m.rating || 0);
    const rewatches = moviesWatchedList.reduce(
      (acc, m) => acc + Math.max(0, m.watchCount - 1),
      0
    );

    const rewatchRate = moviesWatchedList.length
      ? rewatches / moviesWatchedList.length
      : 0;
    const weightedRating = moviesWatchedList.length
      ? moviesWatchedList.reduce(
          (acc, m) => acc + m.rating * Math.max(1, m.watchCount),
          0
        ) /
        moviesWatchedList.reduce((acc, m) => acc + Math.max(1, m.watchCount), 0)
      : 0;

    // Watch Later duration calculation
    const watchLaterTotalSeconds = moviesWatchLaterList.reduce((acc, movie) => {
      return acc + (movie.duration ?? 0);
    }, 0);
    const watchLaterTotalMinutes = Math.floor(watchLaterTotalSeconds / 60);
    const watchLaterTotalHours = Math.floor(watchLaterTotalMinutes / 60);
    const watchLaterRemainingMinutes = watchLaterTotalMinutes % 60;

    const p50Rating = percentile(ratings, 50);
    const p75Rating = percentile(ratings, 75);
    const p90Rating = percentile(ratings, 90);
    const p50Duration = percentile(durations, 50);
    const p75Duration = percentile(durations, 75);
    const p90Duration = percentile(durations, 90);

    const genreDiversity = getGenreDiversity(moviesWatchedList);
    const genreConcentration = getGenreConcentration(moviesWatchedList, 3);
    const genreAffinity = getGenreAffinity(moviesWatchedList, 3);
    const classicModern = splitClassicModern(moviesWatchedList);
    const durationRatingCorr = getDurationRatingTrend(moviesWatchedList);

    const outliers = {
      longest: moviesWatchedList.reduce(
        (a, b) => ((a.duration || 0) > (b.duration || 0) ? a : b),
        moviesWatchedList[0]
      ),
      shortest: moviesWatchedList.reduce(
        (a, b) => ((a.duration || 0) < (b.duration || 0) ? a : b),
        moviesWatchedList[0]
      ),
      oldest: moviesWatchedList.reduce(
        (a, b) => ((a.year || 9999) < (b.year || 9999) ? a : b),
        moviesWatchedList[0]
      ),
      newest: moviesWatchedList.reduce(
        (a, b) => ((a.year || 0) > (b.year || 0) ? a : b),
        moviesWatchedList[0]
      ),
      highest: moviesWatchedList.reduce(
        (a, b) => ((a.rating || 0) > (b.rating || 0) ? a : b),
        moviesWatchedList[0]
      ),
      lowest: moviesWatchedList.reduce(
        (a, b) => ((a.rating || 10) < (b.rating || 10) ? a : b),
        moviesWatchedList[0]
      ),
      mostRewatched: moviesWatchedList.reduce(
        (a, b) => ((a.watchCount || 0) > (b.watchCount || 0) ? a : b),
        moviesWatchedList[0]
      ),
    };

    return {
      totalMovies: totalResults,
      watchedMovies: moviesWatchedList.length,
      totalSeconds,
      totalMinutes,
      totalHours,
      remainingMinutes,
      averageRating:
        moviesWatchedList.reduce((acc, m) => acc + m.rating, 0) /
          moviesWatchedList.length || 0,
      topGenres,
      mostWatchedMovies,
      topDecades,
      watchLaterCount: moviesWatchLaterList.length,
      completionRate: (moviesWatchedList.length / totalResults) * 100,
      rewatchRate,
      weightedRating,
      p50Rating,
      p75Rating,
      p90Rating,
      p50Duration,
      p75Duration,
      p90Duration,
      genreDiversity,
      genreConcentration,
      genreAffinity,
      classicModern,
      durationRatingCorr,
      outliers,
      watchLaterTotalSeconds,
      watchLaterTotalMinutes,
      watchLaterTotalHours,
      watchLaterRemainingMinutes,
      genreCountMap, // Expose map for achievements
    };
  }, [moviesWatchLaterList, moviesWatchedList, totalResults]);

  const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

  const totalBefore1980 = moviesWatchedList.filter((m) => m.year < 1980).length;
  const moviesByDecade = (decade: number) =>
    moviesWatchedList.filter((m) => Math.floor(m.year / 10) * 10 === decade)
      .length;
  const rewatchMaxCount = Math.max(
    ...moviesWatchedList.map((m) => m.watchCount || 1),
    0
  );
  const weekStreak = (() => {
    // Calcula racha máxima semanal aproximada
    const days = uniq(
      moviesWatchedList.flatMap((m) =>
        (m.watchedAt ?? []).map((d) => d.slice(0, 10))
      )
    ).sort();
    let streak = 1,
      max = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 3600 * 24);
      if (diff <= 1.5) {
        streak++;
        max = Math.max(max, streak);
      } else {
        streak = 1;
      }
    }
    return max;
  })();

  // Puedes ajustar los nombres, criterios e iconos/textos según tu preferencia
  const LOGROS = [
    {
      id: "cinefilo1",
      name: "Cinéfilo Novato",
      desc: "5 películas vistas",
      icon: `🎬`,
      achieved: stats.watchedMovies >= 5,
      progress: Math.min(stats.watchedMovies, 5) + "/5",
      left: Math.max(0, 5 - stats.watchedMovies),
    },
    {
      id: "cinefilo2",
      name: "Cinéfilo Regular",
      desc: "20 películas vistas",
      icon: "🎥",
      achieved: stats.watchedMovies >= 20,
      progress: Math.min(stats.watchedMovies, 20) + "/20",
      left: Math.max(0, 20 - stats.watchedMovies),
    },
    {
      id: "cinefilo3",
      name: "Cinéfilo Experto",
      desc: "100+ películas vistas",
      icon: "🏆",
      achieved: stats.watchedMovies >= 100,
      progress: Math.min(stats.watchedMovies, 100) + "/100",
      left: Math.max(0, 100 - stats.watchedMovies),
    },
    {
      id: "maratonista24h",
      name: "Maratón 24h",
      desc: "24 horas acumuladas",
      icon: "⏰",
      achieved: stats.totalHours >= 24,
      progress: Math.min(stats.totalHours, 24) + "h/24h",
      left: Math.max(0, 24 - stats.totalHours),
    },
    {
      id: "maratonista72h",
      name: "Maratón 72h",
      desc: "72 horas acumuladas",
      icon: "⏳",
      achieved: stats.totalHours >= 72,
      progress: Math.min(stats.totalHours, 72) + "h/72h",
      left: Math.max(0, 72 - stats.totalHours),
    },
    {
      id: "genero-diverso-8",
      name: "Explorador de Géneros",
      desc: "Ver 8 géneros distintos",
      icon: "🧭",
      achieved: stats.genreDiversity.unique >= 8,
      progress: Math.min(stats.genreDiversity.unique, 8) + "/8",
      left: Math.max(0, 8 - stats.genreDiversity.unique),
    },
    {
      id: "genero-diverso-16",
      name: "Gran Explorador",
      desc: "Ver 16 géneros distintos",
      icon: "🌏",
      achieved: stats.genreDiversity.unique >= 16,
      progress: Math.min(stats.genreDiversity.unique, 16) + "/16",
      left: Math.max(0, 16 - stats.genreDiversity.unique),
    },
    {
      id: "curador",
      name: "Curador Exigente",
      desc: "Promedio rating ≥8, con 20 películas",
      icon: "⭐",
      achieved: stats.averageRating >= 8 && stats.watchedMovies >= 20,
      progress:
        stats.averageRating.toFixed(2) +
        " / 8.00 (" +
        stats.watchedMovies +
        "/20 pelis)",
      left:
        stats.averageRating < 8
          ? (8 - stats.averageRating).toFixed(2) + " de rating"
          : 20 - stats.watchedMovies + " pelis",
    },
    {
      id: "elite",
      name: "Curador Élite",
      desc: "Promedio rating ≥8.5, con 50 películas",
      icon: "👑",
      achieved: stats.averageRating >= 8.5 && stats.watchedMovies >= 50,
      progress:
        stats.averageRating.toFixed(2) +
        " / 8.50 (" +
        stats.watchedMovies +
        "/50 pelis)",
      left:
        stats.averageRating < 8.5
          ? (8.5 - stats.averageRating).toFixed(2) + " de rating"
          : 50 - stats.watchedMovies + " pelis",
    },
    {
      id: "fan-dedicado",
      name: "Fan Recurrente",
      desc: "Mira una peli 3 veces",
      icon: "🔄",
      achieved: rewatchMaxCount >= 3,
      progress: Math.min(rewatchMaxCount, 3) + "/3",
      left: Math.max(0, 3 - rewatchMaxCount),
    },
    {
      id: "ultra-fan",
      name: "Ultra Fan",
      desc: "Mira una peli 10 veces (!)",
      icon: "💯",
      achieved: rewatchMaxCount >= 10,
      progress: Math.min(rewatchMaxCount, 10) + "/10",
      left: Math.max(0, 10 - rewatchMaxCount),
    },
    {
      id: "arqueologo",
      name: "Arqueólogo",
      desc: "10+ películas anteriores a 1980",
      icon: "🏛️",
      achieved: totalBefore1980 >= 10,
      progress: Math.min(totalBefore1980, 10) + "/10",
      left: Math.max(0, 10 - totalBefore1980),
    },
    {
      id: "super-ochentoso",
      name: "Época Favorita",
      desc: "20+ películas de la misma década",
      icon: "🕰️",
      achieved: [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].some(
        (decade) => moviesByDecade(decade) >= 20
      ),
      progress: [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]
        .map((d) => `${d}s:${moviesByDecade(d)}`)
        .join(" | "),
      left: "Llega a 20 en tu década favorita",
    },
    {
      id: "racha",
      name: "Racha imparable",
      desc: "Ver películas 7 días seguidos",
      icon: "🔥",
      achieved: weekStreak >= 7,
      progress: Math.min(weekStreak, 7) + "/7",
      left: Math.max(0, 7 - weekStreak) + " días seguidos",
    },
    {
      id: "semana-cinefila",
      name: "Semana Cinéfila",
      desc: "Ver peli todos los días de la semana",
      icon: "📅",
      achieved: (() => {
        const dow = [0, 1, 2, 3, 4, 5, 6];
        const days = uniq(
          moviesWatchedList.flatMap((m) =>
            (m.watchedAt ?? []).map((d) => new Date(d).getDay())
          )
        );
        return dow.every((d) => days.includes(d));
      })(),
      progress:
        "Días activos: " +
        uniq(
          moviesWatchedList.flatMap((m) =>
            (m.watchedAt ?? []).map((d) => new Date(d).getDay())
          )
        ).length +
        "/7",
      left: "Ver pelis todos los días una semana",
    },
    {
      id: "gran-completador",
      name: "Gran Completador",
      desc: "50 pelis con rating >7.5",
      icon: "📈",
      achieved: moviesWatchedList.filter((m) => m.rating >= 7.5).length >= 50,
      progress: moviesWatchedList.filter((m) => m.rating >= 7.5).length + "/50",
      left:
        Math.max(
          0,
          50 - moviesWatchedList.filter((m) => m.rating >= 7.5).length
        ) + " pelis",
    },
    {
      id: "planificador",
      name: "Planificador",
      desc: "50+ películas en Watchlist",
      icon: "📝",
      achieved: stats.watchLaterCount >= 50,
      progress: Math.min(stats.watchLaterCount, 50) + "/50",
      left: Math.max(0, 50 - stats.watchLaterCount),
    },
    {
      id: "indeciso",
      name: "Coleccionista",
      desc: "100+ películas en Watchlist",
      icon: "📚",
      achieved: stats.watchLaterCount >= 100,
      progress: Math.min(stats.watchLaterCount, 100) + "/100",
      left: Math.max(0, 100 - stats.watchLaterCount),
    },
    {
      id: "critico-duro",
      name: "Crítico Duro",
      desc: "Calificar una película con 1 estrella",
      icon: "🔨",
      achieved: moviesWatchedList.some((m) => m.rating === 1),
      progress: moviesWatchedList.some((m) => m.rating === 1) ? "1/1" : "0/1",
      left: moviesWatchedList.some((m) => m.rating === 1) ? 0 : 1,
    },
    {
      id: "perfeccionista",
      name: "Perfeccionista",
      desc: "Calificar una película con 10 estrellas",
      icon: "💎",
      achieved: moviesWatchedList.some((m) => m.rating === 10),
      progress: moviesWatchedList.some((m) => m.rating === 10) ? "1/1" : "0/1",
      left: moviesWatchedList.some((m) => m.rating === 10) ? 0 : 1,
    },
    {
      id: "rey-drama",
      name: "Rey del Drama",
      desc: "Ver 10 películas de Drama",
      icon: "🎭",
      achieved: (stats.genreCountMap["Drama"] || 0) >= 10,
      progress: (stats.genreCountMap["Drama"] || 0) + "/10",
      left: Math.max(0, 10 - (stats.genreCountMap["Drama"] || 0)),
    },
    {
      id: "accion-hero",
      name: "Héroe de Acción",
      desc: "Ver 10 películas de Acción",
      icon: "💥",
      achieved: (stats.genreCountMap["Action"] || 0) >= 10,
      progress: (stats.genreCountMap["Action"] || 0) + "/10",
      left: Math.max(0, 10 - (stats.genreCountMap["Action"] || 0)),
    },
    {
      id: "risa-asegurada",
      name: "Risa Asegurada",
      desc: "Ver 10 Comedias",
      icon: "😂",
      achieved: (stats.genreCountMap["Comedy"] || 0) >= 10,
      progress: (stats.genreCountMap["Comedy"] || 0) + "/10",
      left: Math.max(0, 10 - (stats.genreCountMap["Comedy"] || 0)),
    },
    {
      id: "terrorifico",
      name: "Amante del Terror",
      desc: "Ver 10 películas de Terror",
      icon: "👻",
      achieved: (stats.genreCountMap["Horror"] || 0) >= 10,
      progress: (stats.genreCountMap["Horror"] || 0) + "/10",
      left: Math.max(0, 10 - (stats.genreCountMap["Horror"] || 0)),
    },
    {
      id: "futurista",
      name: "Futurista",
      desc: "Ver 10 películas de Sci-Fi",
      icon: "👽",
      achieved: (stats.genreCountMap["Sci-Fi"] || 0) >= 10,
      progress: (stats.genreCountMap["Sci-Fi"] || 0) + "/10",
      left: Math.max(0, 10 - (stats.genreCountMap["Sci-Fi"] || 0)),
    },
  ];

  const bins = Array.from({ length: 11 }, (_, i) => ({
    bin: (4 + i * 0.5).toFixed(1), // "4.0", "4.5", ..., "10.0"
    count: 0,
  }));
  moviesWatchedList.forEach((m) => {
    if (typeof m.rating === "number") {
      // Ratings menores a 4.0 van al primer bin, mayores a 10 al último
      const idx = Math.min(
        Math.max(Math.floor((m.rating - 4) * 2), 0),
        bins.length - 1
      );
      bins[idx].count++;
    }
  });

  const binsDur = Array(8)
    .fill(0)
    .map((_, i) => ({
      bin: `${60 + 20 * i}-${79 + 20 * i}min`,
      count: 0,
    }));
  moviesWatchedList.forEach((m) => {
    if (typeof m.duration === "number") {
      const idx = Math.max(
        0,
        Math.min(Math.floor((m.duration / 60 - 60) / 20), binsDur.length - 1)
      );
      if (binsDur[idx]) binsDur[idx].count++;
    }
  });

  const activityByDay: Record<string, number> = {};
  moviesWatchedList.forEach(
    (m) =>
      Array.isArray(m.watchedAt) &&
      m.watchedAt.forEach((date) => {
        const day = date.substring(0, 10);
        activityByDay[day] = (activityByDay[day] || 0) + 1;
      })
  );

  const activityArray = Object.entries(activityByDay).map(([date, count]) => ({
    date,
    count,
  }));

  const affinityData = stats.genreAffinity.map((g) => ({
    genre: g.genre,
    avg: g.avg,
  }));

  const viewsByMonth = getViewsByMonth(moviesWatchedList);
  const avgRatingByMonth = getAvgRatingByMonth(moviesWatchedList);

  const yearsRanking = getYearsRanking(moviesWatchedList).slice(0, 10);
  const byDOW = getViewsByDayOfWeek(moviesWatchedList);
  const byRewatch = getRewatchDistribution(moviesWatchedList);

  // Data for Duration Category Chart
  const durationCategories = useMemo(() => {
    const short = moviesWatchedList.filter((m) => (m.duration || 0) / 60 < 90);
    const medium = moviesWatchedList.filter(
      (m) => (m.duration || 0) / 60 >= 90 && (m.duration || 0) / 60 <= 120
    );
    const long = moviesWatchedList.filter((m) => (m.duration || 0) / 60 > 120);

    const getAvg = (list: any[]) =>
      list.length
        ? list.reduce((a, b) => a + (b.rating || 0), 0) / list.length
        : 0;

    return [
      {
        name: "Cortas (<90m)",
        rating: getAvg(short),
        count: short.length,
        fill: "#f472b6",
      },
      {
        name: "Medias (90-120m)",
        rating: getAvg(medium),
        count: medium.length,
        fill: "#60a5fa",
      },
      {
        name: "Largas (>120m)",
        rating: getAvg(long),
        count: long.length,
        fill: "#a3e635",
      },
    ];
  }, [moviesWatchedList]);

  // Data for Rating vs Duration Interval Chart
  const ratingByDurationInterval = useMemo(() => {
    const intervals: Record<string, { sum: number; count: number }> = {};

    moviesWatchedList.forEach((m) => {
      if (!m.duration || !m.rating) return;
      // Convert seconds to minutes
      const durationMin = m.duration / 60;
      // Round to nearest 10 min for smoother curve
      const interval = Math.floor(durationMin / 10) * 10;
      const key = `${interval}`;
      if (!intervals[key]) intervals[key] = { sum: 0, count: 0 };
      intervals[key].sum += m.rating;
      intervals[key].count++;
    });

    return Object.entries(intervals)
      .map(([min, data]) => ({
        duration: parseInt(min),
        avgRating: data.sum / data.count,
        count: data.count,
        label: `${min}m`,
      }))
      .sort((a, b) => a.duration - b.duration)
      .filter((d) => d.duration >= 60 && d.duration <= 180); // Focus on common movie lengths
  }, [moviesWatchedList]);

  // PDF export function
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#000000",
        onclone: (clonedDoc) => {
          // Replace all oklch and oklab colors with fallback hex colors
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlEl);

            // Replace background colors
            if (
              computedStyle.backgroundColor?.includes("oklch") ||
              computedStyle.backgroundColor?.includes("oklab")
            ) {
              htmlEl.style.backgroundColor = "#0a0a0a";
            }

            // Replace text colors
            if (
              computedStyle.color?.includes("oklch") ||
              computedStyle.color?.includes("oklab")
            ) {
              htmlEl.style.color = "#ffffff";
            }

            // Replace border colors
            if (
              computedStyle.borderColor?.includes("oklch") ||
              computedStyle.borderColor?.includes("oklab")
            ) {
              htmlEl.style.borderColor = "#27272a";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      );
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "JPEG",
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );
        heightLeft -= pageHeight;
      }

      const date = new Date().toLocaleDateString("es-ES");
      pdf.save(`VeoVeo-Stats-${date}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (statsLoading) {
    return (
      <FullScreenLoader message="Estamos preparando tus estadísticas 😊" />
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card shadow-md">
        <div className="container mx-auto px-4 py-4 flex flex-row items-center justify-between relative">
          {/* Botón volver: muestra solo flecha en móvil, flecha + texto en desktop */}
          <Link to="/" className="flex-none">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent flex items-center"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </Link>

          {/* Texto centrado horizontalmente en desktop, ocupa toda la fila en mobile */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center hidden sm:block">
            <h1 className="text-xl font-bold">📊 Mis Estadísticas</h1>
            <p className="text-muted-foreground text-sm">
              Análisis detallado de tu actividad cinematográfica
            </p>
          </div>
          {/* En móvil debajo del botón, apilado */}
          <div className="flex flex-col items-start flex-1 sm:hidden ml-2">
            <h1 className="text-lg font-bold">📊 Mis Estadísticas</h1>
            <p className="text-muted-foreground text-xs">
              Análisis detallado de tu actividad cinematográfica
            </p>
          </div>

          {/* UserMenu fijo arriba a la derecha siempre visible */}
          <div className="fixed right-4 z-50">
            <UserMenu open={showUserMenu} setOpen={setShowUserMenu} />
          </div>
        </div>
      </header>

      {/* Download Report Button - Outside PDF capture area */}
      <div className="container mx-auto px-4 pt-28 pb-4">
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="gap-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
          >
            <Download className="w-4 h-4" />
            {isGeneratingPDF ? "Generando PDF..." : "Descargar Reporte PDF"}
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-8" ref={reportRef}>
        <div>
          {/* Estadísticas generales */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Resumen General
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              <Info className="w-4 h-4 inline mr-1" />
              Vista panorámica de tu actividad cinematográfica: películas
              vistas, tiempo invertido, calidad promedio y lista de pendientes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full max-w-4xl mx-auto">
            <Card className="py-4 rounded-lg shadow bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                <CardTitle className="text-sm font-medium">
                  Películas Vistas
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.watchedMovies.toLocaleString("es-ES")}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {stats.totalMovies.toLocaleString("es-ES")} total (
                  {stats.completionRate.toFixed(2)}
                  %)
                </p>
                <Progress value={stats.completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="py-4 rounded-lg shadow bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                <CardTitle className="text-sm font-medium">
                  Tiempo Total
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalHours}h {stats.remainingMinutes}m
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.floor(stats.totalHours / 24)} días de contenido
                </p>
              </CardContent>
            </Card>

            <Card className="py-4 rounded-lg shadow bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                <CardTitle className="text-sm font-medium">
                  Rating General
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.weightedRating.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ponderado por veces vistas
                </p>
                <p className="text-xs text-yellow-500 mt-1">
                  Simple: {stats.averageRating.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="py-4 rounded-lg shadow bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                <CardTitle className="text-sm font-medium">
                  Ver Después
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.watchLaterCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tiempo restante: {stats.watchLaterTotalHours}h{" "}
                  {stats.watchLaterRemainingMinutes}m
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actividad reciente - Calendar Heatmap */}
          <section className="mt-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🔥 Actividad Reciente
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              <Info className="w-4 h-4 inline mr-1" />
              Mapa de calor que muestra tu constancia cinematográfica. Cada
              celda representa un día, y su intensidad refleja cuántas películas
              viste. Identifica tus rachas y días más activos.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Calendar Heatmap */}
              <Card className="py-4 rounded-lg shadow bg-card flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex gap-2 items-center">
                    <Activity className="h-4 w-4" />
                    Calendario de Visualizaciones
                  </CardTitle>
                  <CardDescription>Actividad en el último año</CardDescription>
                </CardHeader>
                <CardContent>
                  <CalendarHeatmap
                    startDate={shiftDate(new Date(), -365)}
                    endDate={new Date()}
                    values={activityArray}
                    classForValue={(value) => {
                      if (!value) return "color-empty";
                      return value.count < 5
                        ? `color-veoveo-${value.count}`
                        : `color-veoveo-5`;
                    }}
                    tooltipDataAttrs={(value) => {
                      if (!value || !value.date) {
                        return {
                          "data-tooltip-id": "calendar-tooltip",
                          "data-tooltip-content": "Sin datos",
                        } as any;
                      }

                      // Parse date as local time to avoid timezone issues
                      const [year, month, day] = value.date
                        .split("-")
                        .map(Number);
                      const date = new Date(year, month - 1, day);

                      const diasSemana = [
                        "Domingo",
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                        "Sábado",
                      ];
                      const meses = [
                        "Ene",
                        "Feb",
                        "Mar",
                        "Abr",
                        "May",
                        "Jun",
                        "Jul",
                        "Ago",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dic",
                      ];

                      const diaSemana = diasSemana[date.getDay()];
                      const dia = date.getDate();
                      const mes = meses[date.getMonth()];
                      const año = date.getFullYear();

                      const peliculas =
                        value.count === 1 ? "película" : "películas";
                      const mensaje =
                        value.count === 0
                          ? `${diaSemana}, ${dia} ${mes} ${año}: Sin películas`
                          : `${diaSemana}, ${dia} ${mes} ${año}: ${value.count} ${peliculas}`;

                      return {
                        "data-tooltip-id": "calendar-tooltip",
                        "data-tooltip-content": mensaje,
                      } as any;
                    }}
                    showWeekdayLabels={false}
                  />
                  <ReactTooltip id="calendar-tooltip" />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Actividad reciente - Calendar Heatmap */}
          <div className="space-y-8">
            {/* Primera fila - Géneros (Full Width) */}
            <div className="grid grid-cols-1 gap-8">
              {/* Géneros más vistos */}
              <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChart className="w-5 h-5 text-primary" />
                    Géneros Favoritos
                  </CardTitle>
                  <CardDescription>
                    Tus preferencias principales por género.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.topGenres
                        .map(([name, value]) => ({ name, value }))
                        .slice(0, 10)}
                      layout="vertical"
                      margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.1}
                        horizontal={false}
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 13, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          color: "#f3f4f6",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        radius={[0, 4, 4, 0]}
                        barSize={32}
                      >
                        <LabelList
                          dataKey="value"
                          position="right"
                          style={{
                            fill: "#9ca3af",
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Segunda fila - Películas más vistas y Décadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Películas más vistas */}
              <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Películas Más Repetidas
                  </CardTitle>
                  <CardDescription>
                    Tus verdaderos clásicos personales.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stats.mostWatchedMovies.slice(0, 6).map((movie, index) => (
                      <div
                        key={movie.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={movie.poster || "/placeholder.svg"}
                            alt={movie.title}
                            className="w-12 h-16 rounded object-cover shadow-sm"
                          />
                          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-semibold text-sm truncate"
                            title={movie.title}
                          >
                            {movie.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{movie.year}</span>
                            <span>•</span>
                            <span className="flex items-center text-yellow-500">
                              ★ {movie.rating}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              {movie.watchCount} vistas
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Décadas favoritas */}
              <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    Décadas Favoritas
                  </CardTitle>
                  <CardDescription>
                    Tu viaje en el tiempo cinematográfico.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.topDecades
                        .map(([name, value]) => ({ name: `${name}s`, value }))
                        .sort((a, b) => parseInt(a.name) - parseInt(b.name))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.1}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          color: "#f3f4f6",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#ec4899"
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tercera fila - Actividad y Logros */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Actividad reciente (KPIs) */}
              <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    Resumen de Actividad
                  </CardTitle>
                  <CardDescription>
                    Métricas clave de tu perfil.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-xs text-muted-foreground mb-1">
                        Promedio/Peli
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        {(stats.totalMinutes / stats.watchedMovies).toFixed(0)}m
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="text-xs text-muted-foreground mb-1">
                        Max Duración
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        {Math.max(
                          ...stats.mostWatchedMovies.map((m) => m.duration / 60)
                        ).toFixed(0)}
                        m
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="text-xs text-muted-foreground mb-1">
                        Total Rewatch
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        {moviesWatchedList.reduce(
                          (acc, m) => acc + Math.max(0, m.watchCount - 1),
                          0
                        )}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="text-xs text-muted-foreground mb-1">
                        Género Top
                      </div>
                      <div
                        className="text-lg font-bold text-green-600 truncate"
                        title={stats.topGenres[0]?.[0] || "N/A"}
                      >
                        {stats.topGenres[0]?.[0] || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
                    <span className="text-sm font-medium">Década Top</span>
                    <Badge variant="outline" className="text-sm">
                      {stats.topDecades[0]?.[0]}s
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Logros */}
              <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow col-span-1 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Logros y Medallas
                  </CardTitle>
                  <CardDescription>
                    {LOGROS.filter((l) => l.achieved).length} de {LOGROS.length}{" "}
                    desbloqueados
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {LOGROS.filter((l) => l.achieved).length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                        ¡Sigue viendo películas para desbloquear logros!
                      </div>
                    )}
                    {LOGROS.sort((a, b) =>
                      a.achieved === b.achieved ? 0 : a.achieved ? -1 : 1
                    ).map((logro) => (
                      <div
                        key={logro.id}
                        className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                          logro.achieved
                            ? "bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20 shadow-sm hover:shadow-md hover:border-yellow-500/40"
                            : "bg-muted/20 border-border/30 opacity-50 grayscale hover:opacity-70"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-2xl shadow-inner ${
                            logro.achieved
                              ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white ring-2 ring-yellow-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {logro.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p
                              className={`font-bold text-sm truncate ${
                                logro.achieved
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {logro.name}
                            </p>
                            {logro.achieved && (
                              <Medal className="w-4 h-4 text-yellow-500 shrink-0" />
                            )}
                          </div>
                          <p
                            className="text-xs text-muted-foreground line-clamp-2 leading-tight mb-1.5"
                            title={logro.desc}
                          >
                            {logro.desc}
                          </p>

                          {/* Progress Bar for unachieved */}
                          {!logro.achieved && (
                            <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className="bg-orange-400 h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    typeof logro.progress === "string"
                                      ? 0
                                      : parseFloat(logro.progress as any) || 0
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          )}
                          {!logro.achieved && (
                            <p className="text-[10px] text-orange-500 font-medium mt-1 text-right">
                              Falta:{" "}
                              {typeof logro.left === "number" && logro.left > 0
                                ? logro.left
                                : logro.left || logro.progress}
                            </p>
                          )}
                          {logro.achieved && (
                            <p className="text-[10px] text-green-600 font-medium mt-1">
                              ¡Completado!
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        {}
        <section className="mt-20">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Analítica Básica
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            <Info className="w-4 h-4 inline mr-1" />
            Métricas estadísticas avanzadas que revelan patrones ocultos en tus
            preferencias cinematográficas.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Por Género */}
            {/* Percentiles de Rating */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex gap-2 items-center">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Distribución de Rating Vistos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        P50
                      </div>
                      <div className="font-bold text-yellow-600 text-lg">
                        {stats.p50Rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        P75
                      </div>
                      <div className="font-bold text-yellow-500 text-lg">
                        {stats.p75Rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        P90
                      </div>
                      <div className="font-bold text-yellow-400 text-lg">
                        {stats.p90Rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      El 50% de tus películas tienen{" "}
                      {stats.p50Rating.toFixed(1)} o menos. El top 10% supera el{" "}
                      {stats.p90Rating.toFixed(1)}.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Percentiles de Duración */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex gap-2 items-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Distribución de Duraciones Vistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        P50
                      </div>
                      <div className="font-bold text-blue-500 text-lg">
                        {(stats.p50Duration / 60).toFixed(0)}m
                      </div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        P75
                      </div>
                      <div className="font-bold text-blue-600 text-lg">
                        {(stats.p75Duration / 60).toFixed(0)}m
                      </div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        P90
                      </div>
                      <div className="font-bold text-blue-700 text-lg">
                        {(stats.p90Duration / 60).toFixed(0)}m
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      La mitad de lo que ves dura menos de{" "}
                      {(stats.p50Duration / 60).toFixed(0)} min. Solo el 10%
                      supera los {(stats.p90Duration / 60).toFixed(0)} min.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diversidad de Géneros */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex gap-2 items-center">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  Diversidad de Géneros
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {stats.genreDiversity.unique}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / 19
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Géneros explorados
                  </div>
                  <div className="text-xs font-medium text-green-500">
                    {(100 * stats.genreDiversity.ratio).toFixed(0)}% Cobertura
                  </div>
                </div>
                <div className="h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Vistos",
                            value: stats.genreDiversity.unique,
                            fill: "#22c55e",
                          },
                          {
                            name: "Restantes",
                            value: 19 - stats.genreDiversity.unique,
                            fill: "#374151",
                          },
                        ]}
                        dataKey="value"
                        innerRadius={25}
                        outerRadius={40}
                        stroke="none"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Hábito de Repetición */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex gap-2 items-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Hábito de Repetición
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {(100 * stats.rewatchRate).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tasa de re-visualización
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rating Ponderado:{" "}
                    <span className="text-yellow-500 font-medium">
                      {stats.weightedRating.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Rewatch",
                            value: stats.rewatchRate,
                            fill: "#9333ea",
                          },
                          {
                            name: "Nuevas",
                            value: 1 - stats.rewatchRate,
                            fill: "#374151",
                          },
                        ]}
                        dataKey="value"
                        innerRadius={25}
                        outerRadius={40}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Afinidad por Género (Top 3) */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow col-span-1 sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex gap-2 items-center">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  Top 3 Géneros Vistos con Mejor Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.genreAffinity.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.genre}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0
                            ? "bg-yellow-500/20 text-yellow-500"
                            : idx === 1
                            ? "bg-gray-400/20 text-gray-400"
                            : "bg-orange-700/20 text-orange-700"
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.genre}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.count} vistas
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-yellow-500">
                          ★ {item.avg.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Clásicos vs Modernos */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex gap-2 items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Clásicos vs Modernos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>{" "}
                      Clásicas
                    </span>
                    <span className="font-medium">
                      {stats.classicModern.classic}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-pink-600"></div>{" "}
                      Modernas
                    </span>
                    <span className="font-medium">
                      {stats.classicModern.modern}
                    </span>
                  </div>
                  <div className="pt-2 text-xs text-muted-foreground border-t border-border/50 mt-2">
                    Avg:{" "}
                    <span className="text-blue-400">
                      {stats.classicModern.avgClassic.toFixed(1)}
                    </span>{" "}
                    vs{" "}
                    <span className="text-pink-400">
                      {stats.classicModern.avgModern.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="h-24 w-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Clásicas",
                            value: stats.classicModern.classic,
                            fill: "#2563eb",
                          },
                          {
                            name: "Modernas",
                            value: stats.classicModern.modern,
                            fill: "#db2777",
                          },
                        ]}
                        dataKey="value"
                        innerRadius={0}
                        outerRadius={40}
                        stroke="none"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            {/* Tendencia Duración vs Rating */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Activity className="h-4 w-4" />
                  Rating por Duración
                </CardTitle>
                <CardDescription>
                  ¿De qué tanta duración prefieres tus películas?
                </CardDescription>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={durationCategories}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 10]} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                      formatter={(value: number) => [
                        `★ ${value.toFixed(2)}`,
                        "Rating Promedio",
                      ]}
                    />
                    <Bar
                      dataKey="rating"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                      background={{ fill: "#374151" }}
                    >
                      {durationCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="rating"
                        position="right"
                        formatter={(val: number) => val.toFixed(1)}
                        style={{ fill: "#9ca3af", fontSize: 11 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Récords Personales */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Award className="h-4 w-4" />
                  Récords Personales
                </CardTitle>
                <CardDescription>Tus extremos cinematográficos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 p-2 bg-blue-950/30 rounded border border-blue-900/50">
                    <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                      Película Más Larga
                    </span>
                    <span
                      className="font-medium truncate"
                      title={stats.outliers.longest.title}
                    >
                      {stats.outliers.longest.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(stats.outliers.longest.duration / 60)} min
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-2 bg-pink-950/30 rounded border border-pink-900/50">
                    <span className="text-xs text-pink-400 font-semibold uppercase tracking-wider">
                      Película Más Corta
                    </span>
                    <span
                      className="font-medium truncate"
                      title={stats.outliers.shortest.title}
                    >
                      {stats.outliers.shortest.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(stats.outliers.shortest.duration / 60)} min
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-2 bg-yellow-950/30 rounded border border-yellow-900/50">
                    <span className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">
                      Película con Mayor Rating
                    </span>
                    <span
                      className="font-medium truncate"
                      title={stats.outliers.highest.title}
                    >
                      {stats.outliers.highest.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ★ {stats.outliers.highest.rating?.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-2 bg-red-950/30 rounded border border-red-900/50">
                    <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                      Película con Menor Rating
                    </span>
                    <span
                      className="font-medium truncate"
                      title={stats.outliers.lowest.title}
                    >
                      {stats.outliers.lowest.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ★ {stats.outliers.lowest.rating?.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-2 bg-green-950/30 rounded border border-green-900/50">
                    <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">
                      Película Vista Más Nueva
                    </span>
                    <span
                      className="font-medium truncate"
                      title={stats.outliers.newest.title}
                    >
                      {stats.outliers.newest.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Año {stats.outliers.newest.year}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-2 bg-gray-800/30 rounded border border-gray-700/50">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      Película Vista Más Antigua
                    </span>
                    <span
                      className="font-medium truncate"
                      title={stats.outliers.oldest.title}
                    >
                      {stats.outliers.oldest.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Año {stats.outliers.oldest.year}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-2 bg-purple-950/30 rounded border border-purple-900/50 col-span-1 sm:col-span-2">
                    <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
                      Película Más Repetida
                    </span>
                    <span
                      className="font-medium truncate"
                      title={stats.outliers.mostRewatched.title}
                    >
                      {stats.outliers.mostRewatched.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.outliers.mostRewatched.watchCount} visualizaciones
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        {/* Segunda sección - Gráficos avanzados */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Analítica & Gráficos Avanzados
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            <Info className="w-4 h-4 inline mr-1" />
            Visualizaciones interactivas que transforman tus datos en insights
            accionables. Descubre tendencias, patrones y evolución temporal.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Histograma de Ratings */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <BarChart3 className="h-4 w-4" />
                  Histograma de Ratings
                </CardTitle>
                <CardDescription>
                  Distribución de las calificaciones.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-54 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bins}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.1}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="bin"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e42" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Histograma de Duraciones */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Clock className="h-4 w-4" />
                  Histograma de Duraciones
                </CardTitle>
                <CardDescription>
                  Preferencias de duración (minutos).
                </CardDescription>
              </CardHeader>
              <CardContent className="h-54 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={binsDur}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.1}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="bin"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                    />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Afinidad por Género: Mini Ranking gráfico */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Star className="h-4 w-4" />
                  Afinidad por Género
                </CardTitle>
                <CardDescription>
                  Top mejores géneros por rating promedio.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-54 w-full">
                <ResponsiveContainer width="99%" height="95%">
                  <BarChart
                    data={affinityData.slice(0, 7)}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.1}
                      horizontal={false}
                    />
                    <XAxis type="number" domain={[0, 10]} fontSize={10} hide />
                    <YAxis
                      dataKey="genre"
                      type="category"
                      fontSize={10}
                      width={70}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                      formatter={(val: number) => [
                        `★ ${val.toFixed(2)}`,
                        "Rating",
                      ]}
                    />
                    <Bar dataKey="avg" fill="#60a5fa" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="avg"
                        position="right"
                        formatter={(val: number) => val.toFixed(1)}
                        style={{ fill: "#9ca3af", fontSize: 10 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top años más vistos */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <BarChart3 className="h-4 w-4" />
                  Top Años Más Vistos
                </CardTitle>
                <CardDescription>Tu "edad de oro" del cine.</CardDescription>
              </CardHeader>
              <CardContent className="h-54 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearsRanking}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.1}
                      horizontal={false}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="year"
                      type="category"
                      fontSize={10}
                      width={40}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="count"
                        position="right"
                        style={{ fill: "#9ca3af", fontSize: 10 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Días de la semana */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Calendar className="h-4 w-4" />
                  Actividad Semanal
                </CardTitle>
                <CardDescription>¿Qué día ves más películas?</CardDescription>
              </CardHeader>
              <CardContent className="h-54 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDOW}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.1}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución de Revisiones */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Eye className="h-4 w-4" />
                  Rewatch
                </CardTitle>
                <CardDescription>Veces que repites películas.</CardDescription>
              </CardHeader>
              <CardContent className="h-54 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRewatch}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.1}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="times"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                    />
                    <Bar dataKey="count" fill="#a21caf" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evolución de visualizaciones y rating */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <BarChart3 className="h-4 w-4" />
                  Evolución de Visualizaciones
                </CardTitle>
                <CardDescription>
                  Línea temporal de tu actividad mensual. Identifica tus meses
                  más activos y rachas.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={viewsByMonth}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorViews"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evolución del rating */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Star className="h-4 w-4" />
                  Evolución del Rating Visto
                </CardTitle>
                <CardDescription>
                  Evolución de tu criterio de calidad a lo largo del tiempo. ¿Te
                  vuelves más exigente?
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={avgRatingByMonth}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRating"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f59e42"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e42"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 10]} />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                      formatter={(value: number) => [
                        `★ ${value.toFixed(2)}`,
                        "Rating Promedio",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="avg"
                      stroke="#f59e42"
                      fillOpacity={1}
                      fill="url(#colorRating)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evolución del Rating por Duración */}
            <Card className="py-4 rounded-lg shadow bg-card hover:shadow-xl transition-shadow flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Activity className="h-4 w-4" />
                  Evolución del Rating por Duración
                </CardTitle>
                <CardDescription>
                  Rating promedio agrupado por duración (intervalos de 10 min).
                  Descubre tu "duración ideal".
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={ratingByDurationInterval}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRatingDuration"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8884d8"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8884d8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 10]} />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#f3f4f6",
                      }}
                      formatter={(value: number) => [
                        `★ ${value.toFixed(2)}`,
                        "Rating Promedio",
                      ]}
                      labelFormatter={(label) => `Duración: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgRating"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorRatingDuration)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
