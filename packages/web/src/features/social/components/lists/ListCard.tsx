import React from "react";
import type { CustomList } from "@veoveo/shared";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../shared/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../shared/components/ui/avatar";
import { Badge } from "../../../../shared/components/ui/badge";
import { Heart, List as ListIcon, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ListCardProps {
  list: CustomList;
  onLike?: (listId: string) => void;
  onShare?: (list: CustomList) => void;
  onClick?: (listId: string) => void;
  isOwner?: boolean;
}

export const ListCard: React.FC<ListCardProps> = ({
  list,
  onLike,
  onShare,
  onClick,
  isOwner,
}) => {
  const itemsCount = list.items.length;
  const likesCount = list.likes.length;
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onClick) {
      onClick(list._id || list.id || "");
    } else {
      navigate(`/social/list/${list._id || list.id}`);
    }
  };

  return (
    <Card
      className="group overflow-hidden border border-primary/5 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-primary/5 rounded-2xl cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-black leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {list.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {isOwner && (
              <Badge
                variant={list.isPublic ? "secondary" : "outline"}
                className="text-[10px] h-5 rounded-full px-2"
              >
                {list.isPublic ? "Pública" : "Privada"}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
          {list.description || "Sin descripción"}
        </p>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="flex gap-2 mt-4">
          <div className="flex -space-x-3 overflow-hidden">
            {list.items.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="inline-block h-12 w-9 rounded-md border-2 border-background bg-muted overflow-hidden"
              >
                {item.mediaPoster ? (
                  <img
                    src={item.mediaPoster}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                    {item.mediaType === "movie" ? "FILM" : "TV"}
                  </div>
                )}
              </div>
            ))}
            {itemsCount > 3 && (
              <div className="inline-block h-12 w-9 rounded-md border-2 border-background bg-primary/10 items-center justify-center text-[10px] font-black text-primary">
                +{itemsCount - 3}
              </div>
            )}
            {itemsCount === 0 && (
              <div className="inline-block h-12 w-9 rounded-md border-2 border-background bg-muted/50 items-center justify-center">
                <ListIcon className="w-4 h-4 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-primary/5 mt-4">
        <div className="flex items-center gap-2">
          {!isOwner && (
            <Avatar className="h-6 w-6 border border-primary/10">
              <AvatarImage src={list.userAvatar} />
              <AvatarFallback className="text-[8px] font-bold">
                {list.userName?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            {formatDistanceToNow(new Date(list.updatedAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group/like"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.(list._id || list.id || "");
            }}
          >
            <Heart className="w-4 h-4 group-hover/like:fill-primary" />
            <span className="text-xs font-bold">{likesCount}</span>
          </button>
          <button
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(list);
            }}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};
