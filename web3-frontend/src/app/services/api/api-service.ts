import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl: string = 'http://localhost:5184';

  private dataSubject = new BehaviorSubject<any>(null);
  public data$ = this.dataSubject.asObservable();

  constructor(private http: HttpClient) { }

  getRequest() {
    return this.http.get(`${this.baseUrl}/api/hello`)
        .pipe(
            tap(response => {
                console.log('res', response)
              this.dataSubject.next(response);
            })
        );
  }

  connectWeb3Wallet() {

  }
}
