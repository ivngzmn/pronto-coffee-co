import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

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

export function MenuProductCard({ item, ctaHref = "/order-ahead/" }) {
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
        <Button as="a" href={ctaHref} className="w-full">Add to pickup order</Button>
      </div>
    </article>
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
