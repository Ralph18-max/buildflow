import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

/** Valide un numéro de téléphone : 8 à 15 chiffres, espaces/+/-/() autorisés */
export const phoneValidator: ValidatorFn = (ctrl: AbstractControl): ValidationErrors | null => {
  if (!ctrl.value) return null;
  const digits = String(ctrl.value).replace(/[\s\+\-\(\)\.]/g, '');
  if (!/^\d+$/.test(digits) || digits.length < 8 || digits.length > 15) {
    return { phone: true };
  }
  return null;
};

/** Valide un email avec regex simple */
export const emailFormatValidator: ValidatorFn = (ctrl: AbstractControl): ValidationErrors | null => {
  if (!ctrl.value) return null;
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(ctrl.value));
  return ok ? null : { email: true };
};

/** Validateur de groupe : vérifie que date du champ A est strictement avant date du champ B */
export function dateAvantValidator(champDebut: string, champFin: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const debut = group.get(champDebut)?.value;
    const fin   = group.get(champFin)?.value;
    if (!debut || !fin) return null;
    return debut >= fin ? { dateOrder: `${champDebut} doit être avant ${champFin}` } : null;
  };
}

/** Validateur de groupe spécifique aux contrats : signature < démarrage < livraison */
export const contratsDateOrderValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const sig  = group.get('date_signature')?.value;
  const dema = group.get('date_demarrage_prevue')?.value;
  const livr = group.get('date_livraison_prevue')?.value;
  if (sig && dema && sig > dema) {
    return { dateOrder: 'La date de démarrage doit être après la signature.' };
  }
  if (dema && livr && dema >= livr) {
    return { dateOrder: 'La date de livraison doit être après le démarrage.' };
  }
  return null;
};

/** Vérifie qu'un email est valide — utilisable dans le code TS (hors formulaire réactif) */
export function isEmailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Vérifie qu'un téléphone est valide — utilisable dans le code TS */
export function isTelValide(tel: string): boolean {
  const digits = tel.replace(/[\s\+\-\(\)\.]/g, '');
  return /^\d{8,15}$/.test(digits);
}
