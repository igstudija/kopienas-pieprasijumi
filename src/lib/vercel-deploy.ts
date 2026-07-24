export function vercelDeployUrl(repositoryUrl: string) {
  const url = new URL("https://vercel.com/new/clone");
  url.searchParams.set("repository-url", repositoryUrl);
  url.searchParams.set("project-name", "specific-requests");
  url.searchParams.set("repository-name", "specific-requests");
  url.searchParams.set("env", "SETUP_SECRET");
  url.searchParams.set("envDescription", "Choose a unique installation secret with at least 12 characters. You will enter it once in the first-run wizard.");
  url.searchParams.set("envLink", `${repositoryUrl.replace(/\/$/, "")}/blob/main/docs/INSTALLATION.md`);
  return url.toString();
}
