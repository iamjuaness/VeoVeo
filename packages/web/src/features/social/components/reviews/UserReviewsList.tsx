import { useState, useEffect } from "react";
import { getUserReviews } from "../../services/review";
import type { Review } from "@veoveo/shared";
import { Card, CardContent } from "../../../../shared/components/ui/card";
import {
  Loader2,
  MessageSquare,
  Star,
  Film,
  Tv,
  ExternalLink,
} from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RatingStars } from "./RatingStars";

export function UserReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getUserReviews();
        setReviews(
          data.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-primary/10 rounded-3xl bg-muted/5">
        <div className="bg-primary/5 p-6 rounded-full w-fit mx-auto mb-4">
          <Star className="w-12 h-12 text-primary/20" />
        </div>
        <div className="max-w-[280px] mx-auto">
          <p className="font-bold text-lg">Aún no has escrito reseñas</p>
          <p className="text-sm text-muted-foreground">
            Califica películas y series para que aparezcan aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reviews.map((review) => (
        <Card
          key={review.mediaId}
          className="border border-primary/5 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all rounded-2xl overflow-hidden shadow-sm"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  {review.mediaType === "movie" ? (
                    <Film className="w-4 h-4 text-primary" />
                  ) : (
                    <Tv className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      {review.mediaType === "movie" ? "Película" : "Serie"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg leading-tight">
                    {/* Note: We don't have the title in the review object, but we can navigate to the detail page */}
                    ID: {review.mediaId}
                  </h4>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <RatingStars rating={review.rating} size={16} />
                <span className="text-[10px] font-bold text-muted-foreground">
                  {review.rating}/10
                </span>
              </div>
            </div>

            {review.comment && (
              <div className="p-4 bg-muted/30 rounded-xl mb-4 relative">
                <MessageSquare className="absolute -top-2 -left-2 w-4 h-4 text-primary opacity-20" />
                <p className="text-sm italic text-muted-foreground line-clamp-3">
                  "{review.comment}"
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs font-bold hover:bg-primary/5 gap-2"
                onClick={() =>
                  navigate(`/${review.mediaType}/${review.mediaId}`)
                }
              >
                VER DETALLES
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
