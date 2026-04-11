import { IQueryParams } from "@/shared/interfaces/query-param";
import { Request } from "express";

export const DEFAULT_QUERY_PAGE = 1;
export const DEFAULT_QUERY_LIMIT = 10;

export default function parseQueryParams(query: Request["query"]): IQueryParams {
    const { filter, page, limit, sort } = query;
    return {
        filter: filter ? JSON.parse(filter as string) : {},
        page: page ? parseInt(page as string, 10) : DEFAULT_QUERY_PAGE,
        limit: limit ? parseInt(limit as string, 10) : DEFAULT_QUERY_LIMIT,
        sort: sort ? JSON.parse(sort as string) : {},
    };
}