export const ITEM_TYPE_MAP = {
  snippets: { typeId: "system_snippet", label: "Snippets", singularLabel: "Snippet" },
  prompts:  { typeId: "system_prompt",  label: "Prompts",  singularLabel: "Prompt"  },
  notes:    { typeId: "system_note",    label: "Notes",    singularLabel: "Note"    },
  commands: { typeId: "system_command", label: "Commands", singularLabel: "Command" },
  files:    { typeId: "system_file",    label: "Files",    singularLabel: "File"    },
  images:   { typeId: "system_image",   label: "Images",   singularLabel: "Image"   },
  links:    { typeId: "system_url",     label: "Links",    singularLabel: "Link"    },
} as const;

export const TYPE_ID_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(ITEM_TYPE_MAP).map(([slug, v]) => [v.typeId, slug])
);

export const TYPE_FIELD_CONFIG: Record<string, {
  hasContent: boolean;
  hasLanguage: boolean;
  hasUrl: boolean;
  hasFile: boolean;
}> = {
  system_snippet: { hasContent: true,  hasLanguage: true,  hasUrl: false, hasFile: false },
  system_prompt:  { hasContent: true,  hasLanguage: false, hasUrl: false, hasFile: false },
  system_note:    { hasContent: true,  hasLanguage: false, hasUrl: false, hasFile: false },
  system_command: { hasContent: true,  hasLanguage: false, hasUrl: false, hasFile: false },
  system_file:    { hasContent: false, hasLanguage: false, hasUrl: false, hasFile: true  },
  system_image:   { hasContent: false, hasLanguage: false, hasUrl: false, hasFile: true  },
  system_url:     { hasContent: false, hasLanguage: false, hasUrl: true,  hasFile: false },
};

export const COMMON_LANGUAGES = [
  "bash", "c", "cpp", "css", "dockerfile", "go", "html", "java",
  "javascript", "json", "kotlin", "markdown", "php", "python",
  "ruby", "rust", "sql", "swift", "toml", "typescript", "yaml",
] as const;
