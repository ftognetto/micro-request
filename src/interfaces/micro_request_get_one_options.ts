import { MicroRequestOptions } from './micro_request_options';

export interface MicroRequestGetOneOptions<Y, T> extends MicroRequestOptions {
    id: Y;
    serviceUrl: string;
    url: (serviceUrl: string, id: Y) => string;
    fallback?: T;
}
