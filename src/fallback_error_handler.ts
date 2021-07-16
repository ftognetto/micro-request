import { is500error } from './utils';

export const fallbackErrorHandler = (e: any, fallback?: any) => {
    if (is500error(e)) {
        // risposta di default
        if (fallback) { return fallback; }
        else { throw e; }
    }
    throw e;
};
