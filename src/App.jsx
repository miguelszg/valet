import { useState } from "react";
import {
  GraduationCap,
  Contact,
  Star,
  CreditCard,
  Clock,
  Bell,
  FileText,
  MonitorSmartphone,
  CarFront,
  Menu,
  X,
  Camera,
} from "lucide-react";
import { getUsers } from "./store";
import Valet from "./Valet";

const MENU = [
  { id: "adn", label: "ADN CESBA", icon: GraduationCap },
  { id: "info", label: "Información del alumno", icon: Contact },
  { id: "kardex", label: "Kardex", icon: Star },
  { id: "grados", label: "Grados", icon: CreditCard },
  { id: "carga", label: "Carga académica", icon: Clock },
  { id: "notif", label: "Notificaciones", icon: Bell },
  { id: "reglamentos", label: "Reglamentos", icon: FileText },
  { id: "titulacion", label: "Opciones de titulación", icon: GraduationCap },
  { id: "dispositivos", label: "Dispositivos", icon: MonitorSmartphone },
  { id: "valet", label: "Valet Parking", icon: CarFront },
];
const VALET_MENU = [{ id: "valet", label: "Valet Parking", icon: CarFront }];

function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const currentUsers = getUsers();
    const u = currentUsers.find(
      (x) => x.user === user.trim().toLowerCase() && x.pass === pass,
    );
    if (!u) return setError("Usuario o contraseña incorrectos.");
    onLogin(u);
  };
  const fill = (u) => {
    setUser(u);
    setPass("1234");
    setError("");
  };

  return (
    <div className="min-h-full grid place-items-center bg-cesba p-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-20 place-items-center rounded-3xl  text-cesba shadow-lg">
            <img
              src="./img/icon.jpg"
              alt="CESBA Logo"
              className="h-auto w-auto rounded-xl object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold">CESBA</h1>
        </div>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="Usuario"
          autoCapitalize="none"
          className="mb-3 w-full rounded-xl bg-white px-4 py-3 font-semibold text-navy outline-none focus:ring-4 focus:ring-navy/30"
        />
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          placeholder="Contraseña"
          className="mb-3 w-full rounded-xl bg-white px-4 py-3 font-semibold text-navy outline-none focus:ring-4 focus:ring-navy/30"
        />
        {error && <p className="mb-3 text-sm font-bold text-white">{error}</p>}
        <button className="w-full rounded-xl bg-navy py-3 font-bold shadow-md active:scale-[.98]">
          Iniciar sesión
        </button>
        <div className="mt-6 rounded-xl bg-black/15 p-3 text-sm font-semibold">
          <p className="mb-2 text-white/80">Cuentas de prueba (clave 1234):</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fill("ana")}
              className="rounded-lg bg-white/20 px-3 py-1"
            >
              Estudiante (ana)
            </button>
            <button
              type="button"
              onClick={() => fill("luis")}
              className="rounded-lg bg-white/20 px-3 py-1"
            >
              Membresía vencida (luis)
            </button>
            <button
              type="button"
              onClick={() => fill("valet")}
              className="rounded-lg bg-white/20 px-3 py-1"
            >
              Valet (valet)
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div className="rounded-2xl bg-panel p-6">
      <h2 className="mb-2 text-xl font-extrabold">{title}</h2>
      <p className="font-medium text-white/60">
        Sección de la app original. En este prototipo solo se muestra el módulo
        de Valet Parking.
      </p>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    const u = localStorage.getItem("cesba-session");
    const currentUsers = getUsers();
    return currentUsers.find((x) => x.user === u) || null;
  });
  const [view, setView] = useState("valet");
  const [open, setOpen] = useState(false);

  const login = (u) => {
    localStorage.setItem("cesba-session", u.user);
    setSession(u);
    setView("valet");
  };
  const logout = () => {
    localStorage.removeItem("cesba-session");
    setSession(null);
    setOpen(false);
  };

  if (!session) return <Login onLogin={login} />;

  const items =
    session.role === "valet"
      ? MENU.filter((m) => VALET_MENU.some((v) => v.id === m.id))
      : MENU;
  const current = MENU.find((m) => m.id === view);

  return (
    <div className="flex h-full">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Menú lateral naranja */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85%] flex-col bg-cesba transition-transform lg:static lg:max-w-none lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="relative p-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X />
          </button>
          <div className="mb-4 flex items-start justify-between">
            <div className="grid size-24 place-items-center rounded-lg bg-black/20 text-4xl font-extrabold">
              {session.name[0]}
            </div>
            <Camera className="mr-8 lg:mr-0" />
          </div>
          <p className="font-extrabold leading-tight">{session.name}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{session.email}</p>
            <span
              className={`rounded px-2 py-0.5 text-sm font-bold ${session.status === "active" ? "bg-green-600" : "bg-red-600"}`}
            >
              {session.status === "active" ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto border-t border-white/15 py-2">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setView(id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-5 px-5 py-4 text-left font-extrabold ${view === id ? "bg-black/10 text-white" : "text-orange-100/70 hover:text-white"}`}
            >
              <Icon size={24} /> {label}
            </button>
          ))}
        </nav>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center">
          <p className="mb-4 font-bold">Aviso de privacidad</p>
          <button
            onClick={logout}
            className="rounded bg-cesba-dark px-6 py-3 font-bold shadow-md"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-slate-300 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-navy">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu />
          </button>
          <h1 className="font-extrabold">{current?.label}</h1>
          <Bell />
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:p-8">
          <div className="mx-auto max-w-3xl">
            {view === "valet" ? (
              <Valet
                session={session}
                onUpdateSession={(updated) => setSession(updated)}
              />
            ) : (
              <Placeholder title={current?.label} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
