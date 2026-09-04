import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppMark } from "@/components/agenda/app-mark";
import { ContactDetail } from "@/components/agenda/contact-detail";
import { ContactForm } from "@/components/agenda/contact-form";
import { ContactList } from "@/components/agenda/contact-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  displayName,
  fold,
  formatPhone,
} from "@/lib/contacts/format";
import {
  hydrateContactsStore,
  parseImportedContacts,
  useContacts,
} from "@/lib/contacts/store";
import {
  CONTACT_GROUPS,
  GROUP_LABELS,
  type Contact,
  type ContactDraft,
  type FilterId,
} from "@/lib/contacts/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "favorites", label: "Favoritos" },
  ...CONTACT_GROUPS.map((id) => ({ id, label: GROUP_LABELS[id] })),
];

export function AgendaApp() {
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);
  const [confirm, setConfirm] = useState<"clear" | "restore" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const contacts = useContacts((s) => s.contacts);
  const addContact = useContacts((s) => s.addContact);
  const updateContact = useContacts((s) => s.updateContact);
  const removeContact = useContacts((s) => s.removeContact);
  const toggleFavorite = useContacts((s) => s.toggleFavorite);
  const importContacts = useContacts((s) => s.importContacts);
  const restoreSamples = useContacts((s) => s.restoreSamples);
  const clearAll = useContacts((s) => s.clearAll);

  useEffect(() => {
    let cancelled = false;
    void hydrateContactsStore()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = fold(search.trim());
    return contacts.filter((c) => {
      if (filter === "favorites" && !c.favorite) return false;
      if (filter !== "all" && filter !== "favorites" && c.group !== filter) return false;
      if (!q) return true;
      const hay = fold(
        [
          displayName(c),
          c.matricula,
          c.area,
          GROUP_LABELS[c.group],
          c.company,
          c.email,
          c.notes,
          ...c.phones.map((p) => `${formatPhone(p.number, p.kind)} ${p.number}`),
        ].join(" "),
      );
      return hay.includes(q);
    });
  }, [contacts, filter, search]);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;
  const editing = contacts.find((c) => c.id === editingId) ?? null;
  const didAutoSelect = useRef(false);

  useEffect(() => {
    if (!ready || didAutoSelect.current) return;
    didAutoSelect.current = true;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 640px)").matches) return;
    const first = [...contacts].sort((a, b) =>
      displayName(a).localeCompare(displayName(b), "pt-BR"),
    )[0];
    if (first) setSelectedId(first.id);
  }, [ready, contacts]);

  useEffect(() => {
    if (selectedId && !contacts.some((c) => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [contacts, selectedId]);

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  function handleSave(draft: ContactDraft) {
    if (editingId) {
      updateContact(editingId, draft);
      toast.success("Contato atualizado");
    } else {
      const id = addContact(draft);
      setSelectedId(id);
      toast.success("Contato adicionado");
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleExport() {
    const payload = JSON.stringify({ contacts }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agenda-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Agenda exportada");
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const incoming = parseImportedContacts(JSON.parse(text) as unknown);
      const n = importContacts(incoming);
      toast.success(n === 1 ? "1 contato importado" : `${n} contatos importados`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao importar");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!ready) {
    return <AgendaSkeleton />;
  }

  const countLabel =
    visible.length === 1
      ? "1 colaborador"
      : `${visible.length.toLocaleString("pt-BR")} colaboradores`;

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside
        className={cn(
          "flex min-h-dvh w-full flex-col border-border sm:w-80 sm:border-r lg:w-96",
          selected ? "hidden sm:flex" : "flex",
        )}
      >
        <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-3">
              <AppMark className="mt-0.5 size-11" />
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-widest text-muted uppercase">
                  INB · Lista telefônica
                </p>
                <h1 className="font-display text-3xl font-medium tracking-tight">Agenda</h1>
                <p className="mt-1 text-sm text-muted">{countLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={openCreate} aria-label="Novo contato">
                <Plus className="size-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Mais opções">
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={handleExport}>
                    <Download className="size-4" />
                    Exportar JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                    <Upload className="size-4" />
                    Importar JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setConfirm("restore")}>
                    <RotateCcw className="size-4" />
                    Restaurar lista INB
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="danger" onSelect={() => setConfirm("clear")}>
                    <Trash2 className="size-4" />
                    Apagar todos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, matrícula, ramal, área…"
              className="pr-10 pl-9"
              aria-label="Buscar contatos"
            />
            {search ? (
              <button
                type="button"
                aria-label="Limpar busca"
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-fg"
                onClick={() => setSearch("")}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-fg"
                      : "bg-raised text-muted shadow-[var(--shadow-card)] hover:text-fg",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>

        <ContactList
          contacts={visible}
          selectedId={selectedId}
          search={search}
          onSelect={setSelectedId}
          onToggleFavorite={toggleFavorite}
          empty={
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <p className="font-display text-2xl text-fg">Agenda vazia</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                Restaure a lista da INB ou adicione um colaborador.
              </p>
              <Button className="mt-5" onClick={openCreate}>
                <Plus className="size-4" />
                Novo contato
              </Button>
            </div>
          }
        />
      </aside>

      <section
        className={cn(
          "min-h-dvh bg-bg",
          selected
            ? "fixed inset-0 z-20 sm:static sm:z-0 sm:flex sm:flex-1"
            : "hidden sm:flex sm:flex-1",
        )}
      >
        {selected ? (
          <div className="w-full">
            <ContactDetail
              contact={selected}
              onBack={() => setSelectedId(null)}
              onEdit={() => openEdit(selected.id)}
              onDelete={() => setPendingDelete(selected)}
              onToggleFavorite={() => toggleFavorite(selected.id)}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-2xl text-fg">Selecione um contato</p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Ramal, unidade e WhatsApp aparecem aqui.
            </p>
          </div>
        )}
      </section>

      <ContactForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingId(null);
        }}
        contact={editing}
        onSave={handleSave}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar contato?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${displayName(pendingDelete)} será removido desta agenda.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDelete) return;
                removeContact(pendingDelete.id);
                setSelectedId((id) => (id === pendingDelete.id ? null : id));
                setPendingDelete(null);
                toast.success("Contato apagado");
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "clear" ? "Apagar toda a agenda?" : "Restaurar lista INB?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "clear"
                ? "Todos os contatos deste aparelho serão removidos. Exporte antes se quiser um backup."
                : "Isso substitui a agenda atual pelos 1.133 colaboradores da lista telefônica da INB."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={confirm === "restore" ? buttonVariants({ variant: "primary" }) : undefined}
              onClick={() => {
                if (confirm === "clear") {
                  clearAll();
                  setSelectedId(null);
                  toast.success("Agenda apagada");
                } else {
                  restoreSamples();
                  setSelectedId(null);
                  toast.success("Lista INB restaurada");
                }
                setConfirm(null);
              }}
            >
              {confirm === "clear" ? "Apagar todos" : "Restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0])}
      />
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div className="flex min-h-dvh bg-bg">
      <div className="flex w-full flex-col px-4 pt-8 sm:w-80 sm:border-r sm:border-border lg:w-96">
        <div className="h-4 w-20 rounded bg-raised" />
        <div className="mt-3 h-8 w-36 rounded-md bg-raised" />
        <div className="mt-5 h-11 rounded-lg bg-raised" />
        <div className="mt-4 flex gap-2">
          <div className="h-9 w-16 rounded-full bg-raised" />
          <div className="h-9 w-20 rounded-full bg-raised" />
          <div className="h-9 w-16 rounded-full bg-raised" />
        </div>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-raised" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-raised" />
                <div className="h-3 w-1/3 rounded bg-raised" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
