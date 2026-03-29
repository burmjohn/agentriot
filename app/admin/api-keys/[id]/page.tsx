import { notFound } from "next/navigation";
import { ApiKeyRecordView } from "@/app/admin/_components/api-key-record-view";
import {
  reactivateApiKeyAction,
  revealApiKeyAction,
  revokeApiKeyAction,
  updateApiKeyAction,
} from "@/app/admin/actions";
import { getApiKeyById } from "@/lib/admin/cms";

export default async function AdminApiKeyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getApiKeyById(id);

  if (!record) {
    notFound();
  }

  return (
    <ApiKeyRecordView
      record={record}
      saveAction={updateApiKeyAction.bind(null, id)}
      revealAction={revealApiKeyAction.bind(null, id)}
      revokeAction={revokeApiKeyAction.bind(null, id)}
      reactivateAction={reactivateApiKeyAction.bind(null, id)}
    />
  );
}
