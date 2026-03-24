"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import GuideModal from "./guide-modal";

type Platform = {
  key: string;
  name: string;
  type: "api" | "guide";
  icon: ReactNode;
  guideSteps?: string[];
  connectHref?: string;
};

// Inline SVG brand icons (no emoji)
const ShopifyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 109.5 124.5" fill="#96bf48">
    <path d="M74.7 14.8s-1.4.4-3.7 1.1c-.4-1.3-1-2.8-1.8-4.4-2.6-5-6.5-7.7-11.1-7.7-.3 0-.6 0-1 .1-.1-.2-.3-.3-.4-.5-2-2.2-4.6-3.2-7.7-3.1-6 .2-12 4.5-16.8 12.2-3.4 5.4-6 12.2-6.7 17.5-6.9 2.1-11.7 3.6-11.8 3.7-3.5 1.1-3.6 1.2-4 4.5C9.4 41 0 116.4 0 116.4l75.6 13.1V14.6c-.3.1-.6.1-.9.2zm-16.5 5.2c-4 1.2-8.4 2.6-12.7 3.9.6-3.8 1.8-7.5 3.6-10.6 1.6-2.8 3.7-5.1 6.2-6.4 2.2 3.8 3.1 8.6 2.9 13.1zm-9.4-16.1c.8-.1 1.6.2 2.3.7-2.9 1.5-5.7 4.3-7.7 7.6-2.3 4.1-4 9.1-4.6 14.1-3.6 1.1-7.2 2.2-10.5 3.2 1.8-9.8 9.2-25 20.5-25.6zM44 72.5c.4 6.4 17.3 7.8 18.3 22.9.7 11.9-6.3 20-16.4 20.6-12.2.8-18.9-6.4-18.9-6.4l2.6-11s6.7 5.1 12.1 4.7c3.5-.2 4.8-3.1 4.7-5.1-.5-8.4-14.3-7.9-15.2-21.7-.8-11.6 6.9-23.4 23.7-24.4 6.5-.4 9.8 1.2 9.8 1.2l-3.8 14.4s-4.3-2-9.4-1.7c-7.4.5-7.6 5.2-7.5 6.5zm22.3-53.8c0-4.3-.6-10.4-2.6-15.5 6.6 1.3 9.8 8.7 11.1 13.2-2.6.8-5.4 1.6-8.5 2.3z"/>
    <path d="M76.5 129.4l33-8.2S95.4 30.9 95.3 30.2c-.1-.7-.7-1.1-1.2-1.1-1.2-.1-12.8-.3-12.8-.3s-3.3-3.2-4.7-4.4v105z" fill="#5e8e3e"/>
  </svg>
);

const EbayIcon = () => (
  <svg width="28" height="16" viewBox="0 0 600 240">
    <text fontFamily="Arial Black, sans-serif" fontSize="220" fontWeight="900" y="210">
      <tspan fill="#e53238">e</tspan>
      <tspan fill="#0064d2">B</tspan>
      <tspan fill="#f5af02">a</tspan>
      <tspan fill="#86b817">y</tspan>
    </text>
  </svg>
);

const DepopIcon = () => (
  <svg width="22" height="22" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="100" fill="#FF0054"/>
    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial Black" fontSize="90" fontWeight="900" fill="white">d</text>
  </svg>
);

const VintedIcon = () => (
  <svg width="22" height="22" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="16" fill="#21D179"/>
    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial Black" fontSize="72" fontWeight="900" fill="white">V</text>
  </svg>
);

const WixIcon = () => (
  <svg width="30" height="14" viewBox="0 0 220 80">
    <text fontFamily="Arial Black" fontSize="72" fontWeight="900" fill="#FAAD00" y="68">Wix</text>
  </svg>
);

const WooIcon = () => (
  <svg width="32" height="18" viewBox="0 0 200 120">
    <rect width="200" height="120" rx="10" fill="#7F54B3"/>
    <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial" fontSize="28" fontWeight="700" fill="white">Woo</text>
  </svg>
);

const GodaddyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="100" fill="#1BDBDB"/>
    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial Black" fontSize="72" fontWeight="900" fill="white">G</text>
  </svg>
);

const PLATFORMS: Platform[] = [
  {
    key: "shopify",
    name: "Shopify",
    type: "api",
    icon: <ShopifyIcon />,
    connectHref: "/api/products/bulk-import/shopify/connect",
  },
  {
    key: "ebay",
    name: "eBay",
    type: "api",
    icon: <EbayIcon />,
    connectHref: "/api/products/bulk-import/ebay/connect",
  },
  {
    key: "depop",
    name: "Depop",
    type: "guide",
    icon: <DepopIcon />,
    guideSteps: [
      "Open the Depop app and go to your Profile",
      "Tap the three-dot menu (⋯) in the top right",
      "Select Settings → Privacy → Request my data",
      "Depop will email you a CSV file within 24 hours",
      "Download the CSV and upload it here",
    ],
  },
  {
    key: "vinted",
    name: "Vinted",
    type: "guide",
    icon: <VintedIcon />,
    guideSteps: [
      "Log in to Vinted on desktop at vinted.com",
      "Go to your Account Settings",
      "Select Privacy → Download my data",
      "You will receive an email with a CSV download link",
      "Download the file and upload it here",
    ],
  },
  {
    key: "wix",
    name: "Wix",
    type: "guide",
    icon: <WixIcon />,
    guideSteps: [
      "Log in to your Wix dashboard",
      "Go to Stores → Products",
      "Click the three-dot menu → Export Products",
      "Download the CSV file",
      "Upload it here",
    ],
  },
  {
    key: "woocommerce",
    name: "WooCommerce",
    type: "guide",
    icon: <WooIcon />,
    guideSteps: [
      "Log in to your WordPress admin panel",
      "Go to WooCommerce → Products",
      "Click Export at the top of the page",
      "Select All columns and click Generate CSV",
      "Download and upload the file here",
    ],
  },
  {
    key: "godaddy",
    name: "GoDaddy",
    type: "guide",
    icon: <GodaddyIcon />,
    guideSteps: [
      "Log in to your GoDaddy Online Store",
      "Go to Products in your dashboard",
      "Click Export → Export All Products",
      "Download the CSV file that is emailed to you",
      "Upload it here",
    ],
  },
];

interface ImportPlatformGridProps {
  onFilePicked?: (file: File) => void;
}

export default function ImportPlatformGrid({ onFilePicked }: ImportPlatformGridProps) {
  const router = useRouter();
  const [guideOpen, setGuideOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shopifyModalOpen, setShopifyModalOpen] = useState(false);
  const [shopDomain, setShopDomain] = useState("");

  const handleClick = (platform: Platform) => {
    if (platform.key === "shopify") {
      setShopifyModalOpen(true);
    } else if (platform.type === "api" && platform.connectHref) {
      router.push(platform.connectHref);
    } else {
      setActivePlatform(platform);
      setGuideOpen(true);
    }
  };

  return (
    <div className="bg-content1 border border-divider rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-1">Marketplace or store</h2>
      <p className="text-xs text-default-400 mb-4">
        Connect your store or follow a step-by-step export guide.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.key}
            onClick={() => handleClick(platform)}
            className="flex items-center gap-3 bg-content2 border border-divider rounded-lg px-3 py-2.5 text-left hover:border-default-400 transition-colors"
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {platform.icon}
            </div>
            <span className="text-xs font-medium text-foreground flex-1">{platform.name}</span>
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                platform.type === "api"
                  ? "bg-success-50 text-success-700"
                  : "bg-default-100 text-default-400"
              }`}
            >
              {platform.type === "api" ? "API" : "Guide"}
            </span>
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex items-center justify-center gap-2 border border-dashed border-divider rounded-lg px-3 py-2.5 text-default-400 text-xs hover:border-default-400 transition-colors"
        >
          More platforms
        </button>
      </div>

      {activePlatform && (
        <GuideModal
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          onUpload={onFilePicked ?? (() => setGuideOpen(false))}
          platform={activePlatform.name}
          steps={activePlatform.guideSteps ?? []}
        />
      )}

      {/* Shopify domain modal */}
      <Modal isOpen={shopifyModalOpen} onClose={() => setShopifyModalOpen(false)} size="sm">
        <ModalContent>
          <ModalHeader>Connect your Shopify store</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500 mb-3">
              Enter your Shopify store domain to connect.
            </p>
            <Input
              label="Store domain"
              placeholder="mystore.myshopify.com"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              size="sm"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShopifyModalOpen(false)}>Cancel</Button>
            <Button
              color="primary"
              isDisabled={!shopDomain.includes("myshopify.com")}
              onPress={() => {
                setShopifyModalOpen(false);
                router.push(`/api/products/bulk-import/shopify/connect?shop=${encodeURIComponent(shopDomain.trim())}`);
              }}
            >
              Connect
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={moreOpen} onClose={() => setMoreOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>More platforms coming soon</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              We're always adding new integrations. Let us know which platforms you use and we'll prioritise accordingly.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setMoreOpen(false)}>
              Got it
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
