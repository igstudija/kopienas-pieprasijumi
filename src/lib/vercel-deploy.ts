export function vercelDeployUrl(repositoryUrl: string) {
  const url = new URL("https://vercel.com/new/clone");
  url.searchParams.set("repository-url", repositoryUrl);
  url.searchParams.set("project-name", "kopienas-pieprasijumi");
  url.searchParams.set("repository-name", "kopienas-pieprasijumi");
  url.searchParams.set("env", "SETUP_SECRET");
  url.searchParams.set("envDescription", "Izvēlies vismaz 12 rakstzīmju instalācijas paroli. Tā būs vajadzīga tikai pirmās palaišanas vednī.");
  url.searchParams.set("envLink", `${repositoryUrl.replace(/\/$/, "")}/blob/main/docs/INSTALLATION.md`);
  url.searchParams.set("stores", JSON.stringify([{
    type: "integration",
    integrationSlug: "supabase",
    productSlug: "supabase",
  }]));
  return url.toString();
}
