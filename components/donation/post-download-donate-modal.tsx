// components/donation/post-download-donate-modal.tsx
'use client'

import { Heart } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DonateForm } from '@/components/donation/donate-form'
import { useDonation } from '@/hooks/use-donation'

export function PostDownloadDonateModal() {
  const isModalOpen = useDonation((s) => s.isModalOpen)
  const modalContext = useDonation((s) => s.modalContext)
  const closeModal = useDonation((s) => s.closeModal)

  const open = isModalOpen && modalContext === 'post-download'

  const handleOpenChange = (next: boolean) => {
    if (!next) closeModal()
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Cảm ơn bạn đã tải xuống!
          </DialogTitle>
          <DialogDescription>
            Website này duy trì hoàn toàn nhờ quyên góp. Nếu thấy hữu ích, bạn có
            thể ủng hộ để giúp chúng tôi tiếp tục.
          </DialogDescription>
        </DialogHeader>

        <DonateForm onSubmitted={closeModal} />

        <Button variant="ghost" className="w-full" onClick={closeModal}>
          Để sau
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default PostDownloadDonateModal
