"use client"

import { useState, useEffect } from "react"

export type Orientation = "portrait" | "landscape"

export interface OrientationInfo {
  orientation: Orientation
  isPortrait: boolean
  isLandscape: boolean
}

const SSR_DEFAULT: OrientationInfo = {
  orientation: "portrait",
  isPortrait: true,
  isLandscape: false,
}

/**
 * `useOrientation` — SSR-safe hook that tracks the current device orientation.
 *
 * Uses the `matchMedia('(orientation: landscape)')` API for reliable detection
 * across iOS Safari, Chrome Mobile, and Samsung Internet.
 *
 * Returns "portrait" as SSR default to avoid hydration mismatches.
 *
 * @example
 * const { isLandscape } = useOrientation()
 */
export function useOrientation(): OrientationInfo {
  const [info, setInfo] = useState<OrientationInfo>(SSR_DEFAULT)

  useEffect(() => {
    const query = window.matchMedia("(orientation: landscape)")

    function update(e: MediaQueryListEvent | MediaQueryList) {
      const isLandscape = e.matches
      setInfo({
        orientation: isLandscape ? "landscape" : "portrait",
        isPortrait: !isLandscape,
        isLandscape,
      })
    }

    // Set real value immediately after mount
    update(query)

    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return info
}
