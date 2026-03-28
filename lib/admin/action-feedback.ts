export type AdminActionFeedback = {
  tone: "success" | "error";
  message: string;
};

type SearchParamValue = string | string[] | undefined;

type SearchParamsLike = Record<string, SearchParamValue>;

function normalizeValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function capitalize(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function normalizeEntityLabel(entityLabel: string) {
  return capitalize(entityLabel.trim());
}

const relationMessages = {
  agents: "Related agents updated.",
  prompts: "Related prompts updated.",
  skills: "Related skills updated.",
  taxonomy: "Taxonomy updated.",
} as const;

export function getAdminListFeedback(
  entityLabel: string,
  searchParams: SearchParamsLike,
): AdminActionFeedback | null {
  if (normalizeValue(searchParams.created) === "1") {
    return {
      tone: "success",
      message: `${normalizeEntityLabel(entityLabel)} created.`,
    };
  }

  return null;
}

export function getAdminDetailFeedback(
  entityLabel: string,
  searchParams: SearchParamsLike,
): AdminActionFeedback | null {
  const error = normalizeValue(searchParams.error);
  const restored = normalizeValue(searchParams.restored);
  const relations = normalizeValue(searchParams.relations);
  const saved = normalizeValue(searchParams.saved);

  if (error === "revision-not-found") {
    return {
      tone: "error",
      message: "The selected revision could not be found.",
    };
  }

  if (restored === "1") {
    return {
      tone: "success",
      message: "Revision restored and captured as a new snapshot.",
    };
  }

  if (relations && relations in relationMessages) {
    return {
      tone: "success",
      message: relationMessages[relations as keyof typeof relationMessages],
    };
  }

  if (saved === "1") {
    return {
      tone: "success",
      message: `${normalizeEntityLabel(entityLabel)} saved.`,
    };
  }

  return null;
}
