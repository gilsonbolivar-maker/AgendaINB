import { useMemo, useRef, type ReactNode } from "react";
import { Star } from "lucide-react";
import { Avatar } from "@/components/agenda/avatar";
import type { Contact } from "@/lib/contacts/types";
import { GROUP_LABELS } from "@/lib/contacts/types";
import {
  displayName,
  formatPhone,
  letterKey,
  primaryPhone,
} from "@/lib/contacts/format";
import { cn } from "@/lib/utils";

const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

type Group = { letter: string; items: Contact[] };

function groupByLetter(contacts: Contact[]): Group[] {
  const sorted = [...contacts].sort((a, b) =>
    collator.compare(displayName(a), displayName(b)),
  );
  const groups: Group[] = [];
  for (const contact of sorted) {
    const letter = letterKey(displayName(contact));
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.items.push(contact);
    else groups.push({ letter, items: [contact] });
  }
  return groups;
}

function subtitle(contact: Contact): string {
  const ramais = contact.phones.filter((p) => p.kind === "ramal").map((p) => p.number);
  const unit = GROUP_LABELS[contact.group];
  if (ramais.length) {
    const shown = ramais.slice(0, 3).join(" / ");
    return `Ramal ${shown} · ${unit}`;
  }
  const main = primaryPhone(contact.phones);
  if (main) return `${formatPhone(main.number, main.kind)} · ${unit}`;
  return unit;
}

type ContactListProps = {
  contacts: Contact[];
  selectedId: string | null;
  search: string;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  empty: ReactNode;
};

export function ContactList({
  contacts,
  selectedId,
  search,
  onSelect,
  onToggleFavorite,
  empty,
}: ContactListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupByLetter(contacts), [contacts]);
  const present = useMemo(() => new Set(groups.map((g) => g.letter)), [groups]);

  function jump(letter: string) {
    const node = scrollerRef.current?.querySelector(`#letter-${letter}`);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (contacts.length === 0) {
    if (search.trim()) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="font-display text-xl text-fg">Nada encontrado</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Nenhum colaborador combina com “{search.trim()}”.
          </p>
        </div>
      );
    }
    return <>{empty}</>;
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div ref={scrollerRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {groups.map((group) => (
          <section
            key={group.letter}
            className="mb-1 [content-visibility:auto] [contain-intrinsic-size:auto_240px]"
          >
            <h2
              id={`letter-${group.letter}`}
              className="sticky top-0 z-[1] bg-bg/95 px-4 py-1.5 font-medium text-xs tracking-widest text-muted uppercase"
            >
              {group.letter}
            </h2>
            <ul>
              {group.items.map((contact) => {
                const selected = contact.id === selectedId;
                return (
                  <li key={contact.id}>
                    <div
                      className={cn(
                        "flex items-center gap-3 border-b border-border px-4 py-2.5",
                        selected && "bg-raised",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(contact.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <Avatar
                          firstName={contact.firstName}
                          lastName={contact.lastName}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-fg">
                            {displayName(contact)}
                          </span>
                          <span className="block truncate text-sm text-muted">
                            {subtitle(contact)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={
                          contact.favorite ? "Remover dos favoritos" : "Marcar como favorito"
                        }
                        onClick={() => onToggleFavorite(contact.id)}
                        className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-fg"
                      >
                        <Star
                          className={cn(
                            "size-4",
                            contact.favorite && "fill-accent text-accent",
                          )}
                        />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <div className="h-8" />
      </div>
      <nav aria-label="Índice alfabético" className="flex w-6 shrink-0 flex-col py-1">
        {LETTERS.filter((letter) => letter !== "#" || present.has("#")).map((letter) => {
          const active = present.has(letter);
          return (
            <button
              key={letter}
              type="button"
              disabled={!active}
              onClick={() => jump(letter)}
              className={cn(
                "flex flex-1 items-center justify-center text-xs leading-none",
                active ? "text-accent" : "text-subtle",
              )}
            >
              {letter}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
