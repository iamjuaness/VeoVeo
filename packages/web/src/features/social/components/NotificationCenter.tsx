import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/ui/button";
import { Bell, UserPlus, Film, Tv, MessageSquare } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  getSocialData,
  respondToRequest,
  markNotificationsAsRead,
} from "../services/social";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import { predefinedAvatars } from "../../../shared/components/common/PredefinedAvatars";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "../../../shared/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../shared/components/ui/popover";
import { ScrollArea } from "../../../shared/components/ui/scroll-area";

export function NotificationCenter() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await getSocialData(token);

      // Combine requests and recommendations
      const combined: any[] = [
        ...data.requests.map((r: any) => ({ ...r, type: "request" })),
        ...data.recommendations.map((r: any) => ({
          ...r,
          type: "recommendation",
        })),
      ];

      if (data.unreadMessagesCount > 0) {
        combined.push({
          _id: "unread-msgs",
          type: "messages",
          count: data.unreadMessagesCount,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }

      combined.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(combined);
      setUnreadCount(combined.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [token]);

  const handleOpenChange = async (open: boolean) => {
    if (open && unreadCount > 0) {
      try {
        await markNotificationsAsRead(token!);
        setUnreadCount(0);
        // We don't necessarily want to mark as read immediately if they just view the popover
        // but the backend implementation usually marks all as read when queried or via this call.
      } catch (error) {
        console.error("Error marking read:", error);
      }
    }
  };

  const handleRespond = async (requestId: string, action: "accepted" | "rejected") => {
    if (!token) return;
    try {
      await respondToRequest(requestId, action, token);
      fetchNotifications();
    } catch (error) {
      console.error("Error responding to request:", error);
    }
  };

  if (!user) return null;

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-primary/10 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600 border-2 border-background animate-pulse">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 overflow-hidden bg-white dark:bg-[#161b22] border border-border shadow-2xl"
        align="end"
      >
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <h3 className="font-bold text-sm">Notificaciones</h3>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
              <div className="bg-muted/50 p-3 rounded-full mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notif, idx) => {
                const isRequest = notif.type === "request";
                const isMessages = notif.type === "messages";
                const actor = isMessages ? null : notif.from;
                const actorAvatar = actor
                  ? predefinedAvatars.find((a) => a.id === actor.selectedAvatar) ||
                    predefinedAvatars[0]
                  : null;

                return (
                  <div
                    key={notif._id || idx}
                    className={`p-4 transition-colors hover:bg-primary/5 ${
                      !notif.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 border border-border/50">
                        {isMessages ? (
                          <AvatarFallback className="bg-blue-500 text-white">
                            <MessageSquare className="w-4 h-4" />
                          </AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={actorAvatar?.url} />
                            <AvatarFallback>
                              {actor?.name?.substring(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold leading-none">
                            {isMessages ? "Mensajes" : actor?.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(notif.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>

                        {isRequest ? (
                          <>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <UserPlus className="w-3 h-3 text-primary" /> te
                              envió una solicitud de amistad
                            </p>
                            {notif.status === "pending" ? (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  className="h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-[11px] font-bold"
                                  onClick={() =>
                                    handleRespond(notif._id, "accepted")
                                  }
                                >
                                  ACEPTAR
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="mt-1 text-[10px] capitalize"
                              >
                                {notif.status === "accepted"
                                  ? "Aceptada"
                                  : "Rechazada"}
                              </Badge>
                            )}
                          </>
                        ) : isMessages ? (
                          <>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              Tienes{" "}
                              <span className="font-bold text-foreground">
                                {notif.count}
                              </span>{" "}
                              mensajes nuevos
                            </p>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-[11px] text-primary"
                              onClick={() => (window.location.href = "/social")}
                            >
                              Ver chat
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {notif.mediaType === "movie" ? (
                                <Film className="w-3 h-3" />
                              ) : (
                                <Tv className="w-3 h-3" />
                              )}
                              te recomendó{" "}
                              <span className="font-medium text-foreground">
                                {notif.mediaTitle}
                              </span>
                            </p>
                            {notif.message && (
                              <p className="text-[11px] bg-muted/50 p-2 rounded-lg italic text-muted-foreground mt-1">
                                "{notif.message}"
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 bg-muted/30 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full text-[11px] h-8 text-muted-foreground hover:text-primary"
              onClick={() => (window.location.href = "/social")}
            >
              Ver todo en Social
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
