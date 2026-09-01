export type RamenStyleImageCredit = {
  /** Local path under /public */
  src: string;
  alt: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string;
  filePageUrl: string;
  originalFileName: string;
};

export const RAMEN_STYLE_IMAGES = {
  shoyu: {
    src: "/images/ramen-styles/shoyu.jpg",
    alt: "A bowl of shoyu ramen with clear brown broth, chashu, and green onions",
    width: 1280,
    height: 960,
    author: "Lombroso",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    filePageUrl:
      "https://commons.wikimedia.org/wiki/File:Shoyu_ramen,_at_Kasukabe_Station_(2014.05.05)_1.jpg",
    originalFileName: "Shoyu_ramen,_at_Kasukabe_Station_(2014.05.05)_1.jpg",
  },
  miso: {
    src: "/images/ramen-styles/miso.jpg",
    alt: "A bowl of miso ramen with rich brown broth and toppings",
    width: 1280,
    height: 854,
    author: "Eric Hunt",
    license: "CC BY 2.5",
    licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
    filePageUrl: "https://commons.wikimedia.org/wiki/File:Miso_Ramen.JPG",
    originalFileName: "Miso_Ramen.JPG",
  },
  tonkotsu: {
    src: "/images/ramen-styles/tonkotsu.jpg",
    alt: "A bowl of Hakata tonkotsu ramen with creamy white pork bone broth",
    width: 1218,
    height: 1233,
    author: "Hykw-a4",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    filePageUrl: "https://commons.wikimedia.org/wiki/File:Hakataramen222.jpg",
    originalFileName: "Hakataramen222.jpg",
  },
  shio: {
    src: "/images/ramen-styles/shio.jpg",
    alt: "A bowl of shio (salt) ramen with clear, light broth",
    width: 1280,
    height: 960,
    author: "STRONGlk7",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    filePageUrl:
      "https://commons.wikimedia.org/wiki/File:Japanese_Salt_flavor_Sapporo_Ramen.JPG",
    originalFileName: "Japanese_Salt_flavor_Sapporo_Ramen.JPG",
  },
  iekei: {
    src: "/images/ramen-styles/iekei.jpg",
    alt: "A bowl of iekei ramen with thick noodles, pork, and nori in shoyu-tonkotsu broth",
    width: 1280,
    height: 960,
    author: "Hykw-a4",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    filePageUrl: "https://commons.wikimedia.org/wiki/File:Iekeiramen111.jpg",
    originalFileName: "Iekeiramen111.jpg",
  },
  jiro: {
    src: "/images/ramen-styles/jiro.jpg",
    alt: "A massive bowl of Jiro-inspired ramen piled with garlic, bean sprouts, and fatty pork",
    width: 1280,
    height: 850,
    author: "Ocdp",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    filePageUrl: "https://commons.wikimedia.org/wiki/File:Ramen_Jiro_001.jpg",
    originalFileName: "Ramen_Jiro_001.jpg",
  },
  tsukemen: {
    src: "/images/ramen-styles/tsukemen.jpg",
    alt: "Tsukemen dipping noodles served separately from a bowl of concentrated broth",
    width: 1280,
    height: 853,
    author: "City Foodsters",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    filePageUrl:
      "https://commons.wikimedia.org/wiki/File:Tsukemen_at_a_Tokyo_restaurant.jpg",
    originalFileName: "Tsukemen_at_a_Tokyo_restaurant.jpg",
  },
  tantanmen: {
    src: "/images/ramen-styles/tantanmen.jpg",
    alt: "A bowl of tantanmen with spicy sesame broth",
    width: 1280,
    height: 956,
    author: "nesnad",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    filePageUrl:
      "https://commons.wikimedia.org/wiki/File:Dandan_noodles_in_Japan_-_tantanmen_-_September_2014.jpg",
    originalFileName:
      "Dandan_noodles_in_Japan_-_tantanmen_-_September_2014.jpg",
  },
  "abura-soba": {
    src: "/images/ramen-styles/abura-soba.jpg",
    alt: "A bowl of abura soba with seasoned oil and sauce at the bottom, no broth",
    width: 1280,
    height: 960,
    author: "Douglas Perkins",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    filePageUrl: "https://commons.wikimedia.org/wiki/File:Abura_soba_02.jpg",
    originalFileName: "Abura_soba_02.jpg",
  },
} as const satisfies Record<string, RamenStyleImageCredit>;

export type RamenStyleImageKey = keyof typeof RAMEN_STYLE_IMAGES;

export function formatImageCredit(image: RamenStyleImageCredit): string {
  return `Photo: ${image.author} / Wikimedia Commons / ${image.license}`;
}
