import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Coffee,
  CupSoda,
  LogOut,
  PackageCheck,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Skeleton } from "./components/ui/skeleton";
import { formatOrderItem, orderingCategories } from "@pronto/menu";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

const milkOptions = ["Whole", "Oat", "Almond", "Soy"];
const sizeOptions = ["Small", "Medium", "Large"];

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

function ProtectedRoute({ authenticated, loading, children }) {
  const location = useLocation();

  if (loading) {
    return (
      <PageShell>
        <DashboardSkeleton />
      </PageShell>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-transparent px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
}

function LoadingState({ message }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center text-stone-600">{message}</CardContent>
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
      <div className="grid min-h-[85vh] items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[36px] bg-[linear-gradient(160deg,#292524_0%,#44403c_48%,#a16207_100%)] p-8 text-stone-50 shadow-[0_25px_80px_rgba(28,25,23,0.28)] md:p-10">
          <Badge className="bg-amber-400/20 text-amber-100">Pronto Staff</Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
            Keep the counter, queue, and bar flowing.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-stone-200 md:text-base">
            The operations app now runs as a modern React frontend against the Express and Passport backend.
            Local auth is live, and social login is already queued up as the next backend milestone.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <ValuePill label="API-first" value="Passport local" />
            <ValuePill label="Frontend" value="React + Tailwind" />
            <ValuePill label="Next up" value="Google, GitHub, Facebook" />
          </div>
        </div>
        <Card className="overflow-hidden">
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

function ValuePill({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-300">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ProviderButtons() {
  const providers = ["Google", "GitHub", "Facebook"];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {providers.map((provider) => (
        <Button key={provider} variant="outline" type="button" disabled>
          {provider}
        </Button>
      ))}
    </div>
  );
}

function LoginPage({ setSession }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
      subtitle="Use your local Pronto staff credentials. Social sign-in is documented and queued next."
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-stone-700">Coming soon</p>
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
      <p className="text-sm text-stone-600">
        Need an account?{" "}
        <Link className="font-semibold text-stone-900 underline underline-offset-4" to="/signup">
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
      subtitle="The backend keeps Passport local auth active while the view layer migrates to React."
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-stone-700">Social auth backlog</p>
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
      <p className="text-sm text-stone-600">
        Already have access?{" "}
        <Link className="font-semibold text-stone-900 underline underline-offset-4" to="/login">
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
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function DashboardLayout({ session, setSession, title, description, children }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    setSession({ loading: false, authenticated: false, user: null });
    navigate("/login");
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[32px] bg-white/85 p-6 shadow-[0_20px_80px_rgba(28,25,23,0.08)] md:flex-row md:items-center md:justify-between">
          <div>
            <Badge>{title}</Badge>
            <h1 className="mt-4 text-3xl font-semibold text-stone-900">{description}</h1>
            <p className="mt-2 text-sm text-stone-600">
              Signed in as <span className="font-semibold">{session.user?.userName}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/profile">Profile</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/order-dashboard">Order POS</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/barista-order-dashboard">Barista board</Link>
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
        {children}
      </div>
    </PageShell>
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
      <DashboardLayout session={session} setSession={setSession} title="Profile" description="Loading your shift snapshot">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      session={session}
      setSession={setSession}
      title="Profile"
      description="Shift overview and order health"
    >
      {state.error ? <ErrorBanner message={state.error} /> : null}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>Your local Passport account is still the source of truth.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InfoTile label="Name" value={state.data?.user?.userName || "Unknown"} icon={ShieldCheck} />
            <InfoTile label="Email" value={state.data?.user?.email || "Unknown"} icon={Coffee} />
            <InfoTile label="Pending orders" value={String(state.data?.orders?.length || 0)} icon={CupSoda} />
            <InfoTile label="Completed orders" value={String(state.data?.completed?.length || 0)} icon={PackageCheck} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Auth roadmap</CardTitle>
            <CardDescription>The next auth phase is documented and ready to implement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>Google, GitHub, and Facebook buttons will be enabled once their Passport strategies and callback routes ship.</p>
            <p>The API already exposes separate frontend and marketing URLs so provider callbacks can target the right surface.</p>
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
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-2 text-stone-700 shadow-sm">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
          <p className="mt-1 text-sm font-semibold text-stone-900">{value}</p>
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
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const selectedCategory =
    orderingCategories.find((category) => category.id === activeCategory) ||
    orderingCategories[0];

  async function refresh() {
    try {
      const data = await api("/api/profile");
      setState({ loading: false, data, error: "" });
    } catch (refreshError) {
      setState({ loading: false, data: null, error: refreshError.message });
    }
  }

  function addMenuItem(item) {
    const formatted = formatOrderItem(item, {
      size: item.sizes?.length ? size : "",
      milk: item.milkOptions?.length ? milk : "",
      temperature:
        item.temperatureOptions?.length > 1
          ? item.temperatureOptions[0]
          : item.temperatureOptions?.[0] || "",
    });

    setTicket((current) => [...current, formatted]);
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
          order: ticket,
          orderTaker: session.user?.userName,
        }),
      });

      setCustomerName("");
      setTicket([]);
      await refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <DashboardLayout
      session={session}
      setSession={setSession}
      title="Order POS"
      description="Build tickets and send them to the queue"
    >
      {state.loading ? (
        <DashboardSkeleton />
      ) : (
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>New order</CardTitle>
            <CardDescription>Create a queue ticket for the next guest.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Field label="Customer name">
              <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Alex" />
            </Field>
            <OptionGroup label="Cup size" options={sizeOptions} value={size} onChange={setSize} />
            <OptionGroup label="Milk" options={milkOptions} value={milk} onChange={setMilk} />
            <OptionGroup
              label="Menu category"
              options={orderingCategories.map((category) => category.title)}
              value={selectedCategory?.title || ""}
              onChange={(title) => {
                const nextCategory = orderingCategories.find((category) => category.title === title);
                if (nextCategory) setActiveCategory(nextCategory.id);
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedCategory?.items.map((item) => (
                <Button key={item.id} type="button" variant="outline" onClick={() => addMenuItem(item)}>
                  {item.name}
                </Button>
              ))}
            </div>
            {error ? <ErrorBanner message={error} /> : null}
            <Button className="w-full" type="button" disabled={pending} onClick={submitOrder}>
              {pending ? "Submitting..." : "Submit order"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current ticket</CardTitle>
            <CardDescription>Review the assembled order before sending it to the bar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5">
              {ticket.length ? (
                <ol className="space-y-3 text-sm text-stone-700">
                  {ticket.map((item) => (
                    <li key={item} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-stone-500">Tap drinks, breakfast, or pastries to build the ticket.</p>
              )}
            </div>
            <OrderList
              title="Pending queue"
              orders={state.data?.orders || []}
              emptyMessage="No pending tickets yet."
            />
          </CardContent>
        </Card>
      </div>
      )}
    </DashboardLayout>
  );
}

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-stone-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "default" : "outline"}
            size="sm"
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
      title="Barista board"
      description="Track what is brewing and clear finished orders"
    >
      {error ? <ErrorBanner message={error} /> : null}
      {state.loading ? (
        <DashboardSkeleton />
      ) : (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ready to make</CardTitle>
            <CardDescription>Mark finished drinks with the barista who closed them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(state.data?.orders || []).length ? (
              state.data.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  actionLabel="Mark complete"
                  actionIcon={PackageCheck}
                  onPrimaryAction={() => completeOrder(order.id)}
                  onDelete={() => deleteOrder(order.id)}
                />
              ))
            ) : (
              <EmptyPanel message="No active drinks in the queue." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Recent completed drinks and who finished them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

function OrderCard({ order, actionLabel, actionIcon: ActionIcon, onPrimaryAction, onDelete, compact = false }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-900">{order.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
            {order.source === "online" ? "Order Ahead" : `Taken by ${order.orderTaker}`}
          </p>
          {order.customerPhone ? (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
              Customer phone {order.customerPhone}
            </p>
          ) : null}
          {order.barista ? (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-700">
              Completed by {order.barista}
            </p>
          ) : null}
          <ul className="mt-4 space-y-2 text-sm text-stone-700">
            {order.order.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        {!compact ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={onPrimaryAction}>
              {ActionIcon ? <ActionIcon className="size-4" /> : null}
              {actionLabel}
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
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
    <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-500">
      {message}
    </div>
  );
}

function OrderList({ title, orders, emptyMessage }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <div className="mt-4 space-y-3">
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{order.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    {order.source === "online" ? "Order Ahead" : order.orderTaker}
                  </p>
                  {order.customerPhone ? (
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {order.customerPhone}
                    </p>
                  ) : null}
                </div>
                {order.barista ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    {order.barista}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-500">{emptyMessage}</p>
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
    }),
    [session.authenticated, session.loading]
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
