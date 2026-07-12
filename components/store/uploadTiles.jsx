'use client'
import { ImageIcon, ImagePlusIcon, XIcon } from 'lucide-react'

// Shared presentational building blocks for image uploaders. Used by the
// multi-image ProductImageGrid and the single-image StoreLogoUploader so
// both look identical. No upload logic lives here — callers own state,
// preprocessing, and validation.

// Square preview tile with an accessible remove button. When previewUrl is
// null (e.g. a HEIC file the browser can't decode) a friendly placeholder
// is shown instead of a broken image. Extra props (drag handlers, etc.)
// pass through to the tile element; border/cursor colors come via className.
export const ImagePreviewTile = ({ previewUrl, alt, onRemove, removeLabel, badge, className = '', ...rest }) => (
    <div
        className={`group relative aspect-square overflow-hidden rounded-lg border bg-slate-100 ${className}`}
        {...rest}
    >
        {previewUrl ? (
            <img src={previewUrl} alt={alt} className="h-full w-full object-cover" />
        ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-center">
                <ImageIcon className="size-6 text-slate-400" aria-hidden="true" />
                <span className="text-[10px] leading-tight text-slate-500">
                    Preview unavailable here — this photo will still upload fine
                </span>
            </div>
        )}
        {badge}
        <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1.5 text-white transition-opacity hover:bg-black/75 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
            <XIcon className="size-4" />
        </button>
    </div>
)

// Dashed "add image" tile wrapping an invisible file input. Caption is
// optional (the product grid shows an n/max counter, the logo shows a hint).
export const UploadTile = ({ caption, className = '', inputProps = {} }) => (
    <label className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-green-400 hover:bg-green-50/40 hover:text-green-500 focus-within:border-green-400 focus-within:text-green-500 ${className}`}>
        <ImagePlusIcon className="size-7" />
        {caption && <span className="text-xs">{caption}</span>}
        <input
            type="file"
            accept="image/*,.heic,.heif"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            {...inputProps}
        />
    </label>
)
