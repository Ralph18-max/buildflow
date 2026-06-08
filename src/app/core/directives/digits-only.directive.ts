import { Directive, HostListener, Input } from '@angular/core';

const TOUCHES_AUTORISEES = [
  'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
];

function echapper(caracteres: string): string {
  return caracteres.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Empêche la saisie de tout caractère qui n'est pas un chiffre (et, en option,
 * les caractères listés dans `appDigitsOnlyExtra`, ex: "+ -()" pour un téléphone).
 * Bloque aussi le collage de texte contenant des caractères non autorisés.
 */
@Directive({
  selector: '[appDigitsOnly]',
  standalone: true,
})
export class DigitsOnlyDirective {
  @Input() appDigitsOnlyExtra = '';

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey || TOUCHES_AUTORISEES.includes(event.key)) return;
    const autorise = new RegExp(`^[0-9${echapper(this.appDigitsOnlyExtra)}]$`);
    if (event.key.length === 1 && !autorise.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const texte = event.clipboardData?.getData('text') ?? '';
    const interdit = new RegExp(`[^0-9${echapper(this.appDigitsOnlyExtra)}]`);
    if (interdit.test(texte)) {
      event.preventDefault();
    }
  }
}
