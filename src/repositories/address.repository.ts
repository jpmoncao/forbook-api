import type { Address } from "@/generated/prisma/client";
import type { AddressCreateInput, AddressUpdateInput } from "@/generated/prisma/models";
import AbstractRepository from "@/shared/repository";

export default class AddressRepository extends AbstractRepository<
    "address",
    Address,
    AddressCreateInput,
    AddressUpdateInput
> {
    protected readonly modelKey = "address" as const;
}
