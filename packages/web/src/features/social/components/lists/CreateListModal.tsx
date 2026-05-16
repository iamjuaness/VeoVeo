import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../shared/components/ui/dialog";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Textarea } from "../../../../shared/components/ui/textarea";
import { Label } from "../../../../shared/components/ui/label";
import { Switch } from "../../../../shared/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { CustomList } from "@veoveo/shared";
import { createList, updateList } from "../../services/list";
import { toast } from "sonner";

interface CreateListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: Partial<CustomList>) => Promise<void>;
  onSuccess?: () => void;
  editingList?: CustomList | null;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onSuccess,
  editingList 
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingList) {
        setTitle(editingList.title);
        setDescription(editingList.description || "");
        setIsPublic(editingList.isPublic);
      } else {
        setTitle("");
        setDescription("");
        setIsPublic(true);
      }
    }
  }, [open, editingList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const data = { title, description, isPublic };
      
      if (editingList) {
        await updateList(editingList._id || editingList.id || "", data);
        toast.success("Lista actualizada");
      } else if (onSubmit) {
        await onSubmit(data);
      } else {
        await createList(data);
        toast.success("¡Lista creada con éxito!");
      }
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting list:", error);
      toast.error(editingList ? "Error al actualizar la lista" : "Error al crear la lista");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">
            {editingList ? "EDITAR LISTA" : "NUEVA LISTA"}
          </DialogTitle>
          <DialogDescription>
            {editingList 
              ? "Actualiza los detalles de tu colección personalizada." 
              : "Crea una colección personalizada de tus películas y series favoritas."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-primary/60">Título de la lista</Label>
            <Input
              id="title"
              placeholder="E.g. Joyas Ocultas de Sci-Fi"
              className="rounded-xl border-primary/10 focus-visible:ring-primary/20 h-12"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-primary/60">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="¿De qué trata esta lista?"
              className="rounded-xl border-primary/10 focus-visible:ring-primary/20 min-h-[100px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="space-y-0.5">
              <Label htmlFor="public" className="text-sm font-bold">Lista Pública</Label>
              <p className="text-xs text-muted-foreground">Cualquiera puede ver esta lista.</p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl font-bold"
              onClick={() => onOpenChange(false)}
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="rounded-xl px-8 font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingList ? "GUARDAR CAMBIOS" : "CREAR LISTA")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
