export const CONTACT_GROUPS = [
  "caetite",
  "resende",
  "caldas",
  "rio",
  "sao_paulo",
  "fortaleza",
  "buena",
  "itataia",
  "outros",
] as const;

export type ContactGroup = (typeof CONTACT_GROUPS)[number];

export const GROUP_LABELS: Record<ContactGroup, string> = {
  caetite: "Caetité",
  resende: "Resende",
  caldas: "Caldas",
  rio: "Rio de Janeiro",
  sao_paulo: "São Paulo",
  fortaleza: "Fortaleza",
  buena: "Buena",
  itataia: "Santa Quitéria",
  outros: "Outros",
};

export const PHONE_KINDS = ["ramal", "celular", "fixo", "whatsapp"] as const;

export type PhoneKind = (typeof PHONE_KINDS)[number];

export const PHONE_KIND_LABELS: Record<PhoneKind, string> = {
  ramal: "Ramal",
  celular: "Celular",
  fixo: "Fixo",
  whatsapp: "WhatsApp",
};

export type Phone = {
  id: string;
  kind: PhoneKind;
  number: string;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  matricula: string;
  area: string;
  company: string;
  email: string;
  notes: string;
  group: ContactGroup;
  favorite: boolean;
  phones: Phone[];
  createdAt: number;
  updatedAt: number;
};

export type ContactDraft = Omit<Contact, "id" | "createdAt" | "updatedAt">;

export type FilterId = "all" | "favorites" | ContactGroup;
