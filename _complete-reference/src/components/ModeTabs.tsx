import { ImageIcon, Video } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaMode } from "@/types";

type ModeTabsProps = {
  value: MediaMode;
  onChange: (value: MediaMode) => void;
};

export function ModeTabs({ value, onChange }: ModeTabsProps) {
  return (
    <Tabs value={value} onValueChange={(nextValue) => onChange(nextValue as MediaMode)}>
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="image" className="flex-1 sm:flex-none">
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          画像
        </TabsTrigger>
        <TabsTrigger value="video" className="flex-1 sm:flex-none">
          <Video className="h-4 w-4" aria-hidden="true" />
          動画
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
