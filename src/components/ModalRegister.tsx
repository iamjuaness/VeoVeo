import { useState } from "react";
import { Check, Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { register } from "../api/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { predefinedAvatars } from "./PredefinedAvatars";

interface RegisterDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function ModalRegister({ open, setOpen }: RegisterDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setConfirm] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    predefinedAvatars[0].id
  );
  const [isLoading, setIsLoading] = useState(false);

  // Lógica para manejar el registro (puedes conectar con tu backend o localStorage aquí)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (password !== passwordConfirm) {
        alert("Las contraseñas no coinciden");
        return;
      }
      await register({ name, email, password, passwordConfirm, selectedAvatar });
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setSelectedAvatar(predefinedAvatars[0].id);
      setSelectedAvatar(predefinedAvatars[0].id);
    } catch (error) {
      // Manejo de error opcional
      alert("Error al registrarse, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Registrarse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Cuenta</DialogTitle>
          <DialogDescription>
            Crea una nueva cuenta para guardar tu colección de películas
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="space-y-2">
            <Label htmlFor="register-name">Nombre completo</Label>
            <Input
              id="register-name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Contraseña</Label>
            <Input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-confirm">Confirmar contraseña</Label>
            <Input
              id="register-confirm"
              type="password"
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {/* Selector de Avatar */}
          <div className="space-y-3">
            <Label>Selecciona tu avatar</Label>
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage
                  src={
                    predefinedAvatars.find(
                      (avatar) => avatar.id === selectedAvatar
                    )?.url || "/placeholder.svg"
                  }
                  alt="Avatar seleccionado"
                  className="object-cover"
                />
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Avatar seleccionado</p>
                <p className="text-xs text-muted-foreground">
                  {
                    predefinedAvatars.find(
                      (avatar) => avatar.id === selectedAvatar
                    )?.name
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 border rounded-lg">
              {predefinedAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`relative p-1 rounded-lg transition-all hover:bg-accent ${
                    selectedAvatar === avatar.id
                      ? "ring-2 ring-primary bg-accent"
                      : "hover:ring-1 hover:ring-muted-foreground"
                  }`}
                  disabled={isLoading}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={avatar.url || "/placeholder.svg"}
                      alt={avatar.name}
                      className="object-cover"
                    />
                    <AvatarFallback>👤</AvatarFallback>
                  </Avatar>
                  {selectedAvatar === avatar.id && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando...
                </span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear Cuenta
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
