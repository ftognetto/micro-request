import axios from 'axios';
import { is500error } from './utils';

export class RequestWithRetry {

    private retry: number;
    private retryTimeout: number;

    constructor(options?: { retry?: number, retryTimeout?: number }) {
        this.retry = options?.retry || 3;
        this.retryTimeout = options?.retryTimeout || 1000;
    }

    async get(request: string, headers?: any): Promise<any> {
        return this._get(request, headers, 1);
    }

    private async _get(request: string, headers?: any, retry: number = 1): Promise<any> {
        try {
            const _req = await axios.get(request, { headers });
            return _req;
        }
        catch (e) {
            // se errore 500 intervengo
            if (is500error(e)) {
                // retry
                if (retry < this.retry) {
                    await this.sleep();
                    return this._get(request, headers, retry + 1);
                }
            }
            throw e;
        }
    }

    private sleep(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, this.retryTimeout);
        });
    }
}
