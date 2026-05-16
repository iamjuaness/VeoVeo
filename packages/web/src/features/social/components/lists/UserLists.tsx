import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CustomList } from "@veoveo/shared";
import {
  getMyLists,
  getPublicLists,
  toggleLikeList,
} from "../../services/list";
import { ListCard } from "./ListCard";
import { CreateListModal } from "./CreateListModal";
import { Button } from "../../../../shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../shared/components/ui/tabs";
import { ListPlus, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../auth/hooks/useAuth";

export const UserLists: React.FC = () => {
  const [myLists, setMyLists] = useState<CustomList[]>([]);
  const [publicLists, setPublicLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setActiveTab] = useState("my-lists");
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mine, publicOnes] = await Promise.all([
        getMyLists(),
        getPublicLists(),
      ]);
      setMyLists(mine);
      setPublicLists(publicOnes);
    } catch (error) {
      console.error("Error fetching lists:", error);
      toast.error("Error al cargar las listas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLike = async (listId: string) => {
    try {
      await toggleLikeList(listId);
      // Refresh to get updated like count
      fetchData();
    } catch (error) {
      toast.error("Error al dar like");
    }
  };

  const handleShare = (list: CustomList) => {
    const url = `${window.location.origin}/social/list/${list._id || list.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleListClick = (listId: string) => {
    navigate(`/social/list/${listId}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            LISTAS PERSONALIZADAS
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            Descubre colecciones curadas por la comunidad o crea las tuyas.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 gap-2"
        >
          <ListPlus className="w-5 h-5" />
          NUEVA LISTA
        </Button>
      </div>

      <Tabs
        defaultValue="my-lists"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="bg-muted/30 p-1 rounded-xl mb-6">
          <TabsTrigger value="my-lists" className="rounded-lg font-bold">
            Mis Listas
          </TabsTrigger>
          <TabsTrigger value="discover" className="rounded-lg font-bold">
            Descubrir
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-bold text-muted-foreground">
              Cargando colecciones...
            </p>
          </div>
        ) : (
          <>
            <TabsContent value="my-lists" className="mt-0">
              {myLists.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5">
                  <div className="bg-primary/5 p-6 rounded-full">
                    <ListPlus className="w-12 h-12 text-primary/20" />
                  </div>
                  <div className="max-w-[300px]">
                    <p className="font-bold text-lg">
                      Tu biblioteca está vacía
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Crea tu primera lista para organizar tus películas y
                      series favoritas.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(true)}
                      className="rounded-xl font-bold border-primary/20"
                    >
                      EMPEZAR AHORA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myLists.map((list) => (
                    <ListCard
                      key={list._id || list.id}
                      list={list}
                      isOwner={true}
                      onLike={handleLike}
                      onShare={handleShare}
                      onClick={handleListClick}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover" className="mt-0">
              {publicLists.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5">
                  <Search className="w-12 h-12 text-muted-foreground/20" />
                  <p className="font-bold text-muted-foreground">
                    No se encontraron listas públicas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicLists.map((list) => (
                    <ListCard
                      key={list._id || list.id}
                      list={list}
                      isOwner={list.userId === user?.id}
                      onLike={handleLike}
                      onShare={handleShare}
                      onClick={handleListClick}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      <CreateListModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchData}
      />
    </div>
  );
};
