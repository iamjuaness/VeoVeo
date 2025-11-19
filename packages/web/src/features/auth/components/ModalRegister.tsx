import { useState } from "react";
import { Check, Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { register } from "../../movies/services/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/components/ui/avatar";
import { predefinedAvatars } from "../../../shared/components/common/PredefinedAvatars";

interface RegisterDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function ModalRegister({ open, setOpen }: RegisterDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setConfirm] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(predefinedAvatars[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }
    if (!email.trim()) {
      newErrors.email = "El email es obligatorio.";
    } else {
      // Validación básica de email
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        newErrors.email = "El email no tiene un formato válido.";
      }
    }
    if (!password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "Las contraseñas no coinciden.";
    }

    if (!selectedAvatar) {
      newErrors.selectedAvatar = "Debes seleccionar un avatar.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      await register({ name, email, password, passwordConfirm, selectedAvatar });
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setSelectedAvatar(predefinedAvatars[0].id);
    } catch (error: any) {
      setErrors({ submit: error?.message ?? "Error al registrarse, intenta de nuevo." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 w-full sm:w-auto">
          <UserPlus className="w-4 h-4" />
          Registrarse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-full px-2 py-4 rounded-lg max-h-[90vh] flex flex-col" style={{ touchAction: "manipulation" }}>
        <DialogHeader>
          <DialogTitle>Crear Cuenta</DialogTitle>
          <DialogDescription>
            Crea una nueva cuenta para guardar tu colección de películas.
          </DialogDescription>
        </DialogHeader>
        <form className="flex-1 flex flex-col gap-4 overflow-y-auto pb-24 sm:pb-6" onSubmit={handleRegister}>
          {errors.submit && (
            <div className="text-red-600 font-medium text-sm text-center">{errors.submit}</div>
          )}

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
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
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
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
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
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
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
            {errors.passwordConfirm && <p className="text-xs text-red-600">{errors.passwordConfirm}</p>}
          </div>

          {/* Selector de Avatar */}
          <div className="space-y-3">
            <Label>Selecciona tu avatar</Label>
            <div className="flex flex-col xs:flex-row items-center gap-2 mb-3">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage
                  src={predefinedAvatars.find(avatar => avatar.id === selectedAvatar)?.url || "/placeholder.svg"}
                  alt="Avatar seleccionado"
                  className="object-cover rounded-full"
                />
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-center">Avatar seleccionado</p>
                <p className="text-xs text-muted-foreground text-center">
                  {predefinedAvatars.find(avatar => avatar.id === selectedAvatar)?.name}
                </p>
              </div>
            </div>
            {errors.selectedAvatar && <p className="text-xs text-red-600">{errors.selectedAvatar}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-36 overflow-y-auto p-2 border rounded-lg">
              {predefinedAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`relative p-1 rounded-lg transition-all hover:bg-accent ${selectedAvatar === avatar.id
                    ? "ring-2 ring-primary bg-accent"
                    : "hover:ring-1 hover:ring-muted-foreground"
                    }`}
                  disabled={isLoading}
                >
                  <Avatar className="h-10 w-10 rounded-full">
                    <AvatarImage
                      src={avatar.url || "/placeholder.svg"}
                      alt={avatar.name}
                      className="object-cover rounded-full"
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
          {/* Botonera siempre visible abajo */}
          <div
            className="
              fixed
              left-0
              right-0
              bottom-0
              px-4
              py-3
              bg-background
              border-t
              flex
              gap-2
              sm:static sm:px-0 sm:py-0 sm:bg-transparent sm:border-0
            "
          >
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
