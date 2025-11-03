'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPendingVerifications, approveVerification, rejectVerification } from '@/lib/api/admin'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'

type Verification = {
  id: string
  userId: string
  userEmail: string
  documentType: string
  documentFrontUrl?: string
  documentBackUrl?: string
  selfieUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

export function VerificationApproval() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadVerifications = async () => {
      try {
        const data = await getPendingVerifications()
        setVerifications(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load pending verifications',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadVerifications()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await approveVerification(id)
      setVerifications(verifications.filter(v => v.id !== id))
      toast({
        title: 'Success',
        description: 'Verification approved',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve verification',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectVerification(id, rejectionReason)
      setVerifications(verifications.filter(v => v.id !== id))
      toast({
        title: 'Success',
        description: 'Verification rejected',
      })
      setShowRejectDialog(false)
      setRejectionReason('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject verification',
        variant: 'destructive',
      })
    }
  }

  const openPreview = (imageUrl: string) => {
    setPreviewImage(imageUrl)
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifications.length === 0 ? (
            <p>No pending verifications</p>
          ) : (
            verifications.map(verification => (
              <div key={verification.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{verification.userEmail}</p>
                    <p className="text-sm text-gray-500">{verification.documentType}</p>
                    <p className="text-xs text-gray-400">
                      Submitted: {new Date(verification.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedVerification(verification.id)
                        setShowRejectDialog(true)
                      }}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleApprove(verification.id)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {verification.documentFrontUrl && (
                    <div 
                      className="cursor-pointer"
                      onClick={() => openPreview(verification.documentFrontUrl!)}
                    >
                      <p className="text-xs mb-1">Document Front</p>
                      <div className="h-24 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs">Click to preview</span>
                      </div>
                    </div>
                  )}
                  {verification.documentBackUrl && (
                    <div 
                      className="cursor-pointer"
                      onClick={() => openPreview(verification.documentBackUrl!)}
                    >
                      <p className="text-xs mb-1">Document Back</p>
                      <div className="h-24 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs">Click to preview</span>
                      </div>
                    </div>
                  )}
                  {verification.selfieUrl && (
                    <div 
                      className="cursor-pointer"
                      onClick={() => openPreview(verification.selfieUrl!)}
                    >
                      <p className="text-xs mb-1">Selfie</p>
                      <div className="h-24 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs">Click to preview</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative h-96 w-full">
              <Image
                src={previewImage}
                alt="Document preview"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Please provide a reason for rejection:</p>
            <textarea
              className="w-full p-2 border rounded"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (selectedVerification) {
                    handleReject(selectedVerification)
                  }
                }}
                disabled={!rejectionReason}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
