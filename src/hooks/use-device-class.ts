"use client"

import { useState, useEffect } from "react"

// ─── Device-class breakpoints (mirrors globals.css @theme) ───────────────────
// mobile  : < 768px
// tablet  : 768px – 1199px
// desktop : ≥ 1200px
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceClass = "mobile" | "tablet" | "desktop"

export interface DeviceInfo {
  /** Resolved device class based on viewport width */
  deviceClass: DeviceClass
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  /** True when orientation is landscape */
  isLandscape: boolean
}

// SSR-safe default — always "desktop" on the server to match desktop layout
const SSR_DEFAULT: DeviceInfo = {
  deviceClass: "desktop",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLandscape: false,
}

function resolveDeviceClass(width: number): DeviceClass {
  if (width < 768) return "mobile"
  if (width < 1200) return "tablet"
  return "desktop"
}

function buildDeviceInfo(width: number, landscape: boolean): DeviceInfo {
  const deviceClass = resolveDeviceClass(width)
  return {
    deviceClass,
    isMobile: deviceClass === "mobile",
    isTablet: deviceClass === "tablet",
    isDesktop: deviceClass === "desktop",
    isLandscape: landscape,
  }
}

/**
 * `useDeviceClass` — SSR-safe hook that returns device information based on
 * the current viewport width and orientation.
 *
 * Breakpoints:
 *  - mobile  : < 768px
 *  - tablet  : 768px – 1199px
 *  - desktop : ≥ 1200px
 *
 * The value is updated automatically on window resize and device rotation.
 * During SSR / first paint, returns the "desktop" default to avoid hydration
 * mismatches — the real value is set after mount.
 *
 * @example
 * const { isMobile, isTablet, isLandscape } = useDeviceClass()
 */
export function useDeviceClass(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(SSR_DEFAULT)

  useEffect(() => {
    const landscapeQuery = window.matchMedia("(orientation: landscape)")

    function update() {
      setInfo(buildDeviceInfo(window.innerWidth, landscapeQuery.matches))
    }

    // Set real value immediately after mount
    update()

    // Listen for both resize (width change) and orientation change
    window.addEventListener("resize", update, { passive: true })
    landscapeQuery.addEventListener("change", update)

    return () => {
      window.removeEventListener("resize", update)
      landscapeQuery.removeEventListener("change", update)
    }
  }, [])

  return info
}
