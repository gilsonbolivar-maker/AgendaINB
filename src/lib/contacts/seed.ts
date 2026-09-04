import { INB_DIRECTORY } from "./directory";
import type { ContactDraft } from "./types";

export const SAMPLE_CONTACTS: ContactDraft[] = INB_DIRECTORY.map((row) => ({
  firstName: row.firstName,
  lastName: row.lastName,
  matricula: row.matricula,
  area: row.area,
  company: "",
  email: "",
  notes: "",
  group: row.unidade,
  favorite: false,
  phones: row.phones.map((p, index) => ({
    id: `${row.matricula}-p${index}`,
    kind: p.kind,
    number: p.number,
  })),
}));
