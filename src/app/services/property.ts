import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PropertyService {
private url = 'https://localhost:7167/api';
  constructor(private http: HttpClient) {}

getAll(filters?: any, page: number = 1, pageSize: number = 9) {
  let params = new HttpParams();
  if (filters?.type) params = params.set('type', filters.type);
  if (filters?.minPrice) params = params.set('minPrice', filters.minPrice);
  if (filters?.maxPrice) params = params.set('maxPrice', filters.maxPrice);
  if (filters?.location) params = params.set('location', filters.location);
  if (filters?.guests) params = params.set('guests', filters.guests);
  params = params.set('page', page.toString());
  params = params.set('pageSize', pageSize.toString());
  return this.http.get<any>(`${this.url}/properties`, { params });
}

  getById(id: number) {
    return this.http.get<any>(`${this.url}/properties/${id}`);
  }

  create(data: any) {
    return this.http.post(`${this.url}/properties`, data, {
      headers: this.getHeaders()
    });
  }

  approve(id: number) {
    return this.http.patch(`${this.url}/properties/${id}/approve`, {}, {
      headers: this.getHeaders()
    });
  }

  delete(id: number) {
    return this.http.delete(`${this.url}/admin/properties/${id}`, {
      headers: this.getHeaders()
    });
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}