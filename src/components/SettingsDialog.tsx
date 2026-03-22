import { useState } from "react";
import { getApiUrl, setApiUrl, clearApiUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const [url, setUrl] = useState(getApiUrl() || "");

  const handleSave = () => {
    if (url.trim()) {
      setApiUrl(url.trim());
      toast.success("Google Sheets API connected! Rides will now sync across all users.");
    } else {
      clearApiUrl();
      toast.info("Switched to local-only mode (localStorage)");
    }
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Settings</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">Google Sheets API URL</Label>
            <Input
              id="api-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Paste your deployed Google Apps Script URL to enable multi-user ride sharing.
              Leave empty for local-only mode.
            </p>
          </div>

          <div className="rounded-md bg-muted p-3 space-y-2">
            <p className="text-xs font-medium text-foreground">Setup Instructions:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
              <li>Create a Google Sheet with two tabs: <strong>Rides</strong> and <strong>Requests</strong></li>
              <li>Add headers: Rides → <code className="text-[10px] bg-background px-1 rounded">id | name | phone | direction | date | time | seats | vehicle | createdAt</code></li>
              <li>Requests → <code className="text-[10px] bg-background px-1 rounded">id | rideId | passengerName | passengerPhone | status | requestedAt</code></li>
              <li>Go to Extensions → Apps Script, paste the script from <code className="text-[10px] bg-background px-1 rounded">google-apps-script.gs</code></li>
              <li>Deploy → New Deployment → Web App (Anyone can access)</li>
              <li>Copy the URL and paste it above</li>
            </ol>
            <a
              href="/google-apps-script.gs"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> View Script File
            </a>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">Save</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
