import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

const BottomSheet = DialogPrimitive.Root
const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetClose = DialogPrimitive.Close

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = 'BottomSheetOverlay'

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <BottomSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto',
        'rounded-t-3xl border-t border-border bg-card shadow-2xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        'duration-300',
        className,
      )}
      {...props}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="h-1 w-12 rounded-full bg-muted-foreground/25" />
      </div>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
BottomSheetContent.displayName = 'BottomSheetContent'

const BottomSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between px-5 py-3', className)} {...props} />
)
BottomSheetHeader.displayName = 'BottomSheetHeader'

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-base font-semibold', className)}
    {...props}
  />
))
BottomSheetTitle.displayName = 'BottomSheetTitle'

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
}
