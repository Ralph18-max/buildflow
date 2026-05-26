import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './pagination.html',
  styleUrl:    './pagination.scss',
})
export class PaginationComponent implements OnChanges {
  @Input() total    = 0;
  @Input() pageSize = 10;
  @Input() current  = 1;
  @Output() pageChange = new EventEmitter<number>();

  pages: number[] = [];

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  ngOnChanges(): void {
    const tp = this.totalPages;
    if (tp <= 7) {
      this.pages = Array.from({ length: tp }, (_, i) => i + 1);
    } else {
      // Fenêtre glissante autour de la page courante
      const c = this.current;
      const set = new Set([1, 2, c - 1, c, c + 1, tp - 1, tp]);
      this.pages = [...set].filter(p => p >= 1 && p <= tp).sort((a, b) => a - b);
    }
  }

  go(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.current) return;
    this.pageChange.emit(page);
  }

  // Retourne -1 pour indiquer un séparateur "…" entre deux numéros non consécutifs
  isGap(index: number): boolean {
    return index > 0 && this.pages[index] - this.pages[index - 1] > 1;
  }
}
