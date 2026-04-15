export interface IQueryParams {
    filter: Record<string, any>;
    page: number;
    limit: number;
    sort: Record<string, 'desc' | 'asc'>;
}