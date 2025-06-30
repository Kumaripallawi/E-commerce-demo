import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApolloService {
  constructor() {
  }


  getGraphQLEndpoint(): string {
    return 'https://api.escuelajs.co/graphql';
  }
} 