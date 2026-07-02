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
} from "@heroui/react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";

interface CounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeOfferId: string;
  onSuccess?: () => void;
}

export default function CounterOfferModal({
  isOpen,
  onClose,
  tradeOfferId,
  onSuccess,
}: CounterOfferModalProps) {
  const [cashAmount, setCashAmount] = useState("");

  const counterOffer = trpc.trade.counterOffer.useMutation({
    onSuccess: () => {
      toast.success("Counter offer sent!");
      onClose();
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const cash = parseFloat(cashAmount) || 0;

  const handleClose = () => {
    setCashAmount("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose} size="sm">
      <ModalContent>
        <ModalHeader>Counter Offer</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-500 mb-2">
            Propose a cash amount you want in exchange for your item. The original items stay the same.
          </p>
          <Input
            label="Cash amount you want"
            labelPlacement="outside"
            placeholder="0.00"
            type="number"
            min="0.01"
            step="0.01"
            value={cashAmount}
            onValueChange={setCashAmount}
            startContent={
              <span className="text-default-400 text-small pointer-events-none">£</span>
            }
            classNames={{ label: "text-small font-medium text-default-700" }}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={handleClose}>Cancel</Button>
          <Button
            color="primary"
            isDisabled={cash <= 0}
            isLoading={counterOffer.isPending}
            onPress={() => counterOffer.mutate({ tradeOfferId, counterCashAmount: cash })}
          >
            Send Counter
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
