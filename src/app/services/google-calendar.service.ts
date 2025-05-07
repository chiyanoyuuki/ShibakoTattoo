import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { google } from 'googleapis';
import { gapi } from 'gapi-script';

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private API_KEY = '';
  private CALENDAR_ID = '';
  private BASE_URL = '';

  constructor(private http: HttpClient) {
    this.loadApiKey();
  }

  private loadApiKey() {
    this.http.get<any>('oauth.json').subscribe((config:any) => {
      this.API_KEY = config.API_KEY;
      this.CALENDAR_ID = config.CALENDAR_ID;
      this.BASE_URL = config.BASE_URL;
      console.log("Données calendrier chargées");
    });
  }

  addEvent(event: { start: string; end: string }) {
    let data = { 
      eventstart: event.start,
      eventend: event.end
    };
    return fetch('http' +
          (isDevMode() ? '' : 's') +
          '://chiyanh.cluster031.hosting.ovh.net/addevent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors',
      body: JSON.stringify(data)
    })
  }


  getPublicEvents(): Observable<any> {
      const url = `${this.BASE_URL}/${this.CALENDAR_ID}/events?key=${this.API_KEY}&timeMin=${new Date().toISOString()}&singleEvents=true&orderBy=startTime`;
      return this.http.get<any>(url);
  }
}
