import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export function FeatureCard({ className, image, imageAlt = "", eyebrow, title, meta, description }) {
  return (
    <article className={cn("overflow-hidden rounded-[28px] border border-border bg-secondary/30", className)}>
      {image ? <img src={image} alt={imageAlt} className="h-44 w-full object-cover" /> : null}
      <div className="space-y-3 p-4">
        {eyebrow ? <Badge>{eyebrow}</Badge> : null}
        <div>
          <p className="text-lg font-semibold text-foreground">{title}</p>
          {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
        </div>
        {description ? <p className="text-sm leading-7 text-muted-foreground">{description}</p> : null}
      </div>
    </article>
  );
}

export function MenuItemCard({ item, className }) {
  return (
    <article className={cn("overflow-hidden rounded-[28px] border border-border bg-secondary/30", className)}>
      {item.image ? (
        <img src={item.image} alt={item.name} className="h-48 w-full object-cover" loading="lazy" />
      ) : null}
      <div className="flex items-start justify-between gap-4 p-5 pb-0">
        <div>
          <p className="text-lg font-semibold text-foreground">{item.name}</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
        </div>
        <span className="text-sm font-semibold text-foreground">{item.price}</span>
      </div>
      <div className="flex flex-wrap gap-2 p-5 pt-4">
        {(item.sizes || []).map((size) => (
          <Chip key={size}>{size}</Chip>
        ))}
        {(item.dietaryTags || []).map((tag) => (
          <Chip key={tag} variant="accent">{tag}</Chip>
        ))}
        {item.bestSeller ? <Chip variant="primary">Best Seller</Chip> : null}
        {item.seasonal ? <Chip variant="secondary">Seasonal</Chip> : null}
      </div>
    </article>
  );
}

export function StatusCard({ className, title, status, description }) {
  return (
    <article className={cn("rounded-3xl border border-border bg-secondary/40 p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold text-foreground">{title}</p>
        {status ? <Badge>{status}</Badge> : null}
      </div>
      {description ? <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p> : null}
    </article>
  );
}
