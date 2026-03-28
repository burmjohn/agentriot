export function parseSelectedIds(formData: FormData, fieldName: string) {
  return [...new Set(formData.getAll(fieldName).map(String).map((value) => value.trim()).filter(Boolean))];
}
