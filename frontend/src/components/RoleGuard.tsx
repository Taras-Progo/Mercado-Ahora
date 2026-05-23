"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { roleHome, UserRole, useAuth } from "@/components/AuthProvider";
import { LeafIcon, XCircleIcon } from "@/components/ui/Icons";

type RoleGuardProps = {
  roles: UserRole[];
  children: ReactNode;
};

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [ready, router, user]);

  if (!ready) {
    return <GuardScreen variant="loading" />;
  }

  if (!user) {
    return <GuardScreen variant="redirecting" />;
  }

  if (!roles.includes(user.role)) {
    return <GuardScreen variant="forbidden" expected={roles} currentRole={user.role} />;
  }

  return <>{children}</>;
}

type ScreenProps = {
  variant: "loading" | "redirecting" | "forbidden";
  expected?: UserRole[];
  currentRole?: UserRole;
};

function GuardScreen({ variant, expected, currentRole }: ScreenProps) {
  if (variant === "loading") {
    return (
      <div className="mx-auto grid max-w-md gap-4 rounded-3xl border border-border-soft bg-white p-10 text-center">
        <span className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-olive-muted text-olive-dark">
          <LeafIcon className="h-5 w-5" />
        </span>
        <p className="text-sm text-stone-600">Validando sesión…</p>
      </div>
    );
  }

  if (variant === "redirecting") {
    return (
      <div className="mx-auto grid max-w-md gap-4 rounded-3xl border border-border-soft bg-white p-10 text-center">
        <p className="text-sm text-stone-600">Redirigiendo al ingreso…</p>
      </div>
    );
  }

  const expectedLabel = expected?.map((role) => roleLabel(role)).join(" o ") ?? "";

  return (
    <div className="mx-auto grid max-w-md gap-4 rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
        <XCircleIcon className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-red-700">Acceso restringido</p>
      <p className="text-sm text-red-700/80">
        Esta sección es para {expectedLabel}. Tu cuenta actual es de tipo {roleLabel(currentRole ?? "buyer")}.
      </p>
      <Link
        href={roleHome(currentRole)}
        className="mx-auto inline-flex items-center justify-center rounded-full bg-olive-dark px-4 py-2 text-xs font-semibold text-white transition hover:bg-olive"
      >
        Ir a mi inicio
      </Link>
    </div>
  );
}

function roleLabel(role: UserRole) {
  if (role === "admin") return "administradores";
  if (role === "seller") return "productores";
  return "compradores";
}
