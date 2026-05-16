import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../shared/components/ui/card";
import { Button } from "../../../../shared/components/ui/button";
import { Textarea } from "../../../../shared/components/ui/textarea";
import { MessageSquare, Send, Loader2, Edit2 } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { upsertReview, getReviewByMediaId } from "../../services/review";
import { useAuth } from "../../../auth/hooks/useAuth";
import { toast } from "sonner";
import type { Review } from "@veoveo/shared";

interface ReviewSectionProps {
  mediaId: string;
  mediaType: "movie" | "series";
}

export function ReviewSection({ mediaId, mediaType }: ReviewSectionProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  useEffect(() => {
    async function fetchReview() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const review = await getReviewByMediaId(mediaId);
        if (review) {
          setExistingReview(review);
          setRating(review.rating);
          setComment(review.comment || "");
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (error) {
        console.error("Error fetching review:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReview();
  }, [mediaId, user]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecciona una calificación");
      return;
    }

    setSubmitting(true);
    try {
      await upsertReview({
        mediaId,
        mediaType,
        rating,
        comment,
      });
      const updatedReview: Review = {
        mediaId,
        mediaType,
        rating,
        comment,
        createdAt: existingReview?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setExistingReview(updatedReview);
      setIsEditing(false);
      toast.success("Tu review ha sido guardada");
    } catch (error) {
      console.error("Error saving review:", error);
      toast.error("Error al guardar la review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="rounded-2xl shadow-lg bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <MessageSquare className="w-5 h-5 text-primary" />
          Tu Reseña Personal
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                ¿Qué te pareció?
              </label>
              <RatingStars
                rating={rating}
                onRatingChange={setRating}
                interactive
                size={32}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Tu opinión (opcional)
              </label>
              <Textarea
                placeholder="Cuéntanos qué te gustó o qué no de esta producción..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[120px] bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              {existingReview && (
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {existingReview ? "Actualizar Reseña" : "Guardar Reseña"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <RatingStars rating={rating} size={24} />
                <p className="text-xs text-muted-foreground">
                  Última actualización:{" "}
                  {existingReview?.updatedAt && new Date(existingReview.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2 hover:bg-primary/10 hover:text-primary border-primary/20"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </Button>
            </div>

            {comment ? (
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 italic text-foreground/90">
                "{comment}"
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No has escrito ningún comentario.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
