export const STAFF_TOKEN_STORAGE_KEY = "huginn-staff-token";

export function cleanStaffToken(token: string) {
   return token.trim().replace(/^Bearer\s+/i, "");
}

export function getStoredStaffToken() {
   return sessionStorage.getItem(STAFF_TOKEN_STORAGE_KEY) ?? "";
}

export function storeStaffToken(token: string) {
   sessionStorage.setItem(STAFF_TOKEN_STORAGE_KEY, token);
}

export function clearStaffToken() {
   sessionStorage.removeItem(STAFF_TOKEN_STORAGE_KEY);
}
