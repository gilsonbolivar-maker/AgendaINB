import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_GROUPS,
  GROUP_LABELS,
  PHONE_KINDS,
  PHONE_KIND_LABELS,
  type Contact,
  type ContactDraft,
  type ContactGroup,
  type Phone,
  type PhoneKind,
} from "@/lib/contacts/types";
import { digitsOnly, formatPhoneBR, toNationalDigits } from "@/lib/contacts/format";
import { cn } from "@/lib/utils";

function newPhone(): Phone {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return { id, kind: "ramal", number: "" };
}

function emptyDraft(): ContactDraft {
  return {
    firstName: "",
    lastName: "",
    matricula: "",
    area: "",
    company: "",
    email: "",
    notes: "",
    group: "caetite",
    favorite: false,
    phones: [newPhone()],
  };
}

function fromContact(contact: Contact): ContactDraft {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    matricula: contact.matricula,
    area: contact.area,
    company: contact.company,
    email: contact.email,
    notes: contact.notes,
    group: contact.group,
    favorite: contact.favorite,
    phones: contact.phones.map((p) => ({ ...p })),
  };
}

function normalizePhone(kind: PhoneKind, raw: string): string {
  const d = digitsOnly(raw);
  if (kind === "ramal") return d.slice(0, 4);
  return toNationalDigits(raw);
}

function displayPhone(kind: PhoneKind, raw: string): string {
  if (kind === "ramal") return digitsOnly(raw).slice(0, 4);
  return formatPhoneBR(raw);
}

const selectClass =
  "h-11 w-full rounded-lg bg-raised px-3 text-sm text-fg shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type ContactFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSave: (draft: ContactDraft) => void;
};

export function ContactForm({ open, onOpenChange, contact, onSave }: ContactFormProps) {
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const editing = Boolean(contact);

  useEffect(() => {
    if (!open) return;
    setDraft(contact ? fromContact(contact) : emptyDraft());
    setErrors({});
  }, [open, contact]);

  const canRemovePhone = draft.phones.length > 1;

  const title = useMemo(
    () => (editing ? "Editar contato" : "Novo contato"),
    [editing],
  );

  function update<K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhone(index: number, patch: Partial<Phone>) {
    setDraft((prev) => ({
      ...prev,
      phones: prev.phones.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!draft.firstName.trim()) next.firstName = "Informe o nome";
    const validPhone = draft.phones.some((p) => {
      const n = digitsOnly(p.number);
      return p.kind === "ramal" ? n.length === 4 : n.length >= 10;
    });
    if (!validPhone) next.phones = "Informe um ramal (4 dígitos) ou telefone com DDD";
    if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      next.email = "E-mail inválido";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSave({
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      matricula: draft.matricula.trim(),
      area: draft.area.trim(),
      company: draft.company.trim(),
      email: draft.email.trim(),
      notes: draft.notes.trim(),
      phones: draft.phones
        .map((p) => ({ ...p, number: normalizePhone(p.kind, p.number) }))
        .filter((p) =>
          p.kind === "ramal" ? p.number.length === 4 : p.number.length >= 10,
        ),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="contact-form-desc">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="contact-form-desc">
            Nome e um ramal ou telefone com DDD são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome" htmlFor="firstName" error={errors.firstName}>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  value={draft.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Maria"
                />
              </Field>
              <Field label="Sobrenome" htmlFor="lastName">
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  value={draft.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Silva"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Matrícula" htmlFor="matricula">
                <Input
                  id="matricula"
                  inputMode="numeric"
                  value={draft.matricula}
                  onChange={(e) => update("matricula", digitsOnly(e.target.value).slice(0, 5))}
                  placeholder="0000"
                />
              </Field>
              <Field label="Unidade" htmlFor="group">
                <select
                  id="group"
                  className={selectClass}
                  value={draft.group}
                  onChange={(e) => update("group", e.target.value as ContactGroup)}
                >
                  {CONTACT_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {GROUP_LABELS[g]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Área" htmlFor="area">
              <Input
                id="area"
                value={draft.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder="COBEP.M — Coordenação de Beneficiamento"
              />
            </Field>

            <Field label="E-mail" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={draft.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="nome@inb.gov.br"
              />
            </Field>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ramais e telefones</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted"
                  onClick={() => update("phones", [...draft.phones, newPhone()])}
                >
                  <Plus className="size-4" />
                  Adicionar
                </Button>
              </div>
              {draft.phones.map((phone, index) => (
                <div key={phone.id} className="flex gap-2">
                  <select
                    aria-label="Tipo de telefone"
                    className={cn(selectClass, "w-32 shrink-0")}
                    value={phone.kind}
                    onChange={(e) =>
                      updatePhone(index, { kind: e.target.value as PhoneKind })
                    }
                  >
                    {PHONE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {PHONE_KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <Input
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={phone.kind === "ramal" ? "4840" : "(77) 99999-0000"}
                    value={displayPhone(phone.kind, phone.number)}
                    onChange={(e) =>
                      updatePhone(index, {
                        number: normalizePhone(phone.kind, e.target.value),
                      })
                    }
                  />
                  {canRemovePhone ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted"
                      aria-label="Remover telefone"
                      onClick={() =>
                        update(
                          "phones",
                          draft.phones.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {errors.phones ? (
                <p className="text-sm text-danger">{errors.phones}</p>
              ) : null}
            </div>

            <Field label="Anotações" htmlFor="notes">
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Recado, horário, sala…"
              />
            </Field>

            <button
              type="button"
              onClick={() => update("favorite", !draft.favorite)}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
                draft.favorite
                  ? "bg-accent text-accent-fg"
                  : "bg-raised text-muted shadow-[var(--shadow-card)]",
              )}
            >
              <Star className={cn("size-4", draft.favorite && "fill-current")} />
              {draft.favorite ? "Favorito" : "Marcar como favorito"}
            </button>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
