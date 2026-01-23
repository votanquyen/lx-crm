/**
 * District Configuration
 * Ho Chi Minh City districts list
 */

/**
 * Ho Chi Minh City districts (24 districts)
 */
export const HCM_DISTRICTS = [
  "Quận 1",
  "Quận 2",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 9",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Bình Thạnh",
  "Gò Vấp",
  "Phú Nhuận",
  "Tân Bình",
  "Tân Phú",
  "Thủ Đức",
  "Bình Tân",
  "Nhà Bè",
  "Hóc Môn",
  "Củ Chi",
  "Cần Giờ",
  "Bình Chánh",
] as const;

export type HcmDistrict = (typeof HCM_DISTRICTS)[number];

/**
 * District options for select dropdowns
 */
export const DISTRICT_OPTIONS = HCM_DISTRICTS.map((district) => ({
  value: district,
  label: district,
}));
