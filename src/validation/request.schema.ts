import { z } from 'zod';

// Schémas alignés sur les règles du cahier des charges (F01) et sur docs/api-mobile.md.
// À remplacer par l'import du paquet de schémas partagé avec le web dès qu'il est publié :
// ce fichier doit rester identique, à la lettre, aux messages du web.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Champ obligatoire borné ; les longueurs se mesurent après suppression des espaces de bord. */
function requiredText(min: number, max: number, empty: string, tooShort: string, maxLabel: string) {
  return z.string().superRefine((raw, ctx) => {
    const v = raw.trim();
    if (!v) ctx.addIssue({ code: 'custom', message: empty });
    else if (v.length < min) ctx.addIssue({ code: 'custom', message: tooShort });
    else if (v.length > max) ctx.addIssue({ code: 'custom', message: `${maxLabel} caractères maximum (actuellement ${v.length}).` });
  });
}

export const requestFormSchema = z.object({
  customerName: requiredText(
    2,
    150,
    'Indiquez le nom du client ou de l’entreprise.',
    'Le nom doit contenir au moins 2 caractères.',
    '150',
  ),
  customerEmail: z.string().superRefine((raw, ctx) => {
    const v = raw.trim();
    if (!v) return;
    if (v.length > 254) ctx.addIssue({ code: 'custom', message: '254 caractères maximum.' });
    else if (!EMAIL.test(v)) ctx.addIssue({ code: 'custom', message: 'Adresse e-mail invalide. Exemple : nom@entreprise.com' });
  }),
  customerPhone: z.string().superRefine((raw, ctx) => {
    const v = raw.trim();
    if (v.length > 30) ctx.addIssue({ code: 'custom', message: `30 caractères maximum (actuellement ${v.length}).` });
  }),
  subject: requiredText(3, 200, 'Indiquez l’objet de la demande.', 'L’objet doit contenir au moins 3 caractères.', '200'),
  description: requiredText(
    10,
    5000,
    'Décrivez la demande du client.',
    'La description doit contenir au moins 10 caractères.',
    '5 000',
  ),
});

export type RequestFormValues = z.infer<typeof requestFormSchema>;
export type RequestFormField = keyof RequestFormValues;
export type RequestFormErrors = Partial<Record<RequestFormField, string>>;

export const REQUEST_FORM_FIELDS: readonly RequestFormField[] = [
  'customerName',
  'customerEmail',
  'customerPhone',
  'subject',
  'description',
];

export const EMPTY_REQUEST_FORM: RequestFormValues = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  subject: '',
  description: '',
};

/** Valide le formulaire et renvoie le premier message d'erreur de chaque champ. */
export function validateRequestForm(values: RequestFormValues): RequestFormErrors {
  const result = requestFormSchema.safeParse(values);
  if (result.success) return {};
  const errors: RequestFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as RequestFormField;
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}

/** Corps envoyé au serveur : valeurs sans espaces de bord, téléphone non normalisé. */
export function toCreatePayload(values: RequestFormValues) {
  return {
    customerName: values.customerName.trim(),
    customerEmail: values.customerEmail.trim(),
    customerPhone: values.customerPhone.trim(),
    subject: values.subject.trim(),
    description: values.description.trim(),
  };
}

// ——— Réponses de l'API ———

export const customerRequestSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  customerEmail: z.string().nullable(),
  customerPhone: z.string().nullable(),
  subject: z.string(),
  description: z.string(),
  isPriority: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomerRequest = z.infer<typeof customerRequestSchema>;

export const requestPageSchema = z.object({
  items: z.array(customerRequestSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  pages: z.number().int().nonnegative(),
});
export type RequestPage = z.infer<typeof requestPageSchema>;

export const priorityResultSchema = z.object({
  id: z.string(),
  isPriority: z.boolean(),
  updatedAt: z.string(),
});
export type PriorityResult = z.infer<typeof priorityResultSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['admin', 'agent']),
});
export type User = z.infer<typeof userSchema>;

export const authResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userSchema,
});
