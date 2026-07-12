'use client'
import { useEffect, useMemo, useState } from 'react'
import { isHeicFile } from '@/lib/utils/imageUpload'
import { ImagePreviewTile, UploadTile } from './uploadTiles'

// Presentation-only image grid for the add-product form, adapted from the
// shadcn Elements "uploadthing-image-grid" UX. All file handling (HEIC
// conversion, compression, validation, upload) stays in the parent — this
// component only renders the File[] it is given and reports user intent.
const ProductImageGrid = ({ images, onFilesSelected, onRemove, onReorder, maxImages = 4 }) => {

    const [dragIndex, setDragIndex] = useState(null)
    const [overIndex, setOverIndex] = useState(null)

    // Stable preview URLs; revoke the previous set whenever images change.
    // Files still in HEIC form (browser couldn't convert them) get no object
    // URL — the browser can't render them, so a placeholder tile is shown.
    const previews = useMemo(
        () => images.map((file) => isHeicFile(file) ? null : URL.createObjectURL(file)),
        [images]
    )
    useEffect(() => () => previews.forEach((url) => url && URL.revokeObjectURL(url)), [previews])

    const handleDrop = (index) => {
        if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index)
        setDragIndex(null)
        setOverIndex(null)
    }

    const handleInputChange = (e) => {
        onFilesSelected(e.target.files)
        e.target.value = '' // allow re-selecting the same file after removal
    }

    return (
        <div className="w-full max-w-xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((file, index) => (
                    <ImagePreviewTile
                        key={`${file.name}-${file.size}-${index}`}
                        previewUrl={previews[index]}
                        alt={`Product image ${index + 1}`}
                        onRemove={() => onRemove(index)}
                        removeLabel={`Remove image ${index + 1}`}
                        badge={index === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                Cover
                            </span>
                        )}
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
                        onDragOver={(e) => { e.preventDefault(); setOverIndex(index) }}
                        onDrop={() => handleDrop(index)}
                        className={`cursor-grab active:cursor-grabbing ${
                            overIndex === index && dragIndex !== null && dragIndex !== index
                                ? 'border-green-500 ring-2 ring-green-500/40'
                                : 'border-slate-200'
                        } ${dragIndex === index ? 'opacity-50' : ''}`}
                    />
                ))}

                {images.length < maxImages && (
                    <UploadTile
                        caption={`${images.length}/${maxImages}`}
                        inputProps={{
                            multiple: true,
                            onChange: handleInputChange,
                            'aria-label': 'Add product images',
                        }}
                    />
                )}
            </div>
            <p className="mt-2 text-xs text-slate-400">
                {images.length === 0
                    ? `Upload up to ${maxImages} images. The first image becomes the cover.`
                    : 'Drag images to reorder — the first image is the cover.'}
            </p>
        </div>
    )
}

export default ProductImageGrid
