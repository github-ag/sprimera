import { ProfileSpecTO } from './../models/ProfileSpecTO';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileAggregatorService {

  private BASEURL = 'http://localhost:8080/v1/'

  constructor(private http: HttpClient) { }

  aggregateProfile(profileSpecList: ProfileSpecTO[]): Observable<ProfileSpecTO> {
    return this.http.post<ProfileSpecTO>(
      this.BASEURL + 'profile-aggregate',
      profileSpecList
    );
  }
}
