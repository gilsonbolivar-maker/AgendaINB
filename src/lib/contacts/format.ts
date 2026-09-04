import type { Contact, ContactGroup, PhoneKind } from "./types";
import { GROUP_LABELS, PHONE_KIND_LABELS } from "./types";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function toNationalDigits(raw: string): string {
  let d = digitsOnly(raw);
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    d = d.slice(2);
  }
  return d.slice(0, 11);
}

const RAMAL_EXPAND: Partial<
  Record<ContactGroup, { stem: string; match: RegExp }>
> = {
  caetite: { stem: "773454", match: /^4/ },
  resende: { stem: "243321", match: /^8/ },
  caldas: { stem: "353191", match: /^31/ },
};

export function expandForCall(
  raw: string,
  kind?: PhoneKind,
  group?: ContactGroup,
): string {
  const d = digitsOnly(raw);
  if (kind === "ramal" || d.length === 4) {
    const rule = group ? RAMAL_EXPAND[group] : undefined;
    if (rule && rule.match.test(d)) return `${rule.stem}${d}`;
    return d;
  }
  return toNationalDigits(raw);
}

export function formatPhoneBR(raw: string): string {
  const d = toNationalDigits(raw);
  if (!d) return "";
  if (d.length <= 4) return d;
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (d.length <= 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

export function formatPhone(raw: string, kind?: PhoneKind): string {
  const d = digitsOnly(raw);
  if (kind === "ramal" || d.length === 4) {
    return d ? `Ramal ${d}` : "";
  }
  return formatPhoneBR(raw);
}

export function telHref(raw: string, kind?: PhoneKind, group?: ContactGroup): string {
  const d = expandForCall(raw, kind, group);
  if (!d) return "#";
  if (d.length <= 4) return `tel:${d}`;
  return `tel:+55${d}`;
}

export function smsHref(raw: string, kind?: PhoneKind, group?: ContactGroup): string {
  const d = expandForCall(raw, kind, group);
  if (d.length < 10) return "#";
  return `sms:+55${d}`;
}

export function waHref(raw: string): string {
  const d = toNationalDigits(raw);
  return d.length >= 10 ? `https://wa.me/55${d}` : "#";
}

export function contactCardText(contact: Contact): string {
  const lines: string[] = ["INB · Lista telefônica", "", `*${displayName(contact)}*`];
  if (contact.matricula) lines.push(`Matrícula: ${contact.matricula}`);
  lines.push(`Unidade: ${GROUP_LABELS[contact.group]}`);
  if (contact.area) lines.push(`Área: ${contact.area}`);
  if (contact.company) lines.push(`Empresa: ${contact.company}`);
  if (contact.phones.length) {
    lines.push("");
    for (const phone of contact.phones) {
      lines.push(`${PHONE_KIND_LABELS[phone.kind]}: ${formatPhone(phone.number, phone.kind)}`);
    }
  }
  if (contact.email) lines.push(`E-mail: ${contact.email}`);
  if (contact.notes) lines.push(`Obs.: ${contact.notes}`);
  return lines.join("\n");
}

export function waShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function isLikelyMobile(raw: string): boolean {
  const d = toNationalDigits(raw);
  return d.length === 11 && d[2] === "9";
}

export function canDial(raw: string, kind?: PhoneKind, group?: ContactGroup): boolean {
  return expandForCall(raw, kind, group).length >= 4;
}

export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function displayName(c: { firstName: string; lastName: string }): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

export function initials(c: { firstName: string; lastName: string }): string {
  const letter = (s: string) =>
    [...s].find((ch) => /\p{L}/u.test(ch))?.toUpperCase() ?? "";
  const a = letter(c.firstName);
  const b = letter(c.lastName);
  if (a && b) return `${a}${b}`;
  if (a) {
    const more = [...c.firstName]
      .filter((ch) => /\p{L}/u.test(ch))
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return more || a;
  }
  return "?";
}

export function letterKey(name: string): string {
  const ch = fold(name).charAt(0);
  if (ch >= "a" && ch <= "z") return ch.toUpperCase();
  return "#";
}

export function primaryPhone(
  phones: { number: string; kind: string }[],
): { number: string; kind: PhoneKind } | null {
  if (phones.length === 0) return null;
  const mobile = phones.find((p) => p.kind === "celular" || p.kind === "whatsapp");
  const fixo = phones.find((p) => p.kind === "fixo");
  const pick = mobile ?? fixo ?? phones[0];
  return { number: pick.number, kind: pick.kind as PhoneKind };
}
