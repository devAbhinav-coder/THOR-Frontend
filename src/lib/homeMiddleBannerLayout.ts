/** Mobile middle banner frame (panoramic). Upload at this ratio → no extra crop. */
export const HOME_MIDDLE_BANNER_MOBILE_ASPECT = 2.2;

/** Laptop strip = same width, half the mobile height (2.2 / 2 → 4.4). */
export const HOME_MIDDLE_BANNER_DESKTOP_ASPECT = 4.4;

/** Recommended pixel sizes for admin exports (match frames exactly). */
export const HOME_MIDDLE_BANNER_MOBILE_PX = { width: 1100, height: 500 } as const;
export const HOME_MIDDLE_BANNER_DESKTOP_PX = {
  width: 1920,
  height: 436,
} as const;
