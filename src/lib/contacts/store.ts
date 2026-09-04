import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { SAMPLE_CONTACTS } from "./seed";
import type { Contact, ContactDraft } from "./types";
import { CONTACT_GROUPS, PHONE_KINDS } from "./types";

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function now(): number {
  return Date.now();
}

function fromDirectory(draft: ContactDraft): Contact {
  const matricula = draft.matricula ?? "";
  return {
    ...draft,
    id: `inb-${matricula}`,
    matricula,
    area: draft.area ?? "",
    company: draft.company ?? "",
    favorite: false,
    phones: draft.phones.map((p, index) => ({
      ...p,
      id: p.id || `inb-${matricula}-p${index}`,
      number: p.number,
    })),
    createdAt: 0,
    updatedAt: 0,
  };
}

function fromDraft(draft: ContactDraft): Contact {
  const t = now();
  return {
    ...draft,
    id: createId(),
    matricula: draft.matricula ?? "",
    area: draft.area ?? "",
    company: draft.company ?? "",
    phones: draft.phones.map((p) => ({
      ...p,
      id: p.id || createId(),
      number: p.number,
    })),
    createdAt: t,
    updatedAt: t,
  };
}

const DIRECTORY: Contact[] = SAMPLE_CONTACTS.map(fromDirectory);

type Overlay = {
  extras: Contact[];
  deleted: string[];
  favoriteIds: string[];
  patches: Record<string, ContactDraft>;
};

function mergeContacts(overlay: Overlay): Contact[] {
  const deleted = new Set(overlay.deleted);
  const favs = new Set(overlay.favoriteIds);
  const patched = DIRECTORY.filter((c) => !deleted.has(c.id)).map((c) => {
    const patch = overlay.patches[c.id];
    const next: Contact = patch
      ? {
          ...c,
          ...patch,
          id: c.id,
          phones: patch.phones.map((p) => ({
            ...p,
            id: p.id || createId(),
          })),
          updatedAt: now(),
        }
      : c;
    return { ...next, favorite: favs.has(c.id) };
  });
  const extras = overlay.extras
    .filter((c) => !deleted.has(c.id))
    .map((c) => ({ ...c, favorite: favs.has(c.id) }));
  return [...patched, ...extras];
}

const emptyOverlay = (): Overlay => ({
  extras: [],
  deleted: [],
  favoriteIds: [],
  patches: {},
});

const PhoneSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(PHONE_KINDS),
  number: z.string().min(4).max(13),
});

const ContactSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string(),
  matricula: z.string().default(""),
  area: z.string().default(""),
  company: z.string().default(""),
  email: z.string().default(""),
  notes: z.string().default(""),
  group: z.enum(CONTACT_GROUPS),
  favorite: z.boolean(),
  phones: z.array(PhoneSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export function parseImportedContacts(raw: unknown): Contact[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && "contacts" in raw
      ? (raw as { contacts: unknown }).contacts
      : null;
  if (!Array.isArray(list)) {
    throw new Error("Arquivo inválido");
  }
  const parsed: Contact[] = [];
  for (const item of list) {
    const result = ContactSchema.safeParse(item);
    if (!result.success) continue;
    parsed.push(
      fromDraft({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        matricula: result.data.matricula,
        area: result.data.area,
        company: result.data.company,
        email: result.data.email,
        notes: result.data.notes,
        group: result.data.group,
        favorite: result.data.favorite,
        phones: result.data.phones,
      }),
    );
  }
  if (parsed.length === 0) {
    throw new Error("Nenhum contato válido no arquivo");
  }
  return parsed;
}

type ContactsState = Overlay & {
  contacts: Contact[];
  addContact: (draft: ContactDraft) => string;
  updateContact: (id: string, draft: ContactDraft) => void;
  removeContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  importContacts: (incoming: Contact[]) => number;
  restoreSamples: () => void;
  clearAll: () => void;
};

function apply(overlay: Overlay): Pick<ContactsState, "contacts" | keyof Overlay> {
  return { ...overlay, contacts: mergeContacts(overlay) };
}

export const useContacts = create<ContactsState>()(
  persist(
    (set, get) => ({
      ...apply(emptyOverlay()),
      addContact: (draft) => {
        const contact = fromDraft(draft);
        const overlay: Overlay = {
          extras: [...get().extras, contact],
          deleted: get().deleted,
          favoriteIds: draft.favorite
            ? [...new Set([...get().favoriteIds, contact.id])]
            : get().favoriteIds,
          patches: get().patches,
        };
        set(apply(overlay));
        return contact.id;
      },
      updateContact: (id, draft) => {
        const extras = get().extras;
        const isExtra = extras.some((c) => c.id === id);
        let overlay: Overlay;
        if (isExtra) {
          overlay = {
            extras: extras.map((c) =>
              c.id === id
                ? {
                    ...c,
                    ...draft,
                    id: c.id,
                    phones: draft.phones.map((p) => ({
                      ...p,
                      id: p.id || createId(),
                    })),
                    updatedAt: now(),
                  }
                : c,
            ),
            deleted: get().deleted,
            favoriteIds: draft.favorite
              ? [...new Set([...get().favoriteIds, id])]
              : get().favoriteIds.filter((fid) => fid !== id),
            patches: get().patches,
          };
        } else {
          overlay = {
            extras: extras,
            deleted: get().deleted,
            favoriteIds: draft.favorite
              ? [...new Set([...get().favoriteIds, id])]
              : get().favoriteIds.filter((fid) => fid !== id),
            patches: { ...get().patches, [id]: draft },
          };
        }
        set(apply(overlay));
      },
      removeContact: (id) => {
        set(
          apply({
            extras: get().extras.filter((c) => c.id !== id),
            deleted: [...new Set([...get().deleted, id])],
            favoriteIds: get().favoriteIds.filter((fid) => fid !== id),
            patches: Object.fromEntries(
              Object.entries(get().patches).filter(([key]) => key !== id),
            ),
          }),
        );
      },
      toggleFavorite: (id) => {
        const favoriteIds = get().favoriteIds.includes(id)
          ? get().favoriteIds.filter((fid) => fid !== id)
          : [...get().favoriteIds, id];
        set(
          apply({
            extras: get().extras,
            deleted: get().deleted,
            favoriteIds,
            patches: get().patches,
          }),
        );
      },
      importContacts: (incoming) => {
        const extras = [...get().extras, ...incoming];
        const favoriteIds = [
          ...get().favoriteIds,
          ...incoming.filter((c) => c.favorite).map((c) => c.id),
        ];
        set(
          apply({
            extras,
            deleted: get().deleted,
            favoriteIds: [...new Set(favoriteIds)],
            patches: get().patches,
          }),
        );
        return incoming.length;
      },
      restoreSamples: () => {
        set(apply(emptyOverlay()));
      },
      clearAll: () => {
        set(
          apply({
            extras: [],
            deleted: DIRECTORY.map((c) => c.id),
            favoriteIds: [],
            patches: {},
          }),
        );
      },
    }),
    {
      name: "agenda-inb-overlay-v1",
      skipHydration: true,
      partialize: (state) => ({
        extras: state.extras,
        deleted: state.deleted,
        favoriteIds: state.favoriteIds,
        patches: state.patches,
      }),
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<Overlay>;
        const overlay: Overlay = {
          extras: Array.isArray(raw.extras) ? raw.extras : [],
          deleted: Array.isArray(raw.deleted) ? raw.deleted : [],
          favoriteIds: Array.isArray(raw.favoriteIds) ? raw.favoriteIds : [],
          patches: raw.patches && typeof raw.patches === "object" ? raw.patches : {},
        };
        return { ...current, ...apply(overlay) };
      },
    },
  ),
);

function wipeLegacyStores() {
  if (typeof localStorage === "undefined") return;
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key === "agenda-telefonica-v1" || key === "agenda-inb-v1") {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export async function hydrateContactsStore(): Promise<void> {
  wipeLegacyStores();
  await useContacts.persist.rehydrate();
  const state = useContacts.getState();
  useContacts.setState(
    apply({
      extras: state.extras ?? [],
      deleted: state.deleted ?? [],
      favoriteIds: state.favoriteIds ?? [],
      patches: state.patches ?? {},
    }),
  );
}

