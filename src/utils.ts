
export const is500error = (e: any): boolean =>  e.isAxiosError && e.response && e.response.status >= 500;
