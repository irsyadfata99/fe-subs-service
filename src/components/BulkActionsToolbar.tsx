"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedUserIds: number[];
  onActionComplete: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedUserIds,
  onActionComplete,
}: BulkActionsToolbarProps) {
  const [loading, setLoading] = useState(false);

  const handleBulkUpdate = async (
    action: "mark_paid" | "mark_overdue" | "mark_inactive"
  ) => {
    const actionText = action.replace("mark_", "");

    // Confirmation dialog
    if (
      !confirm(
        `Are you sure you want to mark ${selectedCount} user${
          selectedCount > 1 ? "s" : ""
        } as ${actionText}?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await api.post("/end-users/bulk/update-status", {
        user_ids: selectedUserIds,
        action: action,
      });

      toast.success(
        `Successfully updated ${selectedCount} user${
          selectedCount > 1 ? "s" : ""
        } to ${actionText}`
      );
      onActionComplete();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error("Bulk update error:", err);
      toast.error(error.response?.data?.error || "Failed to update users");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    // Confirmation dialog with strong warning
    if (
      !confirm(
        `⚠️ WARNING: This will permanently delete ${selectedCount} user${
          selectedCount > 1 ? "s" : ""
        }.\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?`
      )
    ) {
      return;
    }

    // Double confirmation for safety
    if (
      !confirm(
        `Final confirmation: Delete ${selectedCount} user${
          selectedCount > 1 ? "s" : ""
        }?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedUserIds.map((id) => api.delete(`/end-users/${id}`))
      );

      toast.success(
        `Successfully deleted ${selectedCount} user${
          selectedCount > 1 ? "s" : ""
        }`
      );
      onActionComplete();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error("Bulk delete error:", err);
      toast.error(error.response?.data?.error || "Failed to delete users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {selectedCount} user{selectedCount > 1 ? "s" : ""} selected
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkUpdate("mark_paid")}
            disabled={loading}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Active
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkUpdate("mark_overdue")}
            disabled={loading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Mark Overdue
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
