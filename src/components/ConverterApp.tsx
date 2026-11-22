"use client";

import { useCallback, useState } from "react";
import { ConvertForm } from "@/components/ConvertForm";
import { ExtractForm } from "@/components/ExtractForm";

export function ConverterApp() {
  const [sourceJobId, setSourceJobId] = useState<string | null>(null);
  const onExtracted = useCallback((jobId: string) => {
    setSourceJobId(jobId);
  }, []);

  return (
    <div className="workspace">
      <ExtractForm onExtracted={onExtracted} />
      <ConvertForm sourceJobId={sourceJobId} />
    </div>
  );
}
