import { cn } from "@/lib/utils"
import { Shimmer } from "./shimmer"
import { Download, File, Image, Play } from "lucide-react"

export interface EvidenceItem {
  id: number
  file_url: string
  file_type?: string
}

interface EvidenceDisplayProps {
  evidence: EvidenceItem[]
  isLoading?: boolean
  className?: string
  onPreview?: (item: EvidenceItem) => void
}

export function EvidenceDisplay({ evidence, isLoading = false, className, onPreview }: EvidenceDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="aspect-square bg-gray-200 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No evidence available</p>
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {evidence.map((item) => (
        <EvidenceItem key={item.id} item={item} onPreview={onPreview} />
      ))}
    </div>
  )
}

interface EvidenceItemProps {
  item: EvidenceItem
  onPreview?: (item: EvidenceItem) => void
}

function EvidenceItem({ item, onPreview }: EvidenceItemProps) {
  const isImage = item.file_type?.startsWith("image/")
  const isVideo = item.file_type?.startsWith("video/")

  if (isImage) {
    return (
      <div className="group cursor-pointer" onClick={() => onPreview?.(item)}>
        <div className="aspect-square overflow-hidden rounded-xl shadow hover:shadow-lg transition-all duration-200 hover:scale-105">
          <img
            src={item.file_url}
            alt="Evidence"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    )
  }

  if (isVideo) {
    return (
      <button
        type="button"
        onClick={() => onPreview?.(item)}
        className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
        title="Preview video"
      >
        <Play className="h-8 w-8 text-blue-600 mb-2" />
        <span className="text-sm text-gray-700">Video</span>
      </button>
    )
  }

  return (
    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors">
      <File className="h-8 w-8 text-gray-400 mb-2" />
      <a
        href={item.file_url}
        download
        className="text-blue-600 hover:text-blue-800 text-sm font-medium text-center break-all"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Download className="h-4 w-4 inline mr-1" />
        Download
      </a>
    </div>
  )
}
