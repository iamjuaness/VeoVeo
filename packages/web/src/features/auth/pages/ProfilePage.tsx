import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getUserProfile } from "../../social/services/social";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import { Button } from "../../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import {
  Instagram,
  Twitter,
  Facebook,
  Link as LinkIcon,
  MessageSquare,
  UserPlus,
  Settings,
  ArrowLeft,
  Loader2,
  Trophy,
  Users,
  Film,
  Tv,
  Edit,
  Share2,
  Sparkles,
} from "lucide-react";
import { predefinedAvatars } from "../../../shared/components/common/PredefinedAvatars";
import { ModalSettings } from "../components/ModalSettings";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, token, setUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const isOwnProfile =
    !id || id === currentUser?.id || id === (currentUser as any)?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const userId = id || currentUser?.id || (currentUser as any)?._id;
        const data = await getUserProfile(userId, token);
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    window.scrollTo(0, 0);
  }, [id, currentUser, token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <p className="text-muted-foreground">Usuario no encontrado</p>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const userAvatarObj =
    predefinedAvatars.find((a) => a.id === profile.selectedAvatar) ||
    predefinedAvatars[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative h-48 sm:h-64 bg-linear-to-br from-primary/30 via-primary/10 to-background border-b border-border/50">
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {isOwnProfile && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Main Info Card */}
          <Card className="w-full md:w-80 shrink-0 rounded-3xl overflow-hidden border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-6 text-center">
              <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 mb-6">
                <Avatar className="w-full h-full border-4 border-background shadow-xl">
                  <AvatarImage
                    src={userAvatarObj.url}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
                    {profile.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <div className="absolute bottom-1 right-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full w-8 h-8 shadow-lg border border-border/50"
                      onClick={() => setShowSettings(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-black mb-1">{profile.name}</h1>
              <p className="text-sm text-muted-foreground mb-6">
                {profile.email}
              </p>

              {profile.bio ? (
                <p className="text-sm line-clamp-4 leading-relaxed mb-6 font-medium text-muted-foreground/80 italic">
                  "{profile.bio}"
                </p>
              ) : (
                isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-6 border-dashed border-primary/30"
                    onClick={() => setShowSettings(true)}
                  >
                    Añadir biografía
                  </Button>
                )
              )}

              <div className="flex gap-2 justify-center mb-6">
                {profile.socialLinks?.instagram && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                    asChild
                  >
                    <a
                      href={`https://instagram.com/${profile.socialLinks.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {profile.socialLinks?.twitter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                    asChild
                  >
                    <a
                      href={`https://twitter.com/${profile.socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {profile.socialLinks?.facebook && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                    asChild
                  >
                    <a
                      href={`https://facebook.com/${profile.socialLinks.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  </Button>
                )}
                {!profile.socialLinks?.instagram &&
                  !profile.socialLinks?.twitter &&
                  !profile.socialLinks?.facebook &&
                  isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl border border-dashed border-primary/20 opacity-50"
                      onClick={() => setShowSettings(true)}
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {!isOwnProfile ? (
                  <>
                    <Button className="rounded-xl font-bold gap-2">
                      <UserPlus className="w-4 h-4" />
                      Seguir
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Mensaje
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full col-span-2 rounded-xl font-bold gap-2 bg-linear-to-r from-primary to-primary/80"
                    onClick={() => setShowSettings(true)}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir Perfil
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stats & Suggestions Section */}
          <div className="flex-1 space-y-6 w-full">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card className="rounded-2xl border-border/50 bg-card/30 backdrop-blur-md">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-black">
                      {profile.stats.friendsCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Amigos
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 bg-card/30 backdrop-blur-md">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-black">
                      {profile.stats.recommendationsCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Logros
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/50 bg-card/30 backdrop-blur-md hidden sm:block">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Nivel 5</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Rango
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations / Suggestions (Customized for profile) */}
            {isOwnProfile && (
              <Card className="rounded-3xl border-primary/20 bg-linear-to-br from-primary/5 to-transparent overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    Mejora tu Perfil
                  </CardTitle>
                  <CardDescription>
                    Potencia tu presencia en CineMate con estas sugerencias.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-colors group cursor-pointer border border-transparent hover:border-primary/20">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <Film className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Muestra tu Top 5</h4>
                      <p className="text-xs text-muted-foreground">
                        Comparte tus películas favoritas directamente en tu
                        banner central.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-colors group cursor-pointer border border-transparent hover:border-primary/20">
                    <div className="p-2 bg-green-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <Badge className="bg-green-500/10 text-green-500 border-none p-0">
                        <Sparkles className="w-4 h-4" />
                      </Badge>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">
                        Sincroniza Letterboxd
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Importa tu historial y críticas automáticamente.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-colors group cursor-pointer border border-transparent hover:border-primary/20">
                    <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <Tv className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Estado de Ánimo</h4>
                      <p className="text-xs text-muted-foreground">
                        Deja que tus amigos sepan qué estás viendo hoy según tu
                        mood.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity / Placeholder for future content */}
            <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-4 opacity-50">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-muted-foreground">
                  Sin actividad visible
                </h3>
                <p className="text-xs text-muted-foreground/60 max-w-[200px] mt-2">
                  {isOwnProfile
                    ? "¡Empieza a ver algo y comparte tus opiniones con el mundo!"
                    : "Este usuario aún no ha compartido su actividad reciente."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {isOwnProfile && currentUser && (
        <ModalSettings
          open={showSettings}
          setOpen={setShowSettings}
          user={currentUser}
          setUser={setUser}
        />
      )}
    </div>
  );
}
