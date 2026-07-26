import { useQueryClient } from "@tanstack/react-query";
import { UploadArea } from "@features/upload/UploadArea";
import { DocumentsList } from "@features/upload/DocumentsList";
import { SystemStatusPanel } from "@features/upload/SystemStatusPanel";
import { useDocuments, useDeleteDocument } from "@features/upload/useDocuments";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { queryKeys } from "@app/queryClient";

export default function UploadDocumentsPage() {
  const documentsQuery = useDocuments();
  const deleteMutation = useDeleteDocument();
  const queryClient = useQueryClient();

  function handleUploadComplete() {
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.list() });
  }

  const documents = documentsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>
        <p className="text-muted-foreground">
          Upload and index institutional knowledge for real-time RAG processing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="pt-6">
              <UploadArea onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Recently Uploaded</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DocumentsList
                documents={documents}
                isLoading={documentsQuery.isLoading}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </CardContent>
          </Card>
        </div>

        <SystemStatusPanel documents={documents} />
      </div>
    </div>
  );
}
