import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../shared/components/ui/dialog";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import { useSocial } from "../context/SocialContext";
import { Search, Send, CheckCircle2 } from "lucide-react";
import { Textarea } from "../../../shared/components/ui/textarea";

interface RecommendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  mediaType: "movie" | "series";
  mediaTitle: string;
  mediaPoster: string;
}

export function RecommendModal({
  open,
  onOpenChange,
  mediaId,
  mediaType,
  mediaTitle,
  mediaPoster,
}: RecommendModalProps) {
  const { friends, recommend } = useSocial();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filteredFriends = friends.filter((f) =>
    f?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRecommend = async () => {
    if (!selectedFriend) return;
    setSending(true);
    try {
      await recommend({
        toId: selectedFriend._id || selectedFriend.id,
        mediaId,
        mediaType,
        mediaTitle,
        mediaPoster,
        message,
      });
      setSent(true);
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
        setSelectedFriend(null);
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Error recommending:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            RECOMENDAR
          </DialogTitle>
          <DialogDescription>
            Comparte{" "}
            <span className="font-bold text-primary">{mediaTitle}</span> con tus
            amigos.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="bg-primary/10 p-6 rounded-full">
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </div>
            <div>
              <p className="text-xl font-black uppercase tracking-tight">
                ¡Recomendación enviada!
              </p>
              <p className="text-sm text-muted-foreground">
                Tu amigo recibirá una notificación.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {!selectedFriend ? (
              <div className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Buscar amigo..."
                    className="pl-10 h-10 bg-muted/30 border-primary/5 rounded-xl"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchQuery(e.target.value)
                    }
                  />
                </div>
                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {filteredFriends.length === 0 ? (
                    <p className="text-center py-8 text-sm text-muted-foreground font-medium italic">
                      No se encontraron amigos.
                    </p>
                  ) : (
                    filteredFriends.map((friend) => (
                      <div
                        key={friend._id || friend.id}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-primary/5 cursor-pointer transition-colors group"
                        onClick={() => setSelectedFriend(friend)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-primary/10">
                            <AvatarImage src={friend.selectedAvatar} />
                            <AvatarFallback className="font-bold text-primary">
                              {friend.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">
                            {friend.name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full h-8 w-8 text-muted-foreground group-hover:text-primary"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={selectedFriend.selectedAvatar} />
                    <AvatarFallback className="font-black text-primary">
                      {selectedFriend.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-primary tracking-widest leading-none mb-1">
                      Para:
                    </p>
                    <p className="font-black text-lg leading-none">
                      {selectedFriend.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFriend(null)}
                    className="text-xs font-bold hover:text-red-500"
                  >
                    Cambiar
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground px-1">
                    Mensaje (Opcional)
                  </label>
                  <Textarea
                    placeholder="¿Por qué la recomiendas?"
                    className="rounded-2xl bg-muted/30 border-primary/5 resize-none h-24 focus-visible:ring-primary/20"
                    value={message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setMessage(e.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {!sent && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              disabled={!selectedFriend || sending}
              onClick={handleRecommend}
              className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20 bg-primary order-1 sm:order-2 flex-1 sm:flex-none"
            >
              {sending ? "ENVIANDO..." : "ENVIAR TIPS"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
