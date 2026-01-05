import React, { useState, useEffect, useRef, useContext } from "react";
import { useSocial } from "../context/SocialContext";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../shared/components/ui/dialog";
import {
  Loader2,
  MessageSquare,
  Search,
  Users,
  Settings,
  Send,
  Instagram,
  Twitter,
  Facebook,
  Trash2,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserMenu } from "../../auth/components/UserMenu";
import { Theme } from "../../../shared/components/layout/Theme";
import { ThemeContext } from "../../../core/providers/ThemeContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { Textarea } from "../../../shared/components/ui/textarea";
import { NotificationCenter } from "../components/NotificationCenter";

export default function SocialPage() {
  const {
    friends,
    requests,
    sentRequests,
    recommendations,
    messages,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    updateProfile,
    sendMessage,
    getMessages,
    search,
  } = useSocial();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { toggleTheme } = useContext(ThemeContext);

  // States for Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    name: currentUser?.name || "",
    bio: (currentUser as any)?.bio || "",
    links: {
      instagram: (currentUser as any)?.socialLinks?.instagram || "",
      twitter: (currentUser as any)?.socialLinks?.twitter || "",
      facebook: (currentUser as any)?.socialLinks?.facebook || "",
      other: (currentUser as any)?.socialLinks?.other || "",
    },
  });

  const [activeChat, setActiveChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [individualLoading, setIndividualLoading] = useState<
    Record<string, boolean>
  >({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const setProcessing = (id: string, processing: boolean) => {
    setIndividualLoading((prev) => ({ ...prev, [id]: processing }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const getRequestStatus = (userId: string) => {
    if (!userId) return "none";
    if (friends.some((f) => f && (f._id === userId || f.id === userId)))
      return "friends";
    if (
      sentRequests.some(
        (r) =>
          ((r?.to as any)?._id === userId || (r?.to as any) === userId) &&
          r.status === "pending"
      )
    )
      return "sent";
    if (
      requests.some(
        (r) =>
          ((r?.from as any)?._id === userId || (r?.from as any) === userId) &&
          r.status === "pending"
      )
    )
      return "received";
    return "none";
  };

  const handleUpdateProfile = async () => {
    await updateProfile({
      name: editingProfile.name,
      bio: editingProfile.bio,
      socialLinks: editingProfile.links,
    });
    setIsProfileOpen(false);
  };

  const openChat = (friend: any) => {
    setActiveChat(friend);
    getMessages(friend._id || friend.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    await sendMessage(activeChat._id || activeChat.id, newMessage);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10 shadow-sm">
        <div className="container mx-auto px-4 h-[72px] flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/home")}
          >
            <div className="bg-primary/10 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <img
                src="pelicula-de-video.png"
                alt="VeoVeo"
                className="w-6 h-6"
              />
            </div>
            <h1 className="text-xl font-black tracking-tighter bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent hidden xs:block">
              VEOVEO SOCIAL
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-primary/5"
              onClick={() => setIsProfileOpen(true)}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Theme toggleTheme={toggleTheme} />
            <NotificationCenter />
            <UserMenu open={showUserMenu} setOpen={setShowUserMenu} />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <Tabs defaultValue="friends" className="w-full">
            <div className="flex overflow-x-auto pb-2 mb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted/30 p-1 text-muted-foreground w-full sm:w-auto min-w-max">
                <TabsTrigger
                  value="friends"
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Amigos
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold">
                    {friends.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="requests"
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Recibidas
                  {requests.filter((r) => r.status === "pending").length >
                    0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                      {requests.filter((r) => r.status === "pending").length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscador
                </TabsTrigger>
                <TabsTrigger
                  value="sent_requests"
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviadas
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold">
                    {sentRequests.filter((r) => r.status === "pending").length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="recommendations"
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Tips
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold">
                    {recommendations.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="friends"
              className="space-y-6 outline-none animate-in fade-in-50 duration-500"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  MIS AMIGOS
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  Conectados ({friends.filter((f) => f).length})
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.filter((f) => f).length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5">
                    <div className="bg-primary/5 p-6 rounded-full">
                      <Users className="w-12 h-12 text-primary/20" />
                    </div>
                    <div className="max-w-[280px]">
                      <p className="font-bold text-lg">
                        Un poco vacío por aquí...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ve al buscador y empieza a crear tu comunidad.
                      </p>
                    </div>
                  </div>
                ) : (
                  friends
                    .filter((f) => f)
                    .map((friend) => (
                      <Card
                        key={friend._id || friend.id}
                        className="group relative border border-primary/5 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-primary/5 rounded-2xl overflow-hidden"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <Avatar className="w-14 h-14 border-2 border-primary/20 group-hover:border-primary transition-colors">
                                <AvatarImage src={friend.selectedAvatar} />
                                <AvatarFallback className="bg-primary/10 text-primary font-black">
                                  {friend.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-lg truncate group-hover:text-primary transition-colors">
                                {friend.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {friend.socialLinks?.instagram && (
                                  <Instagram className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                                )}
                                {friend.socialLinks?.twitter && (
                                  <Twitter className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                                )}
                                {friend.socialLinks?.facebook && (
                                  <Facebook className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-red-500 rounded-full h-8 w-8"
                              onClick={() =>
                                removeFriend(friend._id || friend.id)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="mt-6 pt-4 border-t border-primary/5 flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 rounded-xl font-bold h-10"
                              onClick={() => openChat(friend)}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              CHAT
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl font-bold h-10 border-primary/10"
                            >
                              PERFIL
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="search"
              className="space-y-8 animate-in fade-in-50 duration-500 outline-none"
            >
              <Card className="border border-primary/5 bg-linear-to-br from-primary/5 via-transparent to-transparent shadow-2xl shadow-primary/5 rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold tracking-tight">
                    Buscar Personas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleSearch}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <div className="relative flex-1 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Nombre o email..."
                        className="pl-10 h-12 bg-background/50 border-primary/10 focus-visible:ring-primary/20 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={searching}
                      className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold"
                    >
                      {searching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "BUSCAR"
                      )}
                    </Button>
                  </form>

                  {searchResults.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.map((result) => {
                          if (!result) return null;
                          const status = getRequestStatus(
                            result._id || result.id
                          );
                          return (
                            <div
                              key={result._id || result.id}
                              className="flex items-center justify-between p-4 rounded-2xl border border-primary/5 bg-background/40 backdrop-blur-md hover:border-primary/40 transition-all hover:bg-background/60 group"
                            >
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-primary/10">
                                  <AvatarImage src={result.selectedAvatar} />
                                  <AvatarFallback className="font-bold text-primary">
                                    {(result.name || "U")
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-sm sm:text-base">
                                    {result.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {result.email}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0">
                                {status === "friends" ? (
                                  <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-tighter bg-primary/10 px-3 py-1.5 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                    AMIGOS
                                  </div>
                                ) : status === "sent" ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled
                                    className="bg-muted/50 rounded-full h-9 px-4"
                                  >
                                    PENDIENTE
                                  </Button>
                                ) : status === "received" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full h-9 px-4"
                                    onClick={() => navigate("/social")}
                                  >
                                    REVISAR
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      sendRequest(result._id || result.id)
                                    }
                                    className="rounded-full h-9 px-4 font-bold border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
                                  >
                                    AÑADIR
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="requests"
              className="space-y-6 animate-in fade-in-50 duration-500 outline-none"
            >
              {requests.filter((r) => r && r.status === "pending").length ===
              0 ? (
                <div className="text-center py-20 border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5">
                  <p className="text-muted-foreground font-bold">
                    Sin peticiones pendientes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests
                    .filter((r) => r && r.status === "pending")
                    .map((req) => (
                      <Card
                        key={(req as any)._id || req.id}
                        className="border border-primary/10 rounded-2xl overflow-hidden"
                      >
                        <CardContent className="p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/20">
                              <AvatarImage
                                src={(req.from as any)?.selectedAvatar}
                              />
                              <AvatarFallback className="font-bold text-primary">
                                {(req.from as any)?.name
                                  ?.substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-black text-lg">
                                {(req.from as any)?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(req.from as any)?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={
                                individualLoading[(req as any)._id || req.id]
                              }
                              onClick={async () => {
                                const id = (req as any)._id || req.id;
                                setProcessing(id, true);
                                try {
                                  await acceptRequest(id);
                                } finally {
                                  setProcessing(id, false);
                                }
                              }}
                              className="rounded-xl font-bold min-w-[80px]"
                            >
                              {individualLoading[(req as any)._id || req.id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "ACEPTAR"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                individualLoading[(req as any)._id || req.id]
                              }
                              onClick={async () => {
                                const id = (req as any)._id || req.id;
                                setProcessing(id, true);
                                try {
                                  await rejectRequest(id);
                                } finally {
                                  setProcessing(id, false);
                                }
                              }}
                              className="rounded-xl font-bold text-red-500 border-red-100 hover:bg-red-50"
                            >
                              {individualLoading[(req as any)._id || req.id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "X"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="sent_requests"
              className="space-y-6 animate-in fade-in-50 duration-500 outline-none"
            >
              {sentRequests.filter((r) => r && r.status === "pending")
                .length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5">
                  <p className="text-muted-foreground font-bold">
                    No tienes solicitudes enviadas pendientes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sentRequests
                    .filter((r) => r && r.status === "pending")
                    .map((req) => (
                      <Card
                        key={(req as any)._id || req.id}
                        className="border border-primary/10 rounded-2xl overflow-hidden bg-background/40"
                      >
                        <CardContent className="p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/20">
                              <AvatarImage
                                src={(req.to as any)?.selectedAvatar}
                              />
                              <AvatarFallback className="font-bold text-primary">
                                {(req.to as any)?.name
                                  ?.substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-black text-lg">
                                {(req.to as any)?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(req.to as any)?.email}
                              </p>
                            </div>
                          </div>
                          <div className="bg-primary/5 px-3 py-1 rounded-full">
                            <span className="text-[10px] font-black text-primary uppercase">
                              PENDIENTE
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="recommendations"
              className="space-y-6 animate-in fade-in-50 duration-500 outline-none"
            >
              {recommendations.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5">
                  <p className="text-muted-foreground font-bold">
                    Sin recomendaciones todavía.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recommendations.map((rec) => {
                    if (!rec || !rec.from) return null;
                    return (
                      <Card
                        key={(rec as any)._id || rec.id}
                        className="group border border-primary/10 transition-all bg-background/50 rounded-2xl overflow-hidden shadow-sm"
                      >
                        <CardHeader className="p-5 pb-0">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 ring-2 ring-primary/10 ring-offset-2">
                              <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                                {rec.from.name?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-bold">
                              {rec.from.name}{" "}
                              <span className="font-medium text-muted-foreground">
                                te recomienda:
                              </span>
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-3">
                          <div className="space-y-4">
                            <div className="flex gap-4">
                              <div className="w-20 h-28 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {rec.mediaPoster ? (
                                  <img
                                    src={rec.mediaPoster}
                                    alt={rec.mediaTitle}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest leading-tight text-center px-1">
                                    POSTER {rec.mediaType}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 py-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[9px] font-black text-primary uppercase tracking-wider">
                                    {rec.mediaType}
                                  </span>
                                </div>
                                <h4
                                  className="font-black text-lg leading-tight mb-2 truncate cursor-pointer hover:text-primary transition-colors"
                                  onClick={() =>
                                    navigate(`/${rec.mediaType}/${rec.mediaId}`)
                                  }
                                >
                                  {rec.mediaTitle || `ID: ${rec.mediaId}`}
                                </h4>
                                {rec.message && (
                                  <div className="p-3 bg-muted/30 rounded-xl border-l-4 border-primary/20 italic text-sm">
                                    "{rec.message}"
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="border-t border-primary/5 pt-4 flex items-center justify-between">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                                {new Date(rec.createdAt).toLocaleDateString()}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-lg text-xs font-bold hover:bg-primary/5"
                                onClick={() =>
                                  navigate(`/${rec.mediaType}/${rec.mediaId}`)
                                }
                              >
                                DETALLES
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              MI PERFIL
            </DialogTitle>
            <DialogDescription>
              Personaliza tu presencia en VeoVeo Social.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4 pb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="text-2xl font-black bg-primary/20 text-primary">
                  {currentUser?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground px-1">
                  Nombre
                </label>
                <Input
                  value={editingProfile.name}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      name: e.target.value,
                    })
                  }
                  className="rounded-xl bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground px-1">
                  Biografía
                </label>
                <Textarea
                  placeholder="Sobre tus gustos..."
                  value={editingProfile.bio}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      bio: e.target.value,
                    })
                  }
                  className="rounded-xl bg-muted/30 resize-none h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground px-1 flex items-center gap-2">
                    <Instagram className="w-3 h-3" /> Instagram
                  </label>
                  <Input
                    placeholder="@usuario"
                    value={editingProfile.links.instagram}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        links: {
                          ...editingProfile.links,
                          instagram: e.target.value,
                        },
                      })
                    }
                    className="rounded-xl bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground px-1 flex items-center gap-2">
                    <Twitter className="w-3 h-3" /> Twitter
                  </label>
                  <Input
                    placeholder="@usuario"
                    value={editingProfile.links.twitter}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        links: {
                          ...editingProfile.links,
                          twitter: e.target.value,
                        },
                      })
                    }
                    className="rounded-xl bg-muted/30"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsProfileOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateProfile}
              className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20 bg-primary"
            >
              GUARDAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={!!activeChat} onOpenChange={() => setActiveChat(null)}>
        <DialogContent className="sm:max-w-[450px] h-[600px] p-0 flex flex-col rounded-3xl overflow-hidden">
          <DialogHeader className="p-4 border-b bg-primary/5 flex flex-row items-center gap-3 space-y-0">
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={activeChat?.selectedAvatar} />
              <AvatarFallback className="font-bold">
                {activeChat?.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <DialogTitle className="text-lg font-black tracking-tight">
                {activeChat?.name}
              </DialogTitle>
              <p className="text-xs font-bold text-green-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                En línea
              </p>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                <MessageSquare className="w-12 h-12 mb-2" />
                <p className="text-xs font-black uppercase tracking-widest text-primary">
                  Inicia la conversación
                </p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isMe =
                  m.from === currentUser?.id ||
                  m.from === (currentUser as any)?._id;
                return (
                  <div
                    key={i}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                          : "bg-muted rounded-tl-none border border-primary/5"
                      }`}
                    >
                      {m.content}
                      <p
                        className={`text-[9px] mt-1 opacity-50 font-bold ${
                          isMe ? "text-right" : "text-left"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t bg-muted/20 flex gap-2"
          >
            <Input
              placeholder="Escribe un mensaje..."
              className="rounded-xl bg-background border-primary/10"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-xl shrink-0 h-10 w-10 bg-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
