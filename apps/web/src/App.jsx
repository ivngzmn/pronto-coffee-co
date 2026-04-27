import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  Bolt,
  CreditCard,
  Coffee,
  CupSoda,
  Github,
  LayoutGrid,
  LogOut,
  Menu,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Timer,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Skeleton } from "./components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "./components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { formatOrderItem, orderingCategories } from "@pronto/menu";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const SIDEBAR_COOKIE_PREFIX = "pronto_sidebar_open";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const milkOptions = ["Whole", "Oat", "Almond", "Soy"];
const sizeOptions = ["Small", "Medium", "Large"];
const taxRate = 0.085;
const serviceFeeRate = 0.04;

function getSidebarCookieName(userKey) {
  const normalizedUserKey = String(userKey || "default").trim() || "default";
  return `${SIDEBAR_COOKIE_PREFIX}_${encodeURIComponent(normalizedUserKey)}`;
}

function readCookie(name) {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

function readSidebarOpenPreference(userKey) {
  return readCookie(getSidebarCookieName(userKey)) !== "collapsed";
}

function writeSidebarOpenPreference(userKey, open) {
  if (typeof document === "undefined") return;

  const name = getSidebarCookieName(userKey);
  const value = encodeURIComponent(open ? "expanded" : "collapsed");
  document.cookie = `${name}=${value}; Max-Age=${SIDEBAR_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function createTicketItem(item, selections) {
  return {
    uid:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${item.id}-${Date.now()}-${Math.random()}`,
    id: item.id,
    name: item.name,
    basePrice: item.basePrice || "$4.50",
    category: item.category,
    sizes: item.sizes || [],
    milkOptions: item.milkOptions || [],
    temperatureOptions: item.temperatureOptions || [],
    size: item.sizes?.length ? selections.size : "",
    milk: item.milkOptions?.length ? selections.milk : "",
    temperature:
      item.temperatureOptions?.length > 1
        ? item.temperatureOptions[0]
        : item.temperatureOptions?.[0] || "",
    notes: "",
  };
}

function parsePrice(price) {
  const value = Number.parseFloat(String(price || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getOrderTotals(ticket) {
  const subtotal = ticket.reduce((sum, item) => sum + parsePrice(item.basePrice), 0);
  const serviceFee = subtotal * serviceFeeRate;
  const tax = subtotal * taxRate;
  const total = subtotal + serviceFee + tax;

  return { subtotal, serviceFee, tax, total };
}

function formatTicketItem(item) {
  const formatted = formatOrderItem(item, {
    size: item.size,
    milk: item.milk,
    temperature: item.temperature,
  });

  return item.notes.trim() ? `${formatted} (${item.notes.trim()})` : formatted;
}

function ticketModifiers(item) {
  return [item.size, item.temperature, item.milk ? `${item.milk} milk` : "", item.notes]
    .filter(Boolean)
    .join(", ");
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

function useSession() {
  const [session, setSession] = useState({ loading: true, authenticated: false, user: null });

  useEffect(() => {
    let ignore = false;

    api("/api/session")
      .then((data) => {
        if (!ignore) {
          setSession({ loading: false, ...data });
        }
      })
      .catch(() => {
        if (!ignore) {
          setSession({ loading: false, authenticated: false, user: null });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return [session, setSession];
}

function ProtectedRoute({ authenticated, loading, user, children }) {
  const location = useLocation();

  if (loading) {
    return (
      <PageShell>
        <DashboardSkeleton />
      </PageShell>
    );
  }

  if (!authenticated || user?.role === "customer") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 md:px-6">
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
}

function LoadingState({ message }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center text-slate-600">{message}</CardContent>
      </Card>
    </div>
  );
}

function AuthSkeleton() {
  return (
    <PageShell>
      <div className="grid min-h-[85vh] items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[36px] bg-stone-900 p-8 text-stone-50 md:p-10">
          <Skeleton className="h-6 w-28 bg-white/15" />
          <Skeleton className="mt-6 h-14 w-full max-w-xl bg-white/15" />
          <Skeleton className="mt-3 h-14 w-5/6 bg-white/10" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 bg-white/10" />
            <Skeleton className="h-24 bg-white/10" />
            <Skeleton className="h-24 bg-white/10" />
          </div>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-1/2" />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-[32px] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-80 max-w-full" />
            <Skeleton className="h-4 w-52" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <PageShell>
      <div className="mx-auto grid min-h-[88vh] max-w-5xl items-center gap-10 lg:grid-cols-[0.85fr_1fr]">
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                <Coffee className="size-4" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">BaristaPro</h1>
                <p className="text-xs text-slate-500">Station 01 / Morning Shift</p>
              </div>
            </div>
            <Badge className="mt-8 bg-blue-50 text-blue-700">4 on clock</Badge>
          </div>
          <div className="space-y-3">
            {["Alex Chen", "Sarah Miller", "Jordan Smith"].map((name, index) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <UserRound className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{index === 1 ? "Shift Supervisor" : "Lead Barista"}</p>
                  </div>
                </div>
                <span className="text-slate-300">›</span>
              </div>
            ))}
          </div>
        </div>
        <Card className="overflow-hidden rounded-xl">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function ProviderButtons() {
  const [providers, setProviders] = useState([
    { id: "google", enabled: true, loginUrl: "/api/auth/google" },
    { id: "github", enabled: true, loginUrl: "/api/auth/github" },
    { id: "facebook", enabled: true, loginUrl: "/api/auth/facebook" },
  ]);

  useEffect(() => {
    let ignore = false;

    api("/api/auth/providers")
      .then((data) => {
        if (!ignore && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      })
      .catch(() => {
        if (!ignore) {
          setProviders((current) =>
            current.map((provider) => ({ ...provider, enabled: false }))
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const providerMeta = {
    google: { label: "Google", icon: <span className="text-base font-bold">G</span> },
    github: { label: "GitHub", icon: <Github className="h-4 w-4" /> },
    facebook: { label: "Facebook", icon: <span className="text-base font-bold">f</span> },
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {providers.map((provider) => {
        const meta = providerMeta[provider.id] || {
          label: provider.id,
          icon: null,
        };
        const href = `${API_URL}${provider.loginUrl}`;

        if (!provider.enabled) {
          return (
            <Button key={provider.id} variant="outline" type="button" disabled title="Provider setup needed">
              {meta.icon}
              {meta.label}
            </Button>
          );
        }

        return (
          <Button key={provider.id} variant="outline" type="button" asChild>
            <a href={href}>
              {meta.icon}
              {meta.label}
            </a>
          </Button>
        );
      })}
    </div>
  );
}

function LoginPage({ setSession }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const socialError = params.get("error");

    if (socialError === "social-provider") {
      setError("That social sign-in provider is not configured yet.");
    }

    if (socialError === "social-auth") {
      setError("Social sign-in was cancelled or could not be completed.");
    }
  }, [location.search]);

  async function onSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError("");

    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      setSession({ loading: false, authenticated: true, user: data.user });
      navigate("/profile");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Use fast social sign-in or your local Pronto staff credentials."
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Fast barista sign-in</p>
        <ProviderButtons />
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email">
          <Input name="email" type="email" required placeholder="barista@pronto.coffee" />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required placeholder="Your password" />
        </Field>
        {error ? <ErrorBanner message={error} /> : null}
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="text-sm text-slate-600">
        Need an account?{" "}
        <Link className="font-semibold text-slate-950 underline underline-offset-4" to="/signup">
          Create one here
        </Link>
        .
      </p>
    </AuthLayout>
  );
}

function SignupPage({ setSession }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError("");

    try {
      const data = await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          userName: formData.get("userName"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      setSession({ loading: false, authenticated: true, user: data.user });
      navigate("/profile");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create a staff account"
      subtitle="Start with a social account or create local Pronto staff credentials."
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Fast barista sign-in</p>
        <ProviderButtons />
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Display name">
          <Input name="userName" required placeholder="Jamie" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required placeholder="jamie@pronto.coffee" />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required placeholder="Create a password" />
        </Field>
        {error ? <ErrorBanner message={error} /> : null}
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Creating account..." : "Register account"}
        </Button>
      </form>
      <p className="text-sm text-slate-600">
        Already have access?{" "}
        <Link className="font-semibold text-slate-950 underline underline-offset-4" to="/login">
          Sign in
        </Link>
        .
      </p>
    </AuthLayout>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function DashboardLayout({ session, setSession, title, description, children, actions = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarPreferenceKey = session.user?.id || session.user?.email || session.user?.userName;
  const [sidebarOpen, setSidebarOpen] = useState(() => readSidebarOpenPreference(sidebarPreferenceKey));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isTimeClockScreen = location.pathname === "/profile";
  const navItems = [
    { to: "/order-dashboard", label: "Order Entry", icon: LayoutGrid },
    { to: "/barista-order-dashboard", label: "Order Queue", icon: CupSoda },
    { to: "/profile", label: "Time Clock", icon: Timer },
  ];

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    setSession({ loading: false, authenticated: false, user: null });
    navigate("/login");
  }

  function handleSidebarOpenChange(open) {
    setSidebarOpen(open);
    writeSidebarOpenPreference(sidebarPreferenceKey, open);
  }

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={handleSidebarOpenChange}
      mobileOpen={mobileSidebarOpen}
      onMobileOpenChange={setMobileSidebarOpen}
    >
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50 text-slate-950">
          <Sidebar>
            <SidebarHeader className={sidebarOpen ? "" : "lg:px-3"}>
              <div className={`flex h-8 items-center gap-3 ${sidebarOpen ? "" : "lg:justify-center"}`}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Coffee className="size-4" />
                </div>
                <div className={sidebarOpen ? "min-w-0" : "min-w-0 lg:hidden"}>
                  <p className="text-sm font-semibold leading-none">BaristaPro</p>
                  <p className="mt-1 text-[11px] text-slate-500">Station 01</p>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={to}
                          onClick={() => setMobileSidebarOpen(false)}
                          aria-label={label}
                          className={({ isActive }) =>
                            [
                              "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                              sidebarOpen ? "justify-start" : "justify-start lg:justify-center lg:px-0",
                              isActive
                                ? "bg-slate-100 text-slate-950"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                            ].join(" ")
                          }
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className={sidebarOpen ? "truncate" : "truncate lg:hidden"}>{label}</span>
                        </NavLink>
                      </TooltipTrigger>
                      {!sidebarOpen ? <TooltipContent>{label}</TooltipContent> : null}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 ${
                          sidebarOpen ? "justify-start" : "justify-start lg:justify-center lg:px-0"
                        }`}
                      >
                        <Settings className="size-4 shrink-0" />
                        <span className={sidebarOpen ? "truncate" : "truncate lg:hidden"}>Settings</span>
                      </div>
                    </TooltipTrigger>
                    {!sidebarOpen ? <TooltipContent>Settings</TooltipContent> : null}
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className={sidebarOpen ? "" : "lg:px-3"}>
              <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "lg:justify-center"}`}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <UserRound className="size-4" />
                </div>
                <div className={sidebarOpen ? "min-w-0 flex-1" : "min-w-0 flex-1 lg:hidden"}>
                  <p className="truncate text-sm font-semibold text-slate-900">{session.user?.userName}</p>
                  <p className="text-xs text-slate-500">Lead Barista</p>
                </div>
                {isTimeClockScreen ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                        <LogOut className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Log out</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
        <header className="sticky top-0 z-10 flex min-h-16 flex-col gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => handleSidebarOpenChange(!sidebarOpen)}
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              </Button>
              <h1 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h1>
              <Badge variant="success">Live</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 md:flex">
              <Search className="size-4" />
              <span>Search orders...</span>
            </div>
            {actions}
            {isTimeClockScreen ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4" />
                Clock Out
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-6">
        {children}
        </main>
          </SidebarInset>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}

function useProfileData(authenticated) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    if (!authenticated) return;
    let ignore = false;

    api("/api/profile")
      .then((data) => {
        if (!ignore) setState({ loading: false, data, error: "" });
      })
      .catch((error) => {
        if (!ignore) setState({ loading: false, data: null, error: error.message });
      });

    return () => {
      ignore = true;
    };
  }, [authenticated]);

  return [state, setState];
}

function ProfilePage({ session, setSession }) {
  const [state] = useProfileData(true);

  if (state.loading) {
    return (
      <DashboardLayout session={session} setSession={setSession} title="Time Clock" description="Loading your shift snapshot">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      session={session}
      setSession={setSession}
      title="Time Clock"
      description="Shift overview, clock status, and order health"
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
            <div className="p-6">
              <Badge className="bg-blue-50 text-blue-700">Clocked in</Badge>
              <p className="mt-6 text-5xl font-semibold tracking-tight text-slate-950">08:45</p>
              <p className="mt-2 text-sm text-slate-500">Started today at 8:45 AM</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button>
                  <Timer className="size-4" />
                  Start Break
                </Button>
                <Button variant="outline">
                  <LogOut className="size-4" />
                  Clock Out
                </Button>
              </div>
            </div>
            <div className="min-h-64 bg-[url('/assets/images/menu/cappuccino.webp')] bg-cover bg-center" />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Station Details</CardTitle>
            <CardDescription>Your active staff account and queue snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InfoTile label="Name" value={state.data?.user?.userName || "Unknown"} icon={ShieldCheck} />
            <InfoTile label="Email" value={state.data?.user?.email || "Unknown"} icon={Coffee} />
            <InfoTile label="Pending orders" value={String(state.data?.orders?.length || 0)} icon={CupSoda} />
            <InfoTile label="Completed orders" value={String(state.data?.completed?.length || 0)} icon={PackageCheck} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent queue snapshot</CardTitle>
          <CardDescription>Pending and completed orders from the shared operations database.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <OrderList title="Pending" orders={state.data?.orders || []} emptyMessage="No pending orders." />
          <OrderList title="Completed" orders={state.data?.completed || []} emptyMessage="No completed orders." />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

function InfoTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-white p-2 text-slate-700 shadow-sm">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function OrderDashboardPage({ session, setSession }) {
  const [state, setState] = useProfileData(true);
  const [customerName, setCustomerName] = useState("");
  const [size, setSize] = useState(sizeOptions[1]);
  const [milk, setMilk] = useState(milkOptions[0]);
  const [activeCategory, setActiveCategory] = useState(orderingCategories[0]?.id || "");
  const [ticket, setTicket] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const selectedCategory =
    orderingCategories.find((category) => category.id === activeCategory) ||
    orderingCategories[0];
  const totals = getOrderTotals(ticket);

  async function refresh() {
    try {
      const data = await api("/api/profile");
      setState({ loading: false, data, error: "" });
    } catch (refreshError) {
      setState({ loading: false, data: null, error: refreshError.message });
    }
  }

  function addMenuItem(item) {
    setTicket((current) => [...current, createTicketItem(item, { size, milk })]);
  }

  function updateTicketItem(uid, updates) {
    setTicket((current) =>
      current.map((item) => (item.uid === uid ? { ...item, ...updates } : item))
    );
  }

  function removeTicketItem(uid) {
    setTicket((current) => current.filter((item) => item.uid !== uid));
  }

  function openCheckout() {
    if (!customerName.trim() || ticket.length === 0) {
      setError("Add a customer name and at least one item.");
      return;
    }

    setError("");
    setCheckoutOpen(true);
  }

  async function submitOrder() {
    if (!customerName.trim() || ticket.length === 0) {
      setError("Add a customer name and at least one item.");
      return;
    }

    setPending(true);
    setError("");

    try {
      await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          name: customerName,
          order: ticket.map(formatTicketItem),
          orderTaker: session.user?.userName,
        }),
      });

      setCustomerName("");
      setTicket([]);
      setCheckoutOpen(false);
      await refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  async function deleteOrder(orderId) {
    try {
      setError("");
      await api(`/api/orders/${orderId}`, { method: "DELETE" });
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <DashboardLayout
      session={session}
      setSession={setSession}
      title="Order Entry"
      description="Build tickets and send them to the queue"
    >
      {state.loading ? (
        <DashboardSkeleton />
      ) : (
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <Field label="Customer name">
                <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Alex" />
              </Field>
              <div className="flex flex-wrap gap-3">
                <OptionGroup compact label="Cup size" options={sizeOptions} value={size} onChange={setSize} />
                <OptionGroup compact label="Milk" options={milkOptions} value={milk} onChange={setMilk} />
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-wrap items-center gap-2">
            {orderingCategories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={activeCategory === category.id ? "default" : "ghost"}
                size="sm"
                className={activeCategory === category.id ? "rounded-full px-5" : "rounded-full px-5 text-slate-500"}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.title}
              </Button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {selectedCategory?.items.map((item, index) => (
              <MenuItemTile key={item.id} item={item} index={index} onAdd={() => addMenuItem(item)} />
            ))}
          </div>
        </div>
        <Card className="xl:sticky xl:top-24">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Current Order</CardTitle>
              <CardDescription>Order #{String((state.data?.orders || []).length + 201).padStart(4, "0")}</CardDescription>
            </div>
            <Badge className="bg-slate-50">To Go</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="soft" size="sm">Dine-in</Button>
              <Button type="button" variant="outline" size="sm">To Go</Button>
            </div>
            <div className="min-h-56 space-y-3">
              {ticket.length ? (
                ticket.map((item) => (
                  <TicketLine
                    key={item.uid}
                    item={item}
                    onRemove={() => removeTicketItem(item.uid)}
                  />
                ))
              ) : (
                <EmptyPanel message="Tap menu items to build the ticket." />
              )}
            </div>
            {error ? <ErrorBanner message={error} /> : null}
            <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Items</span>
                <span>{ticket.length}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-950">
                <span>Total</span>
                <span>{formatMoney(totals.total)}</span>
              </div>
            </div>
            <Button className="w-full" type="button" disabled={pending} onClick={openCheckout}>
              <CreditCard className="size-4" />
              Pay with Credit Card
            </Button>
            <OrderList
              title="Pending queue"
              orders={state.data?.orders || []}
              emptyMessage="No pending tickets yet."
              onDelete={deleteOrder}
            />
          </CardContent>
        </Card>
      </div>
      )}
      <CheckoutModal
        customerName={customerName}
        ticket={ticket}
        totals={totals}
        open={checkoutOpen}
        pending={pending}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={submitOrder}
        onRemove={removeTicketItem}
        onUpdate={updateTicketItem}
      />
    </DashboardLayout>
  );
}

function MenuItemTile({ item, onAdd }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={item.image || "/assets/images/menu/house-latte.webp"}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-tight text-slate-950">{item.name}</p>
          <span className="text-xs font-semibold text-slate-700">{item.basePrice || "$4.50"}</span>
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.description || "Classic Pronto favorite"}</p>
      </div>
    </button>
  );
}

function CheckoutModal({
  customerName,
  ticket,
  totals,
  open,
  pending,
  onClose,
  onSubmit,
  onRemove,
  onUpdate,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 lg:h-[720px] lg:flex-row">
        <section className="flex min-h-0 flex-col border-b border-slate-200 bg-white p-6 lg:w-2/5 lg:border-b-0 lg:border-r">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Order Summary</h2>
            <p className="mt-1 text-sm text-slate-500">
              {customerName.trim() || "Walk-up"} / Ticket #{String(ticket.length + 8840).padStart(4, "0")}
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
            {ticket.map((item) => (
              <div key={item.uid} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                  <p className="mt-1 text-xs italic text-slate-500">
                    {ticketModifiers(item) || "No customizations"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-950">{item.basePrice}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-slate-200 pt-5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Service Fee (4%)</span>
              <span>{formatMoney(totals.serviceFee)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax (8.5%)</span>
              <span>{formatMoney(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-4 text-xl font-semibold text-slate-950">
              <span>Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">Payment Method</h2>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close checkout">
              <X className="size-4" />
            </Button>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <PaymentChip active icon={CreditCard} label="Card" />
            <PaymentChip icon={Wallet} label="Cash" />
            <PaymentChip icon={Smartphone} label="Scan" />
          </div>

          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-3xl font-semibold tracking-tight text-slate-950">{formatMoney(totals.total)}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Tendered Amount</p>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {ticket.map((item) => (
              <CheckoutItemEditor
                key={item.uid}
                item={item}
                onRemove={() => onRemove(item.uid)}
                onUpdate={(updates) => onUpdate(item.uid, updates)}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_2fr]">
            <Button type="button" variant="outline" className="h-12" onClick={onClose}>
              Back to Order
            </Button>
            <Button type="button" className="h-12 bg-slate-950 hover:bg-slate-800" disabled={pending || ticket.length === 0} onClick={onSubmit}>
              <Bolt className="size-4" />
              {pending ? "Sending..." : `Charge ${formatMoney(totals.total)}`}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function PaymentChip({ icon: Icon, label, active = false }) {
  return (
    <button
      type="button"
      className={[
        "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold uppercase transition-colors",
        active
          ? "border-slate-950 bg-slate-950/5 text-slate-950"
          : "border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900",
      ].join(" ")}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function CheckoutItemEditor({ item, onRemove, onUpdate }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{item.name}</p>
          <p className="mt-1 text-xs text-slate-500">{item.basePrice}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={onRemove} aria-label={`Remove ${item.name}`}>
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {item.sizes.length ? (
          <SelectField label="Size" value={item.size} options={item.sizes} onChange={(size) => onUpdate({ size })} />
        ) : null}
        {item.temperatureOptions.length ? (
          <SelectField label="Temp" value={item.temperature} options={item.temperatureOptions} onChange={(temperature) => onUpdate({ temperature })} />
        ) : null}
        {item.milkOptions.length ? (
          <SelectField label="Milk" value={item.milk} options={item.milkOptions} onChange={(milk) => onUpdate({ milk })} />
        ) : null}
      </div>
      <label className="mt-3 block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</span>
        <Input
          value={item.notes}
          onChange={(event) => onUpdate({ notes: event.target.value })}
          placeholder="Extra hot, light ice..."
        />
      </label>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TicketLine({ item, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
        <Coffee className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
        <p className="truncate text-xs text-slate-500">{ticketModifiers(item) || "No customizations"}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-5 text-center text-xs font-semibold">1</span>
        <Button className="size-7 rounded-md text-slate-400 hover:text-red-600" type="button" variant="outline" size="icon" onClick={onRemove} aria-label={`Remove ${item.name}`}>
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  );
}

function OptionGroup({ label, options, value, onChange, compact = false }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "default" : "outline"}
            size="sm"
            className={compact ? "h-8 px-3 text-xs" : ""}
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}

function BaristaDashboardPage({ session, setSession }) {
  const [state, setState] = useProfileData(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const data = await api("/api/profile");
      setState({ loading: false, data, error: "" });
    } catch (refreshError) {
      setState({ loading: false, data: null, error: refreshError.message });
    }
  }

  async function completeOrder(orderId) {
    try {
      setError("");
      await api(`/api/orders/${orderId}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ barista: session.user?.userName }),
      });
      await refresh();
    } catch (completeError) {
      setError(completeError.message);
    }
  }

  async function deleteOrder(orderId) {
    try {
      setError("");
      await api(`/api/orders/${orderId}`, { method: "DELETE" });
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <DashboardLayout
      session={session}
      setSession={setSession}
      title="Order Queue"
      description="Track what is brewing and clear finished orders"
    >
      {error ? <ErrorBanner message={error} /> : null}
      {state.loading ? (
        <DashboardSkeleton />
      ) : (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoTile label="Avg. ready time" value="4.2m" icon={Timer} />
          <InfoTile label="Active tickets" value={String((state.data?.orders || []).length)} icon={CupSoda} />
          <InfoTile label="Completed today" value={String((state.data?.completed || []).length)} icon={PackageCheck} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(state.data?.orders || []).length ? (
            state.data.orders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                actionLabel="Mark as Complete"
                actionIcon={PackageCheck}
                onPrimaryAction={() => completeOrder(order.id)}
                onDelete={() => deleteOrder(order.id)}
              />
            ))
          ) : (
            <Card className="min-h-56 border-dashed">
              <CardContent className="flex h-full min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                  <Plus className="size-5" />
                </div>
                <p className="text-sm font-medium text-slate-400">Queue is clearing up...</p>
              </CardContent>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Recent completed drinks and who finished them.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(state.data?.completed || []).length ? (
              state.data.completed.map((order) => (
                <OrderCard key={order.id} order={order} compact />
              ))
            ) : (
              <EmptyPanel message="Completed orders will show up here." />
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </DashboardLayout>
  );
}

function UrgentEyebrow({ className }) {
  return (
    <Badge variant="destructive" className={className} aria-label="Urgent customer request">
      <span className="mr-1 size-1.5 rounded-full bg-red-600" />
      <span className="animate-pulse">Urgent</span>
    </Badge>
  );
}

function isUrgentCustomerRequest(order) {
  return order?.source === "online" && !order?.completed;
}

function OrderCard({ order, actionLabel, actionIcon: ActionIcon, onPrimaryAction, onDelete, compact = false }) {
  const isUrgent = !compact && isUrgentCustomerRequest(order);
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${isUrgent ? "border-red-200 bg-red-50/50" : "border-slate-200"}`}>
      <div className="flex min-h-52 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">#{String(order.id).slice(-4)}</p>
            <p className="mt-2 text-lg font-semibold leading-tight text-slate-950">{order.name}</p>
          </div>
          {!compact ? (
            <div className="flex flex-col items-end gap-2">
              {isUrgent ? <UrgentEyebrow /> : null}
              <Badge variant="secondary">Preparing</Badge>
            </div>
          ) : null}
        </div>
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            {order.source === "online" ? "Order Ahead" : `Taken by ${order.orderTaker}`}
          </p>
          {order.customerPhone ? (
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Customer phone {order.customerPhone}
            </p>
          ) : null}
          {order.barista ? (
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-emerald-700">
              Completed by {order.barista}
            </p>
          ) : null}
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {order.order.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="font-semibold text-slate-950">1x</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        {!compact ? (
          <div className="mt-auto grid gap-2 pt-5">
            <Button size="sm" onClick={onPrimaryAction} className="w-full">
              {ActionIcon ? <ActionIcon className="size-4" /> : null}
              {actionLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="w-full text-slate-400">
              <Trash2 className="size-4" />
              Remove
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyPanel({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
      {message}
    </div>
  );
}

function OrderList({ title, orders, emptyMessage, onDelete }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <div className="mt-4 space-y-3">
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id} className="rounded-lg bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  {isUrgentCustomerRequest(order) ? <UrgentEyebrow className="mb-2" /> : null}
                  <p className="text-sm font-semibold text-slate-950">{order.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {order.source === "online" ? "Order Ahead" : order.orderTaker}
                  </p>
                  {order.customerPhone ? (
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      {order.customerPhone}
                    </p>
                  ) : null}
                </div>
                {order.barista ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    {order.barista}
                  </span>
                ) : onDelete ? (
                  <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => onDelete(order.id)} aria-label={`Remove ${order.name}`}>
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useSession();

  const authProps = useMemo(
    () => ({
      authenticated: session.authenticated,
      loading: session.loading,
      user: session.user,
    }),
    [session.authenticated, session.loading, session.user]
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to={session.authenticated ? "/profile" : "/login"} replace />} />
      <Route path="/login" element={session.loading ? <AuthSkeleton /> : <LoginPage setSession={setSession} />} />
      <Route path="/signup" element={session.loading ? <AuthSkeleton /> : <SignupPage setSession={setSession} />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute {...authProps}>
            <ProfilePage session={session} setSession={setSession} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-dashboard"
        element={
          <ProtectedRoute {...authProps}>
            <OrderDashboardPage session={session} setSession={setSession} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barista-order-dashboard"
        element={
          <ProtectedRoute {...authProps}>
            <BaristaDashboardPage session={session} setSession={setSession} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
