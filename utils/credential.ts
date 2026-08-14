import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});


import { ClientSecretCredential } from "@azure/identity";

export const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID!,
    process.env.AZURE_CLIENT_ID!,
    process.env.AZURE_CLIENT_SECRET!
);

console.log(process.env.AZURE_TENANT_ID);
console.log(process.env.AZURE_CLIENT_ID);
console.log(process.env.AZURE_CLIENT_SECRET);