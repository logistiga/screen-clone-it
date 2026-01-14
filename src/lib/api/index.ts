/**
 * API Services Index
 * 
 * This file exports all available API services for the application.
 * Import from '@/lib/api' for the base axios instance.
 * Import from this file for specific domain APIs.
 */

// Base API instance
export { default as api } from '../api';

// Commercial APIs (Clients, Devis, Ordres, Factures, etc.)
export * from './commercial';

// Credits Bancaires API
export * from './credits';

// Notes de Début API  
export * from './notes-debut';

// Reporting API
export * from './reporting';

// Prévisions API
export * from './previsions';

// Annulations API
export * from './annulations';
