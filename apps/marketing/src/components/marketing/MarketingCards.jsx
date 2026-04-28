import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { addPickupCartItem } from "@/lib/pickupCart";

export function ImageFeatureCard({
  image,
  imageAlt = "",
  eyebrow,
  title,
  description,
  className,
  imageClassName,
  children,
}) {
  return (
    <article className={cn("group overflow-hidden rounded-lg border border-border bg-card shadow-sm", className)}>
      {image ? (
        <img
          src={image}
          alt={imageAlt}
          className={cn("h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]", imageClassName)}
          loading="lazy"
        />
      ) : null}
      <div className="space-y-3 p-6">
        {eyebrow ? <Badge>{eyebrow}</Badge> : null}
        <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm leading-7 text-muted-foreground">{description}</p> : null}
        {children}
      </div>
    </article>
  );
}

export function MenuProductCard({
  item,
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState(1);
  const [size, setSize] = React.useState(item.sizes?.[0] || "");
  const [temperature, setTemperature] = React.useState(item.temperatureOptions?.[0] || "");
  const [milk, setMilk] = React.useState(item.milkOptions?.[0] || "");
  const [added, setAdded] = React.useState(false);

  function addToCart() {
    addPickupCartItem(
      item,
      {
        size: item.sizes?.length ? size : "",
        temperature: item.temperatureOptions?.length ? temperature : "",
        milk: item.milkOptions?.length ? milk : "",
      },
      quantity,
    );
    setAdded(true);
    setPickerOpen(false);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="h-56 overflow-hidden bg-secondary">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
          <span className="rounded-md bg-secondary px-2 py-1 text-sm font-semibold text-secondary-foreground">
            {item.price}
          </span>
        </div>
        <p className="min-h-14 text-sm leading-7 text-muted-foreground">{item.description}</p>
        <div className="flex flex-wrap gap-2">
          {item.bestSeller ? <Chip variant="primary">Best Seller</Chip> : null}
          {item.seasonal ? <Chip variant="secondary">Seasonal</Chip> : null}
          {(item.dietaryTags || []).slice(0, 2).map((tag) => (
            <Chip key={tag} variant="outline">{tag}</Chip>
          ))}
        </div>
        <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
          <SheetTrigger asChild>
            <Button type="button" className="w-full">
              {added ? "Added to cart" : "Add to pickup order"}
            </Button>
          </SheetTrigger>
          <SheetContent title={`Add ${item.name} to pickup order`}>
            <SheetHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <SheetTitle>{item.name}</SheetTitle>
                <SheetDescription>
                  Customize this item before adding it to your pickup cart.
                </SheetDescription>
              </div>
              <SheetClose aria-label="Close item options" />
            </SheetHeader>

            <SheetBody className="space-y-6">
              <div className="overflow-hidden rounded-lg border border-border bg-secondary/20">
                <img
                  src={item.image || "/assets/images/menu/house-latte.webp"}
                  alt=""
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <span className="rounded-md bg-card px-2 py-1 text-sm font-semibold text-foreground">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              {item.sizes?.length ? (
                <OptionPicker label="Size" options={item.sizes} value={size} onChange={setSize} />
              ) : null}
              {item.temperatureOptions?.length ? (
                <OptionPicker
                  label="Temperature"
                  options={item.temperatureOptions}
                  value={temperature}
                  onChange={setTemperature}
                />
              ) : null}
              {item.milkOptions?.length ? (
                <OptionPicker label="Milk" options={item.milkOptions} value={milk} onChange={setMilk} />
              ) : null}

              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-sm font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </Button>
                  <span className="w-7 text-center text-sm font-semibold text-foreground">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </SheetBody>

            <SheetFooter className="grid gap-2">
              <Button type="button" onClick={addToCart}>
                Add to Cart
              </Button>
              <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
                Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </article>
  );
}

function OptionPicker({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "default" : "outline"}
            size="sm"
            className={value === option ? "rounded-lg" : "rounded-lg text-muted-foreground"}
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function BlogCard({ post, featured = false }) {
  return (
    <article className={cn(
      "group overflow-hidden rounded-lg border border-border bg-card shadow-sm",
      featured ? "grid lg:grid-cols-[1.15fr_0.85fr]" : ""
    )}>
      {post.image ? (
        <img
          src={post.image}
          alt={post.imageAlt || post.title}
          className={cn("h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]", featured ? "lg:h-full" : "")}
          loading={featured ? "eager" : "lazy"}
        />
      ) : null}
      <div className="flex flex-col justify-between gap-6 p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span>{post.category}</span>
            <span>{post.date}</span>
          </div>
          <h2 className={cn("font-semibold text-foreground", featured ? "text-3xl md:text-4xl" : "text-2xl")}>{post.title}</h2>
          <p className="text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
        </div>
        <Button as="a" href={post.href || "/blog/how-to-brew-the-perfect-cup/"} variant={featured ? "default" : "outline"} className="w-fit">
          Read article
        </Button>
      </div>
    </article>
  );
}
