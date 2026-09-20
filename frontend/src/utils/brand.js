export const APP_NAME = "Resume Helper AI";
export const APP_SHORT_NAME = "Resume Helper";

export function getPublicAppUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return window.location.origin;
}

export function getFinishSigninUrl() {
  return `${getPublicAppUrl()}/finish-signin`;
}
