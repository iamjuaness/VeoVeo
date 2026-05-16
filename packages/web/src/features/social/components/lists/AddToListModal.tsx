import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import { Button } from "../../../../shared/components/ui/button";
import { getMyLists, updateList, createList } from "../../services/list";
import type { CustomList, CustomListItem } from "@veoveo/shared";
import {
  Loader2,
  Plus,
  List as ListIcon,
  Check,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { CreateListModal } from "./CreateListModal";

interface AddToListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  mediaType: "movie" | "series";
  mediaTitle: string;
  mediaPoster: string;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({
  open,
  onOpenChange,
  mediaId,
  mediaType,
  mediaTitle,
  mediaPoster,
}) => {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLists();
    }
  }, [open]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const data = await getMyLists();
      setLists(data);
    } catch (error) {
      console.error("Error fetching lists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (list: CustomList) => {
    if (list.items.some((item) => item.mediaId === mediaId)) {
      toast.info("Ya está en esta lista");
      return;
    }

    setAddingToListId(list._id || list.id || null);
    try {
      const newItem: CustomListItem = {
        mediaId,
        mediaType,
        mediaTitle,
        mediaPoster,
        addedAt: new Date(),
      };

      const updatedItems = [...list.items, newItem];
      await updateList(list._id || list.id || "", { items: updatedItems });

      toast.success(`Añadido a "${list.title}"`);
      // Update local state
      setLists(
        lists.map((l) =>
          l._id === list._id || l.id === list.id
            ? { ...l, items: updatedItems }
            : l,
        ),
      );
    } catch (error) {
      toast.error("Error al añadir a la lista");
    } finally {
      setAddingToListId(null);
    }
  };

  const handleCreateAndAdd = async (data: Partial<CustomList>) => {
    try {
      const newList = await createList(data);
      const newItem: CustomListItem = {
        mediaId,
        mediaType,
        mediaTitle,
        mediaPoster,
        addedAt: new Date(),
      };

      const updatedItems = [...(newList.items || []), newItem];
      await updateList(newList._id || newList.id || "", {
        items: updatedItems,
      });

      toast.success(`Lista "${data.title}" creada y "${mediaTitle}" añadida`);
      fetchLists();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating and adding to list:", error);
      toast.error("Error al crear la lista y añadir el elemento");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight uppercase italic">
                Añadir a lista
              </DialogTitle>
              <DialogDescription className="text-xs font-medium">
                Organiza "{mediaTitle}" en tus colecciones personales.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-4 space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide bg-muted/20">
            {loading ? (
              <div 
                className="py-20 flex flex-col items-center justify-center space-y-4"
                aria-live="polite"
              >
                <Loader2 className="w-10 h-10 text-primary animate-spin" aria-hidden="true" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                  Cargando tus listas...
                </p>
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-primary/10 rounded-3xl bg-background/50">
                <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                  <ListIcon className="w-8 h-8 text-primary/20" />
                </div>
                <h4 className="font-bold mb-1">BIBLIOTECA VACÍA</h4>
                <p className="text-xs text-muted-foreground mb-6">
                  Aún no has creado ninguna lista personalizada.
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full rounded-2xl font-black h-12 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <PlusCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                  CREAR MI PRIMERA LISTA
                </Button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all group mb-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label="Crear nueva lista"
                >
                  <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors" aria-hidden="true">
                    <Plus className="w-5 h-5 text-primary group-hover:text-white" />
                  </div>
                  <span className="font-black text-sm uppercase italic">
                    Crear nueva lista
                  </span>
                </button>

                <div className="space-y-2" role="list">
                  {lists.map((list) => {
                    const alreadyInList = list.items.some(
                      (item) => item.mediaId === mediaId,
                    );
                    const isAdding = addingToListId === (list._id || list.id);

                    return (
                      <button
                        key={list._id || list.id}
                        type="button"
                        onClick={() => handleAddToList(list)}
                        disabled={alreadyInList || isAdding}
                        aria-label={alreadyInList ? `Ya está en la lista ${list.title}` : `Añadir a la lista ${list.title}`}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50 ${
                          alreadyInList
                            ? "bg-primary/5 border-primary/20 opacity-80 cursor-default"
                            : "bg-background border-primary/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                        }`}
                        role="listitem"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl transition-colors ${alreadyInList ? "bg-primary text-white" : "bg-muted/50 text-primary"}`}
                            aria-hidden="true"
                          >
                            <ListIcon className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="font-black text-sm line-clamp-1 uppercase italic">
                              {list.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                              {list.items.length} ELEMENTOS
                            </p>
                          </div>
                        </div>
                        {isAdding ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
                        ) : alreadyInList ? (
                          <Check className="w-5 h-5 text-primary" aria-hidden="true" />
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-background">
            <Button
              variant="ghost"
              className="w-full rounded-2xl font-black uppercase text-xs h-12"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateListModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateAndAdd}
      />
    </>
  );
};
