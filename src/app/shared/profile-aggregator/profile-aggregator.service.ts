import { ProfileSpecTO } from './../models/ProfileSpecTO';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileAggregatorService {

  private BASEURL = ''

  constructor(private http: HttpClient) {
    this.BASEURL = environment.baseURL;
  }

  aggregateProfile(profileSpecList: ProfileSpecTO[]): Observable<ProfileSpecTO> {
    return this.http.post<ProfileSpecTO>(
      this.BASEURL + '/profile-aggregate',
      profileSpecList
    );
  }
}
