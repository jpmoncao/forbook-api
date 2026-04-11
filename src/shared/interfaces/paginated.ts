import { PaginationMeta } from "@/shared/repository";

export interface IPaginated<T> {
    data: T[];
    meta: PaginationMeta;
}