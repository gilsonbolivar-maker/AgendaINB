import {
  ChevronLeft,
  Copy,
  Mail,
  MessageCircle,
  MessageSquare,
  Pencil,
  Phone,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppMark } from "@/components/agenda/app-mark";
import { Avatar } from "@/components/agenda/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Contact } from "@/lib/contacts/types";
import { GROUP_LABELS, PHONE_KIND_LABELS } from "@/lib/contacts/types";
import {
  canDial,
  contactCardText,
  displayName,
  formatPhone,
  isLikelyMobile,
  primaryPhone,
  smsHref,
  telHref,
  waHref,
  waShareHref,
} from "@/lib/contacts/format";
import { cn } from "@/lib/utils";

type ContactDetailProps = {
  contact: Contact;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
};

export function ContactDetail({
  contact,
  onBack,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ContactDetailProps) {
  const main = primaryPhone(contact.phones);
  const canCall = main ? canDial(main.number, main.kind, contact.group) : false;
  const mobile =
    contact.phones.find((p) => p.kind === "whatsapp" || isLikelyMobile(p.number)) ??
    (main && isLikelyMobile(main.number) ? main : null);
  const canWhatsApp = Boolean(mobile);
  const canSms = Boolean(mobile);
  const canMail = Boolean(contact.email);
  const callHref = main ? telHref(main.number, main.kind, contact.group) : undefined;
  const cardText = contactCardText(contact);
  const shareHref = waShareHref(cardText);

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="sm:invisible"
            onClick={onBack}
            aria-label="Voltar"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              aria-label={contact.favorite ? "Remover dos favoritos" : "Marcar como favorito"}
            >
              <Star className={cn("size-5", contact.favorite && "fill-accent text-accent")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar">
              <Pencil className="size-5" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10">
          <div className="flex flex-col items-center pt-2 pb-6 text-center">
            <Avatar firstName={contact.firstName} lastName={contact.lastName} size="lg" />
            <h2 className="mt-4 font-display text-3xl leading-tight font-medium tracking-tight text-fg">
              {displayName(contact)}
            </h2>
            {contact.area ? (
              <p className="mt-1 max-w-sm text-sm text-muted">{contact.area}</p>
            ) : contact.company ? (
              <p className="mt-1 text-sm text-muted">{contact.company}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-raised px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
                {GROUP_LABELS[contact.group]}
              </span>
              {contact.matricula ? (
                <span className="rounded-full bg-raised px-3 py-1 text-xs font-medium tracking-wide text-muted">
                  Mat. {contact.matricula}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-4 gap-2">
            <ActionLink href={canCall ? callHref : undefined} label="Ligar" icon={Phone} disabled={!canCall} />
            <ActionLink
              href={canWhatsApp && mobile ? waHref(mobile.number) : undefined}
              label="WhatsApp"
              icon={MessageCircle}
              disabled={!canWhatsApp}
              external
            />
            <ActionLink
              href={canSms && mobile ? smsHref(mobile.number, mobile.kind, contact.group) : undefined}
              label="SMS"
              icon={MessageSquare}
              disabled={!canSms}
            />
            <ActionLink
              href={canMail ? `mailto:${contact.email}` : undefined}
              label="E-mail"
              icon={Mail}
              disabled={!canMail}
            />
          </div>

          <section className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-card)]">
            {contact.phones.map((phone, index) => (
              <div key={phone.id}>
                {index > 0 ? <Separator /> : null}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-wide text-muted uppercase">
                      {PHONE_KIND_LABELS[phone.kind]}
                    </p>
                    <a
                      href={telHref(phone.number, phone.kind, contact.group)}
                      className="mt-0.5 block truncate text-base text-fg"
                    >
                      {formatPhone(phone.number, phone.kind)}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copiar número"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(formatPhone(phone.number, phone.kind));
                        toast.success("Número copiado");
                      } catch {
                        toast.error("Não foi possível copiar");
                      }
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            {contact.matricula ? (
              <>
                {contact.phones.length > 0 ? <Separator /> : null}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-wide text-muted uppercase">
                      Matrícula
                    </p>
                    <p className="mt-0.5 text-base text-fg">{contact.matricula}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copiar matrícula"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(contact.matricula);
                        toast.success("Matrícula copiada");
                      } catch {
                        toast.error("Não foi possível copiar");
                      }
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </>
            ) : null}
            {contact.email ? (
              <>
                <Separator />
                <div className="px-4 py-3">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">E-mail</p>
                  <a href={`mailto:${contact.email}`} className="mt-0.5 block truncate text-base">
                    {contact.email}
                  </a>
                </div>
              </>
            ) : null}
            {contact.notes ? (
              <>
                <Separator />
                <div className="px-4 py-3">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">Anotações</p>
                  <p className="mt-0.5 text-base leading-relaxed text-fg">{contact.notes}</p>
                </div>
              </>
            ) : null}
            {contact.phones.length === 0 && !contact.matricula && !contact.email && !contact.notes ? (
              <div className="px-4 py-6 text-center text-sm text-muted">
                Sem ramal ou telefone na lista.
              </div>
            ) : null}
          </section>

          <section className="mt-4 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3 px-4 pt-4 pb-3">
              <AppMark className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  Card para o Zap
                </p>
                <p className="mt-1 font-display text-lg font-medium tracking-tight text-fg">
                  {displayName(contact)}
                </p>
              </div>
            </div>
            <div className="px-4 pb-3">
              <dl className="space-y-1 text-sm">
                {contact.matricula ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted">Matrícula</dt>
                    <dd className="min-w-0 text-fg">{contact.matricula}</dd>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-muted">Unidade</dt>
                  <dd className="min-w-0 text-fg">{GROUP_LABELS[contact.group]}</dd>
                </div>
                {contact.area ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted">Área</dt>
                    <dd className="min-w-0 text-fg">{contact.area}</dd>
                  </div>
                ) : null}
                {contact.phones.map((phone) => (
                  <div key={phone.id} className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted">
                      {PHONE_KIND_LABELS[phone.kind]}
                    </dt>
                    <dd className="min-w-0 text-fg">
                      {formatPhone(phone.number, phone.kind)}
                    </dd>
                  </div>
                ))}
                {contact.email ? (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted">E-mail</dt>
                    <dd className="min-w-0 truncate text-fg">{contact.email}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <Separator />
            <div className="flex flex-col gap-2 p-3">
              <Button variant="primary" className="w-full" asChild>
                <a
                  href={shareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Enviar card no WhatsApp"
                >
                  <Send className="size-4" />
                  Enviar no Zap
                </a>
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                aria-label="Copiar card"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(cardText);
                    toast.success("Card copiado");
                  } catch {
                    toast.error("Não foi possível copiar");
                  }
                }}
              >
                <Copy className="size-4" />
                Copiar card
              </Button>
            </div>
          </section>

          <Button
            variant="ghost"
            className="mt-6 w-full text-danger hover:bg-danger/10 hover:text-danger"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            Apagar contato
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  label,
  icon: Icon,
  disabled,
  external,
}: {
  href?: string;
  label: string;
  icon: typeof Phone;
  disabled?: boolean;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="flex size-12 items-center justify-center rounded-full bg-surface text-fg shadow-[var(--shadow-card)] transition-transform duration-150 ease-out group-active:scale-[0.96]">
        <Icon className="size-5" />
      </span>
      <span className="text-xs font-medium text-muted">{label}</span>
    </>
  );

  if (disabled || !href || href === "#") {
    return <div className="flex flex-col items-center gap-1.5 opacity-35">{inner}</div>;
  }

  return (
    <a
      href={href}
      className="group flex flex-col items-center gap-1.5"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </a>
  );
}
