import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PATTERNS = {
  username: /^[A-Za-z0-9._-]{3,30}$/,
  name: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/,
  studentCode: /^\d{9}$/,
  department: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9().,&/ -]*$/,
  phone: /^\d{10}$/,
  labCode: /^[A-Za-z0-9._-]+$/,
  text: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9().,#/& -]+$/,
  courseCode: /^[A-Za-z0-9-]{0,20}$/,
  section: /^[A-Za-z0-9-]{0,15}$/,
  professorName: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{0,160}$/,
  nrc: /^\d{0,6}$/,
};

export function optionalEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString().trim();
  if (!value) return null;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value) ? null : { email: true };
}

export function distinctEmailFieldsValidator(fields: string[]): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const values = fields
      .map(field => (group.get(field)?.value ?? '').toString().trim().toLowerCase())
      .filter(Boolean);

    if (!values.length) return null;
    return values.length === new Set(values).size ? null : { duplicateEmails: true };
  };
}

export function sanitizeValue(kind: keyof typeof PATTERNS | 'email' | 'textarea', value: string): string {
  const raw = value ?? '';
  switch (kind) {
    case 'username':
      return raw.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30);
    case 'name':
      return raw.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g, '').replace(/\s{2,}/g, ' ').slice(0, 120);
    case 'studentCode':
      return raw.replace(/\D/g, '').slice(0, 9);
    case 'department':
      return raw.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9().,&/ -]/g, '').replace(/\s{2,}/g, ' ').slice(0, 120);
    case 'phone':
      return raw.replace(/\D/g, '').slice(0, 10);
    case 'labCode':
      return raw.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 50).toUpperCase();
    case 'courseCode':
      return raw.replace(/[^A-Za-z0-9-]/g, '').slice(0, 20).toUpperCase();
    case 'section':
      return raw.replace(/[^A-Za-z0-9-]/g, '').slice(0, 15).toUpperCase();
    case 'professorName':
      return raw.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]/g, '').replace(/\s{2,}/g, ' ').slice(0, 160);
    case 'nrc':
      return raw.replace(/\D/g, '').slice(0, 6);
    case 'text':
      return raw.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9().,#/& -]/g, '').replace(/\s{2,}/g, ' ');
    case 'email':
      return raw.replace(/\s/g, '').toLowerCase();
    case 'textarea':
      return raw.replace(/\s{3,}/g, '  ').slice(0, 500);
    default:
      return raw;
  }
}
