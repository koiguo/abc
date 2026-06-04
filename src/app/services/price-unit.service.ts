import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PriceUnitService {
  private priceUnitSubject = new BehaviorSubject<string>('¥');
  priceUnit$ = this.priceUnitSubject.asObservable();
  
  private customUnitSubject = new BehaviorSubject<string>('');
  customUnit$ = this.customUnitSubject.asObservable();

  constructor() {
    this.loadPriceUnit();
  }

  loadPriceUnit() {
    const savedUnit = localStorage.getItem('price_unit');
    const savedCustomUnit = localStorage.getItem('custom_price_unit');
    
    if (savedUnit) {
      this.priceUnitSubject.next(savedUnit);
    }
    if (savedCustomUnit) {
      this.customUnitSubject.next(savedCustomUnit);
    }
  }

  getPriceUnit(): string {
    const unit = this.priceUnitSubject.value;
    if (unit === 'custom') {
      return this.customUnitSubject.value || '¥';
    }
    return unit;
  }

  setPriceUnit(unit: string, customUnit?: string) {
    localStorage.setItem('price_unit', unit);
    this.priceUnitSubject.next(unit);
    
    if (unit === 'custom' && customUnit) {
      localStorage.setItem('custom_price_unit', customUnit);
      this.customUnitSubject.next(customUnit);
    }
  }

  formatPrice(price: number): string {
    const unit = this.getPriceUnit();
    return `${unit}${price.toFixed(2)}`;
  }
}