import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../../../shared/components/ui/button";
import { Card } from "../../../shared/components/ui/card";
import { Badge } from "../../../shared/components/ui/badge";
import {
  ArrowLeft,
  Trash2,
  Heart,
  Calendar,
  Globe,
  Lock,
  Loader2,
  Film,
  Tv,
  ExternalLink,
  MoreVertical,
  Edit2,
} from "lucide-react";
import {
  getListById,
  deleteList,
  toggleLikeList,
  updateList,
} from "../services/list";
import type { CustomList } from "@veoveo/shared";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CreateListModal } from "../components/lists/CreateListModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../shared/components/ui/dropdown-menu";

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [list, setList] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchList();
    }
  }, [id]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getListById(id!);
      setList(data);
    } catch (error) {
      toast.error("Error al cargar la lista");
      navigate("/social");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async () => {
    if (
      !list ||
      !window.confirm("¿Estás seguro de que quieres eliminar esta lista?")
    )
      return;

    try {
      await deleteList(list._id || list.id || "");
      toast.success("Lista eliminada");
      navigate("/social");
    } catch (error) {
      toast.error("Error al eliminar la lista");
    }
  };

  const handleToggleLike = async () => {
    if (!user || !list) return;

    setIsLiking(true);
    try {
      const { isLiked } = await toggleLikeList(list._id || list.id || "");
      // Manual sync of likes array based on isLiked result
      const newLikes = isLiked
        ? [...list.likes, user.id]
        : list.likes.filter((id) => id !== user.id);

      setList({ ...list, likes: newLikes });
    } catch (error) {
      toast.error("Error al dar like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleRemoveItem = async (mediaId: string) => {
    if (!list || !list.items) return;

    try {
      const updatedItems = list.items.filter(
        (item) => item.mediaId !== mediaId,
      );
      const updatedList = await updateList(list._id || list.id || "", {
        items: updatedItems,
      });
      setList(updatedList);
      toast.success("Elemento eliminado de la lista");
    } catch (error) {
      toast.error("Error al eliminar el elemento");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!list) return null;

  const isOwner = user?.id === list.userId;
  const hasLiked = user && list.likes.includes(user.id);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header / Hero */}
      <div className="relative overflow-hidden bg-muted/30 border-b">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent" />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-8 gap-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            VOLVER
          </Button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* List Preview Grid */}
            <div className="w-full md:w-64 aspect-square rounded-3xl overflow-hidden bg-muted border shadow-2xl shrink-0 grid grid-cols-2">
              {list.items.slice(0, 4).map((item, i) => (
                <img
                  key={i}
                  src={item.mediaPoster || "/placeholder.svg"}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ))}
              {list.items.length === 0 && (
                <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                  <Film className="w-12 h-12 opacity-20" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant={list.isPublic ? "outline" : "secondary"}
                  className="rounded-lg gap-1.5 px-3 py-1 uppercase font-black text-[10px]"
                >
                  {list.isPublic ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {list.isPublic ? "Pública" : "Privada"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-lg gap-1.5 px-3 py-1 uppercase font-black text-[10px]"
                >
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(list.updatedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </Badge>
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase italic">
                {list.title}
              </h1>

              {list.description && (
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {list.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button
                  onClick={handleToggleLike}
                  disabled={isLiking || !user}
                  variant={hasLiked ? "default" : "outline"}
                  className={`rounded-2xl gap-2 font-bold px-6 transition-all ${hasLiked ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                >
                  <Heart
                    className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`}
                  />
                  {list.likes.length} LIKES
                </Button>

                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-2xl gap-2 font-bold px-6"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-5 h-5" />
                      EDITAR
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-2xl h-12 w-12 border"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl">
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500 gap-2 font-bold"
                          onClick={handleDeleteList}
                        >
                          <Trash2 className="w-4 h-4" />
                          ELIMINAR LISTA
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">
            CONTENIDO ({list.items.length})
          </h2>
        </div>

        {list.items.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-bold mb-2 uppercase">
              Tu lista está vacía
            </h3>
            <p className="text-muted-foreground mb-8">
              Empieza a añadir películas o series desde sus páginas de detalle.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/home">
                <Button className="rounded-2xl font-bold">VER PELÍCULAS</Button>
              </Link>
              <Link to="/series">
                <Button variant="outline" className="rounded-2xl font-bold">
                  VER SERIES
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {list.items.map((item) => (
              <Card
                key={item.mediaId}
                className="group relative rounded-3xl overflow-hidden border-0 bg-transparent shadow-none hover:translate-y-[-8px] transition-all duration-300"
              >
                <div className="aspect-2/3 relative rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src={item.mediaPoster || "/placeholder.svg"}
                    alt={item.mediaTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <div className="flex gap-2">
                      <Link
                        to={`/${item.mediaType}/${item.mediaId}`}
                        className="flex-1"
                      >
                        <Button className="w-full rounded-xl bg-white text-black hover:bg-white/90 font-bold text-xs gap-1.5 h-10">
                          <ExternalLink className="w-3 h-3" />
                          VER
                        </Button>
                      </Link>
                      {isOwner && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-xl h-10 w-10"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveItem(item.mediaId);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Media Type Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/60 backdrop-blur-md border-white/20 text-white font-black text-[9px] px-2 py-0.5 rounded-lg">
                      {item.mediaType === "movie" ? (
                        <Film className="w-3 h-3 mr-1" />
                      ) : (
                        <Tv className="w-3 h-3 mr-1" />
                      )}
                      {item.mediaType === "movie" ? "FILM" : "SERIES"}
                    </Badge>
                  </div>
                </div>
                <div className="pt-4 px-1">
                  <h3 className="font-black text-sm uppercase italic line-clamp-1 group-hover:text-primary transition-colors">
                    {item.mediaTitle}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateListModal
        open={isEditing}
        onOpenChange={setIsEditing}
        onSuccess={fetchList}
        editingList={list}
      />
    </div>
  );
}
