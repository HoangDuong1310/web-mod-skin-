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
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="pr-6">
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Cảm ơn bạn đã tải xuống!
          </DialogTitle>
          <DialogDescription>
            Website này duy trì hoàn toàn nhờ quyên góp. Nếu thấy hữu ích, bạn có
            thể ủng hộ để giúp chúng tôi tiếp tục.
          </DialogDescription>
        </DialogHeader>

        <div className="-mr-2 mt-4 flex-1 overflow-y-auto pr-2">
          <DonateForm compact onSubmitted={closeModal} />
        </div>

        <Button
          variant="ghost"
          className="mt-4 w-full shrink-0"
          onClick={closeModal}
        >
          Để sau
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default PostDownloadDonateModal
