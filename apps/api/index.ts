import app from "@/app";
import { envConfig } from "@/config/envConfig";
import { DocumentService } from "@/Modules/Documents/Services/document.services";
import { initDocumentJobs, recoverPendingDocuments } from "@/Modules/Documents/Jobs/document.jobs";



// Single shared engine for background document processing.
const documentService = new DocumentService();

initDocumentJobs((job) =>
  documentService.processDocument(job.projectId, job.documentId, {
    providerName: job.providerName,
    providerKey: job.providerKey,
  }),
);



app.listen(envConfig.PORT,()=>{
    console.log(`server is listening at port ${envConfig.PORT}`);
    // Requeue anything left PENDING/PROCESSING by a previous shutdown.
    // Recovered jobs use the stored project embedding configuration;
    // failures are isolated per document and never crash boot.
    recoverPendingDocuments().then(
      (count) => {
        if (count > 0) console.log(`requeued ${count} pending documents`);
      },
      (error) => {
        console.error("document recovery failed:", error instanceof Error ? error.message : error);
      },
    );
})
