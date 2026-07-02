"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Spinner,
  Image,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";

interface ProposeTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestedProductId: string;
  requestedProductName: string;
  requestedProductImage?: string;
}

export default function ProposeTradeModal({
  isOpen,
  onClose,
  requestedProductId,
  requestedProductName,
  requestedProductImage,
}: ProposeTradeModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [offeredProductId, setOfferedProductId] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState<string>("");
  const [message, setMessage] = useState("");

  const { data: myListings = [], isLoading: listingsLoading } =
    trpc.product.getMyListings.useQuery();

  const proposeOffer = trpc.trade.proposeOffer.useMutation({
    onSuccess: (data) => {
      toast.success("Trade offer sent!");
      onClose();
      router.push(`/dashboard/inbox?conversation=${data.conversationId}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const selectedListing = (myListings as any[]).find((l: any) => l.id === offeredProductId);
  const cash = parseFloat(cashAmount) || 0;
  const canProceed = !!offeredProductId || cash > 0;

  const handleSubmit = () => {
    proposeOffer.mutate({
      requestedProductId,
      offeredProductId: offeredProductId ?? undefined,
      cashAmount: cash > 0 ? cash : undefined,
      message: message.trim() || undefined,
    });
  };

  const handleClose = () => {
    setStep(1);
    setOfferedProductId(null);
    setCashAmount("");
    setMessage("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose} size="md">
      <ModalContent>
        <ModalHeader>
          {step === 1 ? "Propose a Trade" : "Confirm Your Offer"}
        </ModalHeader>

        <ModalBody>
          {step === 1 && (
            <div className="flex flex-col gap-4">
              {listingsLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : (myListings as any[]).length === 0 ? (
                <p className="text-sm text-default-500">
                  You have no active listings. You can still make a cash offer below.
                </p>
              ) : (
                <Select
                  label="Item to offer"
                  labelPlacement="outside"
                  placeholder="Select one of your listings"
                  selectedKeys={offeredProductId ? [offeredProductId] : []}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    setOfferedProductId(val === "cash_only" ? null : val);
                  }}
                  classNames={{ label: "text-small font-medium text-default-700" }}
                >
                  <>
                    <SelectItem key="cash_only">Cash only (no item)</SelectItem>
                    {(myListings as any[]).map((l: any) => (
                      <SelectItem key={l.id}>{l.title}</SelectItem>
                    ))}
                  </>
                </Select>
              )}

              <Input
                label="Cash sweetener (optional)"
                labelPlacement="outside"
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onValueChange={setCashAmount}
                startContent={
                  <span className="text-default-400 text-small pointer-events-none">£</span>
                }
                classNames={{ label: "text-small font-medium text-default-700" }}
              />

              <Textarea
                label="Message (optional)"
                labelPlacement="outside"
                placeholder="Add context about your offer..."
                value={message}
                onValueChange={setMessage}
                minRows={2}
                classNames={{ label: "text-small font-medium text-default-700" }}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {selectedListing ? (
                  <div className="flex flex-col items-center gap-1 flex-1 text-center">
                    <Image
                      src={selectedListing.images?.[0] || "/placeholder-product.jpg"}
                      alt={selectedListing.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <p className="text-xs text-default-600 line-clamp-2">{selectedListing.title}</p>
                    <p className="text-xs font-medium">£{Number(selectedListing.price).toFixed(2)}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 flex-1 text-center">
                    <div className="w-20 h-20 rounded-lg bg-default-100 flex items-center justify-center">
                      <Icon icon="solar:dollar-minimalistic-linear" width={32} className="text-default-400" />
                    </div>
                    <p className="text-xs text-default-600">Cash offer</p>
                    <p className="text-xs font-medium">£{cash.toFixed(2)}</p>
                  </div>
                )}

                <Icon icon="solar:transfer-horizontal-linear" width={24} className="text-default-400 flex-shrink-0" />

                <div className="flex flex-col items-center gap-1 flex-1 text-center">
                  <Image
                    src={requestedProductImage || "/placeholder-product.jpg"}
                    alt={requestedProductName}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <p className="text-xs text-default-600 line-clamp-2">{requestedProductName}</p>
                </div>
              </div>

              {cash > 0 && selectedListing && (
                <p className="text-xs text-center text-default-500">
                  including £{cash.toFixed(2)} cash sweetener
                </p>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 1 ? (
            <>
              <Button variant="flat" onPress={handleClose}>Cancel</Button>
              <Button color="primary" isDisabled={!canProceed} onPress={() => setStep(2)}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button variant="flat" onPress={() => setStep(1)}>Back</Button>
              <Button color="primary" isLoading={proposeOffer.isPending} onPress={handleSubmit}>
                Send Offer
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
