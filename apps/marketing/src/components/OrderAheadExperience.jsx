import { useEffect, useMemo, useState } from "react";
import {
  defaultLocation,
  formatOrderItem,
  orderingCategories,
} from "@pronto/menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const defaultCategoryId = orderingCategories[0]?.id || "";
const defaultSize = "Medium";
const defaultMilk = "Whole";

export function OrderAheadExperience({ apiUrl }) {
  const normalizedApiUrl = apiUrl.replace(/\/$/, "");
  const [session, setSession] = useState({ loading: true, authenticated: false, user: null });
  const [activeCategoryId, setActiveCategoryId] = useState(defaultCategoryId);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [size, setSize] = useState(defaultSize);
  const [milk, setMilk] = useState(defaultMilk);
  const [ticket, setTicket] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeCategory = useMemo(
    () =>
      orderingCategories.find((category) => category.id === activeCategoryId) ||
      orderingCategories[0],
    [activeCategoryId]
  );

  useEffect(() => {
    let ignore = false;

    fetch(`${normalizedApiUrl}/api/session`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setSession({ loading: false, ...data });
      })
      .catch(() => {
        if (!ignore) setSession({ loading: false, authenticated: false, user: null });
      });

    return () => {
      ignore = true;
    };
  }, [normalizedApiUrl]);

  useEffect(() => {
    if (!customerName && session.user?.userName) {
      setCustomerName(session.user.userName);
    }
  }, [customerName, session.user?.userName]);

  function addItem(item) {
    const formatted = formatOrderItem(item, {
      size: item.sizes?.length ? size : "",
      milk: item.milkOptions?.length ? milk : "",
      temperature:
        item.temperatureOptions?.length > 1
          ? item.temperatureOptions[0]
          : item.temperatureOptions?.[0] || "",
    });

    setTicket((current) => [...current, formatted]);
    setError("");
    setSuccess("");
  }

  function removeItem(index) {
    setTicket((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submitOrder() {
    if (!customerName.trim() || ticket.length === 0) {
      setError("Add your name and at least one item before sending the order.");
      return;
    }

    if (!session.authenticated) {
      setError("Login or create a customer account before sending the order.");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${normalizedApiUrl}/api/order-ahead`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerName,
          customerPhone,
          order: ticket,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to place the order right now.");
      }

      setTicket([]);
      setCustomerName("");
      setCustomerPhone("");
      setSuccess(
        `Order sent to ${defaultLocation.name}. The team can now see it in the pickup queue.`
      );
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="overflow-hidden border-border/70 bg-primary text-primary-foreground">
        <CardHeader className="space-y-4">
          <Badge className="w-fit bg-white/10 text-stone-100">Order Ahead</Badge>
          <CardTitle className="text-4xl text-white">
            Skip the line and have your coffee waiting.
          </CardTitle>
          <CardDescription className="text-base leading-7 text-stone-300">
            Build a pickup order for {defaultLocation.name}, send it through, and the team
            will see it in the same queue they use at the register.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-7 text-stone-200">
          <div>
            <p className="font-semibold text-white">{defaultLocation.name}</p>
            {defaultLocation.addressLines.map((line) => (
              <p key={line} className="mt-1">
                {line}
              </p>
            ))}
          </div>
          <div>
            <p className="font-semibold text-white">Hours</p>
            <p className="mt-1">{defaultLocation.hours}</p>
          </div>
          <div>
            <p className="font-semibold text-white">Pickup favorites</p>
            <p className="mt-1">
              House lattes, cold brew, breakfast sandwiches, avocado toast, and pastry case
              add-ons for the quick coffee run.
            </p>
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-300">Current ticket</p>
            {ticket.length ? (
              <ol className="mt-3 space-y-2">
                {ticket.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white/10 px-4 py-3"
                  >
                    <span>{item}</span>
                    <Button
                      className="h-auto px-2 py-1 text-xs uppercase tracking-[0.2em] text-stone-300 hover:bg-white/10 hover:text-white"
                      variant="ghost"
                      type="button"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-stone-300">Choose coffee, breakfast, or pastries to build the order.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge className="w-fit">Pickup Builder</Badge>
          <CardTitle className="text-3xl">Choose drinks and breakfast for pickup</CardTitle>
          <CardDescription className="text-base leading-7">
            Pick a category, add items, and send the order straight into the live POS queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder={session.user?.userName || "Taylor"}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="(714) 555-0199"
              />
            </Field>
          </div>

          <OptionGroup
            label="Category"
            options={orderingCategories.map((category) => category.title)}
            value={activeCategory?.title || ""}
            onChange={(title) => {
              const nextCategory = orderingCategories.find(
                (category) => category.title === title
              );
              if (nextCategory) setActiveCategoryId(nextCategory.id);
            }}
          />
          <OptionGroup
            label="Size"
            options={["Small", "Medium", "Large"]}
            value={size}
            onChange={setSize}
          />
          <OptionGroup
            label="Milk"
            options={["Whole", "Oat", "Almond", "Soy"]}
            value={milk}
            onChange={setMilk}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {activeCategory?.items.map((item) => (
              <Button
                key={item.id}
                className="h-auto justify-start rounded-lg border-border bg-secondary/30 px-4 py-4 text-left hover:bg-secondary/60"
                variant="outline"
                type="button"
                onClick={() => addItem(item)}
              >
                <span>
                  <span className="block font-semibold text-foreground">{item.name}</span>
                  <span className="mt-2 block text-sm leading-6 text-muted-foreground">{item.basePrice}</span>
                </span>
              </Button>
            ))}
          </div>

          {error ? (
            <Alert variant="destructive">
              {error}
            </Alert>
          ) : null}
          {success ? (
            <Alert variant="success">
              {success}
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={submitOrder} disabled={pending}>
              {pending ? "Sending Order..." : "Send Pickup Order"}
            </Button>
            {!session.authenticated ? (
              <Button as="a" href="/customer-login/?next=/order-ahead/" variant="secondary">
                Login to Order
              </Button>
            ) : null}
            <Button as="a" href="/menu/" variant="outline">
              Browse Full Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            className={value === option ? "rounded-lg" : "rounded-lg text-muted-foreground"}
            variant={value === option ? "default" : "outline"}
            size="sm"
            type="button"
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
