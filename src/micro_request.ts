import { fallbackErrorHandler } from './fallback_error_handler';
import { Entity } from './interfaces/entity';
import { MicroRequestGetManyOptions } from './interfaces/micro_request_get_many_options';
import { MicroRequestGetOneOptions } from './interfaces/micro_request_get_one_options';
import { MicroRequestGetOptions } from './interfaces/micro_request_get_options';
import { MicroRequestOptions } from './interfaces/micro_request_options';
import { RedisCache } from './redis_cache';
import { RequestWithRetry } from './request_with_retry';

const defaultMicroRequestOptions: MicroRequestOptions = {
    cache: true,
    headers: null,
    retry: 3,
    retryTimeout: 1000
};

async function getOne<Y, T extends Entity<Y>>(options: MicroRequestGetOneOptions<Y, T>): Promise<T> {

    options = {
        ...defaultMicroRequestOptions,
        ...options
    };

    const _url = options.url(options.serviceUrl, options.id);
    const _cachePrefix = options.cachePrefix || options.serviceUrl;

    if (options.cache) {
        const cached = await RedisCache.get<T>(`${options.id}`, _cachePrefix);
        if (cached) { 
            console.log('[@quantos/micro-request][Cache] ' + _url + ' retrieved from cache');
            return cached; 
        }
    }

    try {
        // Richiesta get con retry dal service
        const _req = new RequestWithRetry({ retry: options.retry, retryTimeout: options.retryTimeout });
        const _res = await _req.get(_url, options.headers);
        // salvo nella cache
        if (options.cache) { await  RedisCache.set<Y, T>(options.id, _res.data, _cachePrefix); }
        // torno la risposta
        return _res.data;
    }
    catch (e) {
        return fallbackErrorHandler(e, options.fallback);
    }
}

async function getMany<Y, T extends Entity<Y>>(options: MicroRequestGetManyOptions<Y, T>): Promise<T[]>  {
    
    options = {
        ...defaultMicroRequestOptions,
        ...options
    };
    const _url = options.url(options.serviceUrl, options.ids);
    const _cachePrefix = options.cachePrefix || options.serviceUrl;
    const results: T[] = [];

    if (options.cache) {
        // prendo prima dalla cache
        const _cached = await RedisCache.getMany<Y, T>(options.ids, _cachePrefix); // cache.getCacheds(options.ids.map(String));
        if (_cached && _cached.length) { 
            console.log('[@quantos/micro-request][Cache] ' + _url + ' retrieved ' + _cached.length + ' / ' + options.ids.length + ' elements from cache');
            results.push(..._cached); 
            // rimuovo dagli id quelli cachati
            options.ids = options.ids.filter((id) => _cached.map((u) => u.id).indexOf(id) < 0);
        }
        
    }
    // scarico quelli non cached
    let fetched: T[] = [];
    if (options.ids.length) {
        try {
            const _req = new RequestWithRetry({ retry: options.retry, retryTimeout: options.retryTimeout });
            const _res = await _req.get(_url, options.headers);
            fetched = _res.data;
        }
        catch (e) {
            return fallbackErrorHandler(e, options.fallback);
        }
        // aggungo alla cache quelli nuovi
        if (options.cache) {
            for (const t of fetched) {
                await RedisCache.set<Y, T>(t.id, t, _cachePrefix);
            }
        }
        results.push(...fetched);
    }
    return results;
}

async function get(options: MicroRequestGetOptions): Promise<any> {

    options = {
        ...defaultMicroRequestOptions,
        ...options
    };

    const _url = options.url;
    const _cachePrefix = options.cachePrefix;

    if (options.cache) {
        const cached = await RedisCache.get(_url, _cachePrefix);
        if (cached) { 
            console.log('[@quantos/micro-request][Cache] retrieved ' + _url);
            return cached; 
        }
    }

    try {
        // Richiesta get con retry dal service
        const _req = new RequestWithRetry({ retry: options.retry, retryTimeout: options.retryTimeout });
        const _res = await _req.get(_url, options.headers);
        // salvo nella cache
        if (options.cache) { await RedisCache.set(_url, _res.data, _cachePrefix); }
        // torno la risposta
        return _res.data;
    }
    catch (e) {
        return fallbackErrorHandler(e, options.fallback);
    }
}

const MicroRequest = {
    getOne,
    getMany,
    get
};

export default MicroRequest;
