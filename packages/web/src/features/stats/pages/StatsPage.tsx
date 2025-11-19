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
} from "lucide-react";
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
import { useMemo, useState } from "react";
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
    getRatingVsDuration,
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
    LineChart,
    Line,
    ScatterChart,
    Scatter,
} from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";

// Utilidad para desplazar fechas (resta o suma días)
function shiftDate(date: Date, numDays: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
}

export default function StatsPage() {
    const { totalResults } = useMovies();
    const [showUserMenu, setShowUserMenu] = useState(false);
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
            icon: "🎬",
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

    const scatterData = getRatingVsDuration(moviesWatchedList);
    const genreColors = [
        "#a3e635",
        "#f472b6",
        "#facc15",
        "#60a5fa",
        "#f87171",
        "#34d399",
        "#c084fc",
        "#fb7185",
        "#fdba74",
        "#fda4af",
        "#38bdf8",
        "#818cf8",
        "#fbbf24",
    ];

    const yearsRanking = getYearsRanking(moviesWatchedList).slice(0, 10);
    const byDOW = getViewsByDayOfWeek(moviesWatchedList);
    const byRewatch = getRewatchDistribution(moviesWatchedList);

    if (statsLoading) {
        return (
            <FullScreenLoader message="Estamos preparando tus estadísticas 😊" />
        );
    }
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card">
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

            <main className="container mx-auto px-4 pt-28 pb-8">
                <div>
                    {/* Estadísticas generales */}
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
                                    Rating Promedio
                                </CardTitle>
                                <Star className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {stats.averageRating.toFixed(1)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Calidad de tu selección
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
                                    En tu lista de pendientes
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actividad reciente - Calendar Heatmap */}
                    <section className="mt-8 mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            🔥 Actividad Reciente
                        </h2>
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
                                            return {
                                                "data-tip": `${value?.count} views on ${value?.date
                                                    ?.toString()
                                                    .slice(4, 15)}`,
                                            } as { [key: string]: string };
                                        }}
                                        showWeekdayLabels={false}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Actividad reciente - Calendar Heatmap */}
                    <div className="space-y-8">
                        {/* Primera fila - Géneros y Películas más vistas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Géneros más vistos */}
                            <Card className="py-4 rounded-lg shadow bg-card">
                                <CardHeader className="mt-1">
                                    <CardTitle className="flex items-center gap-2 pt-2">
                                        <PieChart className="w-5 h-5" />
                                        Géneros Más Vistos
                                    </CardTitle>
                                    <CardDescription>
                                        Tus preferencias por categoría
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mb-5">
                                    <div
                                        className={`space-y-4 ${stats.topGenres.length > 4
                                            ? "max-h-56 overflow-y-auto pr-2"
                                            : ""
                                            }`}
                                    >
                                        {stats.topGenres.map(([genre, count], index) => {
                                            const percentage =
                                                (count /
                                                    stats.topGenres.reduce((acc, [, c]) => acc + c, 0)) *
                                                100;
                                            return (
                                                <div key={genre} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                                                            >
                                                                {index + 1}
                                                            </Badge>
                                                            <span className="font-medium">{genre}</span>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {count} película{count > 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                    <Progress value={percentage} className="h-2" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Películas más vistas */}
                            <Card className="py-4 rounded-lg shadow bg-card">
                                <CardHeader className="mt-1">
                                    <CardTitle className="flex items-center gap-2 pt-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Películas Más Vistas
                                    </CardTitle>
                                    <CardDescription>
                                        Tus favoritas de todos los tiempos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mb-5">
                                    <div
                                        className={`space-y-4 ${stats.mostWatchedMovies.length > 4
                                            ? "max-h-56 overflow-y-auto pr-2"
                                            : ""
                                            }`}
                                    >
                                        {stats.mostWatchedMovies.map((movie, index) => (
                                            <div key={movie.id} className="flex items-center gap-3">
                                                <Badge
                                                    variant="outline"
                                                    className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                                                >
                                                    {index + 1}
                                                </Badge>
                                                <img
                                                    src={movie.poster || "/placeholder.svg"}
                                                    width={40}
                                                    height={60}
                                                    className="rounded object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{movie.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {movie.year} • {movie.genres.join(", ")}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="bg-green-600">
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        {movie.watchCount}x
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        ⭐ {movie.rating}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Segunda fila - Décadas favoritas */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Décadas favoritas */}
                            <Card className="py-4 rounded-lg shadow bg-card">
                                <CardHeader className="mt-1">
                                    <CardTitle className="flex items-center gap-2 pt-2">
                                        <BarChart3 className="w-5 h-5" />
                                        Décadas Favoritas
                                    </CardTitle>
                                    <CardDescription>
                                        Épocas cinematográficas que más disfrutas
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mb-5">
                                    <div
                                        className={`space-y-4 ${stats.topDecades.length > 4
                                            ? "max-h-86 overflow-y-auto pr-2"
                                            : ""
                                            }`}
                                    >
                                        {stats.topDecades.map(([decade, count], index) => {
                                            const percentage =
                                                (count /
                                                    stats.topDecades.reduce((acc, [, c]) => acc + c, 0)) *
                                                100;
                                            return (
                                                <div key={decade} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                                                            >
                                                                {index + 1}
                                                            </Badge>
                                                            <span className="font-medium">{decade}s</span>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {count} visualización{count > 1 ? "es" : ""}
                                                        </span>
                                                    </div>
                                                    <Progress value={percentage} className="h-2" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actividad reciente */}
                            <Card className="py-4 rounded-lg shadow bg-card">
                                <CardHeader className="mt-1">
                                    <CardTitle className="flex items-center gap-2 pt-2">
                                        <Activity className="w-5 h-5" />
                                        Actividad Reciente
                                    </CardTitle>
                                    <CardDescription>
                                        Tu comportamiento cinematográfico
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 mb-5 h-86">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Promedio por película
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {(stats.totalMinutes / stats.watchedMovies).toFixed(1)}
                                                min
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Película más larga vista
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {Math.max(
                                                    ...stats.mostWatchedMovies.map((m) => m.duration / 60)
                                                )}
                                                min
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Re-visualizaciones
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {moviesWatchedList.reduce(
                                                    (acc, m) => acc + Math.max(0, m.watchCount - 1),
                                                    0
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Género favorito
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {stats.topGenres[0]?.[0] || "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Década favorita
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {stats.topDecades[0]?.[0]}s
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Logros */}
                            <Card className="py-4 rounded-lg shadow bg-card">
                                <CardHeader className="mt-1">
                                    <CardTitle className="flex items-center gap-2 pt-2">
                                        <Award className="h-4 w-4" />
                                        Logros Desbloqueados & Pendientes
                                    </CardTitle>
                                    <CardDescription>
                                        Avanza hacia tus logros de cinéfilo
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mb-5 overflow-y-auto h-86">
                                    <div className="space-y-3">
                                        <span className="font-bold text-green-600 dark:text-green-300 text-xs pl-2">
                                            Ganados
                                        </span>
                                        {LOGROS.filter((l) => l.achieved).length === 0 && (
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                ¡Aún no tienes logros! Sigue viendo películas.
                                            </span>
                                        )}
                                        {LOGROS.filter((l) => l.achieved).map((logro) => (
                                            <div
                                                key={logro.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800`}
                                            >
                                                <div className="text-2xl">{logro.icon}</div>
                                                <div>
                                                    <p className="font-medium">{logro.name}</p>
                                                    <p className="text-xs">{logro.desc}</p>
                                                    <p className="text-xs text-green-700 dark:text-green-400">
                                                        {"Progreso: " + logro.progress}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        <span className="font-bold text-gray-400 dark:text-gray-500 text-xs pl-2">
                                            Pendientes
                                        </span>
                                        {LOGROS.filter((l) => !l.achieved).map((logro) => (
                                            <div
                                                key={logro.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg opacity-60 border-2 border-dashed bg-white/10`}
                                            >
                                                <div className="text-2xl grayscale">{logro.icon}</div>
                                                <div>
                                                    <p className="font-medium">{logro.name}</p>
                                                    <p className="text-xs">{logro.desc}</p>
                                                    <p className="text-xs text-yellow-600 dark:text-yellow-200">
                                                        {"Te falta: " +
                                                            (typeof logro.left === "number" && logro.left > 0
                                                                ? logro.left
                                                                : logro.left || logro.progress)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                { }
                <section className="mt-20">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" /> Analítica Básica
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {/* Por Género */}
                        <Card className="py-4 rounded-lg shadow bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mt-1">
                                <CardTitle className="text-sm font-medium flex gap-2 items-center">
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    Percentiles de Rating
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span>P50 (Mediana)</span>
                                        <Badge className="bg-yellow-600">
                                            {stats.p50Rating.toFixed(2)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>P75</span>
                                        <Badge className="bg-yellow-500">
                                            {stats.p75Rating.toFixed(2)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>P90</span>
                                        <Badge className="bg-yellow-400">
                                            {stats.p90Rating.toFixed(2)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground">
                                    Distribución cortesía de la mediana y percentiles altos para
                                    entender la calidad de tus selecciones.
                                </div>
                            </CardContent>
                        </Card>
                        {/* Por Duración */}
                        <Card className="py-4 rounded-lg shadow bg-card">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Clock className="h-4 w-4" />
                                    Percentiles de Duración
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between">
                                        <span>P50</span>{" "}
                                        <Badge>{(stats.p50Duration / 60).toFixed(1)} min</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>P75</span>{" "}
                                        <Badge>{(stats.p75Duration / 60).toFixed(1)} min</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>P90</span>{" "}
                                        <Badge>{(stats.p90Duration / 60).toFixed(1)} min</Badge>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground">
                                    ¿Prefieres pelis largas? Aquí lo puedes ver.
                                </div>
                            </CardContent>
                        </Card>
                        {/* Diversidad de Géneros */}
                        <Card className="py-4 rounded-lg shadow bg-card">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <PieChart className="h-4 w-4" />
                                    Diversidad de Géneros
                                </CardTitle>
                                <CardDescription>
                                    ¿Cuántos géneros diferentes has explorado?
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-1">
                                    <span>
                                        <strong>{stats.genreDiversity.unique}</strong> géneros
                                        únicos vistos
                                    </span>
                                    <Progress
                                        value={100 * stats.genreDiversity.ratio}
                                        className="h-2 my-1"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        Diversidad: {(100 * stats.genreDiversity.ratio).toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Top 3 géneros concentran{" "}
                                        {(100 * stats.genreConcentration.ratio).toFixed(1)}% de tu
                                        historial
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Repetición */}
                        <Card className="py-4 rounded-lg shadow bg-card">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <TrendingUp className="h-4 w-4" />
                                    Hábito de Repetición
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-1">
                                    <span>
                                        <Badge className="bg-purple-600">
                                            {(100 * stats.rewatchRate).toFixed(1)}%
                                        </Badge>
                                        <span className="ml-2 text-muted-foreground">
                                            {" "}
                                            de re-visualizaciones
                                        </span>
                                    </span>
                                    <span>
                                        Rating ponderado por veces vistas:
                                        <Badge className="bg-yellow-600 ml-2">
                                            {stats.weightedRating.toFixed(2)}
                                        </Badge>
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    El rating ponderado refleja lo que REALMENTE sueles re-ver.
                                </div>
                            </CardContent>
                        </Card>
                        {/* Afinidad por Género */}
                        <Card className="py-4 rounded-lg shadow bg-card">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <PieChart className="h-4 w-4" />
                                    Afinidad por Género (Top 3)
                                </CardTitle>
                                <CardDescription>
                                    Géneros que viste y están mejor valorados
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {stats.genreAffinity.slice(0, 3).map((item, idx) => (
                                        <div key={item.genre} className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                                            >
                                                {idx + 1}
                                            </Badge>
                                            <span className="font-medium">{item.genre}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                Rating: {item.avg.toFixed(2)} · {item.count} vistas
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        {/* Clásicos vs Modernos */}
                        <Card className="py-4 rounded-lg shadow bg-card">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Calendar className="h-4 w-4" />
                                    Clásicos vs Modernos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <span>
                                        <Badge className="bg-blue-700">
                                            Clásicas: {stats.classicModern.classic}
                                        </Badge>
                                        <span className="mx-2">/</span>
                                        <Badge className="bg-pink-700">
                                            Modernas: {stats.classicModern.modern}
                                        </Badge>
                                    </span>
                                    <Progress
                                        value={
                                            (stats.classicModern.classic * 100) /
                                            (stats.classicModern.classic + stats.classicModern.modern)
                                        }
                                        className="h-2 my-1"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        Promedios — Clásicos:{" "}
                                        {stats.classicModern.avgClassic.toFixed(2)} / Modernos:{" "}
                                        {stats.classicModern.avgModern.toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Tendencia Duración vs Rating */}
                        <Card className="py-4 rounded-lg shadow bg-card">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Activity className="h-4 w-4" />
                                    Tendencia Duración vs Rating
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <span>Tendencia:</span>
                                    <Badge
                                        className={`ml-2 ${stats.durationRatingCorr > 0.15
                                            ? "bg-green-600"
                                            : stats.durationRatingCorr < -0.15
                                                ? "bg-red-600"
                                                : "bg-gray-600"
                                            }`}
                                    >
                                        {stats.durationRatingCorr > 0.15
                                            ? "Prefieres películas largas"
                                            : stats.durationRatingCorr < -0.15
                                                ? "Prefieres películas cortas"
                                                : "Neutro"}
                                    </Badge>
                                    <span className="ml-4 text-xs text-muted-foreground">
                                        ({stats.durationRatingCorr.toFixed(2)} correlación)
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        {/* Récords Personales */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col col-span-1 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Award className="h-4 w-4" />
                                    Récords Personales
                                </CardTitle>
                                <CardDescription>Tus extremos cinematográficos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                    <Badge className="bg-blue-800">
                                        Más larga: {stats.outliers.longest.title}
                                    </Badge>
                                    <Badge className="bg-pink-800">
                                        Más corta: {stats.outliers.shortest.title}
                                    </Badge>
                                    <Badge className="bg-yellow-700">
                                        Mayor rating: {stats.outliers.highest.title}
                                    </Badge>
                                    <Badge className="bg-red-700">
                                        Menor rating: {stats.outliers.lowest.title}
                                    </Badge>
                                    <Badge className="bg-green-900">
                                        Más reciente: {stats.outliers.newest.title}
                                    </Badge>
                                    <Badge className="bg-gray-600">
                                        Más antigua: {stats.outliers.oldest.title}
                                    </Badge>
                                    <Badge className="bg-purple-700">
                                        +Rewatched: {stats.outliers.mostRewatched.title} (
                                        {stats.outliers.mostRewatched.watchCount}x)
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
                {/* Segunda sección - Gráficos avanzados */}
                <section className="mt-20">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Analítica & Gráficos Avanzados
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {/* Histograma de Ratings */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <BarChart3 className="h-4 w-4" />
                                    Histograma de Ratings
                                </CardTitle>
                                <CardDescription>
                                    Frecuencia de tus valoraciones
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-54 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bins}>
                                        <XAxis dataKey="bin" fontSize={10} />
                                        <YAxis fontSize={10} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#f59e42" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Histograma de Duraciones */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Clock className="h-4 w-4" />
                                    Histograma de Duraciones
                                </CardTitle>
                                <CardDescription>Predilección por duraciones</CardDescription>
                            </CardHeader>
                            <CardContent className="h-54 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={binsDur}>
                                        <XAxis dataKey="bin" fontSize={10} />
                                        <YAxis fontSize={10} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Afinidad por Género: Mini Ranking gráfico */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Star className="h-4 w-4" />
                                    Afinidad por Género (Rating)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-54 w-full">
                                <ResponsiveContainer width="99%" height="95%">
                                    <BarChart data={affinityData.slice(0, 7)} layout="vertical">
                                        <XAxis type="number" domain={[0, 10]} fontSize={10} />
                                        <YAxis dataKey="genre" type="category" fontSize={10} />
                                        <Tooltip />
                                        <Bar dataKey="avg" fill="#60a5fa">
                                            <LabelList
                                                dataKey="avg"
                                                position="right"
                                                formatter={(val) =>
                                                    typeof val === "number" ? val.toFixed(2) : val
                                                }
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Top años más vistos */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <BarChart3 className="h-4 w-4" />
                                    Top Años Más Vistos
                                </CardTitle>
                                <CardDescription>
                                    ¿Prefieres los clásicos o lo moderno?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-54 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={yearsRanking} layout="vertical">
                                        <XAxis type="number" />
                                        <YAxis dataKey="year" type="category" />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#6366f1" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Top géneros y años más vistos */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Calendar className="h-4 w-4" />
                                    ¿Qué día ves más películas?
                                </CardTitle>
                                <CardDescription>Día preferido para ver cine</CardDescription>
                            </CardHeader>
                            <CardContent className="h-54 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={byDOW}>
                                        <XAxis dataKey="day" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Distribución por género y año */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Eye className="h-4 w-4" />
                                    Distribución de Revisiones
                                </CardTitle>
                                <CardDescription>
                                    ¿Cuántas veces repites una película?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-54 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={byRewatch}>
                                        <XAxis dataKey="times" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#a21caf" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Evolución de visualizaciones y rating */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <BarChart3 className="h-4 w-4" />
                                    Evolución de Visualizaciones
                                </CardTitle>
                                <CardDescription>Películas vistas por mes</CardDescription>
                            </CardHeader>
                            <CardContent className="h-100 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={viewsByMonth}>
                                        <XAxis dataKey="month" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Evolución del rating */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Star className="h-4 w-4" />
                                    Evolución del Rating Visto
                                </CardTitle>
                                <CardDescription>
                                    ¿Te has vuelto más exigente en lo que ves?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-100 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={avgRatingByMonth}>
                                        <XAxis dataKey="month" />
                                        <YAxis domain={[0, 10]} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="avg"
                                            stroke="#f59e42"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Rating vs. Duración */}
                        <Card className="py-4 rounded-lg shadow bg-card flex flex-col col-span-1 sm:col-span-2 lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <Activity className="h-4 w-4" />
                                    Rating vs. Duración
                                </CardTitle>
                                <CardDescription>
                                    ¿Valoras más las pelis largas o cortas? (color por género)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-100 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart>
                                        <XAxis
                                            type="number"
                                            dataKey="duration"
                                            name="Duración (min)"
                                        />
                                        <YAxis
                                            type="number"
                                            domain={[0, 10]}
                                            dataKey="rating"
                                            name="Rating"
                                        />
                                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                                        {/* Si tienes pocos géneros: un Scatter por genre para colores */}
                                        {Array.from(new Set(scatterData.map((d) => d.genre)))
                                            .slice(0, 7)
                                            .map((g, i) => (
                                                <Scatter
                                                    data={scatterData.filter((d) => d.genre === g)}
                                                    key={g}
                                                    name={g}
                                                    fill={genreColors[i % genreColors.length]}
                                                />
                                            ))}
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>
        </div>
    );
}