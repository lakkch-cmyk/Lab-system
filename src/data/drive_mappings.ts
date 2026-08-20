export const driveMappings: Record<string, string> = {
  "VET64001": "1oum3lKkY66ku68qx9Rh0K4Qzc80cPTaw",
  "VET64002": "13WKAGnnVW_MWcEdbjINdv4KGuyOryiGC",
  "VET64003": "1i3XY5kYOAMY3p-_PhhsD_3L86l1seYFQ",
  "VET65001": "1aLnWY8shCoNE0eeXtxo9z_iffHLEsHK0",
  "VET65002": "1iVW7ZHXw8kZl6HDzzJXygNSKMG2QmWfw",
  "VET65003": "1iKPPsPkDH9cBfKxvGjLwcPXnAQIZBRzW",
  "VET65004": "1K4UmkFl491nBMpNAaD35X3X2nay9LLmK",
  "VET65005": "1831L8lHLlMLoLncMme7TiWqfej6y_0v6",
  "VET65006": "1eKiYv4hWluLUTZrV9hz_iWOeoC_zNfW5",
  "VET66001": "1HbfOKCbyaH65txsuAZVJdohRmg8C90Px",
  "VET66002": "1CBqVp1xdpK-791ic9izFzuN7BXE9aUbU",
  "VET66003": "1F051MNupSGN1TtJwcZ9dKRqPFLbMRi-8",
  "VET66004": "1sjcJxBVwKieIa4qGAC1vLkAwv1-pIDyw",
  "VET66005": "159kw1CB9-0tqjI-CY8K6O2Jf2Ee_gfh3",
  "VET66006": "1Pg44iWPv7lxBLtUXy0mAZ5HZS6ZdLb-J",
  "VET66007": "1Mc6HEzFSIONyFU3okalEatfe0-JKYGtu",
  "VET66008": "1GnZCxn1FPNM7yFXU4-BWaTqYu07ZdXF5",
  "VET67001": "1Akd6KlkZiMBMyBGdmkH1QWAOAQfYtLmT",
  "VET67002": "1y75bOLzGxEXOnAn3QND93j9FlEkrxmNE",
  "VET67003": "1r9KrFnzmFMJvF_cUDRB10Nv784rHuj4G",
  "VET67004": "14Xv4PlLsjFdTKSe7RRSCTBZgR7Q55aCn",
  "VET67005": "1NvapEAbQYNdan9FcNgD6wHqfzeVz11gA",
  "VET67006": "1CXo_8V4UwDXM6Ycx_2BS4lFpcO8IO4KQ",
  "VET67007": "11b_x8KWExf9HPYcR29gwYvy15f_qRf7B",
  "VET67008": "1RJQg-XawkR-KJE1ip1pT-I4H3Eila9X-",
  "VET67009": "1ClTB46sP_hog2hHWJPPgXx8MQmiFFExP",
  "VET67010": "1dxs8FpeVTrFz0ntP-e9iXflXoRchZOeS",
  "VET67011": "1RgqGhItsYgLuLSchO3cFxWKIeoVoL9sp",
  "VET67012": "17foLNElSNJsOoDYQKvNYdnl8VllMbKa4",
  "VET67013": "1kXA3TPw0MNw-5z0KLM1xDsob-YX4wnRY",
  "VET68001": "1-KJpS9zlnVT_4XSA8TKHy8-oAsPLSj8i",
  "VET68002": "1C62DDfZSM2w-s7bYuexuGlK0PEEiIRfv",
  "VET68003": "165K5BNrckKb-mxLd7yWJGXOmJa4Qmf0e",
  "VET68004": "1p6mY5xWN-3gLftMqLAgKKDGBdAkWBgql",
  "VET68005": "11LPDnhx60JwNqIPMWQYyV1hAvW3khHGu",
  "VET68006": "13WKAGnnVW_MWcEdbjINdv4KGuyOryiGC",
  "VET68007": "1uIm7dWJez5OO4Wuvh7gpw9IPdo4zVlmU"
};

/**
 * Curated high quality scientific and veterinary equipment fallback photos
 * grouped by category to ensure 100% visual uptime.
 */
export const categoryFallbackImages: Record<string, string> = {
  "Microscope": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
  "Imaging / Metrology": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80",
  "Sample preparation/Sample analysis": "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1000&q=80",
  "Proteomics/Molecular Biology": "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1000&q=80",
  "Chromatography": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1000&q=80",
  "Spectroscopy": "https://images.unsplash.com/photo-1579154204601-01588f351167?auto=format&fit=crop&w=1000&q=80",
  "Other": "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1000&q=80"
};

/**
 * Returns the primary direct Google UserContent CDN image URL for the given equipment ID.
 */
export function getEquipmentImageUrl(id: string): string {
  const fileId = driveMappings[id.toUpperCase()];
  if (!fileId) {
    return "";
  }
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Returns alternative Google Drive image endpoints for retry pipeline.
 */
export function getEquipmentSecondaryUrl(id: string): string {
  const fileId = driveMappings[id.toUpperCase()];
  if (!fileId) {
    return "";
  }
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

/**
 * Returns fallback image URL based on equipment category and name.
 */
export function getEquipmentFallbackUrl(category?: string, nameTh?: string): string {
  if (nameTh) {
    if (nameTh.includes('กล้องจุลทรรศน์') || nameTh.includes('Microscope')) {
      return categoryFallbackImages['Microscope'];
    }
    if (nameTh.includes('อัลตราซาวด์') || nameTh.includes('เอกซเรย์') || nameTh.includes('Ultrasound') || nameTh.includes('Radiography')) {
      return categoryFallbackImages['Imaging / Metrology'];
    }
    if (nameTh.includes('PCR') || nameTh.includes('พันธุกรรม') || nameTh.includes('น้ำเชื้อ')) {
      return categoryFallbackImages['Proteomics/Molecular Biology'];
    }
    if (nameTh.includes('โครมาโทกราฟ') || nameTh.includes('HPLC') || nameTh.includes('ICP')) {
      return categoryFallbackImages['Chromatography'];
    }
    if (nameTh.includes('สเปกโตร') || nameTh.includes('ฟลูออโร')) {
      return categoryFallbackImages['Spectroscopy'];
    }
  }

  if (category && categoryFallbackImages[category]) {
    return categoryFallbackImages[category];
  }

  return "https://images.unsplash.com/photo-1579154204601-01588f351167?auto=format&fit=crop&w=1000&q=80";
}

