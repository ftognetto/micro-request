import { MicroRequestOptions } from './micro_request_options';

export interface MicroRequestGetManyOptions<Y, T> extends MicroRequestOptions {
  ids: Y[];
  serviceUrl: string;
  url: (serviceUrl: string, ids: Y[]) => string;
  fallback?: T[];

  cache404?: boolean;
}
