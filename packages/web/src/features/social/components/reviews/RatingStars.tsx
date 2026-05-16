import { Star } from "lucide-react";
import { useState } from "react";

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  maxRating?: number;
  interactive?: boolean;
  size?: number;
}

export function RatingStars({
  rating,
  onRatingChange,
  maxRating = 10,
  interactive = false,
  size = 24,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index: number) => {
    if (interactive) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (interactive) setHoverRating(0);
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((index) => {
        const isFilled = (hoverRating || rating) >= index;
        return (
          <Star
            key={index}
            size={size}
            className={`${
              isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            } ${interactive ? "cursor-pointer transition-transform hover:scale-125" : ""}`}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          />
        );
      })}
      <span className="ml-2 font-bold text-lg">
        {hoverRating || rating || 0}
        <span className="text-muted-foreground text-sm font-normal">/{maxRating}</span>
      </span>
    </div>
  );
}
