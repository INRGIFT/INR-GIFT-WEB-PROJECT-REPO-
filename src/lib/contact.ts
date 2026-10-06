/** Contact topics shared by the form and the API (mirrors the check constraint in migration 0004). */
export const CONTACT_TOPICS = [['support', 'Help using INRGIFT'], ['data', 'A data question or error'], ['account', 'My account or sign-in'], ['feedback', 'Product feedback'], ['plans', 'Plans and pricing'], ['partnership', 'Partnership or data licensing'], ['grievance', 'Grievance']] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number][0];
