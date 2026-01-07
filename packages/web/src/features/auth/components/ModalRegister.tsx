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
import { Label } from "../../../shared/components/ui/label";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import { register } from "../../movies/services/auth";
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

      {/* Mobile: bottom sheet, Desktop: centered dialog */}
      <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] sm:max-w-2xl lg:max-w-5xl p-0 gap-0 overflow-hidden fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-t-2xl sm:rounded-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col mx-auto">
        {/* Header - Gradient */}
        <div className="relative h-20 sm:h-24 lg:h-28 bg-linear-to-br from-primary via-primary/90 to-accent flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-2">
            <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-full">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white drop-shadow-lg">
              Crear Cuenta
            </h2>
          </div>
        </div>

        {/* Content - Responsive Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-full">
            {/* Left Panel: Form */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              <DialogHeader className="space-y-1 sm:space-y-2">
                <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold bg-linear-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Únete a CineMate
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  Crea tu cuenta y organiza tu colección de películas
                </DialogDescription>
              </DialogHeader>

              <form
                className="space-y-3 sm:space-y-4"
                onSubmit={handleRegister}
              >
                {errors.submit && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-xs sm:text-sm text-destructive font-medium text-center">
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* Name Field */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="register-name"
                    className="text-xs sm:text-sm font-semibold"
                  >
                    Nombre completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base rounded-lg border focus-visible:ring-1 focus-visible:ring-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="register-email"
                    className="text-xs sm:text-sm font-semibold"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base rounded-lg border focus-visible:ring-1 focus-visible:ring-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="register-password"
                    className="text-xs sm:text-sm font-semibold"
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base rounded-lg border focus-visible:ring-1 focus-visible:ring-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {password && (
                    <div className="space-y-1.5">
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
                      <p className="text-xs text-muted-foreground">
                        Seguridad:{" "}
                        <span
                          className={`font-semibold ${passwordStrength.color.replace(
                            "bg-",
                            "text-"
                          )}`}
                        >
                          {passwordStrength.label}
                        </span>
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="register-confirm"
                    className="text-xs sm:text-sm font-semibold"
                  >
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={passwordConfirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base rounded-lg border focus-visible:ring-1 focus-visible:ring-primary"
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

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 sm:h-11 text-sm sm:text-base flex-1 rounded-lg"
                    onClick={() => setOpen(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 sm:h-11 text-sm sm:text-base flex-1 gap-2 bg-linear-to-r from-primary via-primary/90 to-accent hover:opacity-90 transition-all rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando...
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

            {/* Right Panel: Avatar Selector */}
            <div className="bg-muted/30 border-t lg:border-t-0 lg:border-l p-4 sm:p-6 lg:p-8 space-y-4">
              <div className="text-center lg:text-left space-y-1">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold">
                  Elige tu avatar
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Selecciona tu imagen favorita
                </p>
              </div>

              {/* Selected Avatar Preview */}
              <div className="p-3 sm:p-4 bg-background/80 backdrop-blur-sm rounded-xl border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 border-2 border-primary ring-2 ring-primary/20">
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
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold truncate">
                      {
                        predefinedAvatars.find(
                          (avatar) => avatar.id === selectedAvatar
                        )?.name
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Seleccionado
                    </p>
                  </div>
                </div>
              </div>

              {/* Avatar Grid */}
              <div className="space-y-2">
                {errors.selectedAvatar && (
                  <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-xs text-destructive text-center">
                      {errors.selectedAvatar}
                    </p>
                  </div>
                )}
                <div className="max-h-[300px] sm:max-h-[350px] lg:max-h-[400px] overflow-y-auto p-2 sm:p-3 bg-background/50 rounded-xl border">
                  <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                    {predefinedAvatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`relative p-1.5 rounded-lg transition-all hover:scale-105 border-2 ${
                          selectedAvatar === avatar.id
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-transparent hover:border-primary/30"
                        }`}
                        disabled={isLoading}
                      >
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 mx-auto">
                          <AvatarImage
                            src={avatar.url || "/placeholder.svg"}
                            alt={avatar.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-base">
                            👤
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
