const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "csv", "json", "xml", "yaml", "yml", "toml",
  "sh", "bash", "zsh", "fish", "env", "ini", "cfg", "conf", "log",
  "html", "htm", "css", "js", "ts", "tsx", "jsx", "py", "rb", "go",
  "rs", "sql", "graphql", "gql", "tf", "hcl", "Makefile", "Dockerfile",
]);

export function isTextFile(fileName: string | null | undefined): boolean {
  if (!fileName) return false;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXTENSIONS.has(ext) || TEXT_EXTENSIONS.has(fileName);
}
