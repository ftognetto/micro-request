import { MicroRequestOptions } from './micro_request_options';

export interface MicroRequestGetOptions extends MicroRequestOptions {
    url: string;
    fallback?: any;
}
