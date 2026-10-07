/** "Kisna" from "Kisna Soni"; empty when no name is known. */
export const firstName = (name?: string | null) => (name ?? '').trim().split(/\s+/)[0] ?? '';
/** The workspace greeting: always "Hola AMIGO" (with the first name when known), never a time-of-day greeting. */
export const greeting = (name?: string | null) => (firstName(name) ? `Hola AMIGO, ${firstName(name)}` : 'Hola AMIGO');
