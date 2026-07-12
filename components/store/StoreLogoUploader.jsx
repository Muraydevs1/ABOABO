'use client'
import { useEffect, useMemo } from 'react'
import { isHeicFile } from '@/lib/utils/imageUpload'
import { ImagePreviewTile, UploadTile } from './uploadTiles'

// Single-image logo uploader sharing the ProductImageGrid tile visuals.
// Presentation only: the parent owns state, preprocessing, and validation.
// `image` is a File (or falsy for empty).
const StoreLogoUploader = ({ image, onSelect, onRemove }) => {

    const previewUrl = useMemo(
        () => image instanceof File && !isHeicFile(image) ? URL.createObjectURL(image) : null,
        [image]
    )
    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

    return (
        <div className="w-28 sm:w-32">
            {image ? (
                <ImagePreviewTile
                    previewUrl={previewUrl}
                    alt="Store logo preview"
                    onRemove={onRemove}
                    removeLabel="Remove store logo"
                    className="border-slate-200"
                />
            ) : (
                <UploadTile
                    caption="Add logo"
                    inputProps={{
                        onChange: (e) => {
                            onSelect(e.target.files[0])
                            e.target.value = '' // allow re-selecting the same file after removal
                        },
                        'aria-label': 'Add store logo',
                    }}
                />
            )}
        </div>
    )
}

export default StoreLogoUploader
