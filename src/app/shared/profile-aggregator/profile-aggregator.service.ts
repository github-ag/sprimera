import { HttpClient } from '@angular/common/http';
import { ProfileSpecTO } from './../models/ProfileSpecTO';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import * as yaml from 'js-yaml';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileAggregatorService {

  BASEURL = '';
  constructor(private http: HttpClient) {
    this.BASEURL = environment.baseURL;
  }

  aggregateProfile(profileSpecList: ProfileSpecTO[]): Observable<ProfileSpecTO | any> {
    return of(this.mergeProfileDataList(profileSpecList));
  }

  sortJsonRequest(request: any): Observable<any> {
    return this.http.post<any>(
      this.BASEURL + '/sort-json',
      request
    );
  }

  mergeProfileDataList(profileSpecList: ProfileSpecTO[]): ProfileSpecTO {
    const result = yaml.load(profileSpecList[0].yamlContent);

    const profilePropertyMapper = new Map();
    this.getLineOfEachPropertyValue('', result, profilePropertyMapper, false, profileSpecList[0].profile);

    for (let i = 1; i < profileSpecList.length; ++i) {
      const profile = profileSpecList[i];
      this.mergeData('', result, yaml.load(profile.yamlContent), profile.profile, '');
      this.getLineOfEachPropertyValue('', result, profilePropertyMapper, false, profile.profile);
    }

    const propertyList: any[] = [];
    profilePropertyMapper.forEach((value, key) => {
      propertyList.push({
        property: key,
        owner: value
      });
    });

    return new ProfileSpecTO('', '', result, propertyList);
  }

  mergeData(path: string, root: any, other: any, profile: string, parentType: string): void {

    // console.log(root, other, arrayType);
    for (const key of Object.keys(other)) {
      if (!root.hasOwnProperty(key)) {
        // console.log(key, root[key], other[key], arrayType);
        // console.log(`${path}.${key} = ${profile}`);
        if (parentType !== 'Array' || this.propertyType(other[key]) !== 'primitive') {
          // console.log(path, parentType, this.propertyType(other[key]), key);
          root[key] = other[key];
        }
      }
      else {
        const rootType = this.propertyType(root[key]);
        if (rootType === this.propertyType(other[key]) && rootType !== 'primitive') {
          this.mergeData(`${path}.${key}`, root[key], other[key], profile, rootType);
        }
      }
    }
  }

  propertyType(value: any): string {
    if (value instanceof Array) {
      return 'Array';
    }
    else if (value instanceof Object) {
      return 'object';
    }
    return 'primitive';
  }

  generatePropertyPath(path: string, property: string): string {
    if (path === '') {
      return property;
    }
    return `${path}.${property}`;
  }

  getLineOfEachPropertyValue(path: string, root: any,  mapper: any, isArray: boolean, profile: string): void {
    for (const pro of Object.keys(root)) {
      const val = root[pro];
      const newPath = this.generatePropertyPath(path, pro);

      if (this.propertyType(val) === 'primitive' && isArray) {
        if (!mapper.get(path)) {
          mapper.set(path, profile);
        }
        continue;
      }
      if (val instanceof Object) {
        this.getLineOfEachPropertyValue(newPath, val, mapper, val instanceof Array, profile);
      }
      else {
        if (!mapper.get(newPath)) {
          mapper.set(newPath, profile);
        }
      }
    }
  }
}
