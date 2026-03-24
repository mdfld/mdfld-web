"use client";

import { useRef } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  platform: string;
  steps: string[];
}

export default function GuideModal({ isOpen, onClose, onUpload, platform, steps }: GuideModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>Export from {platform}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-500 mb-4">
            Follow these steps to export your listings, then upload the CSV file below.
          </p>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-default-100 text-default-600 flex items-center justify-center text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="text-default-700 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </ModalBody>
        <ModalFooter>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="flat" onPress={onClose}>
            Got it
          </Button>
          <Button
            color="primary"
            startContent={<Icon icon="solar:upload-outline" className="w-4 h-4" />}
            onPress={() => inputRef.current?.click()}
          >
            Upload CSV
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
