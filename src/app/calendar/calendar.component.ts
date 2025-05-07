import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  imports: [RouterOutlet, CommonModule, FormsModule],
  styleUrls: ['./calendar.component.scss']
})

export class CalendarComponent {
  @Output() retour = new EventEmitter<any>();
  @Input() events: any;
  @Input() flashClicked:any;

  showPopup = false;
  popupText = '';
  mouseX = 0;
  mouseY = 0;
  clickedDay:any;

  currentDate: Date;
  months: string[];
  daysOfWeek: string[];
  creneaux:any;
    
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  constructor() {
    this.currentDate = new Date();
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 1);
    this.months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    this.daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  }

  get currentMonth(): string {
    return this.months[this.currentDate.getMonth()];
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  get daysInMonth(): number[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  get firstDayOfMonth(): number {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    return new Date(year, month, 1).getDay(); // Jour de la semaine pour le 1er jour du mois
  }

  // Calculer les cases vides avant le 1er jour
  get emptyDaysBefore(): number {
    const firstDay = this.firstDayOfMonth;
    return firstDay === 0 ? 6 : firstDay - 1; // Dimanche = 0, Lundi = 1, etc.
  }

  moveToNextMonth() {
    const nextMonth = new Date(this.currentDate);
    nextMonth.setMonth(this.currentDate.getMonth() + 1);
    this.currentDate = nextMonth;
  }

  moveToPreviousMonth() {
    const previousMonth = new Date(this.currentDate);
    previousMonth.setMonth(this.currentDate.getMonth() - 1);
    this.currentDate = previousMonth;
  }

  moveToNextYear() {
    const nextYear = new Date(this.currentDate);
    nextYear.setFullYear(this.currentDate.getFullYear() + 1);
    this.currentDate = nextYear;
  }

  moveToPreviousYear() {
    const previousYear = new Date(this.currentDate);
    previousYear.setFullYear(this.currentDate.getFullYear() - 1);
    this.currentDate = previousYear;
  }

  today(){
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  dayToDate(day:any)
  {
    return this.currentYear+"-"+String(this.months.indexOf(this.currentMonth)+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
  }

  clickDay(day:any)
  {
    this.clickedDay = this.dayToDate(day);
    this.getAvailableTimeSlots(this.clickedDay,this.formatHoursToMinutes(this.flashClicked.temps));
  }

  infToToday(day:any)
  {
    let date = this.dayToDate(day);
    let today = new Date().toISOString().split('T')[0];

    return date<=today;
  }

  checkIfDateIsInRange(events: any): any[] {
    const currentDate = new Date();
  
    return events.filter((event:any) => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
  
      return currentDate >= startDate && currentDate <= endDate;
    });
  }

  getClass(day:any)
  {
    let date = this.dayToDate(day);
    let jour = new Date(date).getDay();
    if(jour === 0 || jour === 1){return "none";}
    else if(this.getMaxAvailableMinutes(date)<this.formatHoursToMinutes(this.flashClicked.temps)){return "none";}
    return "";
  }

  getMaxAvailableMinutes(dateStr: string): number {
    const dayStart = new Date(`${dateStr}T11:00:00`);
    const dayEnd = new Date(`${dateStr}T18:00:00`);
    
    // Initialiser les créneaux de disponibilité
    let availableSlots = [{ start: dayStart, end: dayEnd }];
  
    // Filtrer les événements qui concernent la journée
    const dailyEvents = this.events
      .map((event: any) => ({
        start: new Date(event.start),
        end: new Date(event.end),
      }))
      .filter((event: any) => event.start.toISOString().startsWith(dateStr) || event.end.toISOString().startsWith(dateStr));
  
    // Trier les événements par heure de début
    dailyEvents.sort((a:any, b:any) => a.start.getTime() - b.start.getTime());
  
    // Mettre à jour les créneaux de disponibilité en fonction des événements
    dailyEvents.forEach((event: any) => {
      const eventStart = new Date(Math.max(event.start.getTime(), dayStart.getTime()));
      const eventEnd = new Date(Math.min(event.end.getTime(), dayEnd.getTime()));
  
      if (eventStart < eventEnd) {
        let newSlots: { start: Date; end: Date }[] = [];
        
        availableSlots.forEach((slot) => {
          if (slot.end <= eventStart || slot.start >= eventEnd) {
            // Le créneau n'est pas affecté
            newSlots.push(slot);
          } else {
            // Découper le créneau autour de l'événement
            if (slot.start < eventStart) {
              newSlots.push({ start: slot.start, end: eventStart });
            }
            if (slot.end > eventEnd) {
              newSlots.push({ start: eventEnd, end: slot.end });
            }
          }
        });
  
        availableSlots = newSlots;
      }
    });
  
    // Trouver la plus grande durée consécutive disponible
    let maxMinutes = 0;
    availableSlots.forEach((slot) => {
      const duration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
      if (duration > maxMinutes) {
        maxMinutes = duration;
      }
    });
  
    return maxMinutes;
  }
  

  formatMinutesToHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, "0")}`; // Ajoute un zéro devant si nécessaire
  }

  formatHoursToMinutes(temps:any): number {
    const hours = parseInt(temps.split("h")[0]);
    const mins = parseInt(temps.split("h")[1]);
    return (hours*60 + mins); // Ajoute un zéro devant si nécessaire
  }

  getAvailableTimeSlots(dateStr: string, duration: number) {
    const dayStart = new Date(`${dateStr}T11:00:00`);
    const dayEnd = new Date(`${dateStr}T18:00:00`);
    const step = 30; // Intervalle de séparation entre les créneaux en minutes
    
    let availableSlots = [{ start: dayStart, end: dayEnd }];
  
    // Filtrer et trier les événements de la journée
    const dailyEvents = this.events
      .map((event: any) => ({
        start: new Date(event.start),
        end: new Date(event.end),
      }))
      .filter((event: any) => event.start.toISOString().startsWith(dateStr) || event.end.toISOString().startsWith(dateStr))
      .sort((a:any, b:any) => a.start.getTime() - b.start.getTime());
  
    // Ajuster les créneaux disponibles en fonction des événements
    dailyEvents.forEach((event: any) => {
      const eventStart = new Date(Math.max(event.start.getTime(), dayStart.getTime()));
      const eventEnd = new Date(Math.min(event.end.getTime(), dayEnd.getTime()));
  
      if (eventStart < eventEnd) {
        let newSlots: { start: Date; end: Date }[] = [];
  
        availableSlots.forEach((slot) => {
          if (slot.end <= eventStart || slot.start >= eventEnd) {
            newSlots.push(slot);
          } else {
            if (slot.start < eventStart) {
              newSlots.push({ start: slot.start, end: eventStart });
            }
            if (slot.end > eventEnd) {
              newSlots.push({ start: eventEnd, end: slot.end });
            }
          }
        });
  
        availableSlots = newSlots;
      }
    });
  
    // Générer tous les créneaux possibles de la durée demandée
    let possibleSlots: { start: Date; end: Date }[] = [];
  
    availableSlots.forEach((slot) => {
      let startTime = new Date(slot.start);
      let endTime = new Date(startTime.getTime() + duration * 60000); // Ajoute la durée demandée
  
      while (endTime <= slot.end) {
        possibleSlots.push({ start: new Date(startTime), end: new Date(endTime) });
        startTime = new Date(startTime.getTime() + step * 60000); // Décalage de 30 minutes
        endTime = new Date(startTime.getTime() + duration * 60000);
      }
    });
  
    this.retour.emit(possibleSlots);
  }
}
