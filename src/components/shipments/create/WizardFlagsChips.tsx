import { CountryFlag } from "@/components/CountryFlag";
import { displayLocalized } from "@/lib/localizedString";

export function WizardFlagsChips({
  countries,
}: {
  countries: Record<string, unknown>[];
}) {
  if (!countries.length) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {countries.map((c) => {
        const id = String(c.id ?? "");
        const name = displayLocalized(c.name);
        const iso =
          (c.iso2 as string | undefined) ||
          (c.code as string | undefined) ||
          "";
        return (
          <span
            key={id}
            title={name}
            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-xs">
            <CountryFlag
              emoji={c.emoji as string | null | undefined}
              iso2={c.iso2 as string | null | undefined}
              code={c.code as string | null | undefined}
              className="!h-3 !w-4 shrink-0"
            />
            <span className="max-w-[7rem] truncate">{name}</span>
            {iso ? (
              <span className="text-muted-foreground">({iso})</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
