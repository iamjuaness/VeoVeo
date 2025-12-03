import { useState } from "react";
import {
  Check,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
} from "lucide-react";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
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
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    predefinedAvatars[0].id
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z\d]/.test(pass)) strength++;

    const labels = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Muy fuerte"];
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];

    return {
      strength: Math.min(strength, 5),
      label: labels[Math.min(strength - 1, 4)] || "",
      color: colors[Math.min(strength - 1, 4)] || "",
    };
  };

  const passwordStrength = getPasswordStrength(password);

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }
    if (!email.trim()) {
      newErrors.email = "El email es obligatorio.";
    } else {
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
      await register({
        name,
        email,
        password,
        passwordConfirm,
        selectedAvatar,
      });
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setSelectedAvatar(predefinedAvatars[0].id);
    } catch (error: any) {
      setErrors({
        submit: error?.message ?? "Error al registrarse, intenta de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Registrarse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg w-full p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Gradient Header */}
        <div className="relative h-28 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Crear Cuenta</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl">
              Únete a VeoVeo
            </DialogTitle>
            <DialogDescription className="text-center">
              Crea una cuenta para guardar tu colección de películas
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleRegister}>
            {errors.submit && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center">
                  {errors.submit}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="register-name" className="text-sm font-medium">
                Nombre completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="register-password"
                className="text-sm font-medium"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= passwordStrength.strength
                            ? passwordStrength.color
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <p className="text-xs text-muted-foreground">
                      Seguridad:{" "}
                      <span className="font-medium">
                        {passwordStrength.label}
                      </span>
                    </p>
                  )}
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm" className="text-sm font-medium">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="register-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
              {errors.passwordConfirm && (
                <p className="text-xs text-destructive">
                  {errors.passwordConfirm}
                </p>
              )}
            </div>

            {/* Avatar Selector */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium">
                Selecciona tu avatar
              </Label>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-14 w-14 border-2 border-primary ring-2 ring-primary/20">
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
                  <p className="text-sm font-medium">
                    {
                      predefinedAvatars.find(
                        (avatar) => avatar.id === selectedAvatar
                      )?.name
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avatar seleccionado
                  </p>
                </div>
              </div>
              {errors.selectedAvatar && (
                <p className="text-xs text-destructive">
                  {errors.selectedAvatar}
                </p>
              )}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-background">
                {predefinedAvatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`relative p-1.5 rounded-lg transition-all hover:bg-accent ${
                      selectedAvatar === avatar.id
                        ? "ring-2 ring-primary bg-accent scale-105"
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
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Crear Cuenta
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
