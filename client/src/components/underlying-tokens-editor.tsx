import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UnderlyingTokensEditorProps {
  poolId: string;
  tokens: string[];
  onUpdate: () => void;
}

export function UnderlyingTokensEditor({ poolId, tokens, onUpdate }: UnderlyingTokensEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTokens, setEditedTokens] = useState<string[]>([]);
  const [newToken, setNewToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    setEditedTokens([...(tokens || [])]);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTokens([]);
    setNewToken("");
  };

  const handleAddToken = () => {
    if (newToken.trim()) {
      setEditedTokens([...editedTokens, newToken.trim()]);
      setNewToken("");
    }
  };

  const handleRemoveToken = (index: number) => {
    setEditedTokens(editedTokens.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/pools/${poolId}/underlying-tokens`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ underlyingTokens: editedTokens }),
      });

      if (!response.ok) {
        throw new Error("Failed to update underlying tokens");
      }

      toast({
        title: "Success",
        description: "Underlying tokens updated successfully",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update underlying tokens",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {tokens && tokens.length > 0 ? (
            tokens.slice(0, 2).map((token, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {formatAddress(token)}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray-500">No tokens</span>
          )}
          {tokens && tokens.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{tokens.length - 2} more
            </Badge>
          )}
        </div>
        <Button
          onClick={handleEdit}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          data-testid={`button-edit-tokens-${poolId}`}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Underlying Tokens</DialogTitle>
          <DialogDescription>
            Manage the underlying token addresses for this pool
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Token List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {editedTokens.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No tokens added yet. Add token addresses below.
              </p>
            ) : (
              editedTokens.map((token, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <Input
                    value={token}
                    onChange={(e) => {
                      const newTokens = [...editedTokens];
                      newTokens[index] = e.target.value;
                      setEditedTokens(newTokens);
                    }}
                    className="font-mono text-sm"
                    placeholder="0x..."
                    data-testid={`input-token-${index}`}
                  />
                  <Button
                    onClick={() => handleRemoveToken(index)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    data-testid={`button-remove-token-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Add New Token */}
          <div className="flex items-center gap-2">
            <Input
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddToken();
                }
              }}
              className="font-mono text-sm"
              placeholder="Enter token address (0x...)"
              data-testid="input-new-token"
            />
            <Button
              onClick={handleAddToken}
              variant="outline"
              size="sm"
              disabled={!newToken.trim()}
              data-testid="button-add-token"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSaving}
              data-testid="button-cancel"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}