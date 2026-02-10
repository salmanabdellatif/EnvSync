"use client";

import { type Variable } from "@/lib/schemas";
import { VariableRow } from "./variable-row";
import { deleteVariableAction } from "@/actions/variables";
import { toast } from "sonner";
import { Key, Terminal } from "lucide-react";

interface VariablesListProps {
  variables: Variable[];
  projectId: string;
  envId: string;
  canDelete: boolean;
}

export function VariablesList({
  variables,
  projectId,
  envId,
  canDelete,
}: VariablesListProps) {
  const handleDelete = async (varId: string, varKey: string) => {
    const result = await deleteVariableAction(projectId, envId, varId);

    if (result.success) {
      toast.success(`Variable "${varKey}" deleted`);
    } else {
      toast.error(result.error || "Failed to delete variable");
    }
  };

  if (variables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
        <div className="p-3 bg-muted rounded-full mb-4">
          <Key className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No variables yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Use the CLI to add environment variables to this environment.
        </p>
        <div className="bg-muted/50 border border-border rounded-lg p-3 font-mono text-sm text-muted-foreground">
          <Terminal className="inline-block h-4 w-4 mr-2" />
          envsync push
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Environment Variables</h3>
          <p className="text-sm text-muted-foreground">
            {variables.length}{" "}
            {variables.length === 1 ? "variable" : "variables"}
          </p>
        </div>
      </div>

      {/* Variables list with straight borders */}
      <div className="border border-border rounded-lg overflow-hidden">
        {variables.map((variable, index) => (
          <div
            key={variable.id}
            className={
              index < variables.length - 1 ? "border-b border-border" : ""
            }
          >
            <VariableRow
              variable={variable}
              canDelete={canDelete}
              onDelete={handleDelete}
              isEven={index % 2 === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
