"use client";

import { useState } from "react";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileDrawer } from "./mobile-drawer";

export function MobileBottomNavWrapper() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <MobileBottomNav onOpenDrawer={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
