import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { google } from 'googleapis';
import { gapi } from 'gapi-script';
import { environment } from '../../environments/environment.prod';

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
    let oauth = environment.oauth;
    this.API_KEY = oauth.API_KEY;
    this.CALENDAR_ID = oauth.CALENDAR_ID;
    this.BASE_URL = oauth.BASE_URL;
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
