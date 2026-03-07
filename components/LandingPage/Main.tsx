"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Globe,
  Zap,
  Activity,
  Star,
  TrendingUp,
  Package,
  ChevronRight,
} from "lucide-react";

import TrustBar from "./TrustBar";
import FeaturedCategories from "./FeaturedCategories";
import ProductGrid from "./ProductGrid";
import PromoBanner from "./PromoBanner";
import Testimonials from "./Testimonials";
import ProAthletes from "./ProAtheltes";
import RecentDrops from "./RecentDrops";
import InstagramFeed from "./InstagramFeed";
import HeroSection from "./HeroSection";

// ─── accent synced to your Navbar's #00d4b6 ───────────────────────────────────
const ACCENT = "#00d4b6";
const ACCENT_DIM = "rgba(0,212,182,0.55)";
const ACCENT_FAINT = "rgba(0,212,182,0.07)";
const ACCENT_BORDER = "rgba(0,212,182,0.18)";
const ACCENT_GLOW = "rgba(0,212,182,0.28)";

const PRODUCTS = [
  {
    id: 0,
    tag: "JUST DROPPED",
    brand: "Nike",
    name: "Mercurial Superfly 10 Elite",
    price: "$289",
    originalPrice: "$349",
    rating: 4.9,
    reviews: 2841,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90&auto=format&fit=crop",
    badge: "Best Seller",
  },
  {
    id: 1,
    tag: "LIMITED EDITION",
    brand: "Adidas",
    name: "Predator Elite ControlSkin",
    price: "$259",
    originalPrice: "$319",
    rating: 4.8,
    reviews: 1923,
    img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=90&auto=format&fit=crop",
    badge: "Fan Fave",
  },
  {
    id: 2,
    tag: "PRO EXCLUSIVE",
    brand: "Puma",
    name: "Future 7 Ultimate MxSG",
    price: "$219",
    originalPrice: "$269",
    rating: 4.7,
    reviews: 1102,
    img: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=90&auto=format&fit=crop",
    badge: "Pro Pick",
  },
];

const TICKER_ITEMS = [
  "Free Global Shipping Over $100",
  "✦",
  "New Drops Every Friday",
  "✦",

  "Worn By The Pros",
  "✦",
  "30-Day Returns",
  "✦",
  "5,000+ Products",
  "✦",
];

export default function App() {
  return (
    <div style={{ background: "#020606", minHeight: "100vh" }}>
      <HeroSection />
      <TrustBar />
      <FeaturedCategories />
      <ProductGrid />
      <PromoBanner />
      {/* <ProAthletes /> */}
      {/* <RecentDrops /> */}
      <Testimonials />
      <InstagramFeed />
    </div>
  );
}
