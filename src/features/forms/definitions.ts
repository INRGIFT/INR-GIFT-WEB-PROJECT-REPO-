/**
 * Support, grievance and account-closure forms. One definition per form drives the browser form, the browser checks
 * and the server checks (validateForm runs in /api/forms/[kind] as the authority). Pure TypeScript, no secrets.
 */
export type FormKind = 'support' | 'grievance' | 'account-closure';
export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  min?: number;
  max: number;
  options?: readonly (readonly [value: string, label: string])[];
  hint?: string;
  autoComplete?: string;
  /** Full width on wide screens. */
  wide?: boolean;
  /** Message when a required field is empty or a box is unticked. */
  requiredMessage?: string;
  pattern?: RegExp;
  patternMessage?: string;
}
export interface FormDef { kind: FormKind; fields: FieldDef[]; submitLabel: string }

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^\+?[0-9][0-9 ()-]{6,18}[0-9]$/;
const REFERENCE = /^[A-Za-z0-9 ._#/-]*$/;

export const SUPPORT_CATEGORIES = [
  ['login', 'Signing in'], ['email-verification', 'Email verification'], ['password', 'Password reset'], ['security', 'Account security'],
  ['data', 'Data or content question'], ['technical', 'Technical issue'], ['account-closure', 'Account closure'], ['grievance', 'Grievance'],
  ['privacy', 'Privacy request'], ['legal', 'Legal request'], ['other', 'Something else'],
] as const;
export const GRIEVANCE_CATEGORIES = [
  ['account-access', 'Account access or sign-in'], ['data-accuracy', 'Data accuracy or content'], ['service', 'Service availability or quality'],
  ['privacy', 'Privacy or personal data'], ['support', 'Handling of an earlier support request'], ['other', 'Other'],
] as const;
export const CLOSURE_REASONS = [
  ['no-longer-needed', 'I no longer need INRGIFT'], ['privacy', 'Privacy reasons'], ['another-service', 'I use another service'],
  ['experience', 'I was not satisfied with the service'], ['other', 'Other'], ['not-said', 'Prefer not to say'],
] as const;

const name: FieldDef = { name: 'name', label: 'Full name', type: 'text', required: true, max: 80, autoComplete: 'name', requiredMessage: 'Enter your full name.' };
const emailField = (label: string, hint?: string): FieldDef => ({ name: 'email', label, type: 'email', required: true, max: 254, autoComplete: 'email', hint, requiredMessage: 'Enter your email address.', pattern: EMAIL, patternMessage: 'Enter a valid email address.' });
const phone = (required: boolean): FieldDef => ({ name: 'phone', label: 'Phone number', type: 'tel', required, max: 20, autoComplete: 'tel', hint: required ? 'With country code, for example +91 98765 43210.' : 'Optional. With country code.', requiredMessage: 'Enter your phone number.', pattern: PHONE, patternMessage: 'Enter the number with its country code, for example +91 98765 43210.' });
const reference: FieldDef = { name: 'reference', label: 'Account or reference ID', type: 'text', max: 64, hint: 'Optional. An earlier request reference or anything that identifies your account.', pattern: REFERENCE, patternMessage: 'Use letters, numbers, spaces and . _ # / - only.' };

export const FORMS: Record<FormKind, FormDef> = {
  support: {
    kind: 'support', submitLabel: 'Send to support',
    fields: [
      name, emailField('Email', 'We reply to this address.'), phone(false),
      { name: 'category', label: 'Category', type: 'select', required: true, max: 40, options: SUPPORT_CATEGORIES, requiredMessage: 'Choose a category.' },
      { name: 'subject', label: 'Subject', type: 'text', required: true, min: 3, max: 150, wide: true, requiredMessage: 'Enter a subject.' },
      { name: 'message', label: 'Message', type: 'textarea', required: true, min: 20, max: 4000, wide: true, hint: 'For a data issue, include the asset, the figure and where you saw it. Never include your password.', requiredMessage: 'Describe what you need.' },
      { name: 'consent', label: 'I agree that INRGIFT may use these details to respond to this request, as described in the Privacy Policy.', type: 'checkbox', required: true, max: 5, wide: true, requiredMessage: 'Tick the box so we can use these details to reply.' },
    ],
  },
  grievance: {
    kind: 'grievance', submitLabel: 'Submit grievance',
    fields: [
      name, emailField('Registered email', 'The email address on your INRGIFT account, if you have one.'), phone(true),
      { name: 'category', label: 'Grievance category', type: 'select', required: true, max: 40, options: GRIEVANCE_CATEGORIES, requiredMessage: 'Choose a category.' },
      { name: 'subject', label: 'Subject', type: 'text', required: true, min: 3, max: 150, wide: true, requiredMessage: 'Enter a subject.' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, min: 30, max: 5000, wide: true, hint: 'What happened, when, and what outcome you are asking for. Never include your password.', requiredMessage: 'Describe your grievance.' },
      reference,
      { name: 'consent', label: 'I confirm that the information in this grievance is accurate and agree that INRGIFT may use it to investigate and respond, as described in the Privacy Policy.', type: 'checkbox', required: true, max: 5, wide: true, requiredMessage: 'Tick the box to confirm.' },
    ],
  },
  'account-closure': {
    kind: 'account-closure', submitLabel: 'Submit closure request',
    fields: [
      emailField('Registered email', 'The email address registered on the account to be closed.'), name, reference, phone(false),
      { name: 'reason', label: 'Reason for closure', type: 'select', max: 40, options: CLOSURE_REASONS, hint: 'Optional.' },
      { name: 'confirmRegisteredEmail', label: 'I confirm that I am submitting this request from my registered email address.', type: 'checkbox', required: true, max: 5, wide: true, requiredMessage: 'Confirm that this is your registered email address.' },
      { name: 'acknowledgeChecklist', label: 'I have completed the checklist above before requesting closure.', type: 'checkbox', required: true, max: 5, wide: true, requiredMessage: 'Confirm that you have completed the checklist.' },
      { name: 'acknowledgeResidual', label: 'I have read and irrevocably agree to the statement above on residual amounts received after closure.', type: 'checkbox', required: true, max: 5, wide: true, requiredMessage: 'Confirm that you agree to the residual amounts statement.' },
      { name: 'finalAcknowledge', label: 'I understand that this submits a request, and that the closure process takes 2 working days once the request is submitted.', type: 'checkbox', required: true, max: 5, wide: true, requiredMessage: 'Confirm that you understand how the request is handled.' },
    ],
  },
};
export const isFormKind = (k: string): k is FormKind => k in FORMS;

export type FormValues = Record<string, string | boolean>;
/** Removes control characters; single-line fields also lose line breaks (no header injection through subjects). */
export function clean(v: string, multiline: boolean): string {
  const s = multiline ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '') : v.replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ');
  return s.replace(multiline ? /[ \t]+$/gm : /\s+/g, multiline ? '' : ' ').trim();
}
/** Validates and cleans a submission against its definition. Unknown keys are dropped. */
export function validateForm(kind: FormKind, input: Record<string, unknown>): { values: FormValues; errors: Record<string, string> } {
  const values: FormValues = {};
  const errors: Record<string, string> = {};
  for (const f of FORMS[kind].fields) {
    const raw = input[f.name];
    if (f.type === 'checkbox') {
      const on = raw === true;
      values[f.name] = on;
      if (f.required && !on) errors[f.name] = f.requiredMessage ?? 'Required.';
      continue;
    }
    const v = typeof raw === 'string' ? clean(raw, f.type === 'textarea') : '';
    values[f.name] = v;
    if (!v) { if (f.required) errors[f.name] = f.requiredMessage ?? `Enter ${f.label.toLowerCase()}.`; continue; }
    if (v.length > f.max) errors[f.name] = `Use at most ${f.max} characters.`;
    else if (f.min && v.length < f.min) errors[f.name] = f.type === 'textarea' ? `Write at least ${f.min} characters so we can help.` : `Use at least ${f.min} characters.`;
    else if (f.options && !f.options.some(([o]) => o === v)) errors[f.name] = 'Choose one of the options.';
    else if (f.pattern && !f.pattern.test(v)) errors[f.name] = f.patternMessage ?? 'Check this field.';
  }
  return { values, errors };
}
/** The label for a select value. */
export const optionLabel = (f: FieldDef, v: string) => f.options?.find(([o]) => o === v)?.[1] ?? v;
