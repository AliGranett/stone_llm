/** Replaces `{{key}}` placeholders in a template string. */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : "",
  );
}
